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
    this.resizeHandler = null;
    this.inputSystem = null;
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

    if (this.inputSystem) {
      this.inputSystem.bindMapControls(this, width, height);
    }

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
      if (this.inputSystem) this.inputSystem.onResize(width, height);
    };
    this.scene.scale.on("resize", this.resizeHandler);

    this._unsubFlyTo = this.eventBus.on(Events.CAMERA_FLY_TO, ({ lat, lon, zoom, duration }) => {
      this.animateToGeoPoint(lat, lon, zoom, duration);
    });
    this._unsubFlyToPreset = this.eventBus.on(Events.CAMERA_FLY_TO_PRESET, ({ preset, duration }) => {
      this.animateToPreset(preset, duration);
    });
  }

  destroy() {
    if (this.inputSystem) {
      this.inputSystem.destroy();
      this.inputSystem = null;
    }

    if (this.resizeHandler) {
      this.scene.scale.off("resize", this.resizeHandler);
      this.resizeHandler = null;
    }

    this._unsubFlyTo?.();
    this._unsubFlyToPreset?.();

    if (this._cameraAnimTween) {
      this._cameraAnimTween.stop();
      this._cameraAnimTween = null;
    }
  }

  setInputSystem(inputSystem) {
    this.inputSystem = inputSystem;
  }

  panBy(dx, dy, viewportWidth, viewportHeight) {
    this.mapContainer.x += dx;
    this.mapContainer.y += dy;
    this.clampMapPosition(viewportWidth, viewportHeight);
  }

  _applyTextureFiltering() {
    const tex = this.scene.textures.get("middle-east-map");
    if (tex && tex.source && tex.source[0]) {
      tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
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

  animateToGeoPoint(lat, lon, targetZoom, durationMs = 1200) {
    const { width, height } = this.scene.scale;
    const clampedZoom = Phaser.Math.Clamp(targetZoom, this.minZoomLevel, this.maxZoomLevel);
    const targetScale = this.baseMapScale * clampedZoom;
    const focusPoint = this.geoToImagePoint(lat, lon);
    const targetX = width / 2 - focusPoint.x * targetScale;
    const targetY = height / 2 - focusPoint.y * targetScale;

    const tweenState = {
      x: this.mapContainer.x,
      y: this.mapContainer.y,
      zoom: this.zoomLevel,
    };

    if (this._cameraAnimTween) {
      this._cameraAnimTween.stop();
    }

    this._cameraAnimTween = this.scene.tweens.add({
      targets: tweenState,
      x: targetX,
      y: targetY,
      zoom: clampedZoom,
      duration: durationMs,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        this.zoomLevel = tweenState.zoom;
        const currentScale = this.baseMapScale * this.zoomLevel;
        this.mapContainer.setScale(currentScale);
        this.mapContainer.x = tweenState.x;
        this.mapContainer.y = tweenState.y;
        this.clampMapPosition(width, height);
        this.mapRenderer.updateForZoom(currentScale);
        this.emitZoom();
      },
      onComplete: () => {
        this._cameraAnimTween = null;
      },
    });

    return this._cameraAnimTween;
  }

  animateToPreset(presetName, durationMs = 1200) {
    const presets = this.mapViewConfig.cameraPresets ?? {};
    const preset = presets[presetName];
    if (!preset) return null;
    return this.animateToGeoPoint(preset.lat, preset.lon, preset.zoom, durationMs);
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
