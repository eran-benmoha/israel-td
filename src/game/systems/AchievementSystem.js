import { Events } from "../core/events";

const STORAGE_KEY = "israelTD_achievements";

export class AchievementSystem {
  constructor({ eventBus, gameState, achievementsConfig, unitsConfig }) {
    this.eventBus = eventBus;
    this.state = gameState;
    this.definitions = achievementsConfig.achievements ?? [];
    this.units = unitsConfig.units ?? [];
    this.unlocked = new Set();
    this.totalSpent = 0;
    this.unsubscribers = [];
    this.loadProgress();
  }

  start() {
    this.unsubscribers.push(
      this.eventBus.on(Events.UI_SHOP_RESULT, (payload) => this.onShopResult(payload)),
      this.eventBus.on(Events.UI_WAVE, (payload) => this.onWaveUpdate(payload)),
      this.eventBus.on(Events.UI_RESOURCES, (payload) => this.onResourceUpdate(payload)),
    );
    this.publishList();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.unlocked)) {
          saved.unlocked.forEach((id) => this.unlocked.add(id));
        }
        this.totalSpent = saved.totalSpent ?? 0;
      }
    } catch {
      // corrupted data — start fresh
    }
  }

  saveProgress() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          unlocked: [...this.unlocked],
          totalSpent: this.totalSpent,
        }),
      );
    } catch {
      // storage full or unavailable
    }
  }

  onShopResult({ success, message }) {
    if (!success) return;

    const costMatch = message.match(/for (\d+)/);
    if (costMatch) {
      this.totalSpent += parseInt(costMatch[1], 10);
    }

    this.evaluateAll();
  }

  onWaveUpdate({ waveNumber }) {
    if (waveNumber > 0) {
      this.evaluateAll();
    }
  }

  onResourceUpdate({ resources }) {
    this.currentMoney = resources.money;
    this.evaluateAll();
  }

  evaluateAll() {
    for (const def of this.definitions) {
      if (this.unlocked.has(def.id)) continue;
      if (this.checkCondition(def)) {
        this.unlock(def);
      }
    }
  }

  checkCondition(def) {
    const { trigger, condition } = def;

    switch (trigger) {
      case "purchase_unit":
        return (this.state.purchasedUnits[condition.unitId] ?? 0) >= condition.count;

      case "total_purchases": {
        const total = Object.values(this.state.purchasedUnits).reduce((sum, n) => sum + n, 0);
        return total >= condition.count;
      }

      case "wave_survived":
        return this.state.wave.number >= condition.waveNumber;

      case "total_spent":
        return this.totalSpent >= condition.amount;

      case "money_held":
        return (this.currentMoney ?? this.state.resources.money) >= condition.amount;

      case "all_categories": {
        const purchasedCategories = new Set();
        for (const [unitId, count] of Object.entries(this.state.purchasedUnits)) {
          if (count > 0) {
            const unit = this.units.find((u) => u.id === unitId);
            if (unit) purchasedCategories.add(unit.category);
          }
        }
        return condition.categories.every((cat) => purchasedCategories.has(cat));
      }

      case "category_purchases": {
        const unitIdsInCategory = this.units
          .filter((u) => u.category === condition.category)
          .map((u) => u.id);
        const categoryTotal = unitIdsInCategory.reduce(
          (sum, id) => sum + (this.state.purchasedUnits[id] ?? 0),
          0,
        );
        return categoryTotal >= condition.count;
      }

      default:
        return false;
    }
  }

  unlock(def) {
    this.unlocked.add(def.id);
    this.saveProgress();

    this.eventBus.emit(Events.ACHIEVEMENT_UNLOCKED, {
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
    });
    this.eventBus.emit(Events.UI_ACHIEVEMENT, {
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
    });
    this.publishList();
  }

  publishList() {
    this.eventBus.emit(Events.UI_ACHIEVEMENT_LIST, {
      achievements: this.definitions.map((def) => ({
        ...def,
        unlocked: this.unlocked.has(def.id),
      })),
    });
  }

  getUnlockedCount() {
    return this.unlocked.size;
  }

  getTotalCount() {
    return this.definitions.length;
  }
}
