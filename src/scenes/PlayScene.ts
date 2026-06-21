import Phaser from 'phaser';
import { Board } from '../core/Board';
import { GameManager } from '../core/GameManager';
import { ScoringEngine } from '../core/Scoring';
import type { CandyColor, MatchGroup, CandyState } from '../types/game';

export class PlayScene extends Phaser.Scene {
  private board!: Board;
  private gameManager!: GameManager;
  
  // Visual representation of board
  private candySprites: (Phaser.GameObjects.Container | null)[][] = [];
  private gridBgCells: Phaser.GameObjects.Image[][] = [];

  // Interaction State
  private selectedCandy: { row: number; col: number } | null = null;
  private selectionHighlight?: Phaser.GameObjects.Graphics;
  private isProcessing = false;

  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private swapsText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;

  // Chips & Mult interactive boxes (Balatro Style!)
  private chipsBox!: Phaser.GameObjects.Container;
  private chipsText!: Phaser.GameObjects.Text;
  private multBox!: Phaser.GameObjects.Container;
  private multText!: Phaser.GameObjects.Text;
  private scoringPanelText!: Phaser.GameObjects.Text;

  // Active Joker display
  private jokerCards: Phaser.GameObjects.Container[] = [];
  private jokerSlots: Phaser.GameObjects.Graphics[] = [];

  // Board visual parameters
  private readonly boardX = 380;
  private readonly boardY = 220;
  private readonly cellSize = 60;

  constructor() {
    super('PlayScene');
  }

  create() {
    this.gameManager = GameManager.getInstance();
    this.gameManager.jokerManager.maxSlots = this.gameManager.state.maxJokerSlots;
    this.gameManager.startRound();
    this.board = new Board(8, 8);
    
    // Grid persistence between play scene and shop tarot cards
    if (this.gameManager.state.boardGrid) {
      this.board.grid = JSON.parse(JSON.stringify(this.gameManager.state.boardGrid));
    } else {
      this.gameManager.state.boardGrid = JSON.parse(JSON.stringify(this.board.grid));
    }

    this.candySprites = Array(8).fill(null).map(() => Array(8).fill(null));
    this.gridBgCells = Array(8).fill(null).map(() => Array(8).fill(null));
    this.isProcessing = false;

    const { width, height } = this.scale;

    // 1. Background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x080811, 0x080811, 0x14051a, 0x14051a, 1);
    bgGraphics.fillRect(0, 0, width, height);
    
    // Draw decorative grid lines
    bgGraphics.lineStyle(1, 0x221133, 0.15);
    for (let x = 0; x < width; x += 40) {
      bgGraphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 40) {
      bgGraphics.lineBetween(0, y, width, y);
    }

    // 2. Render Board Area Background
    const boardBg = this.add.graphics();
    boardBg.fillStyle(0x0e0e16, 0.8);
    boardBg.fillRoundedRect(this.boardX - 15, this.boardY - 15, 8 * this.cellSize + 30, 8 * this.cellSize + 30, 16);
    boardBg.lineStyle(2, 0x332244, 0.8);
    boardBg.strokeRoundedRect(this.boardX - 15, this.boardY - 15, 8 * this.cellSize + 30, 8 * this.cellSize + 30, 16);

    // Render Grid Cells
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const x = this.boardX + c * this.cellSize + this.cellSize / 2;
        const y = this.boardY + r * this.cellSize + this.cellSize / 2;
        const cell = this.add.image(x, y, 'grid_cell');
        this.gridBgCells[r][c] = cell;
      }
    }

    // Selection Highlight
    this.selectionHighlight = this.add.graphics();
    this.selectionHighlight.setVisible(false);

    // Render initial candies
    this.rebuildCandySprites();

    // 3. Render HUD / Left Panel
    this.createLeftPanel();

    // 4. Render Balatro scoring panel
    this.createBalatroScoringPanel();

    // 5. Render Top Panel (Jokers)
    this.createJokersHUD();

    // Setup input listener for grid clicks
    this.input.on('pointerdown', this.onPointerDown, this);
  }

  private createLeftPanel() {
    // Panel background
    const panel = this.add.graphics();
    panel.fillStyle(0x0f0f18, 0.9);
    panel.fillRoundedRect(20, 80, 310, 660, 16);
    panel.lineStyle(2, 0x00ffcc, 0.4);
    panel.strokeRoundedRect(20, 80, 310, 660, 16);

    // Title info
    const blindTypes = ['SMALL BLIND', 'BIG BLIND', 'BOSS BLIND'];
    const title = blindTypes[this.gameManager.state.round - 1] || 'BLIND';
    
    this.add.text(175, 110, `ANTE ${this.gameManager.state.ante} - ${title}`, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#00ffcc'
    }).setOrigin(0.5);

    // Score target
    this.add.text(45, 160, 'MỤC TIÊU:', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '14px',
      color: '#888899'
    });

    this.targetText = this.add.text(45, 180, this.formatNumber(this.gameManager.state.scoreTarget), {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ff0055',
      shadow: { blur: 5, color: '#ff0055', fill: true }
    });

    // Score current
    this.add.text(45, 230, 'ĐIỂM HIỆN TẠI:', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '14px',
      color: '#888899'
    });

    this.scoreText = this.add.text(45, 250, '0', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      shadow: { blur: 10, color: '#00ffcc', fill: true }
    });

    // Progress bar for score
    this.progressBar = this.add.graphics();
    this.updateProgressBar();

    // Swaps remaining
    this.swapsText = this.add.text(175, 360, `LƯỢT TRÁO: ${this.gameManager.state.swapsRemaining}`, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffaa00'
    }).setOrigin(0.5);

    // Gold
    this.goldText = this.add.text(175, 410, `VÀNG: $${this.gameManager.state.gold}`, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);

    // Divider
    panel.lineStyle(1, 0x333344, 1);
    panel.lineBetween(40, 460, 310, 460);

    // Candy Levels Stats
    this.add.text(175, 480, 'CẤP ĐỘ KẸO', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#888899'
    }).setOrigin(0.5);

    const colors: { key: CandyColor; hex: string; label: string }[] = [
      { key: 'red', hex: '#ff3366', label: 'Đỏ' },
      { key: 'blue', hex: '#3399ff', label: 'Xanh d.g' },
      { key: 'green', hex: '#33cc66', label: 'Xanh lá' },
      { key: 'yellow', hex: '#ffcc00', label: 'Vàng' },
      { key: 'purple', hex: '#aa33ff', label: 'Tím' }
    ];

    colors.forEach((col, idx) => {
      const yPos = 520 + idx * 36;
      // Small icon placeholder
      this.add.image(60, yPos, `candy_${col.key}`).setScale(0.5);
      
      this.add.text(90, yPos - 10, col.label, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '14px',
        color: '#ffffff'
      });

      const lvl = this.gameManager.state.candyLevels[col.key];
      const stats = ScoringEngine.getBaseCandyStats(col.key, lvl);

      this.add.text(280, yPos - 10, `Lvl ${lvl}`, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: col.hex
      }).setOrigin(1, 0);

      // Display candy base formula: Chips x Mult
      this.add.text(90, yPos + 6, `(${stats.chips} x ${stats.mult})`, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '11px',
        color: '#888899'
      });
    });
  }

  private createBalatroScoringPanel() {
    const startX = 380;
    const startY = 705;
    
    // Chips Box (Blue)
    this.chipsBox = this.add.container(startX + 60, startY);
    const chipsBg = this.add.graphics();
    chipsBg.fillStyle(0x0055ff, 0.95);
    chipsBg.fillRoundedRect(-50, -25, 100, 50, 10);
    chipsBg.lineStyle(2, 0xffffff, 0.8);
    chipsBg.strokeRoundedRect(-50, -25, 100, 50, 10);
    
    this.chipsText = this.add.text(0, 0, '0', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.chipsBox.add([chipsBg, this.chipsText]);

    // X multiplier symbol
    this.add.text(startX + 155, startY, 'X', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffaa00'
    }).setOrigin(0.5);

    // Mult Box (Red)
    this.multBox = this.add.container(startX + 250, startY);
    const multBg = this.add.graphics();
    multBg.fillStyle(0xff1133, 0.95);
    multBg.fillRoundedRect(-50, -25, 100, 50, 10);
    multBg.lineStyle(2, 0xffffff, 0.8);
    multBg.strokeRoundedRect(-50, -25, 100, 50, 10);

    this.multText = this.add.text(0, 0, '0', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.multBox.add([multBg, this.multText]);

    // Equal symbol and final score text
    this.add.text(startX + 325, startY, '=', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.scoringPanelText = this.add.text(startX + 400, startY, '0', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#00ffcc'
    }).setOrigin(0.5);
  }

  private createJokersHUD() {
    const startX = 380;
    const startY = 80;
    const spacing = 100;

    // Draw Joker Card Slot backgrounds
    for (let i = 0; i < this.gameManager.state.maxJokerSlots; i++) {
      const x = startX + i * spacing + 45;
      const y = startY + 67;

      const slot = this.add.graphics();
      slot.fillStyle(0x09090f, 0.5);
      slot.fillRoundedRect(x - 45, y - 67, 90, 135, 12);
      slot.lineStyle(1.5, 0x222233, 1);
      slot.strokeRoundedRect(x - 45, y - 67, 90, 135, 12);

      // Dash border to show it is a placeholder slot
      this.jokerSlots.push(slot);
    }

    this.rebuildJokerCards();
  }

  private rebuildJokerCards() {
    // Destroy previous cards
    this.jokerCards.forEach(c => c.destroy());
    this.jokerCards = [];

    const startX = 380;
    const startY = 80;
    const spacing = 100;

    const activeJokers = this.gameManager.jokerManager.getJokers();

    activeJokers.forEach((joker, index) => {
      const x = startX + index * spacing + 45;
      const y = startY + 67;

      const container = this.add.container(x, y);

      // Card Background Image
      const cardBg = this.add.image(0, 0, 'joker_card_base');
      
      // Color borders based on rarity
      const border = this.add.graphics();
      const rarityColorsNumeric = {
        common: 0x888899,
        uncommon: 0x3399ff,
        rare: 0xff00ff
      };
      const rarityColorsStr = {
        common: '#888899',
        uncommon: '#3399ff',
        rare: '#ff00ff'
      };
      const colorNum = rarityColorsNumeric[joker.rarity] || 0xffffff;
      const colorStr = rarityColorsStr[joker.rarity] || '#ffffff';
      border.lineStyle(2, colorNum, 1);
      border.strokeRoundedRect(-45, -67, 90, 135, 12);

      // Shorten name to fit
      let shortName = joker.name;
      if (shortName.length > 10) shortName = shortName.substring(0, 9) + '.';

      const nameText = this.add.text(0, -50, shortName, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      // Shorten description or fit it in the card
      const descText = this.add.text(0, 15, joker.description, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '9px',
        color: '#888899',
        align: 'center',
        wordWrap: { width: 80 }
      }).setOrigin(0.5);

      const rarityText = this.add.text(0, 52, joker.rarity.toUpperCase(), {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: colorStr
      }).setOrigin(0.5);

      container.add([cardBg, border, nameText, descText, rarityText]);

      // Make card interactive for drag-and-drop
      container.setSize(90, 135);
      container.setInteractive({ useHandCursor: true, draggable: true });

      // Store index on container
      container.setData('index', index);

      // Drag event handlers
      container.on('dragstart', () => {
        this.children.bringToTop(container);
        container.setScale(1.1);
        border.lineStyle(3, 0x00ffcc, 1);
        border.strokeRoundedRect(-45, -67, 90, 135, 12);
      });

      container.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        container.x = dragX;
        // Keep y near the slot area
        container.y = Phaser.Math.Clamp(dragY, y - 20, y + 20);
      });

      container.on('dragend', () => {
        container.setScale(1.0);
        
        // Find which slot is closest
        const relativeX = container.x - startX - 45;
        let targetIndex = Math.round(relativeX / spacing);
        targetIndex = Phaser.Math.Clamp(targetIndex, 0, activeJokers.length - 1);

        const currentIndex = container.getData('index') as number;
        if (targetIndex !== currentIndex) {
          // Swap positions in Manager
          this.gameManager.jokerManager.moveJoker(currentIndex, targetIndex);
          // Sync state
          this.gameManager.state.activeJokers = this.gameManager.jokerManager.getJokerIds();
        }

        // Animate all cards back to their proper slots
        this.rebuildJokerCards();
      });

      this.jokerCards.push(container);
    });
  }

  private createCandyContainer(row: number, col: number, state: any): Phaser.GameObjects.Container {
    const x = this.boardX + col * this.cellSize + this.cellSize / 2;
    const y = this.boardY + row * this.cellSize + this.cellSize / 2;

    const container = this.add.container(x, y);
    
    // 1. Base candy image
    const sprite = this.add.image(0, 0, `candy_${state.color}`);
    sprite.setScale(0.85);
    container.add(sprite);

    // 2. Apply Edition visuals (Tints / Tweens)
    if (state.edition === 'foil') {
      sprite.setTint(0xccddee);
    } else if (state.edition === 'holographic') {
      this.tweens.add({
        targets: sprite,
        tint: { from: 0xffaaee, to: 0xaaeeee },
        duration: 1200,
        yoyo: true,
        repeat: -1
      });
    } else if (state.edition === 'polychrome') {
      this.tweens.add({
        targets: sprite,
        tint: { from: 0xff6666, to: 0x66ff66 },
        duration: 1800,
        yoyo: true,
        repeat: -1
      });
    }

    // 3. Apply Special overlays (Stripes / Glows)
    if (state.special === 'striped_h') {
      const stripe = this.add.graphics();
      stripe.lineStyle(4, 0xffffff, 0.95);
      stripe.lineBetween(-20, 0, 20, 0);
      container.add(stripe);
    } else if (state.special === 'striped_v') {
      const stripe = this.add.graphics();
      stripe.lineStyle(4, 0xffffff, 0.95);
      stripe.lineBetween(0, -20, 0, 20);
      container.add(stripe);
    } else if (state.special === 'wrapped') {
      const glow = this.add.graphics();
      glow.lineStyle(2.5, 0xffaa00, 0.85);
      glow.strokeRoundedRect(-22, -22, 44, 44, 6);
      container.add(glow);
    } else if (state.special === 'color_bomb') {
      const dots = this.add.graphics();
      const colors = [0xff3366, 0x3399ff, 0x33cc66, 0xffcc00, 0xaa33ff];
      colors.forEach((col, idx) => {
        const angle = (idx * Math.PI * 2) / 5;
        dots.fillStyle(col, 1);
        dots.fillCircle(Math.cos(angle) * 15, Math.sin(angle) * 15, 3.5);
      });
      container.add(dots);
    }

    // 4. Apply Enhancement Badge
    if (state.enhancement !== 'none') {
      const badge = this.add.graphics();
      let bgCol = 0xffd700;
      let labelText = '$';
      let labelTextCol = '#000000';

      if (state.enhancement === 'glass') {
        bgCol = 0x99ffff;
        labelText = 'G';
        labelTextCol = '#005577';
      } else if (state.enhancement === 'steel') {
        bgCol = 0x777777;
        labelText = 'S';
        labelTextCol = '#ffffff';
      } else if (state.enhancement === 'lucky') {
        bgCol = 0x33cc66;
        labelText = 'L';
        labelTextCol = '#ffffff';
      } else if (state.enhancement === 'bonus') {
        bgCol = 0xdddddd;
        labelText = 'B';
        labelTextCol = '#000000';
      }

      badge.fillStyle(bgCol, 1);
      badge.fillCircle(14, 14, 8);
      badge.lineStyle(1.5, 0xffffff, 0.9);
      badge.strokeCircle(14, 14, 8);
      container.add(badge);

      const txt = this.add.text(14, 14, labelText, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: labelTextCol
      }).setOrigin(0.5);
      container.add(txt);
    }

    // 5. Apply Ice Overlay (Frozen)
    if (state.frozen) {
      const ice = this.add.graphics();
      // Light blue semi-transparent overlay
      ice.fillStyle(0x88ccff, 0.45);
      ice.fillRoundedRect(-this.cellSize / 2 + 3, -this.cellSize / 2 + 3, this.cellSize - 6, this.cellSize - 6, 8);
      ice.lineStyle(2.5, 0xddeeff, 0.95);
      ice.strokeRoundedRect(-this.cellSize / 2 + 3, -this.cellSize / 2 + 3, this.cellSize - 6, this.cellSize - 6, 8);
      
      // Draw shiny frost cracks
      ice.lineStyle(1.5, 0xffffff, 0.7);
      ice.lineBetween(-15, -15, 10, 10);
      ice.lineBetween(15, -15, -10, 10);
      
      container.add(ice);
      container.setData('iceGraphics', ice); // Store reference to animate ice shatter
    }

    // Interactive configuration
    container.setSize(this.cellSize - 10, this.cellSize - 10);
    container.setInteractive({ useHandCursor: true });
    container.setData('row', row);
    container.setData('col', col);

    return container;
  }

  private rebuildCandySprites() {
    // Clear old sprites
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.candySprites[r][c]) {
          this.candySprites[r][c]!.destroy();
          this.candySprites[r][c] = null;
        }
      }
    }

    // Build new sprites
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const state = this.board.grid[r][c];
        if (state) {
          const container = this.createCandyContainer(r, c, state);
          this.candySprites[r][c] = container;
        }
      }
    }
  }

  private onPointerDown(_pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) {
    if (this.isProcessing) return;

    // Look for clicked candy (which is a Container now)
    const clickedCandy = gameObjects.find(
      obj => obj.type === 'Container' && (obj as Phaser.GameObjects.Container).getData('row') !== undefined
    ) as Phaser.GameObjects.Container;

    if (!clickedCandy) {
      // Clear selection if clicked elsewhere
      this.clearSelection();
      return;
    }

    const r = clickedCandy.getData('row') as number;
    const c = clickedCandy.getData('col') as number;

    const state = this.board.grid[r][c];
    if (state && state.frozen) {
      const warningText = this.add.text(clickedCandy.x, clickedCandy.y, 'ĐÃ ĐÓNG BĂNG!', {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ff3366',
        backgroundColor: '#0a0a14',
        padding: { x: 6, y: 3 },
        shadow: { blur: 4, color: '#000000', fill: true }
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: warningText,
        y: clickedCandy.y - 30,
        alpha: 0,
        duration: 800,
        onComplete: () => warningText.destroy()
      });
      return;
    }

    if (this.selectedCandy === null) {
      // First selection
      this.selectedCandy = { row: r, col: c };
      this.showSelectionHighlight(r, c);
    } else {
      // Second selection, check if adjacent
      if (this.board.isAdjacent(this.selectedCandy.row, this.selectedCandy.col, r, c)) {
        // Swap candies
        this.performSwap(this.selectedCandy, { row: r, col: c });
        this.clearSelection();
      } else {
        // Select the new one instead
        this.selectedCandy = { row: r, col: c };
        this.showSelectionHighlight(r, c);
      }
    }
  }

  private showSelectionHighlight(row: number, col: number) {
    const x = this.boardX + col * this.cellSize + this.cellSize / 2;
    const y = this.boardY + row * this.cellSize + this.cellSize / 2;

    this.selectionHighlight!.clear();
    this.selectionHighlight!.lineStyle(3, 0x00ffcc, 1);
    this.selectionHighlight!.strokeRoundedRect(x - this.cellSize / 2, y - this.cellSize / 2, this.cellSize, this.cellSize, 8);
    this.selectionHighlight!.setVisible(true);
  }

  private clearSelection() {
    this.selectedCandy = null;
    this.selectionHighlight!.setVisible(false);
  }

  private performSwap(candy1: { row: number; col: number }, candy2: { row: number; col: number }) {
    this.isProcessing = true;

    const sprite1 = this.candySprites[candy1.row][candy1.col]!;
    const sprite2 = this.candySprites[candy2.row][candy2.col]!;

    const x1 = this.boardX + candy1.col * this.cellSize + this.cellSize / 2;
    const y1 = this.boardY + candy1.row * this.cellSize + this.cellSize / 2;
    const x2 = this.boardX + candy2.col * this.cellSize + this.cellSize / 2;
    const y2 = this.boardY + candy2.row * this.cellSize + this.cellSize / 2;

    // Swap animation
    this.tweens.add({
      targets: sprite1,
      x: x2,
      y: y2,
      duration: 200,
      ease: 'Quad.easeInOut'
    });

    this.tweens.add({
      targets: sprite2,
      x: x1,
      y: y1,
      duration: 200,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        // Logical swap
        this.board.swap(candy1.row, candy1.col, candy2.row, candy2.col);
        
        // Update sprites grid references
        this.candySprites[candy1.row][candy1.col] = sprite2;
        this.candySprites[candy2.row][candy2.col] = sprite1;
        sprite1.setData('row', candy2.row).setData('col', candy2.col);
        sprite2.setData('row', candy1.row).setData('col', candy1.col);

        // Sync board state back to GameManager
        this.gameManager.state.boardGrid = JSON.parse(JSON.stringify(this.board.grid));

        // Color Bomb swap check
        const state1 = this.board.grid[candy1.row][candy1.col];
        const state2 = this.board.grid[candy2.row][candy2.col];
        let bombMatches: MatchGroup[] = [];

        if (state1 && state2) {
          if (state1.special === 'color_bomb' && state2.special !== 'color_bomb') {
            state1.color = state2.color;
            bombMatches = [{ color: state2.color, candies: [candy1, candy2], isVertical: false }];
          } else if (state2.special === 'color_bomb' && state1.special !== 'color_bomb') {
            state2.color = state1.color;
            bombMatches = [{ color: state1.color, candies: [candy1, candy2], isVertical: false }];
          } else if (state1.special === 'color_bomb' && state2.special === 'color_bomb') {
            // Double bomb: set all grid cell colors to red, so color bomb clears everything!
            for (let r = 0; r < this.board.rows; r++) {
              for (let c = 0; c < this.board.cols; c++) {
                const s = this.board.grid[r][c];
                if (s) {
                  s.color = 'red';
                }
              }
            }
            state1.color = 'red';
            state2.color = 'red';
            bombMatches = [{ color: 'red', candies: [candy1, candy2], isVertical: false }];
          }
        }

        // Check if there are matches
        let matches = this.board.findMatches();
        if (bombMatches.length > 0) {
          matches = [...matches, ...bombMatches];
        }

        if (matches.length > 0) {
          // Keep count of matches and trigger scoring sequences
          this.processCascades(matches, 1, new Set<CandyColor>(), 0, 0);
        } else {
          // Swap back since no matches
          this.tweens.add({
            targets: sprite1,
            x: x1,
            y: y1,
            duration: 200,
            ease: 'Quad.easeInOut'
          });
          this.tweens.add({
            targets: sprite2,
            x: x2,
            y: y2,
            duration: 200,
            ease: 'Quad.easeInOut',
            onComplete: () => {
              this.board.swap(candy1.row, candy1.col, candy2.row, candy2.col);
              this.candySprites[candy1.row][candy1.col] = sprite1;
              this.candySprites[candy2.row][candy2.col] = sprite2;
              sprite1.setData('row', candy1.row).setData('col', candy1.col);
              sprite2.setData('row', candy2.row).setData('col', candy2.col);
              this.isProcessing = false;
            }
          });
        }
      }
    });
  }

  // Handle cascading matches recursively
  private processCascades(
    matches: MatchGroup[],
    comboCount: number,
    matchedColorsInSwap: Set<CandyColor>,
    accumulatedChips: number,
    accumulatedMult: number
  ) {
    // Add current matches colors
    matches.forEach(m => matchedColorsInSwap.add(m.color));

    // Process logic explosions & spawn cards
    const explosionResult = this.board.processExplosions(matches);
    const clearedList = explosionResult.cleared;
    const unfrozenList = explosionResult.unfrozen;

    // Animate ice shatter for newly unfrozen cells
    unfrozenList.forEach(cell => {
      const sprite = this.candySprites[cell.row][cell.col];
      if (sprite) {
        const ice = sprite.getData('iceGraphics') as Phaser.GameObjects.Graphics;
        if (ice) {
          this.tweens.add({
            targets: ice,
            alpha: 0,
            scale: 1.3,
            duration: 300,
            onComplete: () => {
              ice.destroy();
              sprite.setData('iceGraphics', null);
            }
          });
        }
      }
    });

    // Clear matches visual effect and log score addition
    const matchGroupsData = matches.map(m => ({ color: m.color, size: m.candies.length }));

    // Run scoring calculation
    const activeJokers = this.gameManager.jokerManager.getJokers();
    const result = ScoringEngine.processScoring(
      matchGroupsData,
      clearedList.map(c => c.state),
      comboCount,
      activeJokers,
      this.gameManager.state
    );

    // Update accumulated scoring metrics
    const nextChips = accumulatedChips + result.chips;
    const nextMult = accumulatedMult + result.mult;

    // Award immediate gold if any Joker added it
    if (result.goldAdded > 0) {
      this.gameManager.state.gold += result.goldAdded;
      this.updateHUDText();
      this.animateGoldGain(result.goldAdded);
    }

    // Update Balatro Scoring HUD boxes
    this.animateScoreAccumulation(result.chips, result.mult, nextChips, nextMult);

    // Animate Joker activations if there are messages
    this.animateJokerTriggers(result.triggerMessages);

    // Blast candies visually (including chain explosions)
    this.animateCandyExplosion(clearedList, () => {
      
      // Clear visual exploded sprites from board
      clearedList.forEach(cell => {
        if (this.candySprites[cell.row][cell.col]) {
          this.candySprites[cell.row][cell.col]!.destroy();
          this.candySprites[cell.row][cell.col] = null;
        }
      });

      // Spawn visual containers for newly created special candies
      explosionResult.spawns.forEach(spawn => {
        const container = this.createCandyContainer(spawn.row, spawn.col, spawn.state);
        container.setScale(0.1);
        this.tweens.add({
          targets: container,
          scale: 1.0,
          duration: 250,
          ease: 'Back.easeOut'
        });
        this.candySprites[spawn.row][spawn.col] = container;
      });

      // Sync state to GameManager
      this.gameManager.state.boardGrid = JSON.parse(JSON.stringify(this.board.grid));

      // Fall & Refill
      const refillResult = this.board.refill();
      
      // Animate refill falling
      this.animateRefill(refillResult, () => {
        // Find if refill created new matches (Cascade!)
        const nextMatches = this.board.findMatches();
        if (nextMatches.length > 0) {
          // Recursive call for next combo step
          this.time.delayedCall(200, () => {
            this.processCascades(nextMatches, comboCount + 1, matchedColorsInSwap, nextChips, nextMult);
          });
        } else {
          // Finalize swap and score calculation
          this.finalizeSwap(nextChips, nextMult, Array.from(matchedColorsInSwap));
        }
      });
    });
  }

  private finalizeSwap(finalAccumulatedChips: number, finalAccumulatedMult: number, colorsMatched: CandyColor[]) {
    // Trigger swap_end Jokers
    const activeJokers = this.gameManager.jokerManager.getJokers();
    const finalResult = ScoringEngine.finalizeSwapScore(
      finalAccumulatedChips,
      finalAccumulatedMult,
      colorsMatched,
      activeJokers,
      this.gameManager.state
    );

    // Display final calculation and write to total score
    this.chipsText.setText(this.formatNumber(finalResult.chips));
    this.multText.setText(this.formatNumber(finalResult.mult));
    
    const finalScore = finalResult.chips * finalResult.mult;
    this.scoringPanelText.setText(this.formatNumber(finalScore));

    if (finalResult.goldAdded > 0) {
      this.gameManager.state.gold += finalResult.goldAdded;
      this.animateGoldGain(finalResult.goldAdded);
    }

    // Animate Joker triggers
    this.animateJokerTriggers(finalResult.triggerMessages);

    // Animate Score Box flying to scoreboard
    this.tweens.add({
      targets: [this.chipsBox, this.multBox],
      scale: 1.15,
      yoyo: true,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Floating text flying to target score
        const floatingScore = this.add.text(this.boardX + 240, 705, `+${this.formatNumber(finalScore)}`, {
          fontFamily: 'Outfit, Roboto, sans-serif',
          fontSize: '28px',
          fontStyle: 'bold',
          color: '#00ffcc',
          shadow: { blur: 15, color: '#00ffcc', fill: true }
        }).setOrigin(0.5);

        this.tweens.add({
          targets: floatingScore,
          x: 180,
          y: 270,
          scale: 0.7,
          alpha: 0.3,
          duration: 800,
          ease: 'Cubic.easeInOut',
          onComplete: () => {
            floatingScore.destroy();
            
            // Add to total
            this.gameManager.state.scoreCurrent += finalScore;
            this.gameManager.state.swapsRemaining -= 1;

            this.updateHUDText();
            this.updateProgressBar();

            // Flash scoreboard
            this.tweens.add({
              targets: this.scoreText,
              scale: 1.2,
              duration: 100,
              yoyo: true,
              ease: 'Quad.easeOut'
            });

            // Reset calculation boxes to 0
            this.chipsText.setText('0');
            this.multText.setText('0');
            this.scoringPanelText.setText('0');

            // Evaluate Win/Loss
            this.checkRoundEndState();
          }
        });
      }
    });
  }

  private checkRoundEndState() {
    if (this.gameManager.state.scoreCurrent >= this.gameManager.state.scoreTarget) {
      // Won!
      this.isProcessing = true;
      this.time.delayedCall(800, () => {
        this.gameManager.endRound(true);
        // Go to shop
        this.scene.start('ShopScene');
      });
    } else if (this.gameManager.state.swapsRemaining <= 0) {
      // Game Over
      this.isProcessing = true;
      this.time.delayedCall(800, () => {
        this.scene.start('GameOverScene');
      });
    } else {
      // Continue playing
      this.isProcessing = false;
    }
  }

  // Visual Refill Slide Down
  private animateRefill(
    refill: {
      falls: { col: number; fromRow: number; toRow: number; color: CandyColor }[];
      spawns: { col: number; toRow: number; color: CandyColor }[];
    },
    onComplete: () => void
  ) {
    let completedTweens = 0;
    const totalTweens = refill.falls.length + refill.spawns.length;

    if (totalTweens === 0) {
      onComplete();
      return;
    }

    const checkComplete = () => {
      completedTweens++;
      if (completedTweens === totalTweens) {
        onComplete();
      }
    };

    // Construct the new state of the sprite grid after falls and spawns
    const newCandySprites: (Phaser.GameObjects.Container | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    // Keep track of which coordinates are falling (meaning they are from positions)
    const fallingFrom = new Set<string>();
    refill.falls.forEach(f => fallingFrom.add(`${f.fromRow},${f.col}`));

    // 1. Copy static candies that didn't move
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sprite = this.candySprites[r][c];
        if (sprite && !fallingFrom.has(`${r},${c}`)) {
          newCandySprites[r][c] = sprite;
        }
      }
    }

    // 2. Setup fall sprites and trigger animations
    refill.falls.forEach(fall => {
      const sprite = this.candySprites[fall.fromRow][fall.col]!;
      newCandySprites[fall.toRow][fall.col] = sprite;
      sprite.setData('row', fall.toRow);

      const startY = this.boardY + fall.fromRow * this.cellSize + this.cellSize / 2;
      const targetY = this.boardY + fall.toRow * this.cellSize + this.cellSize / 2;
      
      sprite.y = startY;

      this.tweens.add({
        targets: sprite,
        y: targetY,
        duration: 350,
        ease: 'Bounce.easeOut',
        onComplete: checkComplete
      });
    });

    // 3. Instantiate spawn sprites and trigger slide down
    refill.spawns.forEach(spawn => {
      // Start higher up based on target row to prevent clipping overlaps
      const startY = this.boardY - this.cellSize - (spawn.toRow * this.cellSize);
      const targetY = this.boardY + spawn.toRow * this.cellSize + this.cellSize / 2;
      
      const state = this.board.grid[spawn.toRow][spawn.col]!;
      const container = this.createCandyContainer(spawn.toRow, spawn.col, state);
      container.y = startY;

      newCandySprites[spawn.toRow][spawn.col] = container;

      this.tweens.add({
        targets: container,
        y: targetY,
        duration: 400,
        delay: Math.random() * 80,
        ease: 'Bounce.easeOut',
        onComplete: checkComplete
      });
    });

    // Update active class state grid
    this.candySprites = newCandySprites;

    // Sync board state back to GameManager
    this.gameManager.state.boardGrid = JSON.parse(JSON.stringify(this.board.grid));
  }

  // Candy explosion particle/fade animations
  private animateCandyExplosion(
    cleared: { row: number; col: number; state: CandyState }[],
    onComplete: () => void
  ) {
    let particlesCount = 0;
    
    cleared.forEach(cell => {
      const sprite = this.candySprites[cell.row][cell.col];
      if (sprite) {
        particlesCount++;
        
        // Emitter/Explosion particles using simple graphics
        const emitter = this.add.graphics();
        emitter.fillStyle(this.getCandyHexColor(cell.state.color), 0.8);
        
        // Spawn 8 mini particles flying in random directions
        const particlesList: { x: number; y: number; dx: number; dy: number }[] = [];
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 4;
          particlesList.push({
            x: sprite.x,
            y: sprite.y,
              dx: Math.cos(angle) * speed,
              dy: Math.sin(angle) * speed
            });
          }

          // Tween the particles
          this.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 250,
            onUpdate: (tween) => {
              const val = (tween.getValue() as number) ?? 0;
              emitter.clear();
              particlesList.forEach(p => {
                p.x += p.dx;
                p.y += p.dy;
                p.dy += 0.15; // gravity
                const size = Phaser.Math.Clamp(5 * (1 - val / 100), 0, 8);
                emitter.fillCircle(p.x, p.y, size);
              });
            },
            onComplete: () => {
              emitter.destroy();
            }
          });

          // Custom special effects for matching candies
          if (cell.state.special === 'striped_h') {
            const laser = this.add.graphics();
            laser.lineStyle(6, 0xffffff, 1);
            laser.strokeLineShape(new Phaser.Geom.Line(
              this.boardX, sprite.y,
              this.boardX + 8 * this.cellSize, sprite.y
            ));
            laser.lineStyle(2, this.getCandyHexColor(cell.state.color), 0.8);
            laser.strokeLineShape(new Phaser.Geom.Line(
              this.boardX, sprite.y,
              this.boardX + 8 * this.cellSize, sprite.y
            ));
            this.tweens.add({
              targets: laser,
              alpha: 0,
              scaleY: 0.1,
              duration: 350,
              onComplete: () => laser.destroy()
            });
          } else if (cell.state.special === 'striped_v') {
            const laser = this.add.graphics();
            laser.lineStyle(6, 0xffffff, 1);
            laser.strokeLineShape(new Phaser.Geom.Line(
              sprite.x, this.boardY,
              sprite.x, this.boardY + 8 * this.cellSize
            ));
            laser.lineStyle(2, this.getCandyHexColor(cell.state.color), 0.8);
            laser.strokeLineShape(new Phaser.Geom.Line(
              sprite.x, this.boardY,
              sprite.x, this.boardY + 8 * this.cellSize
            ));
            this.tweens.add({
              targets: laser,
              alpha: 0,
              scaleX: 0.1,
              duration: 350,
              onComplete: () => laser.destroy()
            });
          } else if (cell.state.special === 'wrapped') {
            const wave = this.add.graphics();
            const color = this.getCandyHexColor(cell.state.color);
            this.tweens.addCounter({
              from: 10,
              to: 120,
              duration: 400,
              onUpdate: (tween) => {
                const radius = tween.getValue() as number;
                const alpha = 1 - (radius - 10) / 110;
                wave.clear();
                wave.lineStyle(4, color, alpha);
                wave.strokeCircle(sprite.x, sprite.y, radius);
              },
              onComplete: () => {
                wave.destroy();
              }
            });
          } else if (cell.state.special === 'color_bomb') {
            const bombColor = cell.state.color;
            const beam = this.add.graphics();
            const targetCoords: { x: number; y: number }[] = [];
            cleared.forEach(otherCell => {
              if (otherCell.state.color === bombColor && (otherCell.row !== cell.row || otherCell.col !== cell.col)) {
                const otherSprite = this.candySprites[otherCell.row][otherCell.col];
                if (otherSprite) {
                  targetCoords.push({ x: otherSprite.x, y: otherSprite.y });
                }
              }
            });
            
            if (targetCoords.length > 0) {
              this.tweens.addCounter({
                from: 0,
                to: 100,
                duration: 350,
                onUpdate: (tween) => {
                  const val = tween.getValue() as number;
                  const alpha = 1 - val / 100;
                  beam.clear();
                  targetCoords.forEach(target => {
                    beam.lineStyle(3, 0xffffff, alpha);
                    const currentX = sprite.x + (target.x - sprite.x) * (val / 100);
                    const currentY = sprite.y + (target.y - sprite.y) * (val / 100);
                    beam.lineBetween(sprite.x, sprite.y, currentX, currentY);
                    
                    beam.lineStyle(1, 0xaa33ff, alpha * 0.7);
                    beam.lineBetween(sprite.x, sprite.y, target.x, target.y);
                  });
                },
                onComplete: () => {
                  beam.destroy();
                }
              });
            }
          }

          // Scale and fade candy out
          this.tweens.add({
            targets: sprite,
            scale: 0.1,
            alpha: 0,
            angle: 180,
            duration: 200,
            onComplete: () => {
              particlesCount--;
              if (particlesCount === 0) {
                onComplete();
              }
            }
          });
        }
      });

    if (particlesCount === 0) {
      onComplete();
    }
  }

  // Accumulate chips and mult values beautifully
  private animateScoreAccumulation(_chipsAdd: number, _multAdd: number, nextChips: number, nextMult: number) {
    // Punch scale effect on boxes
    this.tweens.add({
      targets: this.chipsBox,
      scale: 1.25,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut'
    });

    this.tweens.add({
      targets: this.multBox,
      scale: 1.25,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut'
    });

    this.chipsText.setText(this.formatNumber(nextChips));
    this.multText.setText(this.formatNumber(nextMult));
    this.scoringPanelText.setText(this.formatNumber(nextChips * nextMult));
  }

  // Floating text on Jokers when triggered
  private animateJokerTriggers(messages: { text: string; source: string }[]) {
    messages.forEach((msg, idx) => {
      // Find card container corresponding to the Joker's source name
      const activeJokers = this.gameManager.jokerManager.getJokers();
      const jokerIndex = activeJokers.findIndex(j => j.name === msg.source);
      
      let spawnX = this.boardX + 240;
      let spawnY = 80;

      if (jokerIndex !== -1) {
        spawnX = this.boardX + jokerIndex * 100 + 45;
        spawnY = 150;
      }

      // Stagger spawn of multiple messages
      this.time.delayedCall(idx * 200, () => {
        const floatText = this.add.text(spawnX, spawnY, msg.text, {
          fontFamily: 'Outfit, Roboto, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          color: msg.text.includes('Mult') ? '#ff3355' : msg.text.includes('Chips') ? '#3399ff' : '#ffd700',
          backgroundColor: '#05050f',
          padding: { x: 8, y: 4 },
          shadow: { blur: 5, color: '#000000', fill: true }
        }).setOrigin(0.5);

        // Float up and disappear
        this.tweens.add({
          targets: floatText,
          y: spawnY - 45,
          alpha: 0,
          scale: 1.2,
          duration: 750,
          ease: 'Quad.easeOut',
          onComplete: () => {
            floatText.destroy();
          }
        });

        // Small nudge shake on the card container
        if (jokerIndex !== -1 && this.jokerCards[jokerIndex]) {
          this.tweens.add({
            targets: this.jokerCards[jokerIndex],
            y: 80 + 67 - 10,
            duration: 80,
            yoyo: true,
            ease: 'Bounce.easeOut'
          });
        }
      });
    });
  }

  private animateGoldGain(amount: number) {
    const goldFloat = this.add.text(175, 410, `+$${amount}`, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: goldFloat,
      y: 380,
      alpha: 0,
      scale: 1.4,
      duration: 800,
      onComplete: () => goldFloat.destroy()
    });
  }

  private updateHUDText() {
    this.scoreText.setText(this.formatNumber(this.gameManager.state.scoreCurrent));
    this.targetText.setText(this.formatNumber(this.gameManager.state.scoreTarget));
    this.swapsText.setText(`LƯỢT TRÁO: ${this.gameManager.state.swapsRemaining}`);
    this.goldText.setText(`VÀNG: $${this.gameManager.state.gold}`);
  }

  private updateProgressBar() {
    this.progressBar.clear();
    const pct = Math.min(1.0, this.gameManager.state.scoreCurrent / this.gameManager.state.scoreTarget);
    
    // Bar frame
    this.progressBar.fillStyle(0x1a1a24, 1);
    this.progressBar.fillRoundedRect(45, 305, 260, 12, 6);

    // Bar progress glow fill
    if (pct > 0) {
      const barColor = pct >= 1.0 ? 0x00ffcc : 0xff0055;
      this.progressBar.fillStyle(barColor, 1);
      this.progressBar.fillRoundedRect(45, 305, 260 * pct, 12, 6);
    }
  }

  private getCandyHexColor(color: CandyColor): number {
    const map = {
      red: 0xff3366,
      blue: 0x3399ff,
      green: 0x33cc66,
      yellow: 0xffcc00,
      purple: 0xaa33ff
    };
    return map[color] || 0xffffff;
  }

  private formatNumber(num: number): string {
    return num.toLocaleString();
  }
}
