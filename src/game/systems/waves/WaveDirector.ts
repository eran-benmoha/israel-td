import Phaser from "phaser";
import type { EventBus } from "../../core/EventBus";
import { Events } from "../../core/events";
import type { GameState } from "../../core/GameState";
import { getUpcomingFactionId, getWaveDefinition } from "../../core/selectors";
import type { FactionSystem } from "../FactionSystem";
import type { LevelConfig, Faction, WaveDefinition } from "../../../types";

export interface WaveLaunchPayload {
  source: string;
}

export interface WaveLaunchResult {
  wave: WaveDefinition;
  faction: Faction;
  source: string;
}

interface WaveDirectorDeps {
  scene: Phaser.Scene;
  eventBus: EventBus;
  gameState: GameState;
  levelConfig: LevelConfig;
  factionSystem: FactionSystem;
}

export class WaveDirector {
  private scene: Phaser.Scene;
  private eventBus: EventBus;
  private state: GameState;
  private level: LevelConfig;
  private factionSystem: FactionSystem;
  private nextWaveAt = 0;
  private nextWaveEvent: Phaser.Time.TimerEvent | null = null;
  private clockTickEvent: Phaser.Time.TimerEvent | null = null;
  private lastSimulationUpdateAt = 0;

  constructor({ scene, eventBus, gameState, levelConfig, factionSystem }: WaveDirectorDeps) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.state = gameState;
    this.level = levelConfig;
    this.factionSystem = factionSystem;
  }

  start(onWaveDue: (payload: WaveLaunchPayload) => void): void {
    this.state.wave.number = 0;
    this.state.wave.activeFactionId = null;
    this.state.wave.upcomingFactionId = getUpcomingFactionId(this.level, 1);
    this.state.wave.simulationClockMs = Date.parse(this.level.simulation.startDateUtc);
    this.lastSimulationUpdateAt = this.scene.time.now;
    this.scheduleNextWave(this.getRandomWaveDelayMs(), onWaveDue);
    this.clockTickEvent = this.scene.time.addEvent({
      delay: 250,
      loop: true,
      callback: this.tickClock,
      callbackScope: this,
    });
    this.publishWaveHud();
  }

  destroy(): void {
    if (this.clockTickEvent) {
      this.clockTickEvent.remove(false);
      this.clockTickEvent = null;
    }

    if (this.nextWaveEvent) {
      this.nextWaveEvent.remove(false);
      this.nextWaveEvent = null;
    }
  }

  launchNextWave({
    source,
    onWaveDue,
  }: {
    source: string;
    onWaveDue: (payload: WaveLaunchPayload) => void;
  }): WaveLaunchResult | null {
    this.state.wave.number += 1;
    const wave = getWaveDefinition(this.level, this.state.wave.number);
    const factionId = wave?.factionId;
    this.state.wave.activeFactionId = factionId ?? null;
    this.state.wave.upcomingFactionId = getUpcomingFactionId(this.level, this.state.wave.number + 1);
    const faction = factionId ? this.factionSystem.getById(factionId) : null;
    if (!wave || !faction) {
      return null;
    }

    this.scheduleNextWave(this.getRandomWaveDelayMs(), onWaveDue);
    this.publishWaveHud();
    return { wave, faction, source };
  }

  private tickClock(): void {
    const now = this.scene.time.now;
    const elapsedRealMs = Math.max(0, now - this.lastSimulationUpdateAt);
    this.lastSimulationUpdateAt = now;
    this.state.wave.simulationClockMs +=
      (elapsedRealMs * this.level.simulation.hoursPerSecond * 60 * 60 * 1000) / 1000;
    this.publishWaveHud();
  }

  private publishWaveHud(): void {
    const clockLabel = this.formatClock();
    const originLabel =
      this.state.wave.number === 0
        ? `Next source: ${this.factionSystem.describe(this.state.wave.upcomingFactionId ?? "")}`
        : `Active source: ${this.factionSystem.describe(this.state.wave.activeFactionId ?? "")}`;

    this.eventBus.emit(Events.UI_WAVE, {
      waveNumber: this.state.wave.number,
      clockLabel,
      originLabel,
    });
  }

  formatClock(): string {
    const date = new Date(this.state.wave.simulationClockMs);
    const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const day = String(date.getUTCDate()).padStart(2, "0");
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} ${hours}:${minutes} UTC`;
  }

  private getRandomWaveDelayMs(): number {
    return Phaser.Math.Between(this.level.waveTiming.minDelayMs, this.level.waveTiming.maxDelayMs);
  }

  private scheduleNextWave(delayMs: number, onWaveDue: (payload: WaveLaunchPayload) => void): void {
    if (this.nextWaveEvent) {
      this.nextWaveEvent.remove(false);
    }

    this.nextWaveAt = this.scene.time.now + delayMs;
    this.nextWaveEvent = this.scene.time.delayedCall(delayMs, () => onWaveDue({ source: "timer" }));
  }
}
