import Phaser from "phaser";
import type { Faction, IsraelData, MapViewConfig, MissileProfile } from "../../types";

interface RegionEntry {
  gfx: Phaser.GameObjects.Graphics;
  borderPoints: Phaser.Geom.Point[];
  label: Phaser.GameObjects.Text;
}

interface CityEntry {
  dot: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  baseRadius: number;
  baseStroke: number;
}

interface HostileEntry {
  gfx: Phaser.GameObjects.Graphics;
  corners: Phaser.Geom.Point[];
  dot: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  rocketColor: number;
  trailColor: number;
}

export interface MissileVisual {
  container: Phaser.GameObjects.Container;
  flame: Phaser.GameObjects.Triangle;
}

export class MapRenderer {
  private scene: Phaser.Scene;
  private mapViewConfig: MapViewConfig;
  private israelData: IsraelData;
  private factions: Faction[];
  private mapImage: Phaser.GameObjects.Image | null = null;
  private mapContainer: Phaser.GameObjects.Container | null = null;

  private _outlineGfx: Phaser.GameObjects.Graphics | null = null;
  private _outlinePoints: Phaser.Geom.Point[] = [];
  private _regionEntries: RegionEntry[] = [];
  private _cityEntries: CityEntry[] = [];
  private _hostileEntries: HostileEntry[] = [];
  _referenceScale: number | null = null;

  constructor({
    scene,
    mapViewConfig,
    israelData,
    factions,
  }: {
    scene: Phaser.Scene;
    mapViewConfig: MapViewConfig;
    israelData: IsraelData;
    factions: Faction[];
  }) {
    this.scene = scene;
    this.mapViewConfig = mapViewConfig;
    this.israelData = israelData;
    this.factions = factions ?? [];
  }

  setMapImage(mapImage: Phaser.GameObjects.Image): void {
    this.mapImage = mapImage;
  }

  setMapContainer(mapContainer: Phaser.GameObjects.Container): void {
    this.mapContainer = mapContainer;
  }

  setReferenceScale(scale: number): void {
    this._referenceScale = scale;
  }

  createOverlayLayers(): {
    outline: Phaser.GameObjects.Graphics;
    regionLayer: Phaser.GameObjects.Container;
    cityLayer: Phaser.GameObjects.Container;
    hostileLayer: Phaser.GameObjects.Container;
  } {
    const outline = this.scene.add.graphics();
    this._outlineGfx = outline;
    this._outlinePoints = this.israelData.outline.map((p) => this.geoToImagePoint(p.lat, p.lon));
    this._drawOutlineAtScale(outline, this._outlinePoints, 1);

    const regionLayer = this.scene.add.container(0, 0);
    this._drawIsraelRegions(regionLayer);

    const cityLayer = this.scene.add.container(0, 0);
    this._drawRegionCityMarkers(cityLayer);

    const hostileLayer = this.scene.add.container(0, 0);
    this._drawHostileFactionMarkers(hostileLayer);

    return { outline, regionLayer, cityLayer, hostileLayer };
  }

  updateForZoom(containerScale: number): void {
    if (!this._referenceScale || this._referenceScale === 0) return;
    const ratio = this._referenceScale / containerScale;

    this._redrawOutline(containerScale);
    this._updateRegions(containerScale, ratio);
    this._updateCities(containerScale, ratio);
    this._updateHostiles(containerScale, ratio);
  }

  geoToImagePoint(lat: number, lon: number): Phaser.Geom.Point {
    const xPercent = this.projectGeoToMapXPercent(lat, lon);
    const yPercent = this.projectGeoToMapYPercent(lat, lon);
    return new Phaser.Geom.Point((xPercent / 100) * this.mapImage!.width, (yPercent / 100) * this.mapImage!.height);
  }

  projectGeoToMapXPercent(_lat: number, lon: number): number {
    const p = this.mapViewConfig.projection;
    if (p.type === "equirectangular") {
      return ((lon - p.lonMin!) / (p.lonMax! - p.lonMin!)) * 100;
    }
    const latRad = Phaser.Math.DegToRad(_lat);
    const lonDeltaRad = Phaser.Math.DegToRad(lon - p.centralMeridian!);
    return 50 + p.xScale! * (p.rOffset! - latRad) * Math.sin(p.thetaScale! * lonDeltaRad) * p.xCompression!;
  }

  projectGeoToMapYPercent(lat: number, lon: number): number {
    const p = this.mapViewConfig.projection;
    if (p.type === "equirectangular") {
      return ((p.latMax! - lat) / (p.latMax! - p.latMin!)) * 100;
    }
    const latRad = Phaser.Math.DegToRad(lat);
    const lonDeltaRad = Phaser.Math.DegToRad(lon - p.centralMeridian!);
    return 50 - p.xScale! * (p.yAnchor! - (p.rOffset! - latRad) * Math.cos(p.thetaScale! * lonDeltaRad));
  }

  private _drawOutlineAtScale(gfx: Phaser.GameObjects.Graphics, points: Phaser.Geom.Point[], scaleCompensation: number): void {
    gfx.clear();
    gfx.lineStyle(4 * scaleCompensation, 0x00131f, 0.45);
    gfx.strokePoints(points, true);
    gfx.lineStyle(2 * scaleCompensation, 0x53d8ff, 0.94);
    gfx.strokePoints(points, true);
  }

  private _redrawOutline(containerScale: number): void {
    if (!this._outlineGfx || !this._outlinePoints.length) return;
    const sc = Math.pow(this._referenceScale! / containerScale, 0.85);
    this._drawOutlineAtScale(this._outlineGfx, this._outlinePoints, sc);
  }

