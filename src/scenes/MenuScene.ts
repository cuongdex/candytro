import Phaser from 'phaser';
import { GameManager } from '../core/GameManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    // 1. Sleek Gradient-like Background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x0a0a14, 0x0a0a14, 0x14051a, 0x14051a, 1);
    bgGraphics.fillRect(0, 0, width, height);

    // Decorate with grid lines
    bgGraphics.lineStyle(1, 0x332244, 0.2);
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      bgGraphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += gridSize) {
      bgGraphics.lineBetween(0, y, width, y);
    }

    // 2. Logo/Title Text (Stylized Neon glow)
    this.add.text(width / 2, height / 3, 'CANDY BALATRO', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#ffffff',
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#ff007f',
        blur: 20,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 3 + 60, 'The Roguelike Match-3 Deckbuilder', {
      fontFamily: 'Outfit, Roboto, "Segoe UI", sans-serif',
      fontSize: '20px',
      color: '#00ffcc',
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#00ffcc',
        blur: 10,
        fill: true
      }
    }).setOrigin(0.5);

    // 3. Play Button
    const playBtnBg = this.add.graphics();
    const btnW = 240;
    const btnH = 60;
    const btnX = width / 2 - btnW / 2;
    const btnY = height * 0.6;

    playBtnBg.fillStyle(0x00ffcc, 0.1);
    playBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);
    playBtnBg.lineStyle(2, 0x00ffcc, 1);
    playBtnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 12);

    const playText = this.add.text(width / 2, height * 0.6 + 30, 'BẮT ĐẦU CHƠI', {
      fontFamily: 'Outfit, Roboto, "Segoe UI", sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#00ffcc'
    }).setOrigin(0.5);

    // Make button interactive
    const triggerArea = this.add.zone(width / 2, height * 0.6 + 30, btnW, btnH)
      .setInteractive({ useHandCursor: true });

    triggerArea.on('pointerover', () => {
      playBtnBg.clear();
      playBtnBg.fillStyle(0x00ffcc, 0.25);
      playBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);
      playBtnBg.lineStyle(3, 0xff00ff, 1); // Border changes to neon pink on hover
      playBtnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 12);
      playText.setColor('#ffffff');
      this.tweens.add({
        targets: playText,
        scale: 1.05,
        duration: 100,
        ease: 'Power1'
      });
    });

    triggerArea.on('pointerout', () => {
      playBtnBg.clear();
      playBtnBg.fillStyle(0x00ffcc, 0.1);
      playBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);
      playBtnBg.lineStyle(2, 0x00ffcc, 1);
      playBtnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 12);
      playText.setColor('#00ffcc');
      this.tweens.add({
        targets: playText,
        scale: 1.0,
        duration: 100,
        ease: 'Power1'
      });
    });

    triggerArea.on('pointerdown', () => {
      // Sound effect or click scale down
      this.tweens.add({
        targets: [playText, playBtnBg],
        scale: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          // Initialize Game Manager and start Play Scene
          GameManager.getInstance().startNewRun();
          this.scene.start('PlayScene');
        }
      });
    });

    // Little instructions
    this.add.text(width / 2, height * 0.85, 'Xếp Kẹo (Match-3) tạo điểm số nhân vật cực lớn nhờ thẻ Joker!', {
      fontFamily: 'Outfit, Roboto, "Segoe UI", sans-serif',
      fontSize: '14px',
      color: '#888899'
    }).setOrigin(0.5);
  }
}
