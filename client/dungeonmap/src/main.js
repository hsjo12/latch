import Phaser from "phaser";
import DungeonScene from "./DungeonScene.js";
import CommonScene from "./CommonScene.js";

export default new Phaser.Game({
  type: Phaser.AUTO,
  width: 256,
  height: 256,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [CommonScene, DungeonScene],
  scale: {
    zoom: 3,
  },
});
