import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    const mapUrl = new URL("../../assets/maps/israel-satellite.jpg", import.meta.url).href;
    this.load.image("israel-map", mapUrl);
  }

  create() {
    this.cameras.main.setBackgroundColor("#05070e");

    let { width, height } = this.scale;
    const mapImage = this.add.image(width / 2, height / 2, "israel-map");

    // Cover the viewport so the map is clearly visible on mobile.
    mapImage.setScale(Math.max(width / mapImage.width, height / mapImage.height));
    this.clampMapPosition(mapImage, width, height);

    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let imageStartX = mapImage.x;
    let imageStartY = mapImage.y;

    this.input.on("pointerdown", (pointer) => {
      isDragging = true;
      dragStartX = pointer.x;
      dragStartY = pointer.y;
      imageStartX = mapImage.x;
      imageStartY = mapImage.y;
    });

    this.input.on("pointermove", (pointer) => {
      if (!isDragging || !pointer.isDown) {
        return;
      }

      mapImage.x = imageStartX + (pointer.x - dragStartX);
      mapImage.y = imageStartY + (pointer.y - dragStartY);
      this.clampMapPosition(mapImage, width, height);
    });

    const stopDrag = () => {
      isDragging = false;
    };

    this.input.on("pointerup", stopDrag);
    this.input.on("pointerupoutside", stopDrag);

    const title = this.add
      .text(width / 2, 34, "Drag to explore map", {
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
      mapImage.setScale(Math.max(width / mapImage.width, height / mapImage.height));
      this.clampMapPosition(mapImage, width, height);
      title.setPosition(width / 2, 34);
    });
  }

  clampMapPosition(mapImage, viewportWidth, viewportHeight) {
    const halfMapWidth = mapImage.displayWidth / 2;
    const halfMapHeight = mapImage.displayHeight / 2;

    if (mapImage.displayWidth <= viewportWidth) {
      mapImage.x = viewportWidth / 2;
    } else {
      const minX = viewportWidth - halfMapWidth;
      const maxX = halfMapWidth;
      mapImage.x = Phaser.Math.Clamp(mapImage.x, minX, maxX);
    }

    if (mapImage.displayHeight <= viewportHeight) {
      mapImage.y = viewportHeight / 2;
    } else {
      const minY = viewportHeight - halfMapHeight;
      const maxY = halfMapHeight;
      mapImage.y = Phaser.Math.Clamp(mapImage.y, minY, maxY);
    }
  }
}
