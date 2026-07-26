export type AvatarGameId =
  | 'chess'
  | 'sketch'
  | 'fact-check'
  | 'money-sense'
  | 'civic-rights'
  | 'critical-cases';

export interface AvatarGameTile {
  id: AvatarGameId;
  title: string;
  blurb: string;
  tag: string;
  theme: string;
  route: string;
}

/** Six hub tiles: Chess + Sketch first, then four 18+ knowledge games. */
export const AVATAR_GAME_TILES: AvatarGameTile[] = [
  {
    id: 'chess',
    title: 'Chess',
    blurb: 'Strangers, friends, or your avatar.',
    tag: 'Board',
    theme: 'chess',
    route: '/avatar-games/chess',
  },
  {
    id: 'sketch',
    title: 'Sketch',
    blurb: 'Draw the word. 30s × 3 rounds.',
    tag: 'Draw',
    theme: 'sketch',
    route: '/avatar-games/sketch',
  },
  {
    id: 'fact-check',
    title: 'Fact Check',
    blurb: 'Spot spin, scams & fake claims (18+).',
    tag: '18+ · Media',
    theme: 'fact',
    route: '/avatar-games/knowledge/fact-check',
  },
  {
    id: 'money-sense',
    title: 'Money Sense',
    blurb: 'Budgets, debt traps & smart choices (18+).',
    tag: '18+ · Finance',
    theme: 'money',
    route: '/avatar-games/knowledge/money-sense',
  },
  {
    id: 'civic-rights',
    title: 'Civic Rights',
    blurb: 'Consent, rights & lawful moves (18+).',
    tag: '18+ · Civic',
    theme: 'civic',
    route: '/avatar-games/knowledge/civic-rights',
  },
  {
    id: 'critical-cases',
    title: 'Critical Cases',
    blurb: 'Judge hard scenarios with reason (18+).',
    tag: '18+ · Logic',
    theme: 'cases',
    route: '/avatar-games/knowledge/critical-cases',
  },
];

export function getAvatarGame(id: string): AvatarGameTile | undefined {
  return AVATAR_GAME_TILES.find((g) => g.id === id);
}
