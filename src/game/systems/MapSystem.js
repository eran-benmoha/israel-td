import Phaser from "phaser";

export class MapSystem {
  constructor({ scene, eventBus, mapViewConfig, israelData, factionsConfig }) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.mapViewConfig = mapViewConfig;
    this.israelData = israelData;
    this.factions = factionsConfig.factions ?? [];
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
    const mapUrl = new URL(this.mapViewConfig.mapImagePath, import.meta.url).href;
    this.scene.load.image("middle-east-map", mapUrl);
  }

  create() {
    const camera = this.scene.cameras.main;
    camera.setBackgroundColor("#05070e");
    camera.setRotation(Phaser.Math.DegToRad(this.mapViewConfig.initial.rotationDeg));

    let { width, height } = this.scene.scale;
    this.mapImage = this.scene.add.image(0, 0, "middle-east-map").setOrigin(0, 0);
    const outline = this.scene.add.graphics();
    this.drawIsraelOutline(outline);

    const regionLayer = this.scene.add.container(0, 0);
    this.drawIsraelRegions(regionLayer);
    const cityLayer = this.scene.add.container(0, 0);
    this.drawRegionCityMarkers(cityLayer);
    const hostileLayer = this.scene.add.container(0, 0);
    this.drawHostileFactionMarkers(hostileLayer);

    this.mapContainer = this.scene.add.container(0, 0, [this.mapImage, regionLayer, outline, hostileLayer, cityLayer]);
    this.baseMapScale = this.getMapCoverScale(width, height);
    this.mapContainer.setScale(this.baseMapScale * this.zoomLevel);
    this.focusMapOnGeoPoint(width, height, this.mapViewConfig.initial.focus.lat, this.mapViewConfig.initial.focus.lon);
    this.emitZoom();

    this.scene.input.addPointer(1);
    this.registerInputHandlers({ width, height });

    this.resizeHandler = (gameSize) => {
      const oldScale = this.mapContainer.scaleX;
      const centerWorldX = (width / 2 - this.mapContainer.x) / oldScale;
      const centerWorldY = (height / 2 - this.mapContainer.y) / oldScale;
      width = gameSize.width;
      height = gameSize.height;
      this.baseMapScale = this.getMapCoverScale(width, height);
      this.mapContainer.setScale(this.baseMapScale * this.zoomLevel);
      this.mapContainer.x = width / 2 - centerWorldX * this.mapContainer.scaleX;
      this.mapContainer.y = height / 2 - centerWorldY * this.mapContainer.scaleY;
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

  registerInputHandlers({ width, height }) {
    let isDragging = false;
    let dragPointerId = null;
    let dragStartX = 0;
    let dragStartY = 0;
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
      isDragging = true;
      dragPointerId = pointer.id;
      dragStartX = pointer.x;
      dragStartY = pointer.y;
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

      this.mapContainer.x = mapStartX + (pointer.x - dragStartX);
      this.mapContainer.y = mapStartY + (pointer.y - dragStartY);
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
        isDragging = true;
        dragPointerId = remaining.id;
        dragStartX = remaining.x;
        dragStartY = remaining.y;
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
    return Math.max(viewportWidth / this.mapImage.width, viewportHeight / this.mapImage.height);
  }

  clampMapPosition(viewportWidth, viewportHeight) {
    const scaledWidth = this.mapImage.width * this.mapContainer.scaleX;
    const scaledHeight = this.mapImage.height * this.mapContainer.scaleY;

    if (scaledWidth <= viewportWidth) {
      this.mapContainer.x = (viewportWidth - scaledWidth) / 2;
    } else {
      this.mapContainer.x = Phaser.Math.Clamp(this.mapContainer.x, viewportWidth - scaledWidth, 0);
    }

    if (scaledHeight <= viewportHeight) {
      this.mapContainer.y = (viewportHeight - scaledHeight) / 2;
    } else {
      this.mapContainer.y = Phaser.Math.Clamp(this.mapContainer.y, viewportHeight - scaledHeight, 0);
    }
  }

  focusMapOnGeoPoint(viewportWidth, viewportHeight, lat, lon) {
    const focusPoint = this.geoToImagePoint(lat, lon);
    this.mapContainer.x = viewportWidth / 2 - focusPoint.x * this.mapContainer.scaleX;
    this.mapContainer.y = viewportHeight / 2 - focusPoint.y * this.mapContainer.scaleY;
    this.clampMapPosition(viewportWidth, viewportHeight);
  }

  applyZoomAtScreenPoint(nextZoomLevel, screenX, screenY, viewportWidth, viewportHeight) {
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
    this.clampMapPosition(viewportWidth, viewportHeight);
    this.emitZoom();
  }

  emitZoom() {
    this.eventBus.emit("ui/debug-zoom", { zoom: this.zoomLevel });
  }

  randomGeoPointFromRect(bounds) {
    const lat = Phaser.Math.FloatBetween(bounds.south, bounds.north);
    const lon = Phaser.Math.FloatBetween(bounds.west, bounds.east);
    return { lat, lon, point: this.geoToImagePoint(lat, lon) };
  }

  geoToImagePoint(lat, lon) {
    const xPercent = this.projectGeoToMapXPercent(lat, lon);
    const yPercent = this.projectGeoToMapYPercent(lat, lon);
    return new Phaser.Geom.Point((xPercent / 100) * this.mapImage.width, (yPercent / 100) * this.mapImage.height);
  }

  projectGeoToMapXPercent(lat, lon) {
    const p = this.mapViewConfig.projection;
    const latRad = Phaser.Math.DegToRad(lat);
    const lonDeltaRad = Phaser.Math.DegToRad(lon - p.centralMeridian);
    return 50 + p.xScale * (p.rOffset - latRad) * Math.sin(p.thetaScale * lonDeltaRad) * p.xCompression;
  }

  projectGeoToMapYPercent(lat, lon) {
    const p = this.mapViewConfig.projection;
    const latRad = Phaser.Math.DegToRad(lat);
    const lonDeltaRad = Phaser.Math.DegToRad(lon - p.centralMeridian);
    return 50 - p.xScale * (p.yAnchor - (p.rOffset - latRad) * Math.cos(p.thetaScale * lonDeltaRad));
  }

  drawIsraelOutline(outline) {
    const points = this.israelData.outline.map((point) => this.geoToImagePoint(point.lat, point.lon));
    outline.clear();
    outline.lineStyle(4, 0x00131f, 0.45);
    outline.strokePoints(points, true);
    outline.lineStyle(2, 0x53d8ff, 0.94);
    outline.strokePoints(points, true);
  }

  drawIsraelRegions(layerContainer) {
    this.israelData.regions.forEach((region) => {
      const boundaryPoints = region.border.map((point) => this.geoToImagePoint(point.lat, point.lon));
      const graphics = this.scene.add.graphics();
      graphics.lineStyle(1, 0xd8ecff, 0.55);
      graphics.strokePoints(boundaryPoints, true);
      layerContainer.add(graphics);

      const centroid = boundaryPoints.reduce(
        (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
        { x: 0, y: 0 },
      );
      const label = this.scene.add
        .text(centroid.x / boundaryPoints.length, centroid.y / boundaryPoints.length, region.name, {
          fontFamily: "Arial",
          fontSize: "10px",
          color: "#eaf5ff",
          backgroundColor: "rgba(5, 14, 26, 0.5)",
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5);
      layerContainer.add(label);
    });
  }

  drawRegionCityMarkers(layerContainer) {
    this.israelData.cities.forEach((city) => {
      const position = this.geoToImagePoint(city.lat, city.lon);
      const dot = this.scene.add.circle(position.x, position.y, 2.8, 0xfff1a8, 0.95);
      dot.setStrokeStyle(1, 0x5a3f09, 0.85);
      const label = this.scene.add
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

  drawHostileFactionMarkers(layerContainer) {
    this.factions.forEach((faction) => {
      const territoryCorners = [
        this.geoToImagePoint(faction.bounds.north, faction.bounds.west),
        this.geoToImagePoint(faction.bounds.north, faction.bounds.east),
        this.geoToImagePoint(faction.bounds.south, faction.bounds.east),
        this.geoToImagePoint(faction.bounds.south, faction.bounds.west),
      ];

      const markerGraphics = this.scene.add.graphics();
      markerGraphics.fillStyle(faction.rocketColor, 0.09);
      markerGraphics.fillPoints(territoryCorners, true);
      markerGraphics.lineStyle(2, faction.trailColor, 0.62);
      markerGraphics.strokePoints(territoryCorners, true);

      const centerPoint = this.geoToImagePoint(
        (faction.bounds.north + faction.bounds.south) / 2,
        (faction.bounds.east + faction.bounds.west) / 2,
      );

      const markerDot = this.scene.add.circle(centerPoint.x, centerPoint.y, 5, faction.rocketColor, 0.95);
      markerDot.setStrokeStyle(2, 0x1f0d06, 0.85);
      const markerLabel = this.scene.add
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

  createMissileVisual(x, y, missileProfile) {
    const container = this.scene.add.container(x, y);
    const body = this.scene.add.polygon(0, 0, [-10, -2, 6, -2, 10, 0, 6, 2, -10, 2, -8, 0], missileProfile.rocketColor, 1);
    body.setStrokeStyle(1, 0x2a0f08, 0.92);
    const flame = this.scene.add.triangle(-10.5, 0, 0, 0, -6.5, 2.2, -6.5, -2.2, missileProfile.flameColor, 0.9);
    const highlight = this.scene.add.rectangle(1.5, -0.8, 5, 0.9, 0xfff4e8, 0.72);
    container.add([flame, body, highlight]);
    this.mapContainer.add(container);
    return { container, flame };
  }
}
