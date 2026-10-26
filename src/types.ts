export type ShapeType = 'circle' | 'triangle' | 'rect' | 'star';

export interface Vertex {
  x: number;
  y: number;
}

export interface ShapeData {
  id: number;
  type: ShapeType;
  name: string;
  x: number;
  y: number;
  size: number;
  vertices: Vertex[] | null;
  color?: string;
}

export interface StakeData {
  id: number;
  name: string;
  x: number;
  y: number;
  radius: number;
}

export interface TransitionState {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  targetMode: string;
  startTime: number;
  duration: number;
}

export interface PointData {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  trailColor?: string;
  baseSpeed: number;
  speed: number;
  angle: number;
  vx: number;
  vy: number;
  progress: number;
  pathDir: number;
  pathSpeed: number;
  currentPathSpeed: number;
  pauseTimer: number;
  mode: string; // 'free' | 'outline:<shapeId>' | 'inside:<shapeId>'
  transition: TransitionState | null;
  isHovered: boolean;
  isBeingDragged: boolean;
  hasLeash: boolean;
  leashTarget: string; // 'mouse' | 'stake:<id>'
  leashLength: number;
  leashColor?: string;
  trail: { x: number; y: number }[];
}

export interface BoardData {
  id: string;
  name: string;
  points: {
    id: string;
    name: string;
    relX: number;
    relY: number;
    mode: string;
    hasLeash: boolean;
    leashTarget: string;
    leashLength: number;
    color?: string;
    trailColor?: string;
    leashColor?: string;
    radius?: number;
  }[];
  shapes: {
    id: number;
    type: ShapeType;
    name: string;
    relX: number;
    relY: number;
    size: number;
    vertices: Vertex[] | null;
    color?: string;
  }[];
  stakes: {
    id: number;
    name: string;
    relX: number;
    relY: number;
  }[];
  shapeCounter: number;
  stakeCounter: number;
}

export interface SimulationState {
  isRunning: boolean;
  speedMultiplier: number;
  showTrails: boolean;
  showGridCoordinates: boolean;
}

export const POINT_COLOR_PALETTE = [
  { name: 'ブルー', value: '#58a6ff' },
  { name: 'グリーン', value: '#3fb950' },
  { name: 'パープル', value: '#bc8cff' },
  { name: 'ピンク', value: '#f778ba' },
  { name: 'オレンジ', value: '#f0883e' },
  { name: 'イエロー', value: '#d29922' },
  { name: 'レッド', value: '#ff7b72' },
  { name: 'シアン', value: '#39c5bb' },
  { name: 'ホワイト', value: '#f0f6fc' },
] as const;
