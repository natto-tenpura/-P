import { ShapeData, Vertex } from '../types';

export function toMathX(screenX: number, originX: number): number {
  return Math.round(screenX - originX);
}

export function toMathY(screenY: number, originY: number): number {
  return Math.round(originY - screenY);
}

export function toScreenX(mathX: number, originX: number): number {
  return originX + mathX;
}

export function toScreenY(mathY: number, originY: number): number {
  return originY - mathY;
}

export function getStarPoints(cx: number, cy: number, spikes = 5, outerRadius = 100, innerRadius = 45): Vertex[] {
  const step = Math.PI / spikes;
  const pts: Vertex[] = [];
  let rot = -Math.PI / 2;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    pts.push({ x: cx + Math.cos(rot) * r, y: cy + Math.sin(rot) * r });
    rot += step;
  }
  return pts;
}

export function isPointInPoly(pt: Vertex, poly: Vertex[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect = yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getWorldVertices(shape: ShapeData): Vertex[] {
  if (!shape.vertices) return [];
  return shape.vertices.map((v) => ({ x: shape.x + v.x, y: shape.y + v.y }));
}

export function createInitialVertices(type: 'triangle' | 'rect', size: number): Vertex[] {
  if (type === 'triangle') {
    const r = size;
    return [
      { x: 0, y: -r },
      { x: Math.cos(Math.PI / 6) * r, y: Math.sin(Math.PI / 6) * r },
      { x: -Math.cos(Math.PI / 6) * r, y: Math.sin(Math.PI / 6) * r },
    ];
  } else {
    const w = size * 1.6;
    const h = size * 1.2;
    return [
      { x: -w / 2, y: -h / 2 },
      { x: w / 2, y: -h / 2 },
      { x: w / 2, y: h / 2 },
      { x: -w / 2, y: h / 2 },
    ];
  }
}

export function getNextAvailablePointName(existingNames: string[]): string {
  const nameSet = new Set(existingNames);
  // 1. 点P 〜 点Z (P:80 〜 Z:90)
  for (let i = 0; i < 11; i++) {
    const candidate = `点${String.fromCharCode(80 + i)}`;
    if (!nameSet.has(candidate)) return candidate;
  }
  // 2. 点1, 点2, 点3...
  let num = 1;
  while (true) {
    const candidate = `点${num}`;
    if (!nameSet.has(candidate)) return candidate;
    num++;
  }
}
