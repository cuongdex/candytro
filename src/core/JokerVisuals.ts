import Phaser from 'phaser';

export type CandyColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

export function createJokerIllustration(scene: Phaser.Scene, jokerId: string): Phaser.GameObjects.GameObject[] {
  const elements: Phaser.GameObjects.GameObject[] = [];
  
  // Center of illustration is at y = -15
  const centerY = -15;

  // Draw card illustration frame/window
  const frame = scene.add.graphics();
  frame.fillStyle(0x0a0a12, 0.7);
  frame.fillRoundedRect(-46, centerY - 28, 92, 56, 8);
  frame.lineStyle(1.5, 0x3d3d5c, 0.9);
  frame.strokeRoundedRect(-46, centerY - 28, 92, 56, 8);
  elements.push(frame);

  // Draw specific graphics based on Joker ID
  if (jokerId === 'sweet_tooth') {
    // Red heart candy with a pink aura
    const aura = scene.add.graphics();
    aura.fillStyle(0xff3366, 0.2);
    aura.fillCircle(0, centerY, 20);
    elements.push(aura);

    const candy = scene.add.image(0, centerY, 'candy_red').setScale(0.65);
    elements.push(candy);
  }
  else if (jokerId === 'ice_mint') {
    // Blue diamond candy with cyan sparkles
    const sparkles = scene.add.graphics();
    sparkles.fillStyle(0x00ffff, 0.85);
    sparkles.fillCircle(22, centerY - 10, 2);
    sparkles.fillCircle(-22, centerY + 10, 2);
    elements.push(sparkles);

    const candy = scene.add.image(0, centerY, 'candy_blue').setScale(0.65);
    elements.push(candy);
  }
  else if (jokerId === 'strawberry_blast') {
    // Red heart candy with explosion lines
    const blast = scene.add.graphics();
    blast.lineStyle(2, 0xff3366, 0.8);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      blast.lineBetween(
        Math.cos(angle) * 14, 
        centerY + Math.sin(angle) * 14, 
        Math.cos(angle) * 24, 
        centerY + Math.sin(angle) * 24
      );
    }
    elements.push(blast);

    const candy = scene.add.image(0, centerY, 'candy_red').setScale(0.65);
    elements.push(candy);
  }
  else if (jokerId === 'blueberry_fizz') {
    // Blue diamond candy with bubbles
    const bubbles = scene.add.graphics();
    bubbles.fillStyle(0xffffff, 0.55);
    bubbles.fillCircle(-14, centerY + 10, 3);
    bubbles.fillCircle(14, centerY - 10, 4);
    bubbles.fillCircle(-8, centerY - 16, 2.5);
    elements.push(bubbles);

    const candy = scene.add.image(0, centerY, 'candy_blue').setScale(0.65);
    elements.push(candy);
  }
  else if (jokerId === 'grape_soda') {
    // Purple hexagon with bubbles
    const fizz = scene.add.graphics();
    fizz.fillStyle(0xaa33ff, 0.25);
    fizz.fillRoundedRect(-15, centerY - 15, 30, 30, 6);
    
    // Draw bubble circles
    fizz.lineStyle(1.5, 0xffffff, 0.6);
    fizz.strokeCircle(-10, centerY + 8, 3.5);
    fizz.strokeCircle(10, centerY - 8, 4.5);
    elements.push(fizz);

    const candy = scene.add.image(0, centerY, 'candy_purple').setScale(0.65);
    elements.push(candy);
  }
  else if (jokerId === 'lemon_squeeze') {
    // Yellow star candy with a squeezed lemon slice
    const lemon = scene.add.graphics();
    lemon.fillStyle(0xffcc00, 0.3);
    lemon.fillCircle(0, centerY, 18);
    lemon.lineStyle(1.5, 0xffcc00, 0.8);
    lemon.strokeCircle(0, centerY, 18);
    
    // Draw slice lines
    lemon.lineBetween(-18, centerY, 18, centerY);
    lemon.lineBetween(0, centerY - 18, 0, centerY + 18);
    elements.push(lemon);

    const candy = scene.add.image(0, centerY, 'candy_yellow').setScale(0.65);
    elements.push(candy);
  }
  else if (jokerId === 'apple_crisp') {
    // Green emerald with sparkling crosses
    const sparkle = scene.add.graphics();
    sparkle.lineStyle(1.5, 0x33cc66, 0.95);
    // Sparkle 1
    sparkle.lineBetween(16, centerY - 10, 24, centerY - 10);
    sparkle.lineBetween(20, centerY - 14, 20, centerY - 6);
    // Sparkle 2
    sparkle.lineBetween(-24, centerY + 10, -16, centerY + 10);
    sparkle.lineBetween(-20, centerY + 6, -20, centerY + 14);
    elements.push(sparkle);

    const candy = scene.add.image(0, centerY, 'candy_green').setScale(0.65);
    elements.push(candy);
  }
  else if (jokerId === 'sugar_rush') {
    // Overlapping red heart, blue diamond, yellow star
    const candy1 = scene.add.image(-12, centerY + 4, 'candy_red').setScale(0.45);
    const candy2 = scene.add.image(12, centerY + 4, 'candy_blue').setScale(0.45);
    const candy3 = scene.add.image(0, centerY - 8, 'candy_yellow').setScale(0.55);
    elements.push(candy1, candy2, candy3);
  }
  else if (jokerId === 'golden_wrapper') {
    // Gold wrapper wrapping a yellow star
    const goldWrap = scene.add.graphics();
    goldWrap.fillStyle(0xffd700, 0.9);
    goldWrap.lineStyle(1.5, 0xffffff, 1);
    
    // Draw wrapper twist tie shapes on the sides
    goldWrap.beginPath();
    goldWrap.moveTo(-16, centerY);
    goldWrap.lineTo(-26, centerY - 12);
    goldWrap.lineTo(-26, centerY + 12);
    goldWrap.closePath();
    goldWrap.fill();
    goldWrap.stroke();
    
    goldWrap.beginPath();
    goldWrap.moveTo(16, centerY);
    goldWrap.lineTo(26, centerY - 12);
    goldWrap.lineTo(26, centerY + 12);
    goldWrap.closePath();
    goldWrap.fill();
    goldWrap.stroke();
    elements.push(goldWrap);

    const candy = scene.add.image(0, centerY, 'candy_yellow').setScale(0.55);
    elements.push(candy);
  }
  else if (jokerId === 'soda_fountain') {
    // Soda cup and straw
    const cup = scene.add.graphics();
    cup.fillStyle(0x00ffcc, 0.8);
    cup.lineStyle(1.5, 0xffffff, 1);
    // Draw cup trapezoid
    cup.beginPath();
    cup.moveTo(-12, centerY + 16);
    cup.lineTo(12, centerY + 16);
    cup.lineTo(16, centerY - 10);
    cup.lineTo(-16, centerY - 10);
    cup.closePath();
    cup.fill();
    cup.stroke();
    
    // Draw lid
    cup.fillStyle(0xffffff, 1);
    cup.fillRect(-18, centerY - 13, 36, 4);
    
    // Draw straw
    cup.lineStyle(3, 0xff3366, 1);
    cup.lineBetween(0, centerY - 12, 10, centerY - 24);
    elements.push(cup);
  }
  else if (jokerId === 'lucky_candy') {
    // Clover background with star candy
    const clover = scene.add.graphics();
    clover.fillStyle(0x33cc66, 0.65);
    clover.lineStyle(1, 0xffffff, 0.5);
    // Draw a basic clover leaf shape (4 circles)
    clover.fillCircle(-8, centerY - 6, 8);
    clover.fillCircle(8, centerY - 6, 8);
    clover.fillCircle(-8, centerY + 6, 8);
    clover.fillCircle(8, centerY + 6, 8);
    elements.push(clover);

    const candy = scene.add.image(0, centerY, 'candy_yellow').setScale(0.55);
    elements.push(candy);
  }
  else if (jokerId === 'double_trouble') {
    // Red heart and Blue diamond side by side
    const candy1 = scene.add.image(-12, centerY, 'candy_red').setScale(0.55);
    const candy2 = scene.add.image(12, centerY, 'candy_blue').setScale(0.55);
    
    // Lightning bolt in the middle
    const bolt = scene.add.graphics();
    bolt.fillStyle(0xffcc00, 1);
    bolt.lineStyle(1, 0xffffff, 0.8);
    bolt.beginPath();
    bolt.moveTo(0, centerY - 15);
    bolt.lineTo(-6, centerY + 2);
    bolt.lineTo(2, centerY + 2);
    bolt.lineTo(0, centerY + 15);
    bolt.lineTo(6, centerY - 2);
    bolt.lineTo(-2, centerY - 2);
    bolt.closePath();
    bolt.fill();
    bolt.stroke();
    
    elements.push(candy1, candy2, bolt);
  }
  else if (jokerId === 'candy_cornucopia') {
    // Cornucopia horn shape spilling multiple tiny candies
    const horn = scene.add.graphics();
    horn.fillStyle(0x8b5a2b, 0.8); // Brown horn
    horn.lineStyle(1.5, 0xd4af37, 1);
    
    // Draw a horn as a simple cone/trapezoid
    horn.beginPath();
    horn.moveTo(18, centerY - 15);
    horn.lineTo(-15, centerY - 8);
    horn.lineTo(-12, centerY + 8);
    horn.lineTo(20, centerY + 15);
    horn.closePath();
    horn.fill();
    horn.stroke();
    
    // Draw opening ellipse
    horn.fillStyle(0x5c3d24, 1);
    horn.fillEllipse(18, centerY, 8, 30);
    horn.strokeEllipse(18, centerY, 8, 30);
    
    elements.push(horn);

    const candy1 = scene.add.image(14, centerY, 'candy_red').setScale(0.35);
    const candy2 = scene.add.image(22, centerY + 6, 'candy_blue').setScale(0.35);
    const candy3 = scene.add.image(20, centerY - 8, 'candy_green').setScale(0.35);
    elements.push(candy1, candy2, candy3);
  }
  else if (jokerId === 'holographic_foil') {
    // Purple hexagon with cool holo rings
    const holo = scene.add.graphics();
    holo.lineStyle(2, 0x00ffff, 0.55);
    holo.strokeCircle(0, centerY, 20);
    holo.lineStyle(2, 0xff00ff, 0.55);
    holo.strokeCircle(0, centerY, 24);
    elements.push(holo);

    const candy = scene.add.image(0, centerY, 'candy_purple').setScale(0.65);
    elements.push(candy);
  }
  else if (jokerId === 'greedy_teeth') {
    // Teeth and wings holding gold coins
    const wings = scene.add.graphics();
    wings.fillStyle(0xffffff, 0.75);
    wings.lineStyle(1, 0xcccccc, 1);
    
    // Draw left and right wings
    wings.fillEllipse(-18, centerY - 6, 12, 24);
    wings.strokeEllipse(-18, centerY - 6, 12, 24);
    wings.fillEllipse(18, centerY - 6, 12, 24);
    wings.strokeEllipse(18, centerY - 6, 12, 24);
    
    // Draw teeth base
    wings.fillStyle(0xeeeeee, 1);
    wings.fillRoundedRect(-8, centerY - 8, 16, 16, 4);
    wings.strokeRoundedRect(-8, centerY - 8, 16, 16, 4);
    
    // Draw gold coin below
    wings.fillStyle(0xffcc00, 1);
    wings.fillCircle(0, centerY + 10, 5);
    wings.lineStyle(1, 0xffffff, 0.8);
    wings.strokeCircle(0, centerY + 10, 5);
    
    elements.push(wings);
  }
  else if (jokerId === 'golden_emperor') {
    // Crown above yellow star candy
    const crown = scene.add.graphics();
    crown.fillStyle(0xffd700, 1);
    crown.lineStyle(1.5, 0xffffff, 1);
    crown.beginPath();
    crown.moveTo(-16, centerY - 8);
    crown.lineTo(-20, centerY - 20);
    crown.lineTo(-8, centerY - 14);
    crown.lineTo(0, centerY - 24);
    crown.lineTo(8, centerY - 14);
    crown.lineTo(20, centerY - 20);
    crown.lineTo(16, centerY - 8);
    crown.closePath();
    crown.fill();
    crown.stroke();
    elements.push(crown);

    const candy = scene.add.image(0, centerY + 4, 'candy_yellow').setScale(0.6);
    elements.push(candy);
  }
  else if (jokerId === 'sour_lemon') {
    // Yellow star candy with sour eyes
    const candy = scene.add.image(0, centerY, 'candy_yellow').setScale(0.65);
    elements.push(candy);

    const face = scene.add.graphics();
    face.lineStyle(2, 0x000000, 0.8);
    // Draw "> <" eyes
    face.lineBetween(-8, centerY - 5, -4, centerY - 2);
    face.lineBetween(-8, centerY + 1, -4, centerY - 2);
    
    face.lineBetween(4, centerY - 2, 8, centerY - 5);
    face.lineBetween(4, centerY - 2, 8, centerY + 1);
    
    // Draw squiggly mouth
    face.lineBetween(-4, centerY + 8, -1, centerY + 6);
    face.lineBetween(-1, centerY + 6, 2, centerY + 8);
    face.lineBetween(2, centerY + 8, 5, centerY + 6);
    elements.push(face);
  }

  return elements;
}

