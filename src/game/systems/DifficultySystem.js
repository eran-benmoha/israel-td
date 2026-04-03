import { Events } from "../core/events";

const STORAGE_KEY = "israel-td-difficulty";

export class DifficultySystem {
  constructor({ eventBus, gameState, difficultyConfig }) {
    this.eventBus = eventBus;
    this.state = gameState;
    this.difficulties = difficultyConfig.difficulties ?? [];
    this.defaultId = difficultyConfig.default ?? "normal";
    this.unsubscribeSelect = null;
  }

  start() {
    this.unsubscribeSelect = this.eventBus.on(Events.DIFFICULTY_SELECT, ({ difficultyId }) =>
      this.selectDifficulty(difficultyId),
    );

    const savedId = this.loadSavedDifficulty();
    const initialId = savedId && this.getById(savedId) ? savedId : this.defaultId;
    this.applyDifficulty(initialId);
    this.publishState();
  }

  destroy() {
    if (this.unsubscribeSelect) {
      this.unsubscribeSelect();
      this.unsubscribeSelect = null;
    }
  }

  getById(difficultyId) {
    return this.difficulties.find((d) => d.id === difficultyId) ?? null;
  }

  selectDifficulty(difficultyId) {
    const difficulty = this.getById(difficultyId);
    if (!difficulty) return;
    this.applyDifficulty(difficultyId);
    this.saveDifficulty(difficultyId);
    this.publishState();
  }

  applyDifficulty(difficultyId) {
    const difficulty = this.getById(difficultyId);
    if (!difficulty) return;

    this.state.difficulty.id = difficulty.id;
    this.state.difficulty.modifiers = { ...difficulty.modifiers };
    this.state.resources.money = difficulty.modifiers.startingMoney;
  }

  publishState() {
    this.eventBus.emit(Events.UI_DIFFICULTY, {
      difficulties: this.difficulties,
      selectedId: this.state.difficulty.id,
    });
  }

  loadSavedDifficulty() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  saveDifficulty(difficultyId) {
    try {
      localStorage.setItem(STORAGE_KEY, difficultyId);
    } catch {
      /* storage unavailable */
    }
  }
}
