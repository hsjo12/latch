"use client";
import { useEffect } from "react";
import { Game, AUTO } from "phaser";
import CommonScene from "@/game/scenes/commonScene";
import DungeonScene from "@/game/scenes/dungeonScene";
import BridgeScene from "@/game/scenes/bridgeScene";

export default function Structure() {
  useEffect(() => {
    const loadGame = async () => {
      try {
        if (window.game) {
          window.game.destroy(true);
        }

        const config = {
          type: AUTO,
          width: 800,
          height: 500,
          parent: "game-container",
          physics: {
            default: "arcade",
            arcade: { gravity: { y: 0 }, debug: false },
          },
          scene: [CommonScene, DungeonScene, BridgeScene],
          zoom: 1.2,
        };

        const game = new Game(config);
        window.game = game;
      } catch (error) {
        console.error("Error loading game:", error);
      }
    };

    loadGame();
  }, []);

  return (
    <main className="border-2 h-screen w-screen mx-auto flex flex-col justify-center items-center gap-10">
      <div
        id="game-container"
        className="flex flex-col justify-center items-center "
      >
        <div id="input-box" style={{ display: "none" }}>
          <h4>Do you want to join the battle ?</h4>
          <button id="yes">Yes</button>
          <button id="no">No</button>
        </div>
      </div>
    </main>
  );
}
