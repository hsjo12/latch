import Phaser from "phaser";
import DungeonScene from "./DungeonScene.js";

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
  scene: [DungeonScene],
  scale: {
    zoom: 3,
  },
});
