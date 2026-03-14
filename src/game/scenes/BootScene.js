import Phaser from "phaser";

const MAP_GEO_BOUNDS = {
  // Approximate geographic coverage of the Middle East base map frame.
  north: 43.5,
  south: 10.0,
  west: 23.0,
  east: 66.0,
};

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

    mapContainer.setScale(this.getMapCoverScale(width, height, mapImage));
    this.clampMapPosition(mapContainer, mapImage, width, height);

    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let mapStartX = mapContainer.x;
    let mapStartY = mapContainer.y;

    this.input.on("pointerdown", (pointer) => {
      isDragging = true;
      dragStartX = pointer.x;
      dragStartY = pointer.y;
      mapStartX = mapContainer.x;
      mapStartY = mapContainer.y;
    });

    this.input.on("pointermove", (pointer) => {
      if (!isDragging || !pointer.isDown) {
        return;
      }

      mapContainer.x = mapStartX + (pointer.x - dragStartX);
      mapContainer.y = mapStartY + (pointer.y - dragStartY);
      this.clampMapPosition(mapContainer, mapImage, width, height);
    });

    const stopDrag = () => {
      isDragging = false;
    };

    this.input.on("pointerup", stopDrag);
    this.input.on("pointerupoutside", stopDrag);

    const title = this.add
      .text(width / 2, 34, "Drag to explore Middle East • Israel outline enabled", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#dbe9ff",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5, 0);

    this.scale.on("resize", (gameSize) => {
      width = gameSize.width;
      height = gameSize.height;
      mapContainer.setScale(this.getMapCoverScale(width, height, mapImage));
      this.clampMapPosition(mapContainer, mapImage, width, height);
      title.setPosition(width / 2, 34);
    });
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
