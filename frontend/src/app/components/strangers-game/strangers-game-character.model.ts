export type StrangerCharacterShape = 'ROUND' | 'TALL' | 'WIDE';

export type AccountGender = 'MALE' | 'FEMALE' | 'ANY' | string | null | undefined;

/** Visual silhouette / gear kit for the SVG avatar renderer. */
export type OutfitLook =
  | 'tee'
  | 'hoodie'
  | 'sport'
  | 'dress'
  | 'sweater'
  | 'jacket'
  | 'tactical'
  | 'tracksuit'
  | 'blazer'
  | 'street-cap';

export type HairStyle = 'short' | 'swept' | 'buzz' | 'ponytail' | 'wavy' | 'bun';

export interface StrangerOutfitOption {
  id: string;
  label: string;
  topColor: string;
  bottomColor: string;
  accentColor: string;
  genders: ('MALE' | 'FEMALE' | 'NEUTRAL')[];
  look: OutfitLook;
  hair: HairStyle;
  accessories?: {
    glasses?: boolean;
    cap?: boolean;
    vest?: boolean;
    gloves?: boolean;
  };
}

export interface StrangersGameCharacter {
  skinColor: string;
  shape: StrangerCharacterShape;
  name: string;
  outfitId: string;
  accountGenderUsed: AccountGender;
  createdAt: string;
  updatedAt: string;
}

export const SKIN_TONE_PRESETS: { id: string; hex: string; label: string }[] = [
  { id: 'tone-1', hex: '#FFDFC4', label: 'Light' },
  { id: 'tone-2', hex: '#F0C8A0', label: 'Warm' },
  { id: 'tone-3', hex: '#D4A574', label: 'Medium' },
  { id: 'tone-4', hex: '#A67C52', label: 'Tan' },
  { id: 'tone-5', hex: '#8D5524', label: 'Brown' },
  { id: 'tone-6', hex: '#5C3D2E', label: 'Deep' },
  { id: 'tone-7', hex: '#3B2314', label: 'Dark' },
  { id: 'tone-8', hex: '#E8B4B8', label: 'Rose' },
];

export const CHARACTER_SHAPES: {
  id: StrangerCharacterShape;
  label: string;
  description: string;
}[] = [
  { id: 'ROUND', label: 'Round', description: 'Friendly & bubbly' },
  { id: 'TALL', label: 'Tall', description: 'Slim & cool' },
  { id: 'WIDE', label: 'Wide', description: 'Bold & strong' },
];