export function createConsumableIllustration(scene: Phaser.Scene, cardId: string, isTarot: boolean): Phaser.GameObjects.GameObject[] {
  const elements: Phaser.GameObjects.GameObject[] = [];
  
  // Center of illustration is at y = -15
  const centerY = -15;

  // Draw card illustration frame/window
  const frame = scene.add.graphics();
  frame.fillStyle(0x05050e, 0.85);
  frame.fillRoundedRect(-52, centerY - 32, 104, 64, 8);
  frame.lineStyle(2, isTarot ? 0xaa33ff : 0x00ffcc, 0.95);
  frame.strokeRoundedRect(-52, centerY - 32, 104, 64, 8);
  elements.push(frame);

  if (isTarot) {
    if (cardId === 'devil') {
      // Devil fire + gold candy
      const fire = scene.add.graphics();
      fire.fillStyle(0xffaa00, 0.25);
      fire.fillCircle(0, centerY, 22);
      
      fire.fillStyle(0xff3300, 0.8);
      fire.beginPath();
      fire.moveTo(-16, centerY + 16);
      fire.lineTo(0, centerY - 20);
      fire.lineTo(16, centerY + 16);
      fire.closePath();
      fire.fill();
      elements.push(fire);

      const candy = scene.add.image(0, centerY + 4, 'candy_yellow').setScale(0.55);
      elements.push(candy);
    }
    else if (cardId === 'lovers') {
      // Lovers ribbon + two heart candies
      const rib = scene.add.graphics();
      rib.lineStyle(3, 0xff3366, 1);
      rib.strokeCircle(0, centerY, 15);
      elements.push(rib);

      const candy1 = scene.add.image(-12, centerY, 'candy_red').setScale(0.55);
      const candy2 = scene.add.image(12, centerY, 'candy_red').setScale(0.55);
      elements.push(candy1, candy2);
    }
    else if (cardId === 'tower') {
      // Steel tower block
      const tower = scene.add.graphics();
      tower.fillStyle(0x777777, 1);
      tower.lineStyle(1.5, 0xffffff, 0.9);
      tower.fillRect(-12, centerY - 16, 24, 32);
      tower.strokeRect(-12, centerY - 16, 24, 32);
      
      // Tower slits/battlements
      tower.fillStyle(0x000000, 1);
      tower.fillRect(-14, centerY - 20, 6, 6);
      tower.fillRect(8, centerY - 20, 6, 6);
      elements.push(tower);
    }
    else if (cardId === 'star') {
      // Big sparkling star
      const glow = scene.add.graphics();
      glow.fillStyle(0x00ffcc, 0.3);
      glow.fillCircle(0, centerY, 24);
      elements.push(glow);

      const candy = scene.add.image(0, centerY, 'candy_yellow').setScale(0.75);
      elements.push(candy);
    }
    else {
      // Default Tarot pack
      const defaultIcon = scene.add.graphics();
      defaultIcon.fillStyle(0xaa33ff, 0.85);
      defaultIcon.fillTriangle(0, centerY - 18, -16, centerY + 12, 16, centerY + 12);
      defaultIcon.lineStyle(1.5, 0xffffff, 1);
      defaultIcon.strokeTriangle(0, centerY - 18, -16, centerY + 12, 16, centerY + 12);
      elements.push(defaultIcon);
    }
  } else {
    // Planet cards
    const rings = scene.add.graphics();
    rings.lineStyle(2, 0xffffff, 0.7);
    rings.strokeEllipse(0, centerY, 48, 12);
    elements.push(rings);

    if (cardId === 'mercury') {
      const candy = scene.add.image(0, centerY, 'candy_red').setScale(0.65);
      elements.push(candy);
    }
    else if (cardId === 'venus') {
      const candy = scene.add.image(0, centerY, 'candy_blue').setScale(0.65);
      elements.push(candy);
    }
    else if (cardId === 'earth') {
      const candy = scene.add.image(0, centerY, 'candy_green').setScale(0.65);
      elements.push(candy);
    }
    else if (cardId === 'mars') {
      const candy = scene.add.image(0, centerY, 'candy_yellow').setScale(0.65);
      elements.push(candy);
    }
    else if (cardId === 'jupiter') {
      const candy = scene.add.image(0, centerY, 'candy_purple').setScale(0.65);
      elements.push(candy);
    }
    else {
      // Default Planet pack
      const pack = scene.add.graphics();
      pack.fillStyle(0x00ffcc, 0.8);
      pack.fillCircle(0, centerY, 15);
      pack.lineStyle(1.5, 0xffffff, 1);
      pack.strokeCircle(0, centerY, 15);
      elements.push(pack);
    }
  }

  return elements;
}
