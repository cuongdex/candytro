import type { Joker } from '../types/joker';

export const JOKER_DATABASE: Record<string, () => Joker> = {
  sweet_tooth: () => ({
    id: 'sweet_tooth',
    name: 'Kẹo Dẻo Ngọt Ngào',
    description: '+4 Mult vào cuối lượt tráo kẹo.',
    rarity: 'common',
    cost: 4,
    sellValue: 2,
    trigger: (ctx) => {
      if (ctx.triggerType === 'swap_end') {
        return { chips: ctx.chips, mult: ctx.mult + 4, message: '+4 Mult' };
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  ice_mint: () => ({
    id: 'ice_mint',
    name: 'Bạc Hà Mát Lạnh',
    description: '+30 Chips vào cuối lượt tráo kẹo.',
    rarity: 'common',
    cost: 4,
    sellValue: 2,
    trigger: (ctx) => {
      if (ctx.triggerType === 'swap_end') {
        return { chips: ctx.chips + 30, mult: ctx.mult, message: '+30 Chips' };
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  strawberry_blast: () => ({
    id: 'strawberry_blast',
    name: 'Dâu Tây Bùng Nổ',
    description: '+4 Mult cho mỗi viên Kẹo Đỏ nổ.',
    rarity: 'common',
    cost: 5,
    sellValue: 3,
    trigger: (ctx) => {
      if (ctx.triggerType === 'candy' && ctx.candyColor === 'red') {
        return { chips: ctx.chips, mult: ctx.mult + 4, message: '+4 Mult' };
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  blueberry_fizz: () => ({
    id: 'blueberry_fizz',
    name: 'Việt Quất Sủi Bọt',
    description: '+30 Chips cho mỗi viên Kẹo Xanh Dương nổ.',
    rarity: 'common',
    cost: 5,
    sellValue: 3,
    trigger: (ctx) => {
      if (ctx.triggerType === 'candy' && ctx.candyColor === 'blue') {
        return { chips: ctx.chips + 30, mult: ctx.mult, message: '+30 Chips' };
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  grape_soda: () => ({
    id: 'grape_soda',
    name: 'Nho Sủi Cảng',
    description: '+8 Mult cho mỗi nhóm Match Kẹo Tím.',
    rarity: 'common',
    cost: 5,
    sellValue: 3,
    trigger: (ctx) => {
      if (ctx.triggerType === 'match' && ctx.candyColor === 'purple') {
        return { chips: ctx.chips, mult: ctx.mult + 8, message: '+8 Mult' };
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  lemon_squeeze: () => ({
    id: 'lemon_squeeze',
    name: 'Chanh Vắt Vỏ',
    description: '+50 Chips cho mỗi nhóm Match Kẹo Vàng.',
    rarity: 'common',
    cost: 5,
    sellValue: 3,
    trigger: (ctx) => {
      if (ctx.triggerType === 'match' && ctx.candyColor === 'yellow') {
        return { chips: ctx.chips + 50, mult: ctx.mult, message: '+50 Chips' };
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  apple_crisp: () => ({
    id: 'apple_crisp',
    name: 'Táo Giòn Tan',
    description: '+6 Mult cho mỗi nhóm Match Kẹo Xanh Lá.',
    rarity: 'common',
    cost: 5,
    sellValue: 3,
    trigger: (ctx) => {
      if (ctx.triggerType === 'match' && ctx.candyColor === 'green') {
        return { chips: ctx.chips, mult: ctx.mult + 6, message: '+6 Mult' };
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  sugar_rush: () => ({
    id: 'sugar_rush',
    name: 'Cơn Sốt Đường',
    description: '+4 Mult nhân với cấp độ combo cascade trong lượt đi.',
    rarity: 'uncommon',
    cost: 6,
    sellValue: 3,
    trigger: (ctx) => {
      if (ctx.triggerType === 'cascade_end' && ctx.comboCount && ctx.comboCount > 0) {
        const bonus = ctx.comboCount * 4;
        return { chips: ctx.chips, mult: ctx.mult + bonus, message: `+${bonus} Mult` };
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  golden_wrapper: () => ({
    id: 'golden_wrapper',
    name: 'Giấy Gói Vàng',
    description: 'Nhận +$1 Vàng khi tạo Match-4 hoặc Match-5.',
    rarity: 'uncommon',
    cost: 6,
    sellValue: 3,
    trigger: (ctx) => {
      if (ctx.triggerType === 'match' && ctx.matchSize && ctx.matchSize >= 4) {
        return { chips: ctx.chips, mult: ctx.mult, goldAdded: 1, message: '+$1 Vàng' };
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  soda_fountain: () => ({
    id: 'soda_fountain',
    name: 'Vòi Phun Soda',
    description: '+150 Chips khi tạo được chuỗi Match-5.',
    rarity: 'uncommon',
    cost: 7,
    sellValue: 4,
    trigger: (ctx) => {
      if (ctx.triggerType === 'match' && ctx.matchSize && ctx.matchSize >= 5) {
        return { chips: ctx.chips + 150, mult: ctx.mult, message: '+150 Chips' };
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  lucky_candy: () => ({
    id: 'lucky_candy',
    name: 'Kẹo May Mắn',
    description: '1/3 cơ hội được +20 Mult, 1/10 cơ hội được +$3 Vàng mỗi lượt đi.',
    rarity: 'uncommon',
    cost: 6,
    sellValue: 3,
    trigger: (ctx) => {
      if (ctx.triggerType === 'swap_end') {
        let multBonus = 0;
        let goldBonus = 0;
        let msg = '';
        if (Math.random() < 1/3) {
          multBonus = 20;
          msg += '+20 Mult';
        }
        if (Math.random() < 1/10) {
          goldBonus = 3;
          if (msg) msg += ' & ';
          msg += '+$3 Vàng';
        }
        return {
          chips: ctx.chips,
          mult: ctx.mult + multBonus,
          goldAdded: goldBonus > 0 ? goldBonus : undefined,
          message: msg || undefined
        };
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  double_trouble: () => ({
    id: 'double_trouble',
    name: 'Rắc Rối Nhân Đôi',
    description: 'x1.5 Mult nếu cả Kẹo Đỏ và Kẹo Xanh Dương đều nổ trong lượt.',
    rarity: 'rare',
    cost: 8,
    sellValue: 4,
    trigger: (ctx) => {
      if (ctx.triggerType === 'swap_end' && ctx.matchedColors) {
        const hasRed = ctx.matchedColors.includes('red');
        const hasBlue = ctx.matchedColors.includes('blue');
        if (hasRed && hasBlue) {
          return { chips: ctx.chips, mult: Math.round(ctx.mult * 1.5), message: 'x1.5 Mult' };
        }
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  candy_cornucopia: () => ({
    id: 'candy_cornucopia',
    name: 'Kẹo Sung Túc',
    description: 'x2.0 Mult nếu tất cả 5 màu kẹo đều nổ trong lượt đi.',
    rarity: 'rare',
    cost: 10,
    sellValue: 5,
    trigger: (ctx) => {
      if (ctx.triggerType === 'swap_end' && ctx.matchedColors) {
        const uniqueColors = new Set(ctx.matchedColors);
        if (uniqueColors.size === 5) {
          return { chips: ctx.chips, mult: Math.round(ctx.mult * 2.0), message: 'x2.0 Mult' };
        }
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  holographic_foil: () => ({
    id: 'holographic_foil',
    name: 'Giấy Bọc Ba Chiều',
    description: 'x1.4 Mult cho mọi lượt tráo kẹo.',
    rarity: 'rare',
    cost: 8,
    sellValue: 4,
    trigger: (ctx) => {
      if (ctx.triggerType === 'swap_end') {
        return { chips: ctx.chips, mult: Math.round(ctx.mult * 1.4), message: 'x1.4 Mult' };
      }
      return { chips: ctx.chips, mult: ctx.mult };
    }
  }),
  greedy_teeth: () => ({
    id: 'greedy_teeth',
    name: 'Răng Ham Hố',
    description: 'Nhận +$1 Vàng cho mỗi lượt tráo kẹo còn thừa khi thắng màn.',
    rarity: 'common',
    cost: 4,
    sellValue: 2,
    trigger: (ctx) => {
      // Game Manager will evaluate this at level win, but we return neutral on swap.
      return { chips: ctx.chips, mult: ctx.mult };
    }
  })
};

export function getRandomJokerId(): string {
  const ids = Object.keys(JOKER_DATABASE);
  return ids[Math.floor(Math.random() * ids.length)];
}

export function createJokerById(id: string): Joker | null {
  const creator = JOKER_DATABASE[id];
  return creator ? creator() : null;
}
