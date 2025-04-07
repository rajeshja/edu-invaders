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
      // callbacks: { // Callbacks might be too early for scene data injection
      //   postBoot: (bootedGame) => {
      //     console.log("Phaser postBoot callback");
      //   }
      // }
    });

    // --- Data Passing Strategy ---
    // We need to pass `gameEvents` to the GameScene.
    // The most reliable way is often during the scene's init method,
    // which receives data passed via scene.start().

    const gameSceneKey = 'GameScene'; // Match the key in config and scene file

    // Attempt to start the scene immediately with data.
    // This might work if the scene is registered quickly enough.
    try {
      console.log(`Attempting to start ${gameSceneKey} immediately with data.`);
      // Check if scene *exists* first to avoid errors if start is called too early
      if (newGame.scene.getScene(gameSceneKey)) {
         newGame.scene.start(gameSceneKey, { gameEvents });
         console.log(`Started ${gameSceneKey} with gameEvents`);
      } else {
          // Scene isn't ready yet, set up a listener
          console.warn(`${gameSceneKey} not immediately available via getScene. Setting up listener.`);

          // **CORRECTED LINE:** Listen on the game's global event emitter
          newGame.events.once(`scene-ready-${gameSceneKey}`, (scene: Phaser.Scene) => {
            // Alternative: 'scene-add' might also work, 'scene-ready' is often safer
            // newGame.events.once('scene-add', (addedSceneKey: string) => {
            //    if (addedSceneKey === gameSceneKey) { ... }

             console.log(`Phaser event 'scene-ready-${gameSceneKey}' caught. Starting scene with data.`);
             // Start the scene now that it's guaranteed to be ready
             // Check if it's *already* started somehow to prevent errors
             if (!scene.scene.settings.active) {
                newGame.scene.start(gameSceneKey, { gameEvents });
             } else {
                 console.log(`${gameSceneKey} was already active when ready event fired. Data might need re-injection if init missed it.`);
                 // If this happens, you might need a method within the scene
                 // to accept the gameEvents after initialization.
                 // For now, the init method in GameScene should handle the data passed via start.
             }
          });

          // Still *tell* Phaser to start the scene. It will wait until the scene is loaded
          // and then emit the ready/add events we listen for above.
          console.log(`Calling scene.start('${gameSceneKey}') - Phaser will start it when ready.`);
          newGame.scene.start(gameSceneKey, { gameEvents });
      }


    } catch (e) {
       console.error(`Error during initial scene start attempt for ${gameSceneKey}:`, e);
       // Fallback or further error handling could go here
    }

    setGame(newGame);
    gameInitialized.current = true;
    console.log("Phaser game instance created:", newGame);

    // Cleanup function
    return () => {
      console.log("Destroying Phaser game instance...");
      // It's important to remove listeners too if they might persist
      // newGame?.events.off(`scene-ready-${gameSceneKey}`); // Remove specific listener
      newGame?.destroy(true); // Destroy game instance on component unmount
      setGame(null);
      gameInitialized.current = false; // Reset for potential re-mount
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* gameEvents removed dependency to prevent re-init on potential reference change */]); // Run only once on mount

  // Re-add gameEvents as a dependency ONLY if it's guaranteed to be stable (e.g., using useCallback in App.tsx, which we did)
  // }, [gameEvents]); // Re-added as useCallback makes it stable

  return game;
}