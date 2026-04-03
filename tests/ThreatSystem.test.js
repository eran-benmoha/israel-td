import { describe, it, expect, beforeEach } from "vitest";
import { ThreatSystem } from "../src/game/systems/ThreatSystem";
import { EventBus } from "../src/game/core/EventBus";
import { Events } from "../src/game/core/events";
import threatConfig from "../src/data/threat-config.json";

const factionsConfig = {
  factions: [
    { id: "hamas-gaza", name: "Hamas", territory: "Gaza Strip" },
    { id: "hezbollah-lebanon", name: "Hezbollah", territory: "South Lebanon" },
    { id: "houthis-yemen", name: "Houthis", territory: "Western Yemen" },
    { id: "iran-regime", name: "Iran regime", territory: "Iran" },
  ],
};

function makeScene() {
  let now = 1000;
  const events = [];
  return {
    time: {
      get now() { return now; },
      addEvent({ delay, loop, callback, callbackScope }) {
        const entry = { delay, loop, callback, callbackScope, removed: false };
        events.push(entry);
        return { remove() { entry.removed = true; } };
      },
    },
    _events: events,
    _advance(ms) { now += ms; },
  };
}

describe("ThreatSystem", () => {
  let bus, system, scene;

  beforeEach(() => {
    bus = new EventBus();
    system = new ThreatSystem({ eventBus: bus, factionsConfig, threatConfig });
    scene = makeScene();
    system.start(scene);
  });

  it("initializes all factions with zero scores", () => {
    const updates = [];
    bus.on(Events.UI_THREAT_UPDATE, (payload) => updates.push(payload));
    system.publish();
    expect(updates.length).toBe(1);
    for (const f of updates[0].factions) {
      expect(f.score).toBe(0);
      expect(f.level.id).toBe("low");
    }
    expect(updates[0].overall.level.id).toBe("low");
  });

  it("missile launch increases faction score", () => {
    bus.emit(Events.THREAT_MISSILE_LAUNCHED, { factionId: "hamas-gaza" });
    const data = system.factionThreats.get("hamas-gaza");
    expect(data.score).toBe(threatConfig.scoring.launchPoints);
    expect(data.totalLaunched).toBe(1);
  });

  it("missile impact increases faction score", () => {
    bus.emit(Events.THREAT_MISSILE_IMPACT, { factionId: "hezbollah-lebanon" });
    const data = system.factionThreats.get("hezbollah-lebanon");
    expect(data.score).toBe(threatConfig.scoring.impactPoints);
    expect(data.totalImpacts).toBe(1);
  });

  it("missile interception decreases faction score", () => {
    bus.emit(Events.THREAT_MISSILE_LAUNCHED, { factionId: "iran-regime" });
    bus.emit(Events.THREAT_MISSILE_LAUNCHED, { factionId: "iran-regime" });
    bus.emit(Events.THREAT_MISSILE_INTERCEPTED, { factionId: "iran-regime" });
    const data = system.factionThreats.get("iran-regime");
    expect(data.score).toBe(2 * threatConfig.scoring.launchPoints + threatConfig.scoring.interceptPoints);
    expect(data.totalIntercepted).toBe(1);
  });

  it("score never goes below 0 on interception", () => {
    bus.emit(Events.THREAT_MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    const data = system.factionThreats.get("hamas-gaza");
    expect(data.score).toBe(0);
  });

  it("score is capped at maxScore", () => {
    for (let i = 0; i < 50; i++) {
      bus.emit(Events.THREAT_MISSILE_IMPACT, { factionId: "hamas-gaza" });
    }
    const data = system.factionThreats.get("hamas-gaza");
    expect(data.score).toBe(threatConfig.scoring.maxScore);
  });

  it("getThreatLevel returns correct tiers", () => {
    expect(system.getThreatLevel(0).id).toBe("low");
    expect(system.getThreatLevel(10).id).toBe("low");
    expect(system.getThreatLevel(25).id).toBe("guarded");
    expect(system.getThreatLevel(50).id).toBe("elevated");
    expect(system.getThreatLevel(70).id).toBe("high");
    expect(system.getThreatLevel(85).id).toBe("severe");
    expect(system.getThreatLevel(100).id).toBe("severe");
  });

  it("overall score is the maximum of all factions", () => {
    for (let i = 0; i < 5; i++) {
      bus.emit(Events.THREAT_MISSILE_IMPACT, { factionId: "iran-regime" });
    }
    expect(system.getOverallScore()).toBe(Math.min(5 * threatConfig.scoring.impactPoints, threatConfig.scoring.maxScore));
  });

  it("tick applies decay to all factions", () => {
    bus.emit(Events.THREAT_MISSILE_IMPACT, { factionId: "hamas-gaza" });
    const scoreBefore = system.factionThreats.get("hamas-gaza").score;
    scene._advance(2000);
    system.tick();
    const scoreAfter = system.factionThreats.get("hamas-gaza").score;
    expect(scoreAfter).toBeLessThan(scoreBefore);
    const expectedDecay = threatConfig.scoring.decayPerSecond * 2;
    expect(scoreAfter).toBeCloseTo(scoreBefore - expectedDecay, 1);
  });

  it("ignores events for unknown faction IDs", () => {
    bus.emit(Events.THREAT_MISSILE_LAUNCHED, { factionId: "unknown-faction" });
    bus.emit(Events.THREAT_MISSILE_IMPACT, { factionId: "unknown-faction" });
    bus.emit(Events.THREAT_MISSILE_INTERCEPTED, { factionId: "unknown-faction" });
    for (const [, data] of system.factionThreats) {
      expect(data.score).toBe(0);
    }
  });

  it("publish emits UI_THREAT_UPDATE with correct structure", () => {
    const updates = [];
    bus.on(Events.UI_THREAT_UPDATE, (payload) => updates.push(payload));
    bus.emit(Events.THREAT_MISSILE_IMPACT, { factionId: "hamas-gaza" });
    system.publish();
    const payload = updates[updates.length - 1];
    expect(payload).toHaveProperty("overall");
    expect(payload).toHaveProperty("factions");
    expect(payload.overall).toHaveProperty("score");
    expect(payload.overall).toHaveProperty("level");
    expect(payload.factions).toHaveLength(4);
    const hamas = payload.factions.find((f) => f.factionId === "hamas-gaza");
    expect(hamas.totalImpacts).toBe(1);
    expect(hamas.score).toBeGreaterThan(0);
  });

  it("destroy unsubscribes all handlers", () => {
    system.destroy();
    bus.emit(Events.THREAT_MISSILE_LAUNCHED, { factionId: "hamas-gaza" });
    const data = system.factionThreats.get("hamas-gaza");
    expect(data.score).toBe(0);
    expect(data.totalLaunched).toBe(0);
  });
});
