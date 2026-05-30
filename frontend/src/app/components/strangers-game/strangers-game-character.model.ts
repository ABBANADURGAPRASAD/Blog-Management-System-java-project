export type StrangerCharacterShape = 'ROUND' | 'TALL' | 'WIDE';

export type AccountGender = 'MALE' | 'FEMALE' | 'ANY' | string | null | undefined;

export interface StrangerOutfitOption {
  id: string;
  label: string;
  /** Top / shirt color */
  topColor: string;
  /** Bottom / pants color */
  bottomColor: string;
  /** Accent (shoes, trim) */
  accentColor: string;
  genders: ('MALE' | 'FEMALE' | 'NEUTRAL')[];
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
  },
  {
    id: 'hoodie-m',
    label: 'Street hoodie',
    topColor: '#6C5CE7',
    bottomColor: '#1A1A2E',
    accentColor: '#FDCB6E',
    genders: ['MALE', 'NEUTRAL'],
  },
  {
    id: 'sport-m',
    label: 'Sport kit',
    topColor: '#00B894',
    bottomColor: '#2D3436',
    accentColor: '#FFEAA7',
    genders: ['MALE', 'NEUTRAL'],
  },
  {
    id: 'dress-f',
    label: 'Summer dress',
    topColor: '#FD79A8',
    bottomColor: '#FD79A8',
    accentColor: '#E84393',
    genders: ['FEMALE', 'NEUTRAL'],
  },
  {
    id: 'cozy-f',
    label: 'Cozy sweater',
    topColor: '#A29BFE',
    bottomColor: '#636E72',
    accentColor: '#DFE6E9',
    genders: ['FEMALE', 'NEUTRAL'],
  },
  {
    id: 'sport-f',
    label: 'Active wear',
    topColor: '#FF7675',
    bottomColor: '#2D3436',
    accentColor: '#FFFFFF',
    genders: ['FEMALE', 'NEUTRAL'],
  },
  {
    id: 'uni-tee',
    label: 'Graphic tee',
    topColor: '#F39C12',
    bottomColor: '#3498DB',
    accentColor: '#2ECC71',
    genders: ['MALE', 'FEMALE', 'NEUTRAL'],
  },
  {
    id: 'uni-jacket',
    label: 'Denim jacket',
    topColor: '#5D6D7E',
    bottomColor: '#1B2631',
    accentColor: '#85C1E9',
    genders: ['MALE', 'FEMALE', 'NEUTRAL'],
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
