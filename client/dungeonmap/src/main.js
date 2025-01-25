import Phaser from "phaser";
import DungeonScene from "./DungeonScene";
import CommonScene from "./CommonScene";
import BridgeScene from "./BridgeScene";
import BackgroundScene from "./managers/backgroundscene";
import io from "socket.io-client";
const socket = io();

const config = {
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
  scene: [BackgroundScene, CommonScene, DungeonScene, BridgeScene],
  scale: {
    zoom: 3,
  },
  callbacks: {
    postBoot: () => {
      window.socket = socket;
    }
  }
};

// Create game instance with config
new Phaser.Game(config);