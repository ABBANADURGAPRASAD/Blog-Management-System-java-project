/**
 * Avatar City map — grid of constant districts + ownable buildings.
 * Roads form a proper street grid; spawn defaults to city center.
 */

export type CityPlaceId =
  | 'park'
  | 'meetup'
  | 'mall'
  | 'transit'
  | 'center'
  | 'homes'
  | 'harbor'
  | 'expansion';

export type CityPlaceKind =
  | 'park'
  | 'transit'
  | 'mall'
  | 'meetup'
  | 'center'
  | 'homes'
  | 'harbor'
  | 'expansion';

export interface CityPlace {
  id: CityPlaceId;
  kind: CityPlaceKind;
  name: string;
  blurb: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: string;
  /** Hidden until city expands (more owners). */
  unlockAtOwners?: number;
}

export interface CityRoad {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Ownable plot — one user can adopt exactly one. */
export interface OwnableBuilding {
  id: string;
  label: string;
  district: CityPlaceId;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  roof: string;
  /** Door / spawn standing point (in front of building). */
  spawnX: number;
  spawnY: number;
  /** Unlocks with city growth. */
  unlockAtOwners?: number;
}

export interface CityObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Base world — expands when more buildings unlock. */
export const CITY_WORLD = { width: 3600, height: 2800 };

/** Default spawn: clear plaza south of the fountain (not inside obstacles). */
export const CITY_CENTER = { x: 1800, y: 1560 };

const ROAD = 110;

/**
 * Block layout (districts sit in cells; roads between):
 *
 *   [ PARK  ]═[ MEETUP ]═[ MALL   ]
 *   ════════╬══════════╬═════════
 *   [ HOMES ]═[ CENTER ]═[ HARBOR ]
 *   ════════╬══════════╬═════════
 *   [TRANSIT]═[ HOMES2 ]═[ EXPAND ]
 */
export const CITY_PLACES: CityPlace[] = [
  {
    id: 'park',
    kind: 'park',
    name: 'City Park',
    blurb: 'Trees, pond, and open grass — always here.',
    x: 80,
    y: 80,
    w: 980,
    h: 780,
    tone: '#7dce82',
  },
  {
    id: 'meetup',
    kind: 'meetup',
    name: 'Meetup Plaza',
    blurb: 'Gather with friends and followers.',
    x: 80 + 980 + ROAD,
    y: 80,
    w: 980,
    h: 780,
    tone: '#cdb4db',
  },
  {
    id: 'mall',
    kind: 'mall',
    name: 'City Mall',
    blurb: 'Shops, cafe, and glass atriums.',
    x: 80 + 2 * (980 + ROAD),
    y: 80,
    w: 980,
    h: 780,
    tone: '#f4a261',
  },
  {
    id: 'homes',
    kind: 'homes',
    name: 'Home Blocks',
    blurb: 'Adopt a house — it becomes your spawn.',
    x: 80,
    y: 80 + 780 + ROAD,
    w: 980,
    h: 780,
    tone: '#e9c46a',
  },
  {
    id: 'center',
    kind: 'center',
    name: 'City Center',
    blurb: 'Default start for every traveler.',
    x: 80 + 980 + ROAD,
    y: 80 + 780 + ROAD,
    w: 980,
    h: 780,
    tone: '#b8c0cc',
  },
  {
    id: 'harbor',
    kind: 'harbor',
    name: 'Harbor Walk',
    blurb: 'Waterfront benches and boats.',
    x: 80 + 2 * (980 + ROAD),
    y: 80 + 780 + ROAD,
    w: 980,
    h: 780,
    tone: '#4d9de0',
  },
  {
    id: 'transit',
    kind: 'transit',
    name: 'Bus & Railway',
    blurb: 'Station platforms and city buses.',
    x: 80,
    y: 80 + 2 * (780 + ROAD),
    w: 980,
    h: 780,
    tone: '#8ecae6',
  },
  {
    id: 'expansion',
    kind: 'expansion',
    name: 'New District',
    blurb: 'Unlocks as more citizens adopt homes.',
    x: 80 + 2 * (980 + ROAD),
    y: 80 + 2 * (780 + ROAD),
    w: 980,
    h: 780,
    tone: '#90be6d',
    unlockAtOwners: 2,
  },
];

/** Street grid between the 3×3 blocks. */
export const CITY_ROADS: CityRoad[] = (() => {
  const roads: CityRoad[] = [];
  const cell = 980;
  const origin = 80;
  const cols = 3;
  const rows = 3;
  // Vertical roads
  for (let c = 0; c < cols - 1; c++) {
    const x = origin + (c + 1) * cell + c * ROAD;
    roads.push({
      x,
      y: origin,
      w: ROAD,
      h: rows * cell + (rows - 1) * ROAD,
    });
  }
  // Horizontal roads
  for (let r = 0; r < rows - 1; r++) {
    const y = origin + (r + 1) * cell + r * ROAD;
    roads.push({
      x: origin,
      y,
      w: cols * cell + (cols - 1) * ROAD,
      h: ROAD,
    });
  }
  // Ring boulevard around city
  roads.push({ x: 20, y: 20, w: CITY_WORLD.width - 40, h: 40 });
  roads.push({ x: 20, y: CITY_WORLD.height - 60, w: CITY_WORLD.width - 40, h: 40 });
  roads.push({ x: 20, y: 20, w: 40, h: CITY_WORLD.height - 40 });
  roads.push({ x: CITY_WORLD.width - 60, y: 20, w: 40, h: CITY_WORLD.height - 40 });
  return roads;
})();

function house(
  id: string,
  district: CityPlaceId,
  x: number,
  y: number,
  color: string,
  roof: string,
  label: string,
  unlockAtOwners?: number
): OwnableBuilding {
  const w = 120;
  const h = 110;
  return {
    id,
    label,
    district,
    x,
    y,
    w,
    h,
    color,
    roof,
    spawnX: x + w / 2,
    spawnY: y + h + 28,
    unlockAtOwners,
  };
}

/** Ownable homes / shops — one per user. */
export const OWNABLE_BUILDINGS: OwnableBuilding[] = [
  // Home blocks (testing: 2 users can claim first two)
  house('home-a1', 'homes', 160, 1080, '#90e0ef', '#0077b6', 'House A1'),
  house('home-a2', 'homes', 340, 1080, '#ffb703', '#fb8500', 'House A2'),
  house('home-a3', 'homes', 520, 1080, '#e9c46a', '#e76f51', 'House A3'),
  house('home-a4', 'homes', 700, 1080, '#80ed99', '#2d6a4f', 'House A4'),
  house('home-b1', 'homes', 160, 1320, '#bde0fe', '#3a86ff', 'House B1'),
  house('home-b2', 'homes', 340, 1320, '#f4a261', '#e76f51', 'House B2'),
  house('home-b3', 'homes', 520, 1320, '#ff99c8', '#c9184a', 'House B3'),
  house('home-b4', 'homes', 700, 1320, '#caf0f8', '#0077b6', 'House B4'),
  // Mall shops (also ownable)
  house('mall-cafe', 'mall', 2360, 220, '#faedcd', '#d4a373', 'Cafe'),
  house('mall-books', 'mall', 2580, 220, '#caf0f8', '#0077b6', 'Books'),
  house('mall-gear', 'mall', 2800, 220, '#d8f3dc', '#2d6a4f', 'Gear'),
  house('mall-arcade', 'mall', 2460, 420, '#ffc8dd', '#c9184a', 'Arcade'),
  // Expansion district (unlocks after 2 owners — grows with users)
  house('exp-1', 'expansion', 2360, 2060, '#ffe5ec', '#ff8fab', 'Villa 1', 2),
  house('exp-2', 'expansion', 2580, 2060, '#e2ece9', '#6d6875', 'Villa 2', 2),
  house('exp-3', 'expansion', 2800, 2060, '#fde2e4', '#f28482', 'Villa 3', 4),
  house('exp-4', 'expansion', 2460, 2280, '#cdb4db', '#7b2cbf', 'Villa 4', 4),
];

/** Non-ownable scenery / stations (collision). */
export const CITY_SCENERY: CityObstacle[] = [
  // Park pond + trees
  { x: 220, y: 220, w: 160, h: 120 },
  { x: 480, y: 180, w: 90, h: 80 },
  { x: 680, y: 320, w: 100, h: 90 },
  { x: 300, y: 480, w: 80, h: 80 },
  // Meetup gazebo
  { x: 1380, y: 280, w: 180, h: 140 },
  { x: 1680, y: 400, w: 140, h: 120 },
  // Mall atrium walls
  { x: 2360, y: 560, w: 400, h: 80 },
  // Center fountain (north of default spawn)
  { x: 1740, y: 1160, w: 120, h: 100 },
  // Harbor docks
  { x: 2400, y: 1120, w: 200, h: 70 },
  { x: 2700, y: 1200, w: 220, h: 70 },
  // Transit rail + bus depot
  { x: 160, y: 2060, w: 720, h: 70 },
  { x: 200, y: 2220, w: 180, h: 90 },
  { x: 420, y: 2220, w: 180, h: 90 },
];

export function getOwnableById(id: string): OwnableBuilding | undefined {
  return OWNABLE_BUILDINGS.find((b) => b.id === id);
}

export function unlockedBuildings(ownerCount: number): OwnableBuilding[] {
  return OWNABLE_BUILDINGS.filter((b) => (b.unlockAtOwners ?? 0) <= ownerCount);
}

export function unlockedPlaces(ownerCount: number): CityPlace[] {
  return CITY_PLACES.filter((p) => (p.unlockAtOwners ?? 0) <= ownerCount);
}

export function placeAt(x: number, y: number, ownerCount = 99): CityPlace | null {
  const places = unlockedPlaces(ownerCount);
  for (let i = places.length - 1; i >= 0; i--) {
    const p = places[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
      return p;
    }
  }
  return null;
}

export function nearBuilding(
  x: number,
  y: number,
  building: OwnableBuilding,
  radius = 70
): boolean {
  const dx = x - building.spawnX;
  const dy = y - building.spawnY;
  return dx * dx + dy * dy <= radius * radius;
}

export function hitsObstacle(
  x: number,
  y: number,
  avatarW = 36,
  avatarH = 28,
  buildings: OwnableBuilding[] = OWNABLE_BUILDINGS
): boolean {
  const left = x - avatarW / 2;
  const right = x + avatarW / 2;
  const top = y - avatarH / 2;
  const bottom = y + avatarH / 2;
  const hit = (bx: number, by: number, bw: number, bh: number) =>
    !(right < bx || left > bx + bw || bottom < by || top > by + bh);

  for (const s of CITY_SCENERY) {
    if (hit(s.x, s.y, s.w, s.h)) return true;
  }
  for (const b of buildings) {
    if (hit(b.x, b.y, b.w, b.h)) return true;
  }
  return false;
}

/** True when two avatars are close enough to chat. */
export function nearPlayer(
  x: number,
  y: number,
  ox: number,
  oy: number,
  radius = 90
): boolean {
  const dx = x - ox;
  const dy = y - oy;
  return dx * dx + dy * dy <= radius * radius;
}

/** @deprecated use hitsObstacle */
export function hitsBuilding(x: number, y: number, avatarW = 36, avatarH = 28): boolean {
  return hitsObstacle(x, y, avatarW, avatarH);
}
