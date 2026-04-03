export class AchievementView {
  constructor({ elements }) {
    this.toastContainer = elements.achievementToastContainer;
    this.panelList = elements.achievementPanelList;
    this.panelCounter = elements.achievementPanelCounter;
    this.panelToggle = elements.achievementPanelToggle;
    this.panelSection = elements.achievementPanel;
    this.toastQueue = [];
    this.isShowingToast = false;
  }

  bindDomEvents() {
    if (this.panelToggle && this.panelSection) {
      this.panelToggle.addEventListener("click", () => {
        const isHidden = this.panelSection.hasAttribute("hidden");
        if (isHidden) {
          this.panelSection.removeAttribute("hidden");
          this.panelToggle.setAttribute("aria-expanded", "true");
        } else {
          this.panelSection.setAttribute("hidden", "");
          this.panelToggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  destroy() {}

  onAchievementUnlocked({ icon, name, description }) {
    this.toastQueue.push({ icon, name, description });
    if (!this.isShowingToast) {
      this.showNextToast();
    }
  }

  showNextToast() {
    if (this.toastQueue.length === 0) {
      this.isShowingToast = false;
      return;
    }

    this.isShowingToast = true;
    const { icon, name, description } = this.toastQueue.shift();

    if (!this.toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "achievement-toast";
    toast.innerHTML =
      `<span class="achievement-toast__icon">${icon}</span>` +
      `<div class="achievement-toast__body">` +
      `<div class="achievement-toast__title">${name}</div>` +
      `<div class="achievement-toast__desc">${description}</div>` +
      `</div>`;

    this.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("achievement-toast--visible");
    });

    setTimeout(() => {
      toast.classList.remove("achievement-toast--visible");
      toast.classList.add("achievement-toast--exit");
      toast.addEventListener("transitionend", () => {
        toast.remove();
        this.showNextToast();
      }, { once: true });
      setTimeout(() => {
        toast.remove();
        this.showNextToast();
      }, 600);
    }, 3000);
  }

  onAchievementList({ achievements }) {
    const unlockedCount = achievements.filter((a) => a.unlocked).length;
    const total = achievements.length;

    if (this.panelCounter) {
      this.panelCounter.textContent = `${unlockedCount}/${total}`;
    }

    if (!this.panelList) return;

    this.panelList.innerHTML = "";

    for (const ach of achievements) {
      const item = document.createElement("div");
      item.className = `achievement-item${ach.unlocked ? " achievement-item--unlocked" : ""}`;
      item.innerHTML =
        `<span class="achievement-item__icon">${ach.unlocked ? ach.icon : "🔒"}</span>` +
        `<div class="achievement-item__body">` +
        `<div class="achievement-item__name">${ach.unlocked ? ach.name : "???"}</div>` +
        `<div class="achievement-item__desc">${ach.unlocked ? ach.description : "Keep playing to unlock"}</div>` +
        `</div>`;
      this.panelList.appendChild(item);
    }
  }
}
