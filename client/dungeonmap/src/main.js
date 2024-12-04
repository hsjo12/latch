import Phaser from "phaser";
import Preloader from "./Preloader.js";

export default new Phaser.Game({
  type: Phaser.AUTO,
  width: 256,
  height: 256,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: true,
    },
  },
  scene: [Preloader],
  scale: {
    zoom: 3,
  },
});
