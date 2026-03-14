import Phaser from "phaser";

const MAP_GEO_BOUNDS = {
  // Approximate geographic coverage of the Middle East base map frame.
  north: 43.5,
  south: 10.0,
  west: 23.0,
  east: 66.0,
};

const WAVE_INTERVAL_MS = 60_000;

const GAZA_STRIP_BOUNDS = {
  north: 31.60,
  south: 31.22,
  west: 34.20,
  east: 34.58,
};

const ISRAEL_TARGETS = [
  { lat: 32.0853, lon: 34.7818 }, // Tel Aviv
  { lat: 31.7683, lon: 35.2137 }, // Jerusalem
  { lat: 32.794, lon: 34.9896 }, // Haifa
  { lat: 31.252, lon: 34.7915 }, // Be'er Sheva
  { lat: 31.8014, lon: 34.6435 }, // Ashdod
  { lat: 32.3215, lon: 34.8532 }, // Netanya
  { lat: 32.7015, lon: 35.3035 }, // Nazareth
  { lat: 32.794, lon: 35.5312 }, // Tiberias
  { lat: 29.5577, lon: 34.9519 }, // Eilat
  { lat: 31.525, lon: 34.595 }, // Sderot
];

const ISRAEL_BORDER_LAT_LON = [
  { lat: 33.28, lon: 35.57 },
  { lat: 33.28, lon: 35.76 },
  { lat: 33.02, lon: 35.62 },
  { lat: 32.75, lon: 35.56 },
  { lat: 32.44, lon: 35.53 },
  { lat: 32.18, lon: 35.45 },
  { lat: 31.90, lon: 35.40 },
  { lat: 31.63, lon: 35.42 },
  { lat: 31.34, lon: 35.37 },
  { lat: 31.02, lon: 35.32 },
  { lat: 30.67, lon: 35.22 },
  { lat: 30.30, lon: 35.12 },
  { lat: 29.86, lon: 34.98 },
  { lat: 29.50, lon: 34.90 },
  { lat: 29.56, lon: 34.66 },
  { lat: 29.88, lon: 34.57 },
  { lat: 30.32, lon: 34.48 },
  { lat: 30.76, lon: 34.41 },
  { lat: 31.06, lon: 34.30 },
  { lat: 31.25, lon: 34.23 },
  { lat: 31.47, lon: 34.34 },
  { lat: 31.72, lon: 34.52 },
  { lat: 32.04, lon: 34.75 },
  { lat: 32.43, lon: 34.95 },
  { lat: 32.78, lon: 35.02 },
  { lat: 33.09, lon: 35.14 },
  { lat: 33.28, lon: 35.22 },
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
    this.mapImage = null;
    this.mapContainer = null;
    this.baseMapScale = 1;
    this.zoomLevel = 1;
    this.minZoomLevel = 1;
    this.maxZoomLevel = 4;
    this.pinchStartDistance = 0;
    this.pinchStartZoomLevel = 1;
    this.waveNumber = 0;
    this.nextWaveAt = 0;
    this.nextWaveEvent = null;
    this.waveCountdownEvent = null;
    this.waveIndicatorEl = null;
    this.waveTimerEl = null;
    this.lastTimerSecond = -1;
    this.debugInstantWaveListener = null;
    this.resources = {
      money: 120,
      morale: 100,
      population: 100,
      army: 100,
    };
    this.maxResources = {
      money: 1000,
      morale: 100,
      population: 100,
      army: 100,
    };
    this.resourceElements = {};
  }

  preload() {
    const mapUrl = new URL("../../assets/maps/middle-east-geographic.jpg", import.meta.url).href;
    this.load.image("middle-east-map", mapUrl);
  }

  create() {
    this.cameras.main.setBackgroundColor("#05070e");

    let { width, height } = this.scale;
    const mapImage = this.add.image(0, 0, "middle-east-map").setOrigin(0, 0);
    const outline = this.add.graphics();
    this.drawIsraelOutline(outline, mapImage.width, mapImage.height);
    const mapContainer = this.add.container(0, 0, [mapImage, outline]);
    this.mapImage = mapImage;
    this.mapContainer = mapContainer;

    this.baseMapScale = this.getMapCoverScale(width, height, mapImage);
    mapContainer.setScale(this.baseMapScale * this.zoomLevel);
    this.clampMapPosition(mapContainer, mapImage, width, height);

    this.input.addPointer(1);
    let isDragging = false;
    let dragPointerId = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let mapStartX = mapContainer.x;
    let mapStartY = mapContainer.y;

    const getActiveTouchPointers = () => [this.input.pointer1, this.input.pointer2].filter((pointer) => pointer?.isDown);
    const isPinching = () => getActiveTouchPointers().length >= 2;

    const beginPinch = () => {
      const [pointerA, pointerB] = getActiveTouchPointers();
      if (!pointerA || !pointerB) {
        return;
      }

      this.pinchStartDistance = Phaser.Math.Distance.Between(pointerA.x, pointerA.y, pointerB.x, pointerB.y);
      this.pinchStartZoomLevel = this.zoomLevel;
      isDragging = false;
      dragPointerId = null;
    };

    const applyPinchZoom = () => {
      const [pointerA, pointerB] = getActiveTouchPointers();
      if (!pointerA || !pointerB) {
        return;
      }

      if (this.pinchStartDistance <= 0) {
        beginPinch();
      }

      const distance = Phaser.Math.Distance.Between(pointerA.x, pointerA.y, pointerB.x, pointerB.y);
      const midpointX = (pointerA.x + pointerB.x) / 2;
      const midpointY = (pointerA.y + pointerB.y) / 2;
      const ratio = this.pinchStartDistance > 0 ? distance / this.pinchStartDistance : 1;
      const nextZoom = Phaser.Math.Clamp(this.pinchStartZoomLevel * ratio, this.minZoomLevel, this.maxZoomLevel);
      this.applyZoomAtScreenPoint(nextZoom, midpointX, midpointY, width, height);
    };

    this.input.on("pointerdown", (pointer) => {
      if (isPinching()) {
        beginPinch();
        return;
      }

      isDragging = true;
      dragPointerId = pointer.id;
      dragStartX = pointer.x;
      dragStartY = pointer.y;
      mapStartX = mapContainer.x;
      mapStartY = mapContainer.y;
    });

    this.input.on("pointermove", (pointer) => {
      if (isPinching()) {
        applyPinchZoom();
        return;
      }

      if (!isDragging || !pointer.isDown || pointer.id !== dragPointerId) {
        return;
      }

      mapContainer.x = mapStartX + (pointer.x - dragStartX);
      mapContainer.y = mapStartY + (pointer.y - dragStartY);
      this.clampMapPosition(mapContainer, mapImage, width, height);
    });

    const stopDrag = () => {
      if (isPinching()) {
        beginPinch();
        return;
      }

      isDragging = false;
      dragPointerId = null;
      this.pinchStartDistance = 0;

      const [remainingPointer] = getActiveTouchPointers();
      if (remainingPointer) {
        isDragging = true;
        dragPointerId = remainingPointer.id;
        dragStartX = remainingPointer.x;
        dragStartY = remainingPointer.y;
        mapStartX = mapContainer.x;
        mapStartY = mapContainer.y;
      }
    };

    this.input.on("pointerup", stopDrag);
    this.input.on("pointerupoutside", stopDrag);
    this.input.on("wheel", (pointer, _gameObjects, _deltaX, deltaY) => {
      const zoomFactor = Math.exp(-deltaY * 0.0012);
      const nextZoom = Phaser.Math.Clamp(this.zoomLevel * zoomFactor, this.minZoomLevel, this.maxZoomLevel);
      this.applyZoomAtScreenPoint(nextZoom, pointer.x, pointer.y, width, height);
    });

    const title = this.add
      .text(width / 2, 34, "Drag + pinch/scroll zoom • Gaza waves every 60s", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#dbe9ff",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5, 0);

    this.scale.on("resize", (gameSize) => {
      const oldScale = mapContainer.scaleX;
      const centerWorldX = (width / 2 - mapContainer.x) / oldScale;
      const centerWorldY = (height / 2 - mapContainer.y) / oldScale;
      width = gameSize.width;
      height = gameSize.height;
      this.baseMapScale = this.getMapCoverScale(width, height, mapImage);
      mapContainer.setScale(this.baseMapScale * this.zoomLevel);
      mapContainer.x = width / 2 - centerWorldX * mapContainer.scaleX;
      mapContainer.y = height / 2 - centerWorldY * mapContainer.scaleY;
      this.clampMapPosition(mapContainer, mapImage, width, height);
      title.setPosition(width / 2, 34);
    });

    this.initializeWaveHud();
    this.registerDebugMenuHooks();
    this.startWaveLoop();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupSceneHooks, this);
  }

  getMapCoverScale(viewportWidth, viewportHeight, mapImage) {
    return Math.max(viewportWidth / mapImage.width, viewportHeight / mapImage.height);
  }

  clampMapPosition(mapContainer, mapImage, viewportWidth, viewportHeight) {
    const scaledWidth = mapImage.width * mapContainer.scaleX;
    const scaledHeight = mapImage.height * mapContainer.scaleY;

    if (scaledWidth <= viewportWidth) {
      mapContainer.x = (viewportWidth - scaledWidth) / 2;
    } else {
      const minX = viewportWidth - scaledWidth;
      const maxX = 0;
      mapContainer.x = Phaser.Math.Clamp(mapContainer.x, minX, maxX);
    }

    if (scaledHeight <= viewportHeight) {
      mapContainer.y = (viewportHeight - scaledHeight) / 2;
    } else {
      const minY = viewportHeight - scaledHeight;
      const maxY = 0;
      mapContainer.y = Phaser.Math.Clamp(mapContainer.y, minY, maxY);
    }
  }

  applyZoomAtScreenPoint(nextZoomLevel, screenX, screenY, viewportWidth, viewportHeight) {
    if (!this.mapContainer || !this.mapImage) {
      return;
    }

    const clampedZoom = Phaser.Math.Clamp(nextZoomLevel, this.minZoomLevel, this.maxZoomLevel);
    if (Math.abs(clampedZoom - this.zoomLevel) < 0.0001) {
      return;
    }

    const currentScale = this.mapContainer.scaleX;
    const worldX = (screenX - this.mapContainer.x) / currentScale;
    const worldY = (screenY - this.mapContainer.y) / currentScale;

    this.zoomLevel = clampedZoom;
    const nextScale = this.baseMapScale * this.zoomLevel;
    this.mapContainer.setScale(nextScale);
    this.mapContainer.x = screenX - worldX * nextScale;
    this.mapContainer.y = screenY - worldY * nextScale;
    this.clampMapPosition(this.mapContainer, this.mapImage, viewportWidth, viewportHeight);
  }

  initializeWaveHud() {
    this.waveIndicatorEl = document.getElementById("wave-indicator");
    this.waveTimerEl = document.getElementById("wave-timer");
    this.initializeResourceHud();
    this.syncWaveHud(60);
  }

  startWaveLoop() {
    this.waveNumber = 0;
    this.lastTimerSecond = -1;
    this.scheduleNextWave();
    this.waveCountdownEvent = this.time.addEvent({
      delay: 250,
      loop: true,
      callback: this.updateWaveCountdown,
      callbackScope: this,
    });
    this.updateWaveCountdown();
  }

  scheduleNextWave(delayMs = WAVE_INTERVAL_MS) {
    if (this.nextWaveEvent) {
      this.nextWaveEvent.remove(false);
    }

    this.nextWaveAt = this.time.now + delayMs;
    this.nextWaveEvent = this.time.delayedCall(delayMs, () => this.launchWave({ source: "timer" }));
  }

  launchWave({ source = "timer" } = {}) {
    this.waveNumber += 1;
    this.spawnRocketWave();
    this.scheduleNextWave();
    this.syncWaveHud(60);
    this.adjustResource("money", 28 + this.waveNumber * 3);
    this.adjustResource("army", 0.75);
    this.updateResourceHud();
    this.emitDebugStatus(source === "debug" ? `Instant wave ${this.waveNumber} launched.` : `Wave ${this.waveNumber} launched.`);
  }

  updateWaveCountdown() {
    const remainingMs = Math.max(0, this.nextWaveAt - this.time.now);
    const remainingSeconds = Math.ceil(remainingMs / 1000);

    if (remainingSeconds !== this.lastTimerSecond) {
      this.lastTimerSecond = remainingSeconds;
      this.syncWaveHud(remainingSeconds);
    }
  }

  syncWaveHud(remainingSeconds = 60) {
    if (this.waveIndicatorEl) {
      this.waveIndicatorEl.textContent = `Wave ${this.waveNumber}`;
    }

    if (this.waveTimerEl) {
      this.waveTimerEl.textContent = `Next wave: ${remainingSeconds}s`;
    }
  }

  initializeResourceHud() {
    this.resourceElements = {
      money: {
        value: document.getElementById("resource-money-value"),
        fill: document.getElementById("resource-money-fill"),
      },
      morale: {
        value: document.getElementById("resource-morale-value"),
        fill: document.getElementById("resource-morale-fill"),
      },
      population: {
        value: document.getElementById("resource-population-value"),
        fill: document.getElementById("resource-population-fill"),
      },
      army: {
        value: document.getElementById("resource-army-value"),
        fill: document.getElementById("resource-army-fill"),
      },
    };
    this.updateResourceHud();
  }

  adjustResource(resourceName, delta) {
    const max = this.maxResources[resourceName];
    const nextValue = Phaser.Math.Clamp(this.resources[resourceName] + delta, 0, max);
    this.resources[resourceName] = nextValue;
  }

  updateResourceHud() {
    const resources = ["money", "morale", "population", "army"];
    resources.forEach((key) => {
      const elements = this.resourceElements[key];
      if (!elements) {
        return;
      }

      const value = this.resources[key];
      const max = this.maxResources[key];
      const percent = (value / max) * 100;

      if (elements.fill) {
        elements.fill.style.width = `${percent}%`;
      }

      if (elements.value) {
        if (key === "money") {
          elements.value.textContent = `${Math.round(value)} / ${max}`;
        } else {
          elements.value.textContent = `${Math.round(percent)}%`;
        }
      }
    });
  }

  registerDebugMenuHooks() {
    this.debugInstantWaveListener = () => {
      this.launchWave({ source: "debug" });
    };
    window.addEventListener("debug:launchWaveInstant", this.debugInstantWaveListener);
    this.emitDebugStatus("Debug ready.");
  }

  cleanupSceneHooks() {
    if (this.waveCountdownEvent) {
      this.waveCountdownEvent.remove(false);
      this.waveCountdownEvent = null;
    }

    if (this.nextWaveEvent) {
      this.nextWaveEvent.remove(false);
      this.nextWaveEvent = null;
    }

    if (this.debugInstantWaveListener) {
      window.removeEventListener("debug:launchWaveInstant", this.debugInstantWaveListener);
      this.debugInstantWaveListener = null;
    }
  }

  emitDebugStatus(message) {
    window.dispatchEvent(
      new CustomEvent("debug:status", {
        detail: { message },
      }),
    );
  }

  spawnRocketWave() {
    const rocketCount = Phaser.Math.Clamp(6 + this.waveNumber * 2, 6, 24);

    for (let i = 0; i < rocketCount; i += 1) {
      this.time.delayedCall(i * 170, () => this.spawnRocket());
    }
  }

  spawnRocket() {
    if (!this.mapImage || !this.mapContainer) {
      return;
    }

    const launchPoint = this.randomPointFromGeoRect(GAZA_STRIP_BOUNDS);
    const targetPoint = this.getRandomIsraelTargetPoint();
    const trail = this.add.graphics();
    const rocket = this.add.circle(launchPoint.x, launchPoint.y, 3.2, 0xff9a5e, 1);
    rocket.setStrokeStyle(1, 0x3d1200, 0.9);
    this.mapContainer.add([trail, rocket]);

    const rocketState = { t: 0 };
    const duration = Phaser.Math.Between(1300, 2400);

    this.tweens.add({
      targets: rocketState,
      t: 1,
      duration,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const x = Phaser.Math.Linear(launchPoint.x, targetPoint.x, rocketState.t);
        const y = Phaser.Math.Linear(launchPoint.y, targetPoint.y, rocketState.t);
        rocket.setPosition(x, y);

        trail.clear();
        trail.lineStyle(2, 0xff7a45, 0.85);
        trail.beginPath();
        trail.moveTo(launchPoint.x, launchPoint.y);
        trail.lineTo(x, y);
        trail.strokePath();
      },
      onComplete: () => {
        trail.destroy();
        rocket.destroy();
        this.createImpactFlash(targetPoint.x, targetPoint.y);
      },
    });
  }

  createImpactFlash(x, y) {
    if (!this.mapContainer) {
      return;
    }

    this.adjustResource("morale", -Phaser.Math.FloatBetween(0.45, 1.2));
    this.adjustResource("population", -Phaser.Math.FloatBetween(0.35, 0.95));
    this.adjustResource("army", -Phaser.Math.FloatBetween(0.28, 0.78));
    this.adjustResource("money", -Phaser.Math.FloatBetween(1, 4));
    this.updateResourceHud();

    const impact = this.add.circle(x, y, 3, 0xfff4b8, 0.95);
    this.mapContainer.add(impact);

    this.tweens.add({
      targets: impact,
      scale: 6,
      alpha: 0,
      duration: 280,
      ease: "Cubic.easeOut",
      onComplete: () => impact.destroy(),
    });
  }

  randomPointFromGeoRect(bounds) {
    const lat = Phaser.Math.FloatBetween(bounds.south, bounds.north);
    const lon = Phaser.Math.FloatBetween(bounds.west, bounds.east);
    return this.geoToImagePoint(lat, lon, this.mapImage.width, this.mapImage.height);
  }

  getRandomIsraelTargetPoint() {
    const target = Phaser.Utils.Array.GetRandom(ISRAEL_TARGETS);
    return this.geoToImagePoint(target.lat, target.lon, this.mapImage.width, this.mapImage.height);
  }

  drawIsraelOutline(outline, imageWidth, imageHeight) {
    const points = ISRAEL_BORDER_LAT_LON.map((point) =>
      this.geoToImagePoint(point.lat, point.lon, imageWidth, imageHeight),
    );

    outline.clear();
    outline.lineStyle(11, 0x00131f, 0.62);
    outline.strokePoints(points, true);
    outline.lineStyle(6, 0x53d8ff, 0.94);
    outline.strokePoints(points, true);
  }

  geoToImagePoint(lat, lon, imageWidth, imageHeight) {
    const x = ((lon - MAP_GEO_BOUNDS.west) / (MAP_GEO_BOUNDS.east - MAP_GEO_BOUNDS.west)) * imageWidth;
    const y = ((MAP_GEO_BOUNDS.north - lat) / (MAP_GEO_BOUNDS.north - MAP_GEO_BOUNDS.south)) * imageHeight;
    return new Phaser.Geom.Point(x, y);
  }
}
