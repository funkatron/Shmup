import Phaser from "phaser";

new Phaser.Game({
  type: Phaser.AUTO,
  width: 360,
  height: 480,
  backgroundColor: "#101827",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: {
    create() {
      this.add.triangle(180, 360, 0, 20, 10, 0, 20, 20, 0x7deaff);
    }
  }
});
