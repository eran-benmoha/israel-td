import Phaser from "phaser";

const MIDDLE_EAST_PROJECTION = {
  // Wikimedia Middle East location-map projection constants.
  centralMeridian: 50.0,
  xScale: 143.2394488,
  rOffset: 2.238026669,
  thetaScale: 0.497465385,
  xCompression: 0.654,
  yAnchor: 1.714427893,
};

const INITIAL_ZOOM_LEVEL = 2.6;
const INITIAL_ISRAEL_FOCUS = { lat: 31.45, lon: 34.95 };
const MAP_VIEW_ROTATION_DEG = -4.5;
const EARTH_RADIUS_KM = 6371;
const SIMULATION_START_UTC_MS = Date.UTC(2022, 0, 1, 0, 0, 0);
const SIMULATION_HOURS_PER_REAL_SECOND = 3;
const WAVE_INTERVAL_MIN_MS = 22_000;
const WAVE_INTERVAL_MAX_MS = 95_000;

const HAMAS_MISSILE_TYPES = {
  // Approximate gameplay ranges inspired by public reporting on Hamas rocket classes.
  // Short-range: around tens of km; Long-range: significantly farther but less frequent.
  shortRange: {
    id: "hamas-short-range",
    label: "short-range",
    minRangeKm: 0,
    maxRangeKm: 45,
    rocketColor: 0xffa767,
    trailOuterColor: 0xffb77c,
    trailInnerColor: 0xfff0a0,
    flameColor: 0xffe59a,
    durationMin: 3600,
    durationMax: 5400,
    impactScale: 1.0,
  },
  longRange: {
    id: "hamas-long-range",
    label: "long-range",
    minRangeKm: 45,
    maxRangeKm: 260,
    rocketColor: 0xff7f4f,
    trailOuterColor: 0xf65a2d,
    trailInnerColor: 0xffd5b8,
    flameColor: 0xffcd9f,
    durationMin: 6200,
    durationMax: 9300,
    impactScale: 1.18,
  },
};

const HOSTILE_FACTIONS = [
  {
    id: "hamas-gaza",
    name: "Hamas",
    territory: "Gaza Strip",
    bounds: { north: 31.6, south: 31.22, west: 34.2, east: 34.58 },
    trailColor: 0xff7a45,
    rocketColor: 0xff9a5e,
    baseVolley: 8,
    maxVolley: 28,
    impactMultiplier: 1.0,
    durationMin: 3800,
    durationMax: 6200,
    launchCadenceMs: 600,
  },
  {
    id: "hezbollah-lebanon",
    name: "Hezbollah",
    territory: "South Lebanon",
    bounds: { north: 34.55, south: 33.05, west: 35.05, east: 36.65 },
    trailColor: 0xffad4d,
    rocketColor: 0xffcb73,
    baseVolley: 7,
    maxVolley: 24,
    impactMultiplier: 1.05,
    durationMin: 4200,
    durationMax: 7000,
    launchCadenceMs: 680,
  },
  {
    id: "houthis-yemen",
    name: "Houthis",
    territory: "Western Yemen",
    bounds: { north: 17.2, south: 12.3, west: 42.1, east: 46.2 },
    trailColor: 0xff5c5c,
    rocketColor: 0xff8787,
    baseVolley: 5,
    maxVolley: 18,
    impactMultiplier: 1.2,
    durationMin: 6200,
    durationMax: 9800,
    launchCadenceMs: 820,
  },
  {
    id: "iran-regime",
    name: "Iran regime",
    territory: "Iran",
    bounds: { north: 38.6, south: 28.0, west: 46.0, east: 60.6 },
    trailColor: 0xd676ff,
    rocketColor: 0xe5a0ff,
    baseVolley: 6,
    maxVolley: 22,
    impactMultiplier: 1.25,
    durationMin: 7000,
    durationMax: 11200,
    launchCadenceMs: 920,
  },
];

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

