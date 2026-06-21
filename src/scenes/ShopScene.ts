import Phaser from 'phaser';
import { createJokerById, getRandomJokerId } from '../core/JokerDb';
import { GameManager } from '../core/GameManager';
import type { CandyColor } from '../types/game';
import { AudioManager } from '../core/AudioManager';

interface ShopJokerSlot {
  id: string;
  price: number;
  purchased: boolean;
  edition?: 'standard' | 'foil' | 'holographic' | 'polychrome' | 'negative';
  cardContainer?: Phaser.GameObjects.Container;
}

interface ShopTarotSlot {
  id: string;
  type: 'tarot' | 'pack';
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
      fontSize: '38px',
      fontStyle: 'bold',
      color: '#ffd700',
      shadow: { blur: 10, color: '#ffd700', fill: true }
    }).setOrigin(0.5);

    // Display Gold
    this.goldText = this.add.text(width - 50, 40, `VÀNG: $${this.gameManager.state.gold}`, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffd700'
    }).setOrigin(1, 0.5);

    // Message HUD
    this.messageText = this.add.text(width / 2, 90, 'Chào mừng đến Cửa hàng! Hãy mua Joker để gia tăng sức mạnh.', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '18px',
      color: '#888899'
    }).setOrigin(0.5);

    // 2. Render Player Active Jokers (Top portion)
    this.add.text(100, 110, 'Joker Đang Sở Hữu (Bấm để Bán):', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '20px',
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

    // Add mute button
    AudioManager.addMuteButton(this);
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
        rare: 0xff00ff,
        legendary: 0xffaa00
      };
      const color = rarityColors[joker.rarity] || 0xffffff;
      border.lineStyle(2, color, 1);
      border.strokeRoundedRect(-45, -67, 90, 135, 12);

      if (joker.rarity === 'legendary') {
        this.tweens.add({
          targets: border,
          alpha: 0.4,
          duration: 600,
          yoyo: true,
          repeat: -1
        });
      }

      let shortName = joker.name;
      if (shortName.length > 10) shortName = shortName.substring(0, 9) + '.';

      const nameText = this.add.text(0, -50, shortName, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      const descText = this.add.text(0, 15, joker.description, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '14px',
        color: '#888899',
        align: 'center',
        wordWrap: { width: 80 }
      }).setOrigin(0.5);

      const sellValueText = this.add.text(0, 52, `BÁN: $${joker.sellValue}`, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ff3366'
      }).setOrigin(0.5);

      const editionElements: Phaser.GameObjects.GameObject[] = [];
      if (joker.edition && joker.edition !== 'standard') {
        let edColor = 0xffffff;
        let edLabel = '';
        if (joker.edition === 'foil') {
          edColor = 0xdddddd;
          edLabel = 'FOIL';
        } else if (joker.edition === 'holographic') {
          edColor = 0x33ccff;
          edLabel = 'HOLO';
        } else if (joker.edition === 'polychrome') {
          edColor = 0xff00ff;
          edLabel = 'POLY';
        } else if (joker.edition === 'negative') {
          edColor = 0xff3366;
          edLabel = 'NEG';
        }

        const edBorder = this.add.graphics();
        edBorder.lineStyle(2, edColor, 0.85);
        edBorder.strokeRoundedRect(-47, -69, 94, 139, 14);
        editionElements.push(edBorder);

        const edTxt = this.add.text(0, -35, edLabel, {
          fontFamily: 'Outfit, Roboto, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#' + edColor.toString(16).padStart(6, '0'),
          backgroundColor: '#05050a',
          padding: { x: 3, y: 1 }
        }).setOrigin(0.5);
        editionElements.push(edTxt);

        if (joker.edition === 'polychrome') {
          this.tweens.addCounter({
            from: 0,
            to: 360,
            duration: 2000,
            loop: -1,
            onUpdate: (tween) => {
              if (tween) {
                const hue = (tween.getValue() as number) / 360;
                const colorObj = Phaser.Display.Color.HSLToColor(hue, 1, 0.5);
                if (colorObj) {
                  edBorder.clear();
                  edBorder.lineStyle(2.5, colorObj.color, 1);
                  edBorder.strokeRoundedRect(-47, -69, 94, 139, 14);
                }
              }
            }
          });
        } else if (joker.edition === 'holographic') {
          this.tweens.add({
            targets: edBorder,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
          });
        }
      }

      container.add([cardBg, border, nameText, descText, sellValueText, ...editionElements]);
      container.setSize(90, 135);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        AudioManager.getInstance().playClick();
        container.setScale(1.05);
      });
      container.on('pointerout', () => {
        container.setScale(1.0);
      });

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
    AudioManager.getInstance().playClick();
  }

  private generateShopJokers() {
    this.shopJokers = [];
    
    // Choose 2 random cards to offer in the shop
    for (let i = 0; i < 2; i++) {
      const jokerId = getRandomJokerId();
      const tempJoker = createJokerById(jokerId);
      if (tempJoker) {
        let edition: 'standard' | 'foil' | 'holographic' | 'polychrome' | 'negative' = 'standard';
        let price = tempJoker.cost;
        const rand = Math.random();
        if (rand < 0.85) {
          edition = 'standard';
        } else if (rand < 0.91) {
          edition = 'foil';
          price += 2;
        } else if (rand < 0.95) {
          edition = 'holographic';
          price += 3;
        } else if (rand < 0.98) {
          edition = 'polychrome';
          price += 4;
        } else {
          edition = 'negative';
          price += 5;
        }

        this.shopJokers.push({
          id: jokerId,
          price: price,
          edition: edition,
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
      joker.edition = item.edition || 'standard';
      const x = startX + index * spacing + 45;
      const y = startY + 67;

      const container = this.add.container(x, y);

      const cardBg = this.add.image(0, 0, 'joker_card_base');
      
      const border = this.add.graphics();
      const rarityColors = {
        common: 0x888899,
        uncommon: 0x3399ff,
        rare: 0xff00ff,
        legendary: 0xffaa00
      };
      const color = rarityColors[joker.rarity] || 0xffffff;
      border.lineStyle(2, color, 1);
      border.strokeRoundedRect(-45, -67, 90, 135, 12);

      if (joker.rarity === 'legendary') {
        this.tweens.add({
          targets: border,
          alpha: 0.4,
          duration: 600,
          yoyo: true,
          repeat: -1
        });
      }

      let shortName = joker.name;
      if (shortName.length > 10) shortName = shortName.substring(0, 9) + '.';

      const nameText = this.add.text(0, -50, shortName, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      const descText = this.add.text(0, 15, joker.description, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '14px',
        color: '#888899',
        align: 'center',
        wordWrap: { width: 80 }
      }).setOrigin(0.5);

      const priceText = this.add.text(0, 52, `MUA: $${item.price}`, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffd700'
      }).setOrigin(0.5);

      const editionElements: Phaser.GameObjects.GameObject[] = [];
      if (joker.edition && joker.edition !== 'standard') {
        let edColor = 0xffffff;
        let edLabel = '';
        if (joker.edition === 'foil') {
          edColor = 0xdddddd;
          edLabel = 'FOIL';
        } else if (joker.edition === 'holographic') {
          edColor = 0x33ccff;
          edLabel = 'HOLO';
        } else if (joker.edition === 'polychrome') {
          edColor = 0xff00ff;
          edLabel = 'POLY';
        } else if (joker.edition === 'negative') {
          edColor = 0xff3366;
          edLabel = 'NEG';
        }

        const edBorder = this.add.graphics();
        edBorder.lineStyle(2, edColor, 0.85);
        edBorder.strokeRoundedRect(-47, -69, 94, 139, 14);
        editionElements.push(edBorder);

        const edTxt = this.add.text(0, -35, edLabel, {
          fontFamily: 'Outfit, Roboto, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#' + edColor.toString(16).padStart(6, '0'),
          backgroundColor: '#05050a',
          padding: { x: 3, y: 1 }
        }).setOrigin(0.5);
        editionElements.push(edTxt);

        if (joker.edition === 'polychrome') {
          this.tweens.addCounter({
            from: 0,
            to: 360,
            duration: 2000,
            loop: -1,
            onUpdate: (tween) => {
              if (tween) {
                const hue = (tween.getValue() as number) / 360;
                const colorObj = Phaser.Display.Color.HSLToColor(hue, 1, 0.5);
                if (colorObj) {
                  edBorder.clear();
                  edBorder.lineStyle(2.5, colorObj.color, 1);
                  edBorder.strokeRoundedRect(-47, -69, 94, 139, 14);
                }
              }
            }
          });
        } else if (joker.edition === 'holographic') {
          this.tweens.add({
            targets: edBorder,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
          });
        }
      }

      container.add([cardBg, border, nameText, descText, priceText, ...editionElements]);
      container.setSize(90, 135);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        AudioManager.getInstance().playClick();
        container.setScale(1.08);
        border.clear();
        border.lineStyle(3, 0xffffff, 1);
        border.strokeRoundedRect(-45, -67, 90, 135, 12);
      });
      container.on('pointerout', () => {
        container.setScale(1.0);
        border.clear();
        border.lineStyle(2, color, 1);
        border.strokeRoundedRect(-45, -67, 90, 135, 12);
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
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#888899'
      }).setOrigin(0.5);

      const lvl = this.gameManager.state.candyLevels[col.key];
      const levelText = this.add.text(0, 15, `Cấp ${lvl}`, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: col.hex
      }).setOrigin(0.5);

      const cost = this.gameManager.getCandyUpgradeCost(col.key);
      const costText = this.add.text(0, 48, `Giá: $${cost}`, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffd700'
      }).setOrigin(0.5);

      container.add([cardBg, candyImg, titleText, levelText, costText]);
      container.setSize(90, 135);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        AudioManager.getInstance().playClick();
        container.setScale(1.08);
        cardBg.clear();
        cardBg.fillStyle(0x0e0e15, 0.95);
        cardBg.fillRoundedRect(-45, -67, 90, 135, 12);
        cardBg.lineStyle(2.5, 0xffffff, 1);
        cardBg.strokeRoundedRect(-45, -67, 90, 135, 12);
      });
      container.on('pointerout', () => {
        container.setScale(1.0);
        cardBg.clear();
        cardBg.fillStyle(0x0e0e15, 0.9);
        cardBg.fillRoundedRect(-45, -67, 90, 135, 12);
        cardBg.lineStyle(1.5, 0x333344, 1);
        cardBg.strokeRoundedRect(-45, -67, 90, 135, 12);
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
      AudioManager.getInstance().playClick();
      return;
    }

    // Try adding to slots
    const success = this.gameManager.jokerManager.addJoker(item.id, item.edition);
    if (success) {
      this.gameManager.state.gold -= item.price;
      this.gameManager.state.activeJokers = this.gameManager.jokerManager.getJokerIds();
      item.purchased = true;
      
      this.updateGoldUI();
      this.rebuildActiveJokers();
      this.renderShopItems(); // Renders without this card
      this.showMessage(`Đã mua ${createJokerById(item.id)!.name}!`);
      AudioManager.getInstance().playUpgrade();
    } else {
      this.showMessage('Hết ô chứa Joker trống! Hãy bán Joker cũ trước.');
      AudioManager.getInstance().playClick();
    }
  }

  private buyCandyUpgrade(color: CandyColor, label: string) {
    const cost = this.gameManager.getCandyUpgradeCost(color);
    if (this.gameManager.state.gold < cost) {
      this.showMessage('Bạn không có đủ vàng để mua nâng cấp kẹo!');
      AudioManager.getInstance().playClick();
      return;
    }

    const success = this.gameManager.upgradeCandy(color);
    if (success) {
      this.updateGoldUI();
      this.renderCandyUpgrades(); // Redraw levels
      this.showMessage(`Đã nâng cấp Kẹo ${label} lên Cấp ${this.gameManager.state.candyLevels[color]}!`);
      AudioManager.getInstance().playUpgrade();
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
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#00ffcc'
    }).setOrigin(0.5);

    const area = this.add.zone(220, btnY + btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true });
    
    area.on('pointerover', () => {
      AudioManager.getInstance().playClick();
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
      AudioManager.getInstance().playClick();
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
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ff0055'
    }).setOrigin(0.5);

    const area = this.add.zone(width - 150, btnY + btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true });

    area.on('pointerover', () => {
      AudioManager.getInstance().playClick();
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
      AudioManager.getInstance().playClick();
      // Go to PlayScene
      this.scene.start('PlayScene');
    });
  }

  private generateShopTarot() {
    const rand = Math.random();
    if (rand < 0.4) {
      this.shopTarot = {
        id: 'tarot_pack',
        type: 'pack',
        name: 'Tarot Pack',
        description: 'Mở gói chọn 1 trong 3 thẻ bài Tarot ngẫu nhiên.',
        price: 4,
        purchased: false
      };
    } else if (rand < 0.8) {
      this.shopTarot = {
        id: 'planet_pack',
        type: 'pack',
        name: 'Planet Pack',
        description: 'Mở gói chọn 1 trong 3 thẻ Hành Tinh ngẫu nhiên.',
        price: 4,
        purchased: false
      };
    } else {
      const tarots = [
        { id: 'devil', name: 'The Devil', description: 'Biến 3 kẹo ngẫu nhiên thành Kẹo Vàng (+Vàng khi nổ)', price: 3 },
        { id: 'lovers', name: 'The Lovers', description: 'Biến 3 kẹo ngẫu nhiên thành Kẹo Thủy Tinh (x2.0 điểm nổ)', price: 3 },
        { id: 'tower', name: 'The Tower', description: 'Biến 3 kẹo ngẫu nhiên thành Kẹo Thép (x1.5 điểm khi giữ trên bảng)', price: 3 },
        { id: 'star', name: 'The Star', description: 'Biến 2 kẹo ngẫu nhiên thành Viền Ánh Kim/Holo/Đa Sắc', price: 3 }
      ];
      const selected = tarots[Math.floor(Math.random() * tarots.length)];
      this.shopTarot = {
        ...selected,
        type: 'tarot',
        purchased: false
      };
    }
  }

  private renderShopTarot() {
    if (!this.shopTarot || this.shopTarot.purchased) return;

    const startX = 50;
    const startY = 380;
    
    // Consumable slot is at the third slot (index 2)
    const x = startX + 2 * 95 + 45;
    const y = startY + 67;

    const container = this.add.container(x, y);

    const cardBg = this.add.image(0, 0, 'tarot_card_base');
    
    const border = this.add.graphics();
    const borderColor = this.shopTarot.type === 'pack' ? 0xffaa00 : 0xaa33ff;
    border.lineStyle(2, borderColor, 1);
    border.strokeRoundedRect(-45, -67, 90, 135, 12);

    const tagColor = this.shopTarot.type === 'pack' ? '#ffaa00' : '#aa33ff';
    const tarotTag = this.add.text(0, -50, this.shopTarot.type === 'pack' ? 'BOOSTER' : 'TAROT', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: tagColor
    }).setOrigin(0.5);

    const nameText = this.add.text(0, -32, this.shopTarot.name, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const descText = this.add.text(0, 15, this.shopTarot.description, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '14px',
      color: this.shopTarot.type === 'pack' ? '#ffeedd' : '#bfa3ff',
      align: 'center',
      wordWrap: { width: 80 }
    }).setOrigin(0.5);

    const priceText = this.add.text(0, 52, `MUA: $${this.shopTarot.price}`, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);

    container.add([cardBg, border, tarotTag, nameText, descText, priceText]);
    container.setSize(90, 135);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      AudioManager.getInstance().playClick();
      container.setScale(1.08);
      border.clear();
      border.lineStyle(2, 0xffffff, 1);
      border.strokeRoundedRect(-45, -67, 90, 135, 12);
    });
    container.on('pointerout', () => {
      container.setScale(1.0);
      border.clear();
      border.lineStyle(2, borderColor, 1);
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
      this.showMessage(this.shopTarot.type === 'pack' ? 'Bạn không có đủ vàng để mua Gói bài này!' : 'Bạn không có đủ vàng để mua thẻ bài Tarot này!');
      AudioManager.getInstance().playClick();
      return;
    }

    this.gameManager.state.gold -= this.shopTarot.price;
    this.shopTarot.purchased = true;
    
    // Apply effect or open pack
    if (this.shopTarot.type === 'pack') {
      this.openBoosterPack(this.shopTarot.id);
    } else {
      this.applyTarotEffect(this.shopTarot.id);
    }

    if (this.shopTarot.cardContainer) {
      this.shopTarot.cardContainer.destroy();
      this.shopTarot.cardContainer = undefined;
    }

    this.updateGoldUI();
    this.showMessage(this.shopTarot.type === 'pack' ? `Đã mua ${this.shopTarot.name}!` : `Đã mua và sử dụng ${this.shopTarot.name}!`);
    AudioManager.getInstance().playUpgrade();
  }

  private openBoosterPack(packId: string) {
    const { width, height } = this.scale;
    const modal = this.add.container(0, 0);

    // 1. Semi-transparent blocker background
    const bg = this.add.graphics();
    bg.fillStyle(0x020205, 0.95);
    bg.fillRect(0, 0, width, height);
    modal.add(bg);

    // Blocker zone to prevent underlying clicks
    const zone = this.add.zone(width / 2, height / 2, width, height);
    zone.setInteractive();
    modal.add(zone);

    // 2. Title
    const packName = packId === 'tarot_pack' ? 'GÓI THÈ BÀI PHÉP (TAROT PACK)' : 'GÓI THÈ HÀNH TINH (CELESTIAL PACK)';
    const title = this.add.text(width / 2, 120, packName, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#ffd700',
      shadow: { blur: 10, color: '#ffd700', fill: true }
    }).setOrigin(0.5);
    modal.add(title);

    const subtitle = this.add.text(width / 2, 160, 'CHỌN 1 TRONG 3 LÁ BÀI DƯỚI ĐÂY', {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '18px',
      color: '#888899'
    }).setOrigin(0.5);
    modal.add(subtitle);

    // 3. Generate 3 random cards based on packId
    const cardOptions: any[] = [];
    if (packId === 'tarot_pack') {
      const tarots = [
        { id: 'devil', name: 'The Devil', description: 'Biến 3 kẹo ngẫu nhiên thành Kẹo Vàng (+Vàng khi nổ)', color: 0xaa33ff, isTarot: true },
        { id: 'lovers', name: 'The Lovers', description: 'Biến 3 kẹo ngẫu nhiên thành Kẹo Thủy Tinh (x2.0 điểm nổ)', color: 0xaa33ff, isTarot: true },
        { id: 'tower', name: 'The Tower', description: 'Biến 3 kẹo ngẫu nhiên thành Kẹo Thép (x1.5 điểm khi giữ trên bảng)', color: 0xaa33ff, isTarot: true },
        { id: 'star', name: 'The Star', description: 'Biến 2 kẹo ngẫu nhiên thành Viền Ánh Kim/Holo/Đa Sắc', color: 0xaa33ff, isTarot: true }
      ];
      for (let i = 0; i < 3; i++) {
        cardOptions.push(tarots[Math.floor(Math.random() * tarots.length)]);
      }
    } else {
      const planets = [
        { id: 'mercury', name: 'Sao Thủy (Mercury)', description: 'Nâng cấp Kẹo Đỏ lên +1 Cấp độ', color: 0xff3366, isPlanet: true, candyColor: 'red', label: 'Đỏ' },
        { id: 'venus', name: 'Sao Kim (Venus)', description: 'Nâng cấp Kẹo Xanh Dương lên +1 Cấp độ', color: 0x3399ff, isPlanet: true, candyColor: 'blue', label: 'Xanh dương' },
        { id: 'earth', name: 'Trái Đất (Earth)', description: 'Nâng cấp Kẹo Xanh Lá lên +1 Cấp độ', color: 0x33cc66, isPlanet: true, candyColor: 'green', label: 'Xanh lá' },
        { id: 'mars', name: 'Sao Hỏa (Mars)', description: 'Nâng cấp Kẹo Vàng lên +1 Cấp độ', color: 0xffcc00, isPlanet: true, candyColor: 'yellow', label: 'Vàng' },
        { id: 'jupiter', name: 'Sao Mộc (Jupiter)', description: 'Nâng cấp Kẹo Tím lên +1 Cấp độ', color: 0xaa33ff, isPlanet: true, candyColor: 'purple', label: 'Tím' }
      ];
      for (let i = 0; i < 3; i++) {
        cardOptions.push(planets[Math.floor(Math.random() * planets.length)]);
      }
    }

    // 4. Render cards
    const startX = width / 2 - 200;
    const spacing = 200;
    const cardY = height / 2;

    cardOptions.forEach((card, index) => {
      const x = startX + index * spacing;
      const y = cardY;

      const cardContainer = this.add.container(x, y);

      // Card Base BG
      const bgImg = this.add.image(0, 0, card.isTarot ? 'tarot_card_base' : 'joker_card_base');
      
      const border = this.add.graphics();
      border.lineStyle(2.5, card.color, 1);
      border.strokeRoundedRect(-70, -100, 140, 200, 15);

      const tagText = card.isTarot ? 'TAROT' : 'PLANET';
      const typeText = this.add.text(0, -80, tagText, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#' + card.color.toString(16).padStart(6, '0')
      }).setOrigin(0.5);

      const nameText = this.add.text(0, -50, card.name, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 120 }
      }).setOrigin(0.5);

      const descText = this.add.text(0, 15, card.description, {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '15px',
        color: '#ddddff',
        align: 'center',
        wordWrap: { width: 120 }
      }).setOrigin(0.5);

      const useText = this.add.text(0, 75, 'CHỌN LÁ BÀI', {
        fontFamily: 'Outfit, Roboto, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#00ffcc'
      }).setOrigin(0.5);

      cardContainer.add([bgImg, border, typeText, nameText, descText, useText]);
      cardContainer.setSize(140, 200);
      cardContainer.setInteractive({ useHandCursor: true });

      // Hover animations
      cardContainer.on('pointerover', () => {
        AudioManager.getInstance().playClick();
        cardContainer.setScale(1.08);
        border.clear();
        border.lineStyle(3.5, 0xffffff, 1);
        border.strokeRoundedRect(-70, -100, 140, 200, 15);
      });

      cardContainer.on('pointerout', () => {
        cardContainer.setScale(1.0);
        border.clear();
        border.lineStyle(2.5, card.color, 1);
        border.strokeRoundedRect(-70, -100, 140, 200, 15);
      });

      // Apply effect on select
      cardContainer.on('pointerdown', () => {
        AudioManager.getInstance().playUpgrade();
        if (card.isTarot) {
          this.applyTarotEffect(card.id);
          this.showMessage(`Đã kích hoạt lá bài Tarot: ${card.name}!`);
        } else {
          this.gameManager.state.candyLevels[card.candyColor as CandyColor] += 1;
          this.renderCandyUpgrades(); // Redraw levels
          this.showMessage(`Đã nâng cấp Kẹo ${card.label} lên Cấp ${this.gameManager.state.candyLevels[card.candyColor as CandyColor]}!`);
        }
        
        modal.destroy();
      });

      modal.add(cardContainer);
    });
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
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#00ffcc'
    }).setOrigin(0.5);

    const nameText = this.add.text(0, -32, this.shopVoucher.name, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const descText = this.add.text(0, 15, this.shopVoucher.description, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '14px',
      color: '#88aacc',
      align: 'center',
      wordWrap: { width: 80 }
    }).setOrigin(0.5);

    const priceText = this.add.text(0, 52, `MUA: $${this.shopVoucher.price}`, {
      fontFamily: 'Outfit, Roboto, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);

    container.add([cardBg, border, voucherTag, nameText, descText, priceText]);
    container.setSize(90, 135);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      AudioManager.getInstance().playClick();
      container.setScale(1.08);
      border.clear();
      border.lineStyle(2.5, 0xffffff, 1);
      border.strokeRoundedRect(-45, -67, 90, 135, 12);
    });
    container.on('pointerout', () => {
      container.setScale(1.0);
      border.clear();
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
      AudioManager.getInstance().playClick();
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
    AudioManager.getInstance().playUpgrade();
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
