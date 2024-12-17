'use client';
import { useEffect } from 'react';
import { Game, AUTO, Scale } from 'phaser';

export default function Page() {
  useEffect(() => {
    const loadGame = async () => {
      try {
        const { default: CommonScene } = await import('../../../../dungeonmap/src/CommonScene');
        const { default: DungeonScene } = await import('../../../../dungeonmap/src/DungeonScene');
        const { default: BridgeScene } = await import('../../../../dungeonmap/src/BridgeScene');
        
        const config = {
          type: AUTO,
          width: 900,
          height: 800,
          zoom: 1.5,
          parent: 'game-container',
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { y: 0 },
              debug: false
            }
          },
          scene: [CommonScene, DungeonScene, BridgeScene]
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
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <div id="game-container" />
    </div>
  );
}
