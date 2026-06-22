import Phaser from 'phaser';
import { AudioManager } from '../core/AudioManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // We can load external assets here if needed, but we will generate textures programmatically for zero-load speed.
    // Display a sleek loading indicator
    const { width, height } = this.scale;
    const loadingText = this.add.text(width / 2, height / 2, 'Loading Game...', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Outfit, Roboto, sans-serif'
    }).setOrigin(0.5);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 + 30, 320, 10);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ffcc, 1);
      progressBar.fillRect(width / 2 - 160, height / 2 + 30, 320 * value, 10);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }

  create() {
    // Generate all dynamic textures
    this.createCandyTextures();
    this.createUITextures();

    // Bootstrap music on first user interaction
    const startMusicHandler = () => {
      AudioManager.getInstance().startMusic();
      window.removeEventListener('click', startMusicHandler);
      window.removeEventListener('keydown', startMusicHandler);
    };
    window.addEventListener('click', startMusicHandler);
    window.addEventListener('keydown', startMusicHandler);

    // Go to Menu Scene
    this.scene.start('MenuScene');
  }

  private createCandyTextures() {
    const size = 64;
    const center = size / 2;

    // Candy colors configuration
    const candyColors = [
      { key: 'candy_red', fill: 0xff3366, darkFill: 0x990033, type: 'heart' },
      { key: 'candy_blue', fill: 0x3399ff, darkFill: 0x0044cc, type: 'diamond' },
      { key: 'candy_green', fill: 0x33cc66, darkFill: 0x006622, type: 'emerald' },
      { key: 'candy_yellow', fill: 0xffcc00, darkFill: 0xcc8800, type: 'star' },
      { key: 'candy_purple', fill: 0xaa33ff, darkFill: 0x5500aa, type: 'hexagon' }
    ];

    candyColors.forEach(cfg => {
      const g = this.add.graphics();
      g.clear();

      // Shadow
      g.fillStyle(0x000000, 0.4);
      g.fillCircle(center + 2, center + 4, 24);

      // Base shape gradients / gloss
      g.lineStyle(2, 0xffffff, 0.8);

      if (cfg.type === 'heart') {
        g.fillStyle(cfg.fill, 1);
        
        // Draw two circles
        g.fillCircle(center - 10, center - 6, 13);
        g.fillCircle(center + 10, center - 6, 13);
        
        // Draw bottom triangle
        const points = [
          new Phaser.Math.Vector2(center - 22.5, center - 2),
          new Phaser.Math.Vector2(center + 22.5, center - 2),
          new Phaser.Math.Vector2(center, center + 20)
        ];
        g.fillPoints(points, true);
        g.strokePoints(points, true);
        
        // Draw outline circle caps to look clean
        g.strokeCircle(center - 10, center - 6, 13);
        g.strokeCircle(center + 10, center - 6, 13);

        // Shiny highlight
        g.fillStyle(0xffffff, 0.35);
        g.fillCircle(center - 8, center - 10, 6);
      } 
      else if (cfg.type === 'diamond') {
        g.fillStyle(cfg.fill, 1);
        g.beginPath();
        g.moveTo(center, center - 24);
        g.lineTo(center + 22, center);
        g.lineTo(center, center + 24);
        g.lineTo(center - 22, center);
        g.closePath();
        g.fill();
        g.stroke();

        // Shiny highlight
        g.fillStyle(0xffffff, 0.4);
        g.beginPath();
        g.moveTo(center, center - 20);
        g.lineTo(center + 8, center - 8);
        g.lineTo(center, center - 4);
        g.lineTo(center - 8, center - 8);
        g.closePath();
        g.fill();
      } 
      else if (cfg.type === 'emerald') {
        g.fillStyle(cfg.fill, 1);
        // Rounded ellipse
        g.fillEllipse(center, center, 44, 48);
        g.strokeEllipse(center, center, 44, 48);

        // Glass reflection
        g.fillStyle(0xffffff, 0.35);
        g.fillEllipse(center - 6, center - 8, 14, 18);
      } 
      else if (cfg.type === 'star') {
        g.fillStyle(cfg.fill, 1);
        // 5 Point Star
        const points: Phaser.Math.Vector2[] = [];
        const rot = Math.PI / 2 * 3;
        const spikes = 5;
        const outerRadius = 24;
        const innerRadius = 10;
        let x = center;
        let y = center;
        let step = Math.PI / spikes;

        for (let i = 0; i < spikes; i++) {
          x = center + Math.cos(rot + i * 2 * step) * outerRadius;
          y = center + Math.sin(rot + i * 2 * step) * outerRadius;
          points.push(new Phaser.Math.Vector2(x, y));

          x = center + Math.cos(rot + (i * 2 + 1) * step) * innerRadius;
          y = center + Math.sin(rot + (i * 2 + 1) * step) * innerRadius;
          points.push(new Phaser.Math.Vector2(x, y));
        }
        g.fillPoints(points, true);
        g.strokePoints(points, true);

        // Highlight
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(center, center - 2, 6);
      } 
      else if (cfg.type === 'hexagon') {
        g.fillStyle(cfg.fill, 1);
        // Hexagon points
        const points: Phaser.Math.Vector2[] = [];
        const sides = 6;
        const radius = 24;
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides;
          points.push(new Phaser.Math.Vector2(
            center + radius * Math.cos(angle),
            center + radius * Math.sin(angle)
          ));
        }
        g.fillPoints(points, true);
        g.strokePoints(points, true);

        // Gloss
        g.fillStyle(0xffffff, 0.3);
        g.beginPath();
        g.moveTo(center - 10, center - 10);
        g.lineTo(center + 10, center - 10);
        g.lineTo(center, center - 2);
        g.closePath();
        g.fill();
      }

      g.generateTexture(cfg.key, size, size);
      g.destroy();
    });
  }

  private createUITextures() {
    // 1. Grid cell background
    const cellSize = 60;
    const cellGraphics = this.add.graphics();
    
    // Draw grid square
    cellGraphics.fillStyle(0x1a1a24, 0.7);
    cellGraphics.fillRoundedRect(1, 1, cellSize - 2, cellSize - 2, 8);
    cellGraphics.lineStyle(1.5, 0x2d2d3d, 0.8);
    cellGraphics.strokeRoundedRect(1, 1, cellSize - 2, cellSize - 2, 8);
    
    cellGraphics.generateTexture('grid_cell', cellSize, cellSize);
    cellGraphics.destroy();

    // 2. Joker Card base texture
    const cardW = 116;
    const cardH = 174;
    const cardGraphics = this.add.graphics();

    // Card shadow
    cardGraphics.fillStyle(0x000000, 0.5);
    cardGraphics.fillRoundedRect(3, 3, cardW - 6, cardH - 6, 12);

    // Card background
    cardGraphics.fillStyle(0x111116, 0.95);
    cardGraphics.fillRoundedRect(0, 0, cardW - 2, cardH - 2, 12);

    // Metallic boarder
    cardGraphics.lineStyle(2.5, 0xd4af37, 1); // Gold default border
    cardGraphics.strokeRoundedRect(0, 0, cardW - 2, cardH - 2, 12);
    
    // Subtle inner design
    cardGraphics.lineStyle(1, 0x333344, 0.5);
    cardGraphics.strokeRoundedRect(4, 4, cardW - 10, cardH - 10, 8);

    cardGraphics.generateTexture('joker_card_base', cardW, cardH);
    cardGraphics.destroy();

    // 3. Tarot Card base texture
    const tarotW = 116;
    const tarotH = 174;
    const tarotGraphics = this.add.graphics();

    // Card shadow
    tarotGraphics.fillStyle(0x000000, 0.5);
    tarotGraphics.fillRoundedRect(3, 3, tarotW - 6, tarotH - 6, 12);

    // Card background (mystic dark purple)
    tarotGraphics.fillStyle(0x180f2b, 0.95);
    tarotGraphics.fillRoundedRect(0, 0, tarotW - 2, tarotH - 2, 12);

    // Metallic purple/blue border
    tarotGraphics.lineStyle(2.5, 0xaa33ff, 1);
    tarotGraphics.strokeRoundedRect(0, 0, tarotW - 2, tarotH - 2, 12);
    
    // Mystic inner design
    tarotGraphics.lineStyle(1, 0x5522aa, 0.5);
    tarotGraphics.strokeRoundedRect(4, 4, tarotW - 10, tarotH - 10, 8);

    tarotGraphics.generateTexture('tarot_card_base', tarotW, tarotH);
    tarotGraphics.destroy();

    // 4. Voucher Card base texture
    const voucherW = 116;
    const voucherH = 174;
    const voucherGraphics = this.add.graphics();

    // Card shadow
    voucherGraphics.fillStyle(0x000000, 0.5);
    voucherGraphics.fillRoundedRect(3, 3, voucherW - 6, voucherH - 6, 12);

    // Card background (sleek metallic dark grey/silver)
    voucherGraphics.fillStyle(0x1a2129, 0.95);
    voucherGraphics.fillRoundedRect(0, 0, voucherW - 2, voucherH - 2, 12);

    // Metallic silver/cyan border
    voucherGraphics.lineStyle(2.5, 0x00ffcc, 1); // Neon cyan border
    voucherGraphics.strokeRoundedRect(0, 0, voucherW - 2, voucherH - 2, 12);
    
    // Inner design
    voucherGraphics.lineStyle(1, 0x334e5a, 0.5);
    voucherGraphics.strokeRoundedRect(4, 4, voucherW - 10, voucherH - 10, 8);

    voucherGraphics.generateTexture('voucher_card_base', voucherW, voucherH);
    voucherGraphics.destroy();
  }
}
