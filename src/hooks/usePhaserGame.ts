import { useState, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { phaserConfig } from '../phaser/config';
import { GameScene, GameEvents } from '../phaser/scenes/GameScene';

export function usePhaserGame(gameEvents: GameEvents): Phaser.Game | null {
  const [game, setGame] = useState<Phaser.Game | null>(null);
  const gameInitialized = useRef(false); // Prevent double initialization in StrictMode

  useEffect(() => {
    if (gameInitialized.current || !gameEvents || !phaserConfig.parent) {
      return; // Already initialized or missing dependencies
    }

    // Check if the parent element exists
    const parentElement = document.getElementById(phaserConfig.parent as string);
    if (!parentElement) {
      console.error(`Phaser parent element #${phaserConfig.parent} not found.`);
      return;
    }

    console.log("Initializing Phaser game...");
    // Create the Phaser game instance
    const newGame = new Phaser.Game({
      ...phaserConfig,
      // Pass the gameEvents down to the scene(s) via sceneConfig data
      callbacks: {
        postBoot: (bootedGame) => {
          console.log("Phaser postBoot callback");
          // Ensure scene is ready before passing data (or use scene init)
          // This might be too early, let's use scene init instead
        }
      }
    });

    // Pass data to the scene on startup
    // Ensure the scene key matches the one in config.ts and GameScene.ts
    if (newGame.scene.getScene('GameScene')) {
        newGame.scene.start('GameScene', { gameEvents });
        console.log("Started GameScene with gameEvents");
    } else {
         // If scene isn't immediately available, listen for add event
         newGame.scene.events.once('add', (sceneKey: string) => {
            if (sceneKey === 'GameScene') {
                console.log("Starting GameScene via event listener with gameEvents");
                newGame.scene.start('GameScene', { gameEvents });
            }
         });
         console.warn("GameScene not immediately available, waiting for 'add' event.");
         // Attempt to start anyway, might work depending on timing
         try {
            newGame.scene.start('GameScene', { gameEvents });
         } catch (e) {
            console.error("Failed to start scene immediately:", e);
         }
    }


    setGame(newGame);
    gameInitialized.current = true;
    console.log("Phaser game instance created:", newGame);

    // Cleanup function
    return () => {
      console.log("Destroying Phaser game instance...");
      newGame?.destroy(true); // Destroy game instance on component unmount
      setGame(null);
      gameInitialized.current = false; // Reset for potential re-mount
    };
  }, [gameEvents]); // Re-run effect if gameEvents changes (shouldn't normally)

  return game;
}