const UNIT_CATALOG = [
  {
    id: "iron-dome-battery",
    name: "Iron Dome Battery",
    category: "air-defense",
    cost: 120,
    moraleBoost: 0.8,
    armyBoost: 2.2,
  },
  {
    id: "arrow-system",
    name: "Arrow Interceptor",
    category: "air-defense",
    cost: 180,
    moraleBoost: 1.1,
    armyBoost: 3.0,
  },
  {
    id: "fighter-sortie",
    name: "Fighter Sortie",
    category: "air-force",
    cost: 160,
    moraleBoost: 1.0,
    armyBoost: 2.7,
  },
  {
    id: "precision-strike",
    name: "Precision Strike",
    category: "air-force",
    cost: 210,
    moraleBoost: 1.4,
    armyBoost: 3.5,
  },
  {
    id: "reserve-brigade",
    name: "Reserve Brigade",
    category: "ground-troops",
    cost: 90,
    moraleBoost: 0.6,
    armyBoost: 1.8,
  },
  {
    id: "border-defense-line",
    name: "Border Defense Line",
    category: "ground-troops",
    cost: 140,
    moraleBoost: 0.9,
    armyBoost: 2.4,
  },
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

const ISRAEL_REGIONS = [
  {
    id: "north",
    name: "North",
    border: [
      { lat: 33.29, lon: 34.9 },
      { lat: 33.29, lon: 35.78 },
      { lat: 32.78, lon: 35.75 },
      { lat: 32.76, lon: 34.93 },
    ],
  },
  {
    id: "central",
    name: "Central",
    border: [
      { lat: 32.78, lon: 34.93 },
      { lat: 32.78, lon: 35.56 },
      { lat: 31.95, lon: 35.52 },
      { lat: 31.95, lon: 34.5 },
    ],
  },
  {
    id: "south",
    name: "South",
    border: [
      { lat: 31.95, lon: 34.5 },
      { lat: 31.95, lon: 35.48 },
      { lat: 29.5, lon: 34.95 },
      { lat: 29.5, lon: 34.3 },
    ],
  },
  {
    id: "gaza-border",
    name: "Gaza Border",
    border: [
      { lat: 31.62, lon: 34.3 },
      { lat: 31.62, lon: 34.85 },
      { lat: 31.2, lon: 34.85 },
      { lat: 31.2, lon: 34.34 },
    ],
  },
  {
    id: "west-bank",
    name: "West Bank",
    border: [
      { lat: 32.56, lon: 35.12 },
      { lat: 32.06, lon: 35.45 },
      { lat: 31.27, lon: 35.46 },
      { lat: 31.3, lon: 35.1 },
      { lat: 31.86, lon: 34.99 },
    ],
  },
];

const REGION_CITY_MARKERS = [
  { regionId: "north", name: "Haifa", lat: 32.794, lon: 34.9896 },
  { regionId: "north", name: "Tiberias", lat: 32.794, lon: 35.5312 },
  { regionId: "central", name: "Tel Aviv", lat: 32.0853, lon: 34.7818 },
  { regionId: "central", name: "Jerusalem", lat: 31.7683, lon: 35.2137 },
  { regionId: "south", name: "Be'er Sheva", lat: 31.252, lon: 34.7915 },
  { regionId: "south", name: "Eilat", lat: 29.5577, lon: 34.9519 },
  { regionId: "gaza-border", name: "Sderot", lat: 31.525, lon: 34.595 },
  { regionId: "gaza-border", name: "Ashkelon", lat: 31.6688, lon: 34.5743 },
  { regionId: "west-bank", name: "Ramallah", lat: 31.9038, lon: 35.2034 },
  { regionId: "west-bank", name: "Hebron", lat: 31.5326, lon: 35.0998 },
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
    this.mapImage = null;
    this.mapContainer = null;
    this.baseMapScale = 1;
    this.zoomLevel = INITIAL_ZOOM_LEVEL;
    this.minZoomLevel = 1;
    this.maxZoomLevel = 12;
    this.pinchStartDistance = 0;
    this.pinchStartZoomLevel = 1;
    this.waveNumber = 0;
    this.activeFaction = null;
    this.upcomingFaction = HOSTILE_FACTIONS[0];
    this.nextWaveAt = 0;
    this.nextWaveEvent = null;
    this.clockTickEvent = null;
    this.waveIndicatorEl = null;
    this.waveTimerEl = null;
    this.waveOriginEl = null;
    this.simulationClockMs = SIMULATION_START_UTC_MS;
    this.lastSimulationUpdateAt = 0;
    this.debugInstantWaveListener = null;
    this.resources = {
      money: 120,
      morale: 100,
      population: 100,
      army: 100,
      economy: 100,
    };
    this.maxResources = {
      money: 1000,
      morale: 100,
      population: 100,
      army: 100,
      economy: 100,
    };
    this.resourceElements = {};
    this.shopPurchaseListener = null;
    this.purchasedUnits = {};
  }

  preload() {
    const mapUrl = new URL("../../assets/maps/middle-east-relief.jpg", import.meta.url).href;
    this.load.image("middle-east-map", mapUrl);
  }

  create() {
    this.cameras.main.setBackgroundColor("#05070e");
    this.cameras.main.setRotation(Phaser.Math.DegToRad(MAP_VIEW_ROTATION_DEG));

    let { width, height } = this.scale;
    const mapImage = this.add.image(0, 0, "middle-east-map").setOrigin(0, 0);
    const outline = this.add.graphics();
    this.drawIsraelOutline(outline, mapImage.width, mapImage.height);
    const regionsLayer = this.add.container(0, 0);
    this.drawIsraelRegions(regionsLayer, mapImage.width, mapImage.height);
    const cityLayer = this.add.container(0, 0);
    this.drawRegionCityMarkers(cityLayer, mapImage.width, mapImage.height);
    const hostileMarkers = this.add.container(0, 0);
    this.drawHostileFactionMarkers(hostileMarkers, mapImage.width, mapImage.height);
    const mapContainer = this.add.container(0, 0, [mapImage, regionsLayer, outline, hostileMarkers, cityLayer]);
    this.mapImage = mapImage;
    this.mapContainer = mapContainer;

    this.baseMapScale = this.getMapCoverScale(width, height, mapImage);
    mapContainer.setScale(this.baseMapScale * this.zoomLevel);
    this.focusMapOnGeoPoint(mapContainer, mapImage, width, height, INITIAL_ISRAEL_FOCUS.lat, INITIAL_ISRAEL_FOCUS.lon);

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
      .text(width / 2, 34, "Drag + pinch/scroll zoom • Hostile waves every 60s", {
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
    this.registerShopHooks();
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

  focusMapOnGeoPoint(mapContainer, mapImage, viewportWidth, viewportHeight, lat, lon) {
    const focusPoint = this.geoToImagePoint(lat, lon, mapImage.width, mapImage.height);
    mapContainer.x = viewportWidth / 2 - focusPoint.x * mapContainer.scaleX;
    mapContainer.y = viewportHeight / 2 - focusPoint.y * mapContainer.scaleY;
    this.clampMapPosition(mapContainer, mapImage, viewportWidth, viewportHeight);
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
    this.emitDebugZoom();
  }

  initializeWaveHud() {
    this.waveIndicatorEl = document.getElementById("wave-indicator");
    this.waveTimerEl = document.getElementById("wave-timer");
    this.waveOriginEl = document.getElementById("wave-origin");
    this.initializeResourceHud();
    this.syncWaveHud();
  }

  startWaveLoop() {
    this.waveNumber = 0;
    this.activeFaction = null;
    this.upcomingFaction = this.getFactionForWave(1);
    this.simulationClockMs = SIMULATION_START_UTC_MS;
    this.lastSimulationUpdateAt = this.time.now;
    this.scheduleNextWave();
    this.clockTickEvent = this.time.addEvent({
      delay: 250,
      loop: true,
      callback: this.tickSimulationClock,
      callbackScope: this,
    });
    this.syncWaveHud();
  }

  scheduleNextWave(delayMs = this.getRandomWaveDelayMs()) {
    if (this.nextWaveEvent) {
      this.nextWaveEvent.remove(false);
    }

    this.nextWaveAt = this.time.now + delayMs;
    this.nextWaveEvent = this.time.delayedCall(delayMs, () => this.launchWave({ source: "timer" }));
  }

  launchWave({ source = "timer" } = {}) {
    this.waveNumber += 1;
    this.activeFaction = this.getFactionForWave(this.waveNumber);
    this.upcomingFaction = this.getFactionForWave(this.waveNumber + 1);
    this.spawnRocketWave(this.activeFaction);
    this.scheduleNextWave();
    this.syncWaveHud();
    this.adjustResource("money", 28 + this.waveNumber * 3);
    this.adjustResource("army", 0.75);
    this.updateResourceHud();
    this.emitDebugStatus(
      source === "debug"
        ? `Instant wave ${this.waveNumber} launched from ${this.describeFaction(this.activeFaction)}.`
        : `Wave ${this.waveNumber} launched from ${this.describeFaction(this.activeFaction)}.`,
    );
  }

  getRandomWaveDelayMs() {
    return Phaser.Math.Between(WAVE_INTERVAL_MIN_MS, WAVE_INTERVAL_MAX_MS);
  }

  tickSimulationClock() {
    const now = this.time.now;
    const elapsedRealMs = Math.max(0, now - this.lastSimulationUpdateAt);
    this.lastSimulationUpdateAt = now;
    this.simulationClockMs += (elapsedRealMs * SIMULATION_HOURS_PER_REAL_SECOND * 60 * 60 * 1000) / 1000;
    this.syncWaveHud();
  }

  formatSimulationClock() {
    const date = new Date(this.simulationClockMs);
    const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const day = String(date.getUTCDate()).padStart(2, "0");
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} ${hours}:${minutes} UTC`;
  }

  syncWaveHud() {
    if (this.waveIndicatorEl) {
      this.waveIndicatorEl.textContent = `Wave ${this.waveNumber}`;
    }

    if (this.waveTimerEl) {
      this.waveTimerEl.textContent = `Clock: ${this.formatSimulationClock()}`;
    }

    if (this.waveOriginEl) {
      const sourceText =
        this.waveNumber === 0
          ? `Next source: ${this.describeFaction(this.upcomingFaction)}`
          : `Active source: ${this.describeFaction(this.activeFaction)}`;
      this.waveOriginEl.textContent = sourceText;
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
      economy: {
        value: document.getElementById("resource-economy-value"),
        fill: document.getElementById("resource-economy-fill"),
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
    this.recalculateEconomy();
    const resources = ["money", "morale", "population", "army", "economy"];
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

    this.emitShopState();
  }

  recalculateEconomy() {
    const moneyPercent = (this.resources.money / this.maxResources.money) * 100;
    const weightedEconomy =
      moneyPercent * 0.45 + this.resources.morale * 0.2 + this.resources.population * 0.2 + this.resources.army * 0.15;
    this.resources.economy = Phaser.Math.Clamp(weightedEconomy, 0, 100);
  }

  registerDebugMenuHooks() {
    this.debugInstantWaveListener = () => {
      this.launchWave({ source: "debug" });
    };
    window.addEventListener("debug:launchWaveInstant", this.debugInstantWaveListener);
    this.emitDebugStatus("Debug ready.");
    this.emitDebugZoom();
  }

  registerShopHooks() {
    this.shopPurchaseListener = (event) => {
      const unitId = event.detail?.unitId;
      if (typeof unitId !== "string") {
        return;
      }

      this.purchaseUnit(unitId);
    };
    window.addEventListener("shop:purchaseUnit", this.shopPurchaseListener);
    this.emitShopCatalog();
    this.emitShopState();
  }

  purchaseUnit(unitId) {
    const unit = UNIT_CATALOG.find((candidate) => candidate.id === unitId);
    if (!unit) {
      this.emitShopPurchaseResult(false, "Unit not found.");
      return;
    }

    if (this.resources.money < unit.cost) {
      this.emitShopPurchaseResult(false, `Not enough money for ${unit.name}.`);
      return;
    }

    this.adjustResource("money", -unit.cost);
    this.adjustResource("army", unit.armyBoost);
    this.adjustResource("morale", unit.moraleBoost);
    this.purchasedUnits[unit.id] = (this.purchasedUnits[unit.id] ?? 0) + 1;
    this.updateResourceHud();
    this.emitDebugStatus(`Purchased ${unit.name}.`);
    this.emitShopPurchaseResult(true, `Purchased ${unit.name} for ${unit.cost}.`);
  }

  emitShopCatalog() {
    window.dispatchEvent(
      new CustomEvent("shop:catalog", {
        detail: { units: UNIT_CATALOG },
      }),
    );
  }

  emitShopState() {
    window.dispatchEvent(
      new CustomEvent("shop:state", {
        detail: {
          money: this.resources.money,
          purchased: { ...this.purchasedUnits },
        },
      }),
    );
  }

  emitShopPurchaseResult(success, message) {
    window.dispatchEvent(
      new CustomEvent("shop:purchaseResult", {
        detail: {
          success,
          message,
        },
      }),
    );
  }

  cleanupSceneHooks() {
    if (this.clockTickEvent) {
      this.clockTickEvent.remove(false);
      this.clockTickEvent = null;
    }

    if (this.nextWaveEvent) {
      this.nextWaveEvent.remove(false);
      this.nextWaveEvent = null;
    }

    if (this.debugInstantWaveListener) {
      window.removeEventListener("debug:launchWaveInstant", this.debugInstantWaveListener);
      this.debugInstantWaveListener = null;
    }

    if (this.shopPurchaseListener) {
      window.removeEventListener("shop:purchaseUnit", this.shopPurchaseListener);
      this.shopPurchaseListener = null;
    }
  }

  emitDebugStatus(message) {
    window.dispatchEvent(
      new CustomEvent("debug:status", {
        detail: { message },
      }),
    );
  }

  emitDebugZoom() {
    window.dispatchEvent(
      new CustomEvent("debug:zoom", {
        detail: { zoom: this.zoomLevel },
      }),
    );
  }

  getFactionForWave(waveNumber) {
    const index = (waveNumber - 1) % HOSTILE_FACTIONS.length;
    return HOSTILE_FACTIONS[Math.max(0, index)];
  }

  describeFaction(faction) {
    if (!faction) {
      return "Unknown";
    }
    return `${faction.name} • ${faction.territory}`;
  }

  spawnRocketWave(faction) {
    const rocketCount = Phaser.Math.Clamp(faction.baseVolley + this.waveNumber, faction.baseVolley, faction.maxVolley);
    const launchCadenceMs = faction.launchCadenceMs ?? 700;

    for (let i = 0; i < rocketCount; i += 1) {
      const missileType = this.getMissileTypeForLaunch(faction, i);
      this.time.delayedCall(i * launchCadenceMs, () => this.spawnRocket(faction, missileType));
    }
  }

  getMissileTypeForLaunch(faction, launchIndex) {
    if (faction.id !== "hamas-gaza") {
      return {
        id: `${faction.id}-standard`,
        label: "standard",
        minRangeKm: 0,
        maxRangeKm: 9999,
        rocketColor: faction.rocketColor,
        trailOuterColor: faction.trailColor,
        trailInnerColor: 0xffe2c6,
        flameColor: 0xffd7a8,
        durationMin: faction.durationMin,
        durationMax: faction.durationMax,
        impactScale: 1,
      };
    }

    // Long-range launches are intentionally much fewer.
    const shouldUseLongRange = (launchIndex + 1) % 9 === 0;
    return shouldUseLongRange ? HAMAS_MISSILE_TYPES.longRange : HAMAS_MISSILE_TYPES.shortRange;
  }

  spawnRocket(faction, missileType) {
    if (!this.mapImage || !this.mapContainer) {
      return;
    }

    const launch = this.randomGeoPointFromRect(faction.bounds);
    const target = this.getTargetForMissileType(launch, missileType);
    const launchPoint = launch.point;
    const targetPoint = target.point;
    const trail = this.add.graphics();
    const rocketVisual = this.createMissileVisual(launchPoint.x, launchPoint.y, missileType);
    this.mapContainer.add([trail, rocketVisual.container]);

    const rocketState = { t: 0 };
    let previousX = launchPoint.x;
    let previousY = launchPoint.y;
    const duration = Phaser.Math.Between(missileType.durationMin, missileType.durationMax);

    this.tweens.add({
      targets: rocketState,
      t: 1,
      duration,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const x = Phaser.Math.Linear(launchPoint.x, targetPoint.x, rocketState.t);
        const y = Phaser.Math.Linear(launchPoint.y, targetPoint.y, rocketState.t);
        const heading = Phaser.Math.Angle.Between(previousX, previousY, x, y);
        rocketVisual.container.setPosition(x, y);
        rocketVisual.container.setRotation(heading);
        rocketVisual.flame.alpha = Phaser.Math.FloatBetween(0.58, 0.95);
        previousX = x;
        previousY = y;

        trail.clear();
        trail.lineStyle(4, missileType.trailOuterColor, 0.24);
        trail.beginPath();
        trail.moveTo(launchPoint.x, launchPoint.y);
        trail.lineTo(x, y);
        trail.strokePath();
        trail.lineStyle(2, missileType.trailInnerColor, 0.78);
        trail.beginPath();
        trail.moveTo(launchPoint.x, launchPoint.y);
        trail.lineTo(x, y);
        trail.strokePath();
      },
      onComplete: () => {
        trail.destroy();
        rocketVisual.container.destroy();
        this.createImpactFlash(targetPoint.x, targetPoint.y, faction, missileType);
      },
    });
  }

  createMissileVisual(x, y, missileType) {
    const container = this.add.container(x, y);
    const missileBody = this.add.polygon(0, 0, [-10, -2, 6, -2, 10, 0, 6, 2, -10, 2, -8, 0], missileType.rocketColor, 1);
    missileBody.setStrokeStyle(1, 0x2a0f08, 0.92);
    const flame = this.add.triangle(-10.5, 0, 0, 0, -6.5, 2.2, -6.5, -2.2, missileType.flameColor, 0.9);
    const highlight = this.add.rectangle(1.5, -0.8, 5, 0.9, 0xfff4e8, 0.72);
    container.add([flame, missileBody, highlight]);
    return { container, flame };
  }

  createImpactFlash(x, y, faction, missileType) {
    if (!this.mapContainer) {
      return;
    }

    const impactScale = (faction?.impactMultiplier ?? 1) * (missileType?.impactScale ?? 1);
    this.adjustResource("morale", -Phaser.Math.FloatBetween(0.45, 1.2) * impactScale);
    this.adjustResource("population", -Phaser.Math.FloatBetween(0.35, 0.95) * impactScale);
    this.adjustResource("army", -Phaser.Math.FloatBetween(0.28, 0.78) * impactScale);
    this.adjustResource("money", -Phaser.Math.FloatBetween(1, 4) * impactScale);
    this.updateResourceHud();

    const impactColor = missileType?.rocketColor ?? faction?.rocketColor ?? 0xfff4b8;
    const impact = this.add.circle(x, y, 3, impactColor, 0.95);
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

  randomGeoPointFromRect(bounds) {
    const lat = Phaser.Math.FloatBetween(bounds.south, bounds.north);
    const lon = Phaser.Math.FloatBetween(bounds.west, bounds.east);
    return {
      lat,
      lon,
      point: this.geoToImagePoint(lat, lon, this.mapImage.width, this.mapImage.height),
    };
  }

  getTargetForMissileType(launch, missileType) {
    const targetsInRange = ISRAEL_TARGETS.filter((candidate) => {
      const distanceKm = this.distanceKmBetweenPoints(launch.lat, launch.lon, candidate.lat, candidate.lon);
      return distanceKm >= missileType.minRangeKm && distanceKm <= missileType.maxRangeKm;
    });

    const targetPool = targetsInRange.length > 0 ? targetsInRange : ISRAEL_TARGETS;
    const pickedTarget = Phaser.Utils.Array.GetRandom(targetPool);
    return {
      ...pickedTarget,
      point: this.geoToImagePoint(pickedTarget.lat, pickedTarget.lon, this.mapImage.width, this.mapImage.height),
    };
  }

  distanceKmBetweenPoints(latA, lonA, latB, lonB) {
    const dLat = Phaser.Math.DegToRad(latB - latA);
    const dLon = Phaser.Math.DegToRad(lonB - lonA);
    const lat1 = Phaser.Math.DegToRad(latA);
    const lat2 = Phaser.Math.DegToRad(latB);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
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
    outline.lineStyle(4, 0x00131f, 0.45);
    outline.strokePoints(points, true);
    outline.lineStyle(2, 0x53d8ff, 0.94);
    outline.strokePoints(points, true);
  }

  drawHostileFactionMarkers(layerContainer, imageWidth, imageHeight) {
    HOSTILE_FACTIONS.forEach((faction) => {
      const markerGraphics = this.add.graphics();
      const territoryCorners = [
        this.geoToImagePoint(faction.bounds.north, faction.bounds.west, imageWidth, imageHeight),
        this.geoToImagePoint(faction.bounds.north, faction.bounds.east, imageWidth, imageHeight),
        this.geoToImagePoint(faction.bounds.south, faction.bounds.east, imageWidth, imageHeight),
        this.geoToImagePoint(faction.bounds.south, faction.bounds.west, imageWidth, imageHeight),
      ];

      markerGraphics.fillStyle(faction.rocketColor, 0.09);
      markerGraphics.fillPoints(territoryCorners, true);
      markerGraphics.lineStyle(2, faction.trailColor, 0.62);
      markerGraphics.strokePoints(territoryCorners, true);

      const centerLat = (faction.bounds.north + faction.bounds.south) / 2;
      const centerLon = (faction.bounds.east + faction.bounds.west) / 2;
      const centerPoint = this.geoToImagePoint(centerLat, centerLon, imageWidth, imageHeight);

      const markerDot = this.add.circle(centerPoint.x, centerPoint.y, 5, faction.rocketColor, 0.95);
      markerDot.setStrokeStyle(2, 0x1f0d06, 0.85);

      const markerLabel = this.add
        .text(centerPoint.x, centerPoint.y - 10, `${faction.name}\n${faction.territory}`, {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#f2f8ff",
          align: "center",
          backgroundColor: "rgba(2, 8, 14, 0.62)",
          padding: { x: 5, y: 3 },
        })
        .setOrigin(0.5, 1);

      layerContainer.add([markerGraphics, markerDot, markerLabel]);
    });
  }

  drawIsraelRegions(layerContainer, imageWidth, imageHeight) {
    ISRAEL_REGIONS.forEach((region) => {
      const boundaryPoints = region.border.map((point) =>
        this.geoToImagePoint(point.lat, point.lon, imageWidth, imageHeight),
      );
      const regionGraphics = this.add.graphics();
      regionGraphics.lineStyle(1, 0xd8ecff, 0.55);
      regionGraphics.strokePoints(boundaryPoints, true);
      layerContainer.add(regionGraphics);

      const centroid = boundaryPoints.reduce(
        (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
        { x: 0, y: 0 },
      );
      const centerX = centroid.x / boundaryPoints.length;
      const centerY = centroid.y / boundaryPoints.length;
      const regionLabel = this.add
        .text(centerX, centerY, region.name, {
          fontFamily: "Arial",
          fontSize: "10px",
          color: "#eaf5ff",
          backgroundColor: "rgba(5, 14, 26, 0.5)",
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5);
      layerContainer.add(regionLabel);
    });
  }

  drawRegionCityMarkers(layerContainer, imageWidth, imageHeight) {
    REGION_CITY_MARKERS.forEach((city) => {
      const position = this.geoToImagePoint(city.lat, city.lon, imageWidth, imageHeight);
      const dot = this.add.circle(position.x, position.y, 2.8, 0xfff1a8, 0.95);
      dot.setStrokeStyle(1, 0x5a3f09, 0.85);
      const label = this.add
        .text(position.x + 5, position.y - 3, city.name, {
          fontFamily: "Arial",
          fontSize: "9px",
          color: "#fff6d7",
          backgroundColor: "rgba(13, 9, 4, 0.48)",
          padding: { x: 3, y: 1 },
        })
        .setOrigin(0, 1);
      layerContainer.add([dot, label]);
    });
  }

  geoToImagePoint(lat, lon, imageWidth, imageHeight) {
    const xPercent = this.projectGeoToMapXPercent(lat, lon);
    const yPercent = this.projectGeoToMapYPercent(lat, lon);
    const x = (xPercent / 100) * imageWidth;
    const y = (yPercent / 100) * imageHeight;
    return new Phaser.Geom.Point(x, y);
  }

  projectGeoToMapXPercent(lat, lon) {
    const latRad = Phaser.Math.DegToRad(lat);
    const lonDeltaRad = Phaser.Math.DegToRad(lon - MIDDLE_EAST_PROJECTION.centralMeridian);
    return (
      50 +
      MIDDLE_EAST_PROJECTION.xScale *
        (MIDDLE_EAST_PROJECTION.rOffset - latRad) *
        Math.sin(MIDDLE_EAST_PROJECTION.thetaScale * lonDeltaRad) *
        MIDDLE_EAST_PROJECTION.xCompression
    );
  }

  projectGeoToMapYPercent(lat, lon) {
    const latRad = Phaser.Math.DegToRad(lat);
    const lonDeltaRad = Phaser.Math.DegToRad(lon - MIDDLE_EAST_PROJECTION.centralMeridian);
    return (
      50 -
      MIDDLE_EAST_PROJECTION.xScale *
        (MIDDLE_EAST_PROJECTION.yAnchor -
          (MIDDLE_EAST_PROJECTION.rOffset - latRad) * Math.cos(MIDDLE_EAST_PROJECTION.thetaScale * lonDeltaRad))
    );
  }
}
