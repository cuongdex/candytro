import Phaser from 'phaser';
import { GameManager } from '../core/GameManager';
import { AudioManager } from '../core/AudioManager';

export class GameOverScene extends Phaser.Scene {
  private gameManager!: GameManager;

  constructor() {
    super('GameOverScene');
  }

  create() {
    this.gameManager = GameManager.getInstance();
    const { width, height } = this.scale;

    // 1. Dark Red/Purplish Background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x0e0505, 0x0e0505, 0x14051a, 0x14051a, 1);
    bgGraphics.fillRect(0, 0, width, height);

    // Decorative grid lines
    bgGraphics.lineStyle(1, 0x3d1111, 0.15);
    for (let x = 0; x < width; x += 40) {
      bgGraphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 40) {
      bgGraphics.lineBetween(0, y, width, y);
    }

    // 2. GameOver Title
    this.add.text(width / 2, height / 4, 'THẤT BẠI!', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#ff1133',
      shadow: { blur: 20, color: '#ff1133', fill: true }
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 4 + 60, 'Bạn đã hết lượt đi mà chưa đạt được điểm mục tiêu', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '20px',
      color: '#888899'
    }).setOrigin(0.5);

    // 3. Stats display
    const panel = this.add.graphics();
    panel.fillStyle(0x110c0e, 0.9);
    panel.fillRoundedRect(width / 2 - 200, height / 2 - 80, 400, 180, 16);
    panel.lineStyle(2, 0xff1133, 0.3);
    panel.strokeRoundedRect(width / 2 - 200, height / 2 - 80, 400, 180, 16);

    // Stats texts
    this.add.text(width / 2 - 150, height / 2 - 50, 'Vòng đấu (Ante):', {
      fontFamily: 'Outfit, Roboto, sans-serif', fontSize: '18px', color: '#888899'
    });
    this.add.text(width / 2 + 150, height / 2 - 50, `${this.gameManager.state.ante}`, {
      fontFamily: 'Outfit, Roboto, sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(1, 0);

    const blindTypes = ['Small Blind', 'Big Blind', 'Boss Blind'];
    const curRoundStr = blindTypes[this.gameManager.state.round - 1] || 'Blind';
    this.add.text(width / 2 - 150, height / 2 - 15, 'Màn đấu (Round):', {
      fontFamily: 'Outfit, Roboto, sans-serif', fontSize: '18px', color: '#888899'
    });
    this.add.text(width / 2 + 150, height / 2 - 15, `${curRoundStr}`, {
      fontFamily: 'Outfit, Roboto, sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#00ffcc'
    }).setOrigin(1, 0);

    this.add.text(width / 2 - 150, height / 2 + 20, 'Điểm số đạt được:', {
      fontFamily: 'Outfit, Roboto, sans-serif', fontSize: '18px', color: '#888899'
    });
    this.add.text(width / 2 + 150, height / 2 + 20, `${this.gameManager.state.scoreCurrent.toLocaleString()} / ${this.gameManager.state.scoreTarget.toLocaleString()}`, {
      fontFamily: 'Outfit, Roboto, sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ff3366'
    }).setOrigin(1, 0);

    this.add.text(width / 2 - 150, height / 2 + 55, 'Tổng tiền tích lũy:', {
      fontFamily: 'Outfit, Roboto, sans-serif', fontSize: '18px', color: '#888899'
    });
    this.add.text(width / 2 + 150, height / 2 + 55, `$${this.gameManager.state.gold}`, {
      fontFamily: 'Outfit, Roboto, sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ffd700'
    }).setOrigin(1, 0);

    // 4. Action Buttons
    this.createButtons(width, height);

    // Add mute button
    AudioManager.addMuteButton(this);
  }

  private createButtons(width: number, height: number) {
    const btnW = 180;
    const btnH = 50;
    
    // Play again
    const x1 = width / 2 - 100;
    const y1 = height * 0.76;
    
    const bg1 = this.add.graphics();
    bg1.fillStyle(0x00ffcc, 0.05);
    bg1.fillRoundedRect(x1 - btnW / 2, y1 - btnH / 2, btnW, btnH, 10);
    bg1.lineStyle(1.5, 0x00ffcc, 0.6);
    bg1.strokeRoundedRect(x1 - btnW / 2, y1 - btnH / 2, btnW, btnH, 10);

    this.add.text(x1, y1, 'CHƠI LẠI', {
      fontFamily: 'Outfit, Roboto, sans-serif', fontSize: '19px', fontStyle: 'bold', color: '#00ffcc'
    }).setOrigin(0.5);

    const area1 = this.add.zone(x1, y1, btnW, btnH).setInteractive({ useHandCursor: true });
    
    area1.on('pointerover', () => {
      AudioManager.getInstance().playClick();
      bg1.clear();
      bg1.fillStyle(0x00ffcc, 0.2);
      bg1.fillRoundedRect(x1 - btnW / 2, y1 - btnH / 2, btnW, btnH, 10);
      bg1.lineStyle(1.5, 0x00ffcc, 1);
      bg1.strokeRoundedRect(x1 - btnW / 2, y1 - btnH / 2, btnW, btnH, 10);
    });

    area1.on('pointerout', () => {
      bg1.clear();
      bg1.fillStyle(0x00ffcc, 0.05);
      bg1.fillRoundedRect(x1 - btnW / 2, y1 - btnH / 2, btnW, btnH, 10);
      bg1.lineStyle(1.5, 0x00ffcc, 0.6);
      bg1.strokeRoundedRect(x1 - btnW / 2, y1 - btnH / 2, btnW, btnH, 10);
    });

    area1.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      this.gameManager.startNewRun();
      this.scene.start('PlayScene');
    });

    // Main menu
    const x2 = width / 2 + 100;
    const y2 = height * 0.76;

    const bg2 = this.add.graphics();
    bg2.fillStyle(0xffffff, 0.05);
    bg2.fillRoundedRect(x2 - btnW / 2, y2 - btnH / 2, btnW, btnH, 10);
    bg2.lineStyle(1.5, 0xffffff, 0.4);
    bg2.strokeRoundedRect(x2 - btnW / 2, y2 - btnH / 2, btnW, btnH, 10);

    this.add.text(x2, y2, 'MÀN HÌNH CHÍNH', {
      fontFamily: 'Outfit, Roboto, sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    const area2 = this.add.zone(x2, y2, btnW, btnH).setInteractive({ useHandCursor: true });

    area2.on('pointerover', () => {
      AudioManager.getInstance().playClick();
      bg2.clear();
      bg2.fillStyle(0xffffff, 0.15);
      bg2.fillRoundedRect(x2 - btnW / 2, y2 - btnH / 2, btnW, btnH, 10);
      bg2.lineStyle(1.5, 0xffffff, 0.8);
      bg2.strokeRoundedRect(x2 - btnW / 2, y2 - btnH / 2, btnW, btnH, 10);
    });

    area2.on('pointerout', () => {
      bg2.clear();
      bg2.fillStyle(0xffffff, 0.05);
      bg2.fillRoundedRect(x2 - btnW / 2, y2 - btnH / 2, btnW, btnH, 10);
      bg2.lineStyle(1.5, 0xffffff, 0.4);
      bg2.strokeRoundedRect(x2 - btnW / 2, y2 - btnH / 2, btnW, btnH, 10);
    });

    area2.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      this.scene.start('MenuScene');
    });
  }
}