  private _drawIsraelRegions(layerContainer: Phaser.GameObjects.Container): void {
    this.israelData.regions.forEach((region) => {
      const borderPoints = region.border.map((p) => this.geoToImagePoint(p.lat, p.lon));
      const gfx = this.scene.add.graphics();
      gfx.lineStyle(1, 0xd8ecff, 0.55);
      gfx.strokePoints(borderPoints, true);
      layerContainer.add(gfx);

      const centroid = borderPoints.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      const cx = centroid.x / borderPoints.length;
      const cy = centroid.y / borderPoints.length;

      const label = this.scene.add
        .text(cx, cy, region.name, {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "10px",
          color: "#eaf5ff",
          backgroundColor: "rgba(5, 14, 26, 0.5)",
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5);
      layerContainer.add(label);

      this._regionEntries.push({ gfx, borderPoints, label });
    });
  }

  private _updateRegions(_containerScale: number, ratio: number): void {
    const lineSc = Math.pow(ratio, 0.85);
    const labelSc = Math.pow(ratio, 0.75);

    this._regionEntries.forEach(({ gfx, borderPoints, label }) => {
      gfx.clear();
      gfx.lineStyle(1 * lineSc, 0xd8ecff, 0.55);
      gfx.strokePoints(borderPoints, true);
      label.setScale(labelSc);
    });
  }

  private _drawRegionCityMarkers(layerContainer: Phaser.GameObjects.Container): void {
    this.israelData.cities.forEach((city) => {
      const pos = this.geoToImagePoint(city.lat, city.lon);
      const dot = this.scene.add.circle(pos.x, pos.y, 2.8, 0xfff1a8, 0.95);
      dot.setStrokeStyle(1, 0x5a3f09, 0.85);

      const label = this.scene.add
        .text(pos.x + 5, pos.y - 3, city.name, {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "9px",
          color: "#fff6d7",
          backgroundColor: "rgba(13, 9, 4, 0.48)",
          padding: { x: 3, y: 1 },
        })
        .setOrigin(0, 1);
      layerContainer.add([dot, label]);

      this._cityEntries.push({ dot, label, baseRadius: 2.8, baseStroke: 1 });
    });
  }

  private _updateCities(_containerScale: number, ratio: number): void {
    const labelSc = Math.pow(ratio, 0.7);
    const dotSc = Math.pow(ratio, 0.8);

    this._cityEntries.forEach(({ dot, label }) => {
      label.setScale(labelSc);
      dot.setScale(dotSc);
    });
  }

  private _drawHostileFactionMarkers(layerContainer: Phaser.GameObjects.Container): void {
    this.factions.forEach((faction) => {
      const corners = [
        this.geoToImagePoint(faction.bounds.north, faction.bounds.west),
        this.geoToImagePoint(faction.bounds.north, faction.bounds.east),
        this.geoToImagePoint(faction.bounds.south, faction.bounds.east),
        this.geoToImagePoint(faction.bounds.south, faction.bounds.west),
      ];

      const gfx = this.scene.add.graphics();
      gfx.fillStyle(faction.rocketColor, 0.09);
      gfx.fillPoints(corners, true);
      gfx.lineStyle(2, faction.trailColor, 0.62);
      gfx.strokePoints(corners, true);

      const center = this.geoToImagePoint(
        (faction.bounds.north + faction.bounds.south) / 2,
        (faction.bounds.east + faction.bounds.west) / 2,
      );

      const dot = this.scene.add.circle(center.x, center.y, 5, faction.rocketColor, 0.95);
      dot.setStrokeStyle(2, 0x1f0d06, 0.85);

      const label = this.scene.add
        .text(center.x, center.y - 10, `${faction.name}\n${faction.territory}`, {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "11px",
          color: "#f2f8ff",
          align: "center",
          backgroundColor: "rgba(2, 8, 14, 0.62)",
          padding: { x: 5, y: 3 },
        })
        .setOrigin(0.5, 1);

      layerContainer.add([gfx, dot, label]);

      this._hostileEntries.push({
        gfx,
        corners,
        dot,
        label,
        rocketColor: faction.rocketColor,
        trailColor: faction.trailColor,
      });
    });
  }

  private _updateHostiles(_containerScale: number, ratio: number): void {
    const lineSc = Math.pow(ratio, 0.85);
    const labelSc = Math.pow(ratio, 0.65);
    const dotSc = Math.pow(ratio, 0.8);

    this._hostileEntries.forEach(({ gfx, corners, dot, label, rocketColor, trailColor }) => {
      gfx.clear();
      gfx.fillStyle(rocketColor, 0.09);
      gfx.fillPoints(corners, true);
      gfx.lineStyle(2 * lineSc, trailColor, 0.62);
      gfx.strokePoints(corners, true);
      label.setScale(labelSc);
      dot.setScale(dotSc);
    });
  }

  createMissileVisual(x: number, y: number, missileProfile: MissileProfile): MissileVisual {
    const container = this.scene.add.container(x, y);
    const body = this.scene.add.polygon(0, 0, [-10, -2, 6, -2, 10, 0, 6, 2, -10, 2, -8, 0], missileProfile.rocketColor, 1);
    body.setStrokeStyle(1, 0x2a0f08, 0.92);
    const flame = this.scene.add.triangle(-10.5, 0, 0, 0, -6.5, 2.2, -6.5, -2.2, missileProfile.flameColor, 0.9);
    const highlight = this.scene.add.rectangle(1.5, -0.8, 5, 0.9, 0xfff4e8, 0.72);
    container.add([flame, body, highlight]);
    this.mapContainer!.add(container);
    return { container, flame };
  }
}
