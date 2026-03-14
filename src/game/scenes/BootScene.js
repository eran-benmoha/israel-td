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

    const { width, height } = this.scale;
    const mapImage = this.add.image(width / 2, height / 2, "israel-map");

    // Cover the viewport so the map is clearly visible on mobile.
    const coverScale = Math.max(width / mapImage.width, height / mapImage.height);
    mapImage.setScale(coverScale);

    this.add
      .text(width / 2, 34, "Static Israel map prototype", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#dbe9ff",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5, 0);
  }
}
