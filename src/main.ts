import Phaser from 'phaser';
import { GameConfig } from './config';
import './style.css';

// Initialize the Phaser Game
window.addEventListener('load', () => {
  // Clear Vite boilerplate HTML if any
  const appElement = document.querySelector<HTMLDivElement>('#app');
  if (appElement) {
    appElement.innerHTML = `<div id="game-container"></div>`;
  }
  
  // Start the game instance
  new Phaser.Game(GameConfig);
});