export const OUTFIT_CATALOG: StrangerOutfitOption[] = [
  {
    id: 'casual-m',
    label: 'Casual tee',
    topColor: '#4A90E2',
    bottomColor: '#2C3E50',
    accentColor: '#FFFFFF',
    genders: ['MALE', 'NEUTRAL'],
    look: 'tee',
    hair: 'swept',
  },
  {
    id: 'hoodie-m',
    label: 'Street hoodie',
    topColor: '#6C5CE7',
    bottomColor: '#1A1A2E',
    accentColor: '#FDCB6E',
    genders: ['MALE', 'NEUTRAL'],
    look: 'hoodie',
    hair: 'short',
  },
  {
    id: 'sport-m',
    label: 'Sport kit',
    topColor: '#00B894',
    bottomColor: '#2D3436',
    accentColor: '#FFEAA7',
    genders: ['MALE', 'NEUTRAL'],
    look: 'sport',
    hair: 'buzz',
  },
  {
    id: 'tracksuit-m',
    label: 'Track suit',
    topColor: '#2d3436',
    bottomColor: '#b2bec3',
    accentColor: '#ffffff',
    genders: ['MALE', 'NEUTRAL'],
    look: 'tracksuit',
    hair: 'buzz',
    accessories: { glasses: true },
  },
  {
    id: 'blazer-m',
    label: 'City blazer',
    topColor: '#dfe6e9',
    bottomColor: '#2d3436',
    accentColor: '#636e72',
    genders: ['MALE', 'NEUTRAL'],
    look: 'blazer',
    hair: 'swept',
    accessories: { glasses: true },
  },
  {
    id: 'tactical-m',
    label: 'Tactical street',
    topColor: '#636e72',
    bottomColor: '#2d3436',
    accentColor: '#d63031',
    genders: ['MALE', 'NEUTRAL'],
    look: 'tactical',
    hair: 'short',
    accessories: { vest: true, gloves: true, glasses: true },
  },
  {
    id: 'dress-f',
    label: 'Summer dress',
    topColor: '#FD79A8',
    bottomColor: '#FD79A8',
    accentColor: '#E84393',
    genders: ['FEMALE', 'NEUTRAL'],
    look: 'dress',
    hair: 'wavy',
  },
  {
    id: 'cozy-f',
    label: 'Cozy sweater',
    topColor: '#A29BFE',
    bottomColor: '#636E72',
    accentColor: '#DFE6E9',
    genders: ['FEMALE', 'NEUTRAL'],
    look: 'sweater',
    hair: 'ponytail',
  },
  {
    id: 'sport-f',
    label: 'Active wear',
    topColor: '#FF7675',
    bottomColor: '#2D3436',
    accentColor: '#FFFFFF',
    genders: ['FEMALE', 'NEUTRAL'],
    look: 'sport',
    hair: 'ponytail',
  },
  {
    id: 'street-cap-f',
    label: 'Street cap',
    topColor: '#2d3436',
    bottomColor: '#636e72',
    accentColor: '#74b9ff',
    genders: ['FEMALE', 'NEUTRAL'],
    look: 'street-cap',
    hair: 'ponytail',
    accessories: { glasses: true, cap: true, gloves: true },
  },
  {
    id: 'tactical-f',
    label: 'Tactical chic',
    topColor: '#f5f6fa',
    bottomColor: '#718093',
    accentColor: '#c23616',
    genders: ['FEMALE', 'NEUTRAL'],
    look: 'tactical',
    hair: 'bun',
    accessories: { vest: true, gloves: true, cap: true },
  },
  {
    id: 'uni-tee',
    label: 'Graphic tee',
    topColor: '#F39C12',
    bottomColor: '#3498DB',
    accentColor: '#2ECC71',
    genders: ['MALE', 'FEMALE', 'NEUTRAL'],
    look: 'tee',
    hair: 'short',
  },
  {
    id: 'uni-jacket',
    label: 'Denim jacket',
    topColor: '#5D6D7E',
    bottomColor: '#1B2631',
    accentColor: '#85C1E9',
    genders: ['MALE', 'FEMALE', 'NEUTRAL'],
    look: 'jacket',
    hair: 'swept',
  },
];

export function outfitOptionsForGender(gender: AccountGender): StrangerOutfitOption[] {
  const g = normalizeAccountGender(gender);
  if (g === 'MALE') {
    return OUTFIT_CATALOG.filter((o) => o.genders.includes('MALE') || o.genders.includes('NEUTRAL'));
  }
  if (g === 'FEMALE') {
    return OUTFIT_CATALOG.filter((o) => o.genders.includes('FEMALE') || o.genders.includes('NEUTRAL'));
  }
  return OUTFIT_CATALOG;
}

export function normalizeAccountGender(gender: AccountGender): 'MALE' | 'FEMALE' | 'ANY' {
  if (!gender) {
    return 'ANY';
  }
  const u = String(gender).toUpperCase();
  if (u === 'MALE' || u === 'FEMALE') {
    return u;
  }
  return 'ANY';
}

export function getOutfitById(id: string): StrangerOutfitOption | undefined {
  return OUTFIT_CATALOG.find((o) => o.id === id);
}

/** Soften / deepen a hex for SVG gradients. */
export function shadeHex(hex: string, amount: number): string {
  const raw = (hex || '#888888').replace('#', '');
  if (raw.length !== 6) {
    return hex;
  }
  const n = parseInt(raw, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r + 255 * amount)));
  g = Math.max(0, Math.min(255, Math.round(g + 255 * amount)));
  b = Math.max(0, Math.min(255, Math.round(b + 255 * amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
