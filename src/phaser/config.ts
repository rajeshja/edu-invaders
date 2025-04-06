import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // Choose WebGL or Canvas automatically
  parent: 'phaser-game-container', // ID of the div where the game will be mounted
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
    //   gravity: { y: 0 }, // No global gravity needed for top-down
      debug: false, // Set to true for physics debugging visuals
    },
  },
  scene: [GameScene], // Start with GameScene
  backgroundColor: '#000033', // Dark blue space background
};