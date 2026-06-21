import Phaser from 'phaser';
import { createJokerById, getRandomJokerId } from '../core/JokerDb';
import { GameManager } from '../core/GameManager';
import type { CandyColor } from '../types/game';

interface ShopJokerSlot {
  id: string;
  price: number;
  purchased: boolean;
  cardContainer?: Phaser.GameObjects.Container;
}

interface ShopTarotSlot {
  id: string;
  name: string;
  description: string;
  price: number;
  purchased: boolean;
  cardContainer?: Phaser.GameObjects.Container;
}

interface ShopVoucherSlot {
  id: string;
  name: string;
  description: string;
  price: number;
  purchased: boolean;
  cardContainer?: Phaser.GameObjects.Container;
}

export class ShopScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private shopJokers: ShopJokerSlot[] = [];
  private shopTarot: ShopTarotSlot | null = null;
  private shopVoucher: ShopVoucherSlot | null = null;
  
  // Reroll mechanics
  private rerollCost = 2;

  // UI elements
  private goldText!: Phaser.GameObjects.Text;
  private rerollBtnText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;

  // Active inventory cards (for selling)
  private activeJokerCards: Phaser.GameObjects.Container[] = [];

  // Candy upgrades UI
  private candyUpgradeContainers: Phaser.GameObjects.Container[] = [];

  constructor() {
    super('ShopScene');
  }

  create() {
    this.gameManager = GameManager.getInstance();
    const hasDiscount = this.gameManager.state.boughtVouchers.includes('reroll_discount');
    this.rerollCost = hasDiscount ? 1 : 2;

    const { width, height } = this.scale;

    // 1. Background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x06060c, 0x06060c, 0x14051a, 0x14051a, 1);
    bgGraphics.fillRect(0, 0, width, height);

    // Decorative grid
    bgGraphics.lineStyle(1, 0x332244, 0.1);
    for (let x = 0; x < width; x += 40) {
      bgGraphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 40) {
      bgGraphics.lineBetween(0, y, width, y);
    }

    // Header Title
    this.add.text(width / 2, 40, 'CỬA HÀNG BÙA CHÚ', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffd700',
      shadow: { blur: 10, color: '#ffd700', fill: true }
    }).setOrigin(0.5);

    // Display Gold
    this.goldText = this.add.text(width - 50, 40, `VÀNG: $${this.gameManager.state.gold}`, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffd700'
    }).setOrigin(1, 0.5);

    // Message HUD
    this.messageText = this.add.text(width / 2, 90, 'Chào mừng đến Cửa hàng! Hãy mua Joker để gia tăng sức mạnh.', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '14px',
      color: '#888899'
    }).setOrigin(0.5);

    // 2. Render Player Active Jokers (Top portion)
    this.add.text(100, 110, 'Joker Đang Sở Hữu (Bấm để Bán):', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#888899'
    });

    this.rebuildActiveJokers();

    // 3. Generate shop items (2 random Jokers + 1 Tarot Card + 1 Voucher + candy upgrades)
    this.generateShopJokers();
    this.generateShopTarot();
    this.generateShopVoucher();
    this.renderShopItems();

    // 4. Render Reroll Button
    this.createRerollButton();

    // 5. Render Next Round Button
    this.createNextRoundButton();
  }

  private rebuildActiveJokers() {
    this.activeJokerCards.forEach(c => c.destroy());
    this.activeJokerCards = [];

    const startX = 100;
    const startY = 140;
    const spacing = 100;

    const currentJokers = this.gameManager.jokerManager.getJokers();

    currentJokers.forEach((joker, index) => {
      const x = startX + index * spacing + 45;
      const y = startY + 67;

      const container = this.add.container(x, y);

      const cardBg = this.add.image(0, 0, 'joker_card_base');
      
      const border = this.add.graphics();
      const rarityColors = {
        common: 0x888899,
        uncommon: 0x3399ff,
        rare: 0xff00ff
      };
      const color = rarityColors[joker.rarity] || 0xffffff;
      border.lineStyle(2, color, 1);
      border.strokeRoundedRect(-45, -67, 90, 135, 12);

      let shortName = joker.name;
      if (shortName.length > 10) shortName = shortName.substring(0, 9) + '.';

      const nameText = this.add.text(0, -50, shortName, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      const descText = this.add.text(0, 15, joker.description, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '9px',
        color: '#888899',
        align: 'center',
        wordWrap: { width: 80 }
      }).setOrigin(0.5);

      const sellValueText = this.add.text(0, 52, `BÁN: $${joker.sellValue}`, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#ff3366'
      }).setOrigin(0.5);

      container.add([cardBg, border, nameText, descText, sellValueText]);
      container.setSize(90, 135);
      container.setInteractive({ useHandCursor: true });

      // Click to sell
      container.on('pointerdown', () => {
        this.sellActiveJoker(index, joker.name);
      });

      this.activeJokerCards.push(container);
    });
  }

  private sellActiveJoker(index: number, name: string) {
    const value = this.gameManager.jokerManager.sellJoker(index);
    this.gameManager.state.gold += value;
    this.gameManager.state.activeJokers = this.gameManager.jokerManager.getJokerIds();
    
    this.updateGoldUI();
    this.rebuildActiveJokers();
    this.showMessage(`Đã bán ${name} nhận được $${value} vàng!`);
  }

  private generateShopJokers() {
    this.shopJokers = [];
    
    // Choose 2 random cards to offer in the shop
    for (let i = 0; i < 2; i++) {
      const jokerId = getRandomJokerId();
      const tempJoker = createJokerById(jokerId);
      if (tempJoker) {
        this.shopJokers.push({
          id: jokerId,
          price: tempJoker.cost,
          purchased: false
        });
      }
    }
  }

  private renderShopItems() {
    // Destroy previous shop items
    this.shopJokers.forEach(item => {
      if (item.cardContainer) {
        item.cardContainer.destroy();
        item.cardContainer = undefined;
      }
    });

    if (this.shopTarot && this.shopTarot.cardContainer) {
      this.shopTarot.cardContainer.destroy();
      this.shopTarot.cardContainer = undefined;
    }

    if (this.shopVoucher && this.shopVoucher.cardContainer) {
      this.shopVoucher.cardContainer.destroy();
      this.shopVoucher.cardContainer = undefined;
    }

    const startX = 50;
    const startY = 380;
    const spacing = 95;

    // 1. Render Shop Jokers
    this.shopJokers.forEach((item, index) => {
      if (item.purchased) return;

      const joker = createJokerById(item.id)!;
      const x = startX + index * spacing + 45;
      const y = startY + 67;

      const container = this.add.container(x, y);

      const cardBg = this.add.image(0, 0, 'joker_card_base');
      
      const border = this.add.graphics();
      const rarityColors = {
        common: 0x888899,
        uncommon: 0x3399ff,
        rare: 0xff00ff
      };
      const color = rarityColors[joker.rarity] || 0xffffff;
      border.lineStyle(2, color, 1);
      border.strokeRoundedRect(-45, -67, 90, 135, 12);

      let shortName = joker.name;
      if (shortName.length > 10) shortName = shortName.substring(0, 9) + '.';

      const nameText = this.add.text(0, -50, shortName, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      const descText = this.add.text(0, 15, joker.description, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '9px',
        color: '#888899',
        align: 'center',
        wordWrap: { width: 80 }
      }).setOrigin(0.5);

      const priceText = this.add.text(0, 52, `MUA: $${item.price}`, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffd700'
      }).setOrigin(0.5);

      container.add([cardBg, border, nameText, descText, priceText]);
      container.setSize(90, 135);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        container.setScale(1.05);
      });
      container.on('pointerout', () => {
        container.setScale(1.0);
      });

      container.on('pointerdown', () => {
        this.buyJoker(item, index);
      });

      item.cardContainer = container;
    });

    // 2. Render Shop Tarot
    this.renderShopTarot();

    // 3. Render Shop Voucher
    this.renderShopVoucher();

    // 4. Render Candy Upgrades (on the right)
    this.renderCandyUpgrades();
  }

  private renderCandyUpgrades() {
    this.candyUpgradeContainers.forEach(c => c.destroy());
    this.candyUpgradeContainers = [];

    const startX = 460;
    const startY = 380;
    const spacing = 100;

    const colors: { key: CandyColor; label: string; hex: string }[] = [
      { key: 'red', label: 'Đỏ', hex: '#ff3366' },
      { key: 'blue', label: 'Xanh dương', hex: '#3399ff' },
      { key: 'green', label: 'Xanh lá', hex: '#33cc66' },
      { key: 'yellow', label: 'Vàng', hex: '#ffcc00' },
      { key: 'purple', label: 'Tím', hex: '#aa33ff' }
    ];

    colors.forEach((col, index) => {
      const x = startX + index * spacing + 45;
      const y = startY + 67;

      const container = this.add.container(x, y);

      // Card Background outline
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x0e0e15, 0.9);
      cardBg.fillRoundedRect(-45, -67, 90, 135, 12);
      cardBg.lineStyle(1.5, 0x333344, 1);
      cardBg.strokeRoundedRect(-45, -67, 90, 135, 12);

      // Candy Image
      const candyImg = this.add.image(0, -35, `candy_${col.key}`).setScale(0.85);

      const titleText = this.add.text(0, 0, `NÂNG CẤP`, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#888899'
      }).setOrigin(0.5);

      const lvl = this.gameManager.state.candyLevels[col.key];
      const levelText = this.add.text(0, 15, `Cấp ${lvl}`, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: col.hex
      }).setOrigin(0.5);

      const cost = this.gameManager.getCandyUpgradeCost(col.key);
      const costText = this.add.text(0, 48, `Giá: $${cost}`, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffd700'
      }).setOrigin(0.5);

      container.add([cardBg, candyImg, titleText, levelText, costText]);
      container.setSize(90, 135);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        container.setScale(1.05);
      });
      container.on('pointerout', () => {
        container.setScale(1.0);
      });

      container.on('pointerdown', () => {
        this.buyCandyUpgrade(col.key, col.label);
      });

      this.candyUpgradeContainers.push(container);
    });
  }

  private buyJoker(item: ShopJokerSlot, _index: number) {
    if (this.gameManager.state.gold < item.price) {
      this.showMessage('Bạn không có đủ vàng để mua Joker này!');
      return;
    }

    // Try adding to slots
    const success = this.gameManager.jokerManager.addJoker(item.id);
    if (success) {
      this.gameManager.state.gold -= item.price;
      this.gameManager.state.activeJokers = this.gameManager.jokerManager.getJokerIds();
      item.purchased = true;
      
      this.updateGoldUI();
      this.rebuildActiveJokers();
      this.renderShopItems(); // Renders without this card
      this.showMessage(`Đã mua ${createJokerById(item.id)!.name}!`);
    } else {
      this.showMessage('Hết ô chứa Joker trống! Hãy bán Joker cũ trước.');
    }
  }

  private buyCandyUpgrade(color: CandyColor, label: string) {
    const cost = this.gameManager.getCandyUpgradeCost(color);
    if (this.gameManager.state.gold < cost) {
      this.showMessage('Bạn không có đủ vàng để mua nâng cấp kẹo!');
      return;
    }

    const success = this.gameManager.upgradeCandy(color);
    if (success) {
      this.updateGoldUI();
      this.renderCandyUpgrades(); // Redraw levels
      this.showMessage(`Đã nâng cấp Kẹo ${label} lên Cấp ${this.gameManager.state.candyLevels[color]}!`);
    }
  }

  private createRerollButton() {
    const btnW = 200;
    const btnH = 45;
    const btnX = 220 - btnW / 2;
    const btnY = 570;

    const bg = this.add.graphics();
    bg.fillStyle(0x00ffcc, 0.05);
    bg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
    bg.lineStyle(1.5, 0x00ffcc, 0.6);
    bg.strokeRoundedRect(btnX, btnY, btnW, btnH, 8);

    this.rerollBtnText = this.add.text(220, btnY + btnH / 2, `LÀM MỚI SHOP ($${this.rerollCost})`, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#00ffcc'
    }).setOrigin(0.5);

    const area = this.add.zone(220, btnY + btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true });
    
    area.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x00ffcc, 0.15);
      bg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
      bg.lineStyle(1.5, 0x00ffcc, 1);
      bg.strokeRoundedRect(btnX, btnY, btnW, btnH, 8);
    });

    area.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x00ffcc, 0.05);
      bg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
      bg.lineStyle(1.5, 0x00ffcc, 0.6);
      bg.strokeRoundedRect(btnX, btnY, btnW, btnH, 8);
    });

    area.on('pointerdown', () => {
      this.rerollShop();
    });
  }

  private rerollShop() {
    if (this.gameManager.state.gold < this.rerollCost) {
      this.showMessage('Bạn không có đủ vàng để Reroll!');
      return;
    }

    this.gameManager.state.gold -= this.rerollCost;
    this.rerollCost += 1; // Reroll price escalates per shop
    this.updateGoldUI();
    this.rerollBtnText.setText(`LÀM MỚI SHOP ($${this.rerollCost})`);

    // Generate new cards
    this.generateShopJokers();
    this.generateShopTarot();
    this.renderShopItems();
    this.showMessage('Đã làm mới vật phẩm!');
  }

  private createNextRoundButton() {
    const { width } = this.scale;
    const btnW = 200;
    const btnH = 50;
    const btnX = width - 200 - 50;
    const btnY = 570;

    const bg = this.add.graphics();
    bg.fillStyle(0xff0055, 0.1);
    bg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
    bg.lineStyle(2, 0xff0055, 0.8);
    bg.strokeRoundedRect(btnX, btnY, btnW, btnH, 8);

    this.add.text(width - 150, btnY + btnH / 2, 'VÒNG TIẾP THEO', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ff0055'
    }).setOrigin(0.5);

    const area = this.add.zone(width - 150, btnY + btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true });

    area.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xff0055, 0.2);
      bg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
      bg.lineStyle(2, 0xff0055, 1);
      bg.strokeRoundedRect(btnX, btnY, btnW, btnH, 8);
    });

    area.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xff0055, 0.1);
      bg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
      bg.lineStyle(2, 0xff0055, 0.8);
      bg.strokeRoundedRect(btnX, btnY, btnW, btnH, 8);
    });

    area.on('pointerdown', () => {
      // Go to PlayScene
      this.scene.start('PlayScene');
    });
  }

  private generateShopTarot() {
    const tarots = [
      { id: 'devil', name: 'The Devil', description: 'Biến 3 kẹo ngẫu nhiên thành Kẹo Vàng (+Vàng khi nổ)', price: 3 },
      { id: 'lovers', name: 'The Lovers', description: 'Biến 3 kẹo ngẫu nhiên thành Kẹo Thủy Tinh (x2.0 điểm nổ)', price: 3 },
      { id: 'tower', name: 'The Tower', description: 'Biến 3 kẹo ngẫu nhiên thành Kẹo Thép (x1.5 điểm khi giữ trên bảng)', price: 3 },
      { id: 'star', name: 'The Star', description: 'Biến 2 kẹo ngẫu nhiên thành Viền Ánh Kim/Holo/Đa Sắc', price: 3 }
    ];
    const selected = tarots[Math.floor(Math.random() * tarots.length)];
    this.shopTarot = {
      ...selected,
      purchased: false
    };
  }

  private renderShopTarot() {
    if (!this.shopTarot || this.shopTarot.purchased) return;

    const startX = 50;
    const startY = 380;
    
    // Tarot card is at the third slot (index 2)
    const x = startX + 2 * 95 + 45;
    const y = startY + 67;

    const container = this.add.container(x, y);

    const cardBg = this.add.image(0, 0, 'tarot_card_base');
    
    const border = this.add.graphics();
    border.lineStyle(2, 0xaa33ff, 1);
    border.strokeRoundedRect(-45, -67, 90, 135, 12);

    const tarotTag = this.add.text(0, -50, 'TAROT', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#aa33ff'
    }).setOrigin(0.5);

    const nameText = this.add.text(0, -32, this.shopTarot.name, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const descText = this.add.text(0, 15, this.shopTarot.description, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '9px',
      color: '#bfa3ff',
      align: 'center',
      wordWrap: { width: 80 }
    }).setOrigin(0.5);

    const priceText = this.add.text(0, 52, `MUA: $${this.shopTarot.price}`, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);

    container.add([cardBg, border, tarotTag, nameText, descText, priceText]);
    container.setSize(90, 135);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      container.setScale(1.05);
      border.lineStyle(2, 0xdd88ff, 1);
      border.strokeRoundedRect(-45, -67, 90, 135, 12);
    });
    container.on('pointerout', () => {
      container.setScale(1.0);
      border.lineStyle(2, 0xaa33ff, 1);
      border.strokeRoundedRect(-45, -67, 90, 135, 12);
    });

    container.on('pointerdown', () => {
      this.buyTarot();
    });

    this.shopTarot.cardContainer = container;
  }

  private buyTarot() {
    if (!this.shopTarot) return;

    if (this.gameManager.state.gold < this.shopTarot.price) {
      this.showMessage('Bạn không có đủ vàng để mua thẻ bài Tarot này!');
      return;
    }

    this.gameManager.state.gold -= this.shopTarot.price;
    this.shopTarot.purchased = true;
    
    // Apply Tarot effect
    this.applyTarotEffect(this.shopTarot.id);

    if (this.shopTarot.cardContainer) {
      this.shopTarot.cardContainer.destroy();
      this.shopTarot.cardContainer = undefined;
    }

    this.updateGoldUI();
    this.showMessage(`Đã mua và sử dụng ${this.shopTarot.name}!`);
  }

  private applyTarotEffect(tarotId: string) {
    const grid = this.gameManager.state.boardGrid;
    if (!grid) return;

    // Flatten grid to list of { r, c } where cell is not null
    const validCells: { r: number; c: number }[] = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] !== null) {
          validCells.push({ r, c });
        }
      }
    }

    if (validCells.length === 0) return;

    // Helper to shuffle list of cells
    const shuffled = [...validCells].sort(() => Math.random() - 0.5);

    if (tarotId === 'devil') {
      // Upgrade up to 3 candies to Gold
      const targetCount = Math.min(3, shuffled.length);
      for (let i = 0; i < targetCount; i++) {
        const { r, c } = shuffled[i];
        grid[r][c]!.enhancement = 'gold';
      }
    } else if (tarotId === 'lovers') {
      // Upgrade up to 3 candies to Glass
      const targetCount = Math.min(3, shuffled.length);
      for (let i = 0; i < targetCount; i++) {
        const { r, c } = shuffled[i];
        grid[r][c]!.enhancement = 'glass';
      }
    } else if (tarotId === 'tower') {
      // Upgrade up to 3 candies to Steel
      const targetCount = Math.min(3, shuffled.length);
      for (let i = 0; i < targetCount; i++) {
        const { r, c } = shuffled[i];
        grid[r][c]!.enhancement = 'steel';
      }
    } else if (tarotId === 'star') {
      // Upgrade up to 2 candies to foil/holographic/polychrome
      const targetCount = Math.min(2, shuffled.length);
      for (let i = 0; i < targetCount; i++) {
        const { r, c } = shuffled[i];
        const rand = Math.random();
        let ed: 'foil' | 'holographic' | 'polychrome' = 'foil';
        if (rand < 0.5) ed = 'foil';
        else if (rand < 0.85) ed = 'holographic';
        else ed = 'polychrome';
        
        grid[r][c]!.edition = ed;
      }
    }
  }

  private generateShopVoucher() {
    const bought = this.gameManager.state.boughtVouchers || [];
    const pool = [
      { id: 'joker_slot', name: 'Khay Joker +1', description: 'Tăng giới hạn Joker lên tối đa 6 ô vĩnh viễn' },
      { id: 'extra_swap', name: 'Lượt Tráo +1', description: 'Tăng số lượt tráo cơ bản mỗi vòng đấu lên 6' },
      { id: 'reroll_discount', name: 'Mẹo Reroll', description: 'Reroll giảm giá 50% (khởi đầu từ $1 và tăng $1)' }
    ];

    const available = pool.filter(v => !bought.includes(v.id));

    if (available.length > 0) {
      const selected = available[Math.floor(Math.random() * available.length)];
      this.shopVoucher = {
        ...selected,
        price: 10,
        purchased: false
      };
    } else {
      this.shopVoucher = null;
    }
  }

  private renderShopVoucher() {
    if (!this.shopVoucher || this.shopVoucher.purchased) return;

    const startX = 50;
    const startY = 380;
    
    // Voucher card is at the fourth slot (index 3)
    const x = startX + 3 * 95 + 45;
    const y = startY + 67;

    const container = this.add.container(x, y);

    const cardBg = this.add.image(0, 0, 'voucher_card_base');
    
    const border = this.add.graphics();
    border.lineStyle(2, 0x00ffcc, 1);
    border.strokeRoundedRect(-45, -67, 90, 135, 12);

    const voucherTag = this.add.text(0, -50, 'VOUCHER', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#00ffcc'
    }).setOrigin(0.5);

    const nameText = this.add.text(0, -32, this.shopVoucher.name, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const descText = this.add.text(0, 15, this.shopVoucher.description, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '9px',
      color: '#88aacc',
      align: 'center',
      wordWrap: { width: 80 }
    }).setOrigin(0.5);

    const priceText = this.add.text(0, 52, `MUA: $${this.shopVoucher.price}`, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);

    container.add([cardBg, border, voucherTag, nameText, descText, priceText]);
    container.setSize(90, 135);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      container.setScale(1.05);
      border.lineStyle(2, 0xffffff, 1);
      border.strokeRoundedRect(-45, -67, 90, 135, 12);
    });
    container.on('pointerout', () => {
      container.setScale(1.0);
      border.lineStyle(2, 0x00ffcc, 1);
      border.strokeRoundedRect(-45, -67, 90, 135, 12);
    });

    container.on('pointerdown', () => {
      this.buyVoucher();
    });

    this.shopVoucher.cardContainer = container;
  }

  private buyVoucher() {
    if (!this.shopVoucher) return;

    if (this.gameManager.state.gold < this.shopVoucher.price) {
      this.showMessage('Bạn không có đủ vàng để mua Voucher này!');
      return;
    }

    this.gameManager.state.gold -= this.shopVoucher.price;
    this.shopVoucher.purchased = true;
    
    // Save to bought list
    this.gameManager.state.boughtVouchers.push(this.shopVoucher.id);

    // Apply Voucher effect
    if (this.shopVoucher.id === 'joker_slot') {
      this.gameManager.state.maxJokerSlots = 6;
      this.gameManager.jokerManager.maxSlots = 6;
    } else if (this.shopVoucher.id === 'extra_swap') {
      this.gameManager.state.baseSwaps = 6;
    } else if (this.shopVoucher.id === 'reroll_discount') {
      this.rerollCost = Math.max(1, this.rerollCost - 1);
      this.rerollBtnText.setText(`LÀM MỚI SHOP ($${this.rerollCost})`);
    }

    if (this.shopVoucher.cardContainer) {
      this.shopVoucher.cardContainer.destroy();
      this.shopVoucher.cardContainer = undefined;
    }

    this.updateGoldUI();
    this.showMessage(`Đã kích hoạt Voucher ${this.shopVoucher.name}!`);
  }

  private updateGoldUI() {
    this.goldText.setText(`VÀNG: $${this.gameManager.state.gold}`);
  }

  private showMessage(text: string) {
    this.messageText.setText(text).setColor('#00ffcc');
    this.time.delayedCall(3000, () => {
      if (this.messageText.text === text) {
        this.messageText.setText('Hãy mua các thẻ Joker và nâng cấp kẹo phù hợp.').setColor('#888899');
      }
    });
  }
}
