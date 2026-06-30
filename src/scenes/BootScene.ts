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
      { key: 'candy_red', fill: 0xff3366, darkFill: 0x800020, type: 'heart' },
      { key: 'candy_blue', fill: 0x3399ff, darkFill: 0x0033aa, type: 'diamond' },
      { key: 'candy_green', fill: 0x33cc66, darkFill: 0x005511, type: 'emerald' },
      { key: 'candy_yellow', fill: 0xffcc00, darkFill: 0x996600, type: 'star' },
      { key: 'candy_purple', fill: 0xaa33ff, darkFill: 0x440088, type: 'hexagon' }
    ];

    candyColors.forEach(cfg => {
      const g = this.add.graphics();
      g.clear();

      // Soft Shadow
      g.fillStyle(0x000000, 0.35);
      g.fillCircle(center + 2, center + 4, 23);

      // Helper functions to draw shapes at a specific center, scale and offset
      const drawHeart = (graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, scale: number) => {
        const rCircle = 13 * scale;
        const offsetX = 10 * scale;
        const offsetY = 6 * scale;
        graphics.fillCircle(cx - offsetX, cy - offsetY, rCircle);
        graphics.fillCircle(cx + offsetX, cy - offsetY, rCircle);
        const points = [
          new Phaser.Math.Vector2(cx - 22.5 * scale, cy - 2 * scale),
          new Phaser.Math.Vector2(cx + 22.5 * scale, cy - 2 * scale),
          new Phaser.Math.Vector2(cx, cy + 20 * scale)
        ];
        graphics.fillPoints(points, true);
      };

      const drawDiamond = (graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, scale: number) => {
        graphics.beginPath();
        graphics.moveTo(cx, cy - 24 * scale);
        graphics.lineTo(cx + 22 * scale, cy);
        graphics.lineTo(cx, cy + 24 * scale);
        graphics.lineTo(cx - 22 * scale, cy);
        graphics.closePath();
        graphics.fill();
      };

      const drawEmerald = (graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, scale: number) => {
        graphics.fillEllipse(cx, cy, 44 * scale, 48 * scale);
      };

      const drawStar = (graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, scale: number) => {
        const points: Phaser.Math.Vector2[] = [];
        const rot = Math.PI / 2 * 3;
        const spikes = 5;
        const outerRadius = 24 * scale;
        const innerRadius = 10 * scale;
        const step = Math.PI / spikes;

        for (let i = 0; i < spikes; i++) {
          let x = cx + Math.cos(rot + i * 2 * step) * outerRadius;
          let y = cy + Math.sin(rot + i * 2 * step) * outerRadius;
          points.push(new Phaser.Math.Vector2(x, y));

          x = cx + Math.cos(rot + (i * 2 + 1) * step) * innerRadius;
          y = cy + Math.sin(rot + (i * 2 + 1) * step) * innerRadius;
          points.push(new Phaser.Math.Vector2(x, y));
        }
        graphics.fillPoints(points, true);
      };

      const drawHexagon = (graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, scale: number) => {
        const points: Phaser.Math.Vector2[] = [];
        const sides = 6;
        const radius = 24 * scale;
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides;
          points.push(new Phaser.Math.Vector2(
            cx + radius * Math.cos(angle),
            cy + radius * Math.sin(angle)
          ));
        }
        graphics.fillPoints(points, true);
      };

      // Draw 3D Radial Gradient Effect by layering 8 shrinking shapes
      const layers = 8;
      for (let i = 0; i < layers; i++) {
        const ratio = i / (layers - 1);
        
        // Interpolate between darkFill and fill
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.IntegerToColor(cfg.darkFill),
          Phaser.Display.Color.IntegerToColor(cfg.fill),
          layers,
          i
        );
        const hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
        g.fillStyle(hexColor, 1);

        // Shrink slightly and shift towards top-left to simulate light source
        const scale = 1 - ratio * 0.25;
        const offsetX = -ratio * 2.5;
        const offsetY = -ratio * 2.5;

        if (cfg.type === 'heart') {
          drawHeart(g, center + offsetX, center + offsetY, scale);
        } else if (cfg.type === 'diamond') {
          drawDiamond(g, center + offsetX, center + offsetY, scale);
        } else if (cfg.type === 'emerald') {
          drawEmerald(g, center + offsetX, center + offsetY, scale);
        } else if (cfg.type === 'star') {
          drawStar(g, center + offsetX, center + offsetY, scale);
        } else if (cfg.type === 'hexagon') {
          drawHexagon(g, center + offsetX, center + offsetY, scale);
        }
      }

      // Draw a subtle white highlight on the top-left edge
      g.fillStyle(0xffffff, 0.45);
      if (cfg.type === 'heart') {
        g.fillCircle(center - 8, center - 10, 6);
        g.fillCircle(center - 11, center - 12, 3); // Extra glint
      } else if (cfg.type === 'diamond') {
        g.beginPath();
        g.moveTo(center - 2, center - 18);
        g.lineTo(center + 4, center - 10);
        g.lineTo(center - 2, center - 6);
        g.lineTo(center - 8, center - 10);
        g.closePath();
        g.fill();
      } else if (cfg.type === 'emerald') {
        g.fillEllipse(center - 6, center - 8, 12, 16);
        g.fillStyle(0xffffff, 0.2);
        g.fillEllipse(center - 4, center - 6, 6, 8); // Extra glint
      } else if (cfg.type === 'star') {
        g.fillCircle(center - 2, center - 4, 5);
        g.fillStyle(0xffffff, 0.25);
        g.fillCircle(center - 4, center - 6, 2.5);
      } else if (cfg.type === 'hexagon') {
        g.beginPath();
        g.moveTo(center - 10, center - 10);
        g.lineTo(center + 6, center - 10);
        g.lineTo(center - 2, center - 4);
        g.closePath();
        g.fill();
      }

      // Outermost white shine line
      g.lineStyle(1.5, 0xffffff, 0.45);
      if (cfg.type === 'heart') {
        // Draw outline
        const rCircle = 13;
        const offsetX = 10;
        const offsetY = 6;
        g.strokeCircle(center - offsetX, center - offsetY, rCircle);
        g.strokeCircle(center + offsetX, center - offsetY, rCircle);
        const points = [
          new Phaser.Math.Vector2(center - 22.5, center - 2),
          new Phaser.Math.Vector2(center + 22.5, center - 2),
          new Phaser.Math.Vector2(center, center + 20)
        ];
        g.strokePoints(points, true);
      } else if (cfg.type === 'diamond') {
        drawDiamond(g, center, center, 1);
        g.strokePath();
      } else if (cfg.type === 'emerald') {
        g.strokeEllipse(center, center, 44, 48);
      } else if (cfg.type === 'star') {
        const points: Phaser.Math.Vector2[] = [];
        const rot = Math.PI / 2 * 3;
        const spikes = 5;
        const outerRadius = 24;
        const innerRadius = 10;
        const step = Math.PI / spikes;
        for (let i = 0; i < spikes; i++) {
          let x = center + Math.cos(rot + i * 2 * step) * outerRadius;
          let y = center + Math.sin(rot + i * 2 * step) * outerRadius;
          points.push(new Phaser.Math.Vector2(x, y));
          x = center + Math.cos(rot + (i * 2 + 1) * step) * innerRadius;
          y = center + Math.sin(rot + (i * 2 + 1) * step) * innerRadius;
          points.push(new Phaser.Math.Vector2(x, y));
        }
        g.strokePoints(points, true);
      } else if (cfg.type === 'hexagon') {
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
        g.strokePoints(points, true);
      }

      g.generateTexture(cfg.key, size, size);
      g.destroy();
    });
  }

  private createUITextures() {
    // 1. Grid cell background (sleek carbon-neon cell)
    const cellSize = 60;
    const cellGraphics = this.add.graphics();
    
    cellGraphics.fillStyle(0x0e0e14, 0.85);
    cellGraphics.fillRoundedRect(1, 1, cellSize - 2, cellSize - 2, 8);
    
    // Double border: outer dark, inner neon glow
    cellGraphics.lineStyle(1.5, 0x1d1d29, 1);
    cellGraphics.strokeRoundedRect(1, 1, cellSize - 2, cellSize - 2, 8);
    cellGraphics.lineStyle(1, 0x2e1f3d, 0.4);
    cellGraphics.strokeRoundedRect(3, 3, cellSize - 6, cellSize - 6, 6);
    
    cellGraphics.generateTexture('grid_cell', cellSize, cellSize);
    cellGraphics.destroy();

    // Helper to draw premium card base
    const drawPremiumCardBase = (key: string, w: number, h: number, bgCol: number, borderCol: number, innerBorderCol: number) => {
      const g = this.add.graphics();
      
      // Card Shadow
      g.fillStyle(0x000000, 0.6);
      g.fillRoundedRect(4, 4, w - 8, h - 8, 12);
      
      // Card Background (dark textured)
      g.fillStyle(0x0a0a0f, 0.98);
      g.fillRoundedRect(0, 0, w - 2, h - 2, 12);
      
      // Inner Card body (colored tint)
      g.fillStyle(bgCol, 0.85);
      g.fillRoundedRect(4, 4, w - 10, h - 10, 8);
      
      // Metallic outer border
      g.lineStyle(2.5, borderCol, 1);
      g.strokeRoundedRect(0, 0, w - 2, h - 2, 12);
      
      // Fine inner border
      g.lineStyle(1, innerBorderCol, 0.5);
      g.strokeRoundedRect(3, 3, w - 8, h - 8, 10);
      g.strokeRoundedRect(6, 6, w - 14, h - 14, 8);
      
      // Corner metallic rivets/dots
      g.fillStyle(borderCol, 0.95);
      g.fillCircle(8, 8, 2.5);
      g.fillCircle(w - 10, 8, 2.5);
      g.fillCircle(8, h - 10, 2.5);
      g.fillCircle(w - 10, h - 10, 2.5);
      
      // Extra corner lines
      g.lineStyle(1.5, borderCol, 0.7);
      g.lineBetween(8, 5, 14, 5);
      g.lineBetween(5, 8, 5, 14);
      g.lineBetween(w - 10, 5, w - 16, 5);
      g.lineBetween(w - 7, 8, w - 7, 14);
      g.lineBetween(8, h - 7, 14, h - 7);
      g.lineBetween(5, h - 10, 5, h - 16);
      g.lineBetween(w - 10, h - 7, w - 16, h - 7);
      g.lineBetween(w - 7, h - 10, w - 7, h - 16);
      
      g.generateTexture(key, w, h);
      g.destroy();
    };

    // 2. Joker Card (Gold/Black)
    drawPremiumCardBase('joker_card_base', 116, 174, 0x111116, 0xd4af37, 0xaa8822);

    // 3. Tarot Card (Mystic Purple/Indigo)
    drawPremiumCardBase('tarot_card_base', 116, 174, 0x140c24, 0xaa33ff, 0x6611cc);

    // 4. Voucher Card (Neon Cyan/Silver)
    drawPremiumCardBase('voucher_card_base', 116, 174, 0x0c161a, 0x00ffcc, 0x008899);
  }
}
