import Phaser from "phaser";

export class MapRenderer {
  constructor({ scene, mapViewConfig, israelData, factions }) {
    this.scene = scene;
    this.mapViewConfig = mapViewConfig;
    this.israelData = israelData;
    this.factions = factions ?? [];
    this.mapImage = null;
    this.mapContainer = null;
  }

  setMapImage(mapImage) {
    this.mapImage = mapImage;
  }

  setMapContainer(mapContainer) {
    this.mapContainer = mapContainer;
  }

  createOverlayLayers() {
    const outline = this.scene.add.graphics();
    this.drawIsraelOutline(outline);

    const regionLayer = this.scene.add.container(0, 0);
    this.drawIsraelRegions(regionLayer);

    const cityLayer = this.scene.add.container(0, 0);
    this.drawRegionCityMarkers(cityLayer);

    const hostileLayer = this.scene.add.container(0, 0);
    this.drawHostileFactionMarkers(hostileLayer);

    return { outline, regionLayer, cityLayer, hostileLayer };
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
