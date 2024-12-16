import Phaser from "phaser";
import DungeonScene from "./DungeonScene.js";
import CommonScene from "./CommonScene.js";
import BridgeScene from "./BridgeScene.js";
import io from "socket.io-client";

const socket = io();

export default new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [CommonScene, DungeonScene, BridgeScene],
  scale: {
    zoom: 3,
  },
  callbacks: {
    postBoot: () => {
      window.socket = socket;
    }
  }
});
