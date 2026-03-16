import Phaser from "phaser";
import middleEastSatelliteUrl from "../../assets/maps/middle-east-satellite.jpg";
import { MapRenderer } from "./MapRenderer";
import { Events } from "../core/events";

export class MapSystem {
  constructor({ scene, eventBus, mapViewConfig, israelData, factionsConfig }) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.mapViewConfig = mapViewConfig;
    this.mapRenderer = new MapRenderer({
      scene,
      mapViewConfig,
      israelData,
      factions: factionsConfig.factions ?? [],
    });
    this.mapImage = null;
    this.mapContainer = null;
    this.baseMapScale = 1;
    this.zoomLevel = mapViewConfig.initial.zoomLevel;
    this.minZoomLevel = mapViewConfig.zoom.min;
    this.maxZoomLevel = mapViewConfig.zoom.max;
    this.pinchStartDistance = 0;
    this.pinchStartZoomLevel = this.zoomLevel;
    this.inputHandlers = [];
    this.resizeHandler = null;
  }

  preload() {
    const configuredPath = this.mapViewConfig.mapImagePath ?? "";
    const mapUrl = /^https?:\/\//i.test(configuredPath) ? configuredPath : middleEastSatelliteUrl;
    this.scene.load.image("middle-east-map", mapUrl);
  }

  create() {
    const camera = this.scene.cameras.main;
    camera.setBackgroundColor("#05070e");
    camera.setRotation(Phaser.Math.DegToRad(this.mapViewConfig.initial.rotationDeg));

    this._applyTextureFiltering();

    let { width, height } = this.scene.scale;
    this.mapImage = this.scene.add.image(0, 0, "middle-east-map").setOrigin(0, 0);
    this.mapRenderer.setMapImage(this.mapImage);
    const { outline, regionLayer, cityLayer, hostileLayer } = this.mapRenderer.createOverlayLayers();

    this.mapContainer = this.scene.add.container(0, 0, [this.mapImage, regionLayer, outline, hostileLayer, cityLayer]);
    this.mapRenderer.setMapContainer(this.mapContainer);
    this.baseMapScale = this.getMapCoverScale(width, height);
    this.mapContainer.setScale(this.baseMapScale * this.zoomLevel);

    const referenceScale = this.baseMapScale * this.mapViewConfig.initial.zoomLevel;
    this.mapRenderer.setReferenceScale(referenceScale);
    this.mapRenderer.updateForZoom(this.mapContainer.scaleX);

    this.focusMapOnGeoPoint(width, height, this.mapViewConfig.initial.focus.lat, this.mapViewConfig.initial.focus.lon);
    this.emitZoom();

    this.scene.input.addPointer(1);
    this.registerInputHandlers({ width, height });

    this.resizeHandler = (gameSize) => {
      const oldScale = this.mapContainer.scaleX;
      const centerWorld = camera.getWorldPoint(width / 2, height / 2);
      const centerWorldX = (centerWorld.x - this.mapContainer.x) / oldScale;
      const centerWorldY = (centerWorld.y - this.mapContainer.y) / oldScale;
      width = gameSize.width;
      height = gameSize.height;
      this.baseMapScale = this.getMapCoverScale(width, height);
      this.mapContainer.setScale(this.baseMapScale * this.zoomLevel);

      const newRef = this.baseMapScale * this.mapViewConfig.initial.zoomLevel;
      this.mapRenderer.setReferenceScale(newRef);
      this.mapRenderer.updateForZoom(this.mapContainer.scaleX);

      const nextCenterWorld = camera.getWorldPoint(width / 2, height / 2);
      this.mapContainer.x = nextCenterWorld.x - centerWorldX * this.mapContainer.scaleX;
      this.mapContainer.y = nextCenterWorld.y - centerWorldY * this.mapContainer.scaleY;
      this.clampMapPosition(width, height);
    };
    this.scene.scale.on("resize", this.resizeHandler);
  }

  destroy() {
    this.inputHandlers.forEach(({ eventName, handler }) => {
      this.scene.input.off(eventName, handler);
    });
    this.inputHandlers = [];

    if (this.resizeHandler) {
      this.scene.scale.off("resize", this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  _applyTextureFiltering() {
    const tex = this.scene.textures.get("middle-east-map");
    if (tex && tex.source && tex.source[0]) {
      tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
  }

  registerInputHandlers({ width, height }) {
    const camera = this.scene.cameras.main;
    let isDragging = false;
    let dragPointerId = null;
    let dragStartWorldX = 0;
    let dragStartWorldY = 0;
    let mapStartX = this.mapContainer.x;
    let mapStartY = this.mapContainer.y;

    const getActiveTouchPointers = () => [this.scene.input.pointer1, this.scene.input.pointer2].filter((pointer) => pointer?.isDown);
    const isPinching = () => getActiveTouchPointers().length >= 2;

    const beginPinch = () => {
      const [a, b] = getActiveTouchPointers();
      if (!a || !b) {
        return;
      }
      this.pinchStartDistance = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      this.pinchStartZoomLevel = this.zoomLevel;
      isDragging = false;
      dragPointerId = null;
    };

    const applyPinch = () => {
      const [a, b] = getActiveTouchPointers();
      if (!a || !b) {
        return;
      }
      if (this.pinchStartDistance <= 0) {
        beginPinch();
      }
      const distance = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      const midpointX = (a.x + b.x) / 2;
      const midpointY = (a.y + b.y) / 2;
      const ratio = this.pinchStartDistance > 0 ? distance / this.pinchStartDistance : 1;
      const nextZoom = Phaser.Math.Clamp(this.pinchStartZoomLevel * ratio, this.minZoomLevel, this.maxZoomLevel);
      this.applyZoomAtScreenPoint(nextZoom, midpointX, midpointY, width, height);
    };

    const pointerDown = (pointer) => {
      if (isPinching()) {
        beginPinch();
        return;
      }
      const startWorld = camera.getWorldPoint(pointer.x, pointer.y);
      isDragging = true;
      dragPointerId = pointer.id;
      dragStartWorldX = startWorld.x;
      dragStartWorldY = startWorld.y;
      mapStartX = this.mapContainer.x;
      mapStartY = this.mapContainer.y;
    };

    const pointerMove = (pointer) => {
      if (isPinching()) {
        applyPinch();
        return;
      }

      if (!isDragging || !pointer.isDown || pointer.id !== dragPointerId) {
        return;
      }

      const currentWorld = camera.getWorldPoint(pointer.x, pointer.y);
      this.mapContainer.x = mapStartX + (currentWorld.x - dragStartWorldX);
      this.mapContainer.y = mapStartY + (currentWorld.y - dragStartWorldY);
      this.clampMapPosition(width, height);
    };

    const stopDrag = () => {
      if (isPinching()) {
        beginPinch();
        return;
      }

      isDragging = false;
      dragPointerId = null;
      this.pinchStartDistance = 0;
      const [remaining] = getActiveTouchPointers();
      if (remaining) {
        const remainingWorld = camera.getWorldPoint(remaining.x, remaining.y);
        isDragging = true;
        dragPointerId = remaining.id;
        dragStartWorldX = remainingWorld.x;
        dragStartWorldY = remainingWorld.y;
        mapStartX = this.mapContainer.x;
        mapStartY = this.mapContainer.y;
      }
    };

    const wheel = (pointer, _gameObjects, _deltaX, deltaY) => {
      const zoomFactor = Math.exp(-deltaY * 0.0012);
      const nextZoom = Phaser.Math.Clamp(this.zoomLevel * zoomFactor, this.minZoomLevel, this.maxZoomLevel);
      this.applyZoomAtScreenPoint(nextZoom, pointer.x, pointer.y, width, height);
    };

    this.scene.input.on("pointerdown", pointerDown);
    this.scene.input.on("pointermove", pointerMove);
    this.scene.input.on("pointerup", stopDrag);
    this.scene.input.on("pointerupoutside", stopDrag);
    this.scene.input.on("wheel", wheel);

    this.inputHandlers.push(
      { eventName: "pointerdown", handler: pointerDown },
      { eventName: "pointermove", handler: pointerMove },
      { eventName: "pointerup", handler: stopDrag },
      { eventName: "pointerupoutside", handler: stopDrag },
      { eventName: "wheel", handler: wheel },
    );
  }

  getMapCoverScale(viewportWidth, viewportHeight) {
    const { width, height } = this.getEffectiveViewportAabb(viewportWidth, viewportHeight);
    return Math.min(width / this.mapImage.width, height / this.mapImage.height);
  }

  clampMapPosition(viewportWidth, viewportHeight) {
    const camera = this.scene.cameras.main;
    const viewCenter = camera.getWorldPoint(viewportWidth / 2, viewportHeight / 2);
    const { width: viewWidth, height: viewHeight } = this.getEffectiveViewportAabb(viewportWidth, viewportHeight);
    const viewLeft = viewCenter.x - viewWidth / 2;
    const viewRight = viewCenter.x + viewWidth / 2;
    const viewTop = viewCenter.y - viewHeight / 2;
    const viewBottom = viewCenter.y + viewHeight / 2;
    const scaledWidth = this.mapImage.width * this.mapContainer.scaleX;
    const scaledHeight = this.mapImage.height * this.mapContainer.scaleY;

    if (scaledWidth <= viewWidth) {
      this.mapContainer.x = viewCenter.x - scaledWidth / 2;
    } else {
      this.mapContainer.x = Phaser.Math.Clamp(this.mapContainer.x, viewRight - scaledWidth, viewLeft);
    }

    if (scaledHeight <= viewHeight) {
      this.mapContainer.y = viewCenter.y - scaledHeight / 2;
    } else {
      this.mapContainer.y = Phaser.Math.Clamp(this.mapContainer.y, viewBottom - scaledHeight, viewTop);
    }
  }

  focusMapOnGeoPoint(viewportWidth, viewportHeight, lat, lon) {
    const focusPoint = this.geoToImagePoint(lat, lon);
    this.mapContainer.x = viewportWidth / 2 - focusPoint.x * this.mapContainer.scaleX;
    this.mapContainer.y = viewportHeight / 2 - focusPoint.y * this.mapContainer.scaleY;
    this.clampMapPosition(viewportWidth, viewportHeight);
  }

  applyZoomAtScreenPoint(nextZoomLevel, screenX, screenY, viewportWidth, viewportHeight) {
    const camera = this.scene.cameras.main;
    const clampedZoom = Phaser.Math.Clamp(nextZoomLevel, this.minZoomLevel, this.maxZoomLevel);
    if (Math.abs(clampedZoom - this.zoomLevel) < 0.0001) {
      return;
    }

    const currentScale = this.mapContainer.scaleX;
    const screenWorld = camera.getWorldPoint(screenX, screenY);
    const worldX = (screenWorld.x - this.mapContainer.x) / currentScale;
    const worldY = (screenWorld.y - this.mapContainer.y) / currentScale;
    this.zoomLevel = clampedZoom;
    const nextScale = this.baseMapScale * this.zoomLevel;
    this.mapContainer.setScale(nextScale);
    this.mapContainer.x = screenWorld.x - worldX * nextScale;
    this.mapContainer.y = screenWorld.y - worldY * nextScale;
    this.clampMapPosition(viewportWidth, viewportHeight);
    this.mapRenderer.updateForZoom(nextScale);
    this.emitZoom();
  }

  getEffectiveViewportAabb(viewportWidth, viewportHeight) {
    const rotationAbs = Math.abs(this.scene.cameras.main.rotation);
    const cos = Math.abs(Math.cos(rotationAbs));
    const sin = Math.abs(Math.sin(rotationAbs));
    return {
      width: viewportWidth * cos + viewportHeight * sin,
      height: viewportWidth * sin + viewportHeight * cos,
    };
  }

  getOverlayScaleFactor() {
    if (!this.mapContainer || !this.mapRenderer._referenceScale) return 1;
    return Math.pow(this.mapRenderer._referenceScale / this.mapContainer.scaleX, 0.5);
  }

  emitZoom() {
    this.eventBus.emit(Events.UI_DEBUG_ZOOM, { zoom: this.zoomLevel });
  }

  randomGeoPointFromRect(bounds) {
    const lat = Phaser.Math.FloatBetween(bounds.south, bounds.north);
    const lon = Phaser.Math.FloatBetween(bounds.west, bounds.east);
    return { lat, lon, point: this.geoToImagePoint(lat, lon) };
  }

  geoToImagePoint(lat, lon) {
    return this.mapRenderer.geoToImagePoint(lat, lon);
  }

  createMissileVisual(x, y, missileProfile) {
    return this.mapRenderer.createMissileVisual(x, y, missileProfile);
  }
}
