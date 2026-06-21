import Phaser from 'phaser';
import { GameManager } from '../core/GameManager';
import { AudioManager } from '../core/AudioManager';

export class MenuScene extends Phaser.Scene {
  private logoText!: Phaser.GameObjects.Text;
  private subText!: Phaser.GameObjects.Text;
  private playBtnBg!: Phaser.GameObjects.Graphics;
  private playText!: Phaser.GameObjects.Text;
  private triggerArea!: Phaser.GameObjects.Zone;
  private instructionText!: Phaser.GameObjects.Text;

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

    // Add mute button
    AudioManager.addMuteButton(this);

    // 2. Logo/Title Text (Stylized Neon glow)
    this.logoText = this.add.text(width / 2, height / 3, 'CANDY BALATRO', {
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
    this.subText = this.add.text(width / 2, height / 3 + 60, 'The Roguelike Match-3 Deckbuilder', {
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
    this.playBtnBg = this.add.graphics();
    const btnW = 240;
    const btnH = 60;
    const btnX = width / 2 - btnW / 2;
    const btnY = height * 0.6;

    this.playBtnBg.fillStyle(0x00ffcc, 0.1);
    this.playBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);
    this.playBtnBg.lineStyle(2, 0x00ffcc, 1);
    this.playBtnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 12);

    this.playText = this.add.text(width / 2, height * 0.6 + 30, 'BẮT ĐẦU CHƠI', {
      fontFamily: 'Outfit, Roboto, "Segoe UI", sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#00ffcc'
    }).setOrigin(0.5);

    // Make button interactive
    this.triggerArea = this.add.zone(width / 2, height * 0.6 + 30, btnW, btnH)
      .setInteractive({ useHandCursor: true });

    this.triggerArea.on('pointerover', () => {
      this.playBtnBg.clear();
      this.playBtnBg.fillStyle(0x00ffcc, 0.25);
      this.playBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);
      this.playBtnBg.lineStyle(3, 0xff00ff, 1); // Border changes to neon pink on hover
      this.playBtnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 12);
      this.playText.setColor('#ffffff');
      this.tweens.add({
        targets: this.playText,
        scale: 1.05,
        duration: 100,
        ease: 'Power1'
      });
    });

    this.triggerArea.on('pointerout', () => {
      this.playBtnBg.clear();
      this.playBtnBg.fillStyle(0x00ffcc, 0.1);
      this.playBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);
      this.playBtnBg.lineStyle(2, 0x00ffcc, 1);
      this.playBtnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 12);
      this.playText.setColor('#00ffcc');
      this.tweens.add({
        targets: this.playText,
        scale: 1.0,
        duration: 100,
        ease: 'Power1'
      });
    });

    this.triggerArea.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      // Sound effect or click scale down
      this.tweens.add({
        targets: [this.playText, this.playBtnBg],
        scale: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          this.showDeckSelection();
        }
      });
    });

    // Little instructions
    this.instructionText = this.add.text(width / 2, height * 0.85, 'Xếp Kẹo (Match-3) tạo điểm số nhân vật cực lớn nhờ thẻ Joker!', {
      fontFamily: 'Outfit, Roboto, "Segoe UI", sans-serif',
      fontSize: '14px',
      color: '#888899'
    }).setOrigin(0.5);
  }

  private showDeckSelection() {
    // Hide main menu UI
    this.logoText.setVisible(false);
    this.subText.setVisible(false);
    this.playBtnBg.setVisible(false);
    this.playText.setVisible(false);
    this.triggerArea.disableInteractive();
    this.instructionText.setVisible(false);

    const { width, height } = this.scale;

    // Title
    this.add.text(width / 2, height * 0.15, 'CHỌN HỘP KẸO KHỞI ĐẦU', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      shadow: { blur: 15, color: '#aa33ff', fill: true }
    }).setOrigin(0.5);

    // Deck configuration
    const decks: {
      type: 'classic' | 'gold' | 'love';
      name: string;
      color: number;
      textColor: string;
      stats: string;
      desc: string;
    }[] = [
      {
        type: 'classic',
        name: 'HỘP CỔ ĐIỂN\n(Classic Box)',
        color: 0x0055ff,
        textColor: '#00ccff',
        stats: '5 LƯỢT TRÁO - $4 VÀNG',
        desc: 'Lưới kẹo 5 màu tiêu chuẩn.\nDành cho lối chơi cân bằng.'
      },
      {
        type: 'gold',
        name: 'HỘP TÀI PHIỆT\n(Golden Box)',
        color: 0xffcc00,
        textColor: '#ffdd44',
        stats: '4 LƯỢT TRÁO - $15 VÀNG',
        desc: 'Khởi đầu giàu có nhưng ít lượt đi.\nDễ dàng mua sắm Joker sớm.'
      },
      {
        type: 'love',
        name: 'HỘP TÌNH YÊU\n(Love Box)',
        color: 0xff3366,
        textColor: '#ff66aa',
        stats: '5 LƯỢT TRÁO - $4 VÀNG',
        desc: 'Xóa hoàn toàn kẹo Xanh Dương.\nTăng tỷ lệ xuất hiện kẹo Đỏ.'
      }
    ];

    const cardW = 240;
    const cardH = 340;
    const startX = width / 2 - cardW - 40; // Spacing for 3 cards
    const spacing = cardW + 40;

    decks.forEach((deck, idx) => {
      const x = startX + idx * spacing;
      const y = height * 0.52;

      const container = this.add.container(x, y);

      // Card background
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x0e0e16, 0.95);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
      cardBg.lineStyle(2, deck.color, 0.8);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);

      // Title
      const nameText = this.add.text(0, -110, deck.name, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5);

      // Divider line
      const divider = this.add.graphics();
      divider.lineStyle(1.5, deck.color, 0.6);
      divider.lineBetween(-cardW / 2 + 20, -50, cardW / 2 - 20, -50);

      // Stats
      const statsText = this.add.text(0, -25, deck.stats, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: deck.textColor
      }).setOrigin(0.5);

      // Description
      const descText = this.add.text(0, 60, deck.desc, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '13px',
        color: '#888899',
        align: 'center',
        lineSpacing: 8
      }).setOrigin(0.5);

      // Start Button Overlay/Hint
      const selectHint = this.add.text(0, 130, 'NHẤP ĐỂ CHỌN', {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#0a0a0f',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5).setAlpha(0.6);

      container.add([cardBg, nameText, divider, statsText, descText, selectHint]);
      container.setSize(cardW, cardH);
      container.setInteractive({ useHandCursor: true });

      // Hover effects
      container.on('pointerover', () => {
        AudioManager.getInstance().playClick();
        container.setScale(1.05);
        cardBg.clear();
        cardBg.fillStyle(0x131322, 0.95);
        cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
        cardBg.lineStyle(3, deck.color, 1);
        cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
        selectHint.setAlpha(1.0).setColor(deck.textColor);
      });

      container.on('pointerout', () => {
        container.setScale(1.0);
        cardBg.clear();
        cardBg.fillStyle(0x0e0e16, 0.95);
        cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
        cardBg.lineStyle(2, deck.color, 0.8);
        cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
        selectHint.setAlpha(0.6).setColor('#ffffff');
      });

      // Selection click
      container.on('pointerdown', () => {
        AudioManager.getInstance().playUpgrade();
        // Shatter slide effect or screen fade out
        this.tweens.add({
          targets: container,
          scale: 0.98,
          duration: 80,
          yoyo: true,
          onComplete: () => {
            GameManager.getInstance().startNewRun(deck.type);
            this.scene.start('PlayScene');
          }
        });
      });
    });
  }
}
