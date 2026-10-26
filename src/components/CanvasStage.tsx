import React, { useEffect, useRef, useCallback } from 'react';
import { PointData, ShapeData, StakeData, SimulationState } from '../types';
import {
  toMathX,
  toMathY,
  getStarPoints,
  isPointInPoly,
  getWorldVertices,
} from '../utils/math';

interface CanvasStageProps {
  points: PointData[];
  shapes: ShapeData[];
  stakes: StakeData[];
  simulationState: SimulationState;
  searchQuery: string;
  onPointsUpdate: (updater: (prev: PointData[]) => PointData[]) => void;
  onShapesUpdate: (updater: (prev: ShapeData[]) => ShapeData[]) => void;
  onStakesUpdate: (updater: (prev: StakeData[]) => StakeData[]) => void;
  onPointNameChangePrompt: (point: PointData) => void;
  onHoverCoordsChange: (coords: { x: number; y: number } | null) => void;
  onSaveState: () => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  points,
  shapes,
  stakes,
  simulationState,
  searchQuery,
  onPointsUpdate,
  onShapesUpdate,
  onStakesUpdate,
  onPointNameChangePrompt,
  onHoverCoordsChange,
  onSaveState,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Use refs for animation loop to avoid stutter and unnecessary re-creations
  const pointsRef = useRef(points);
  pointsRef.current = points;

  const shapesRef = useRef(shapes);
  shapesRef.current = shapes;

  const stakesRef = useRef(stakes);
  stakesRef.current = stakes;

  const simStateRef = useRef(simulationState);
  simStateRef.current = simulationState;

  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const draggingObjRef = useRef<{ type: 'point' | 'stake' | 'shape'; id: string | number } | null>(null);
  const draggingVertexRef = useRef<{ shapeId: number; index: number } | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);

  // Resize canvas according to window size
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main animation and physics loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const originX = width / 2;
      const originY = height / 2;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Grid and Mathematical Coordinates
      const gridSize = 50;
      ctx.lineWidth = 0.5;

      // Sub-grid lines
      for (let x = originX % gridSize; x <= width; x += gridSize) {
        ctx.strokeStyle = Math.abs(x - originX) < 1 ? 'rgba(88, 166, 255, 0.4)' : 'rgba(255, 255, 255, 0.04)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = originY % gridSize; y <= height; y += gridSize) {
        ctx.strokeStyle = Math.abs(y - originY) < 1 ? 'rgba(88, 166, 255, 0.4)' : 'rgba(255, 255, 255, 0.04)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Main Axes X and Y
      ctx.strokeStyle = 'rgba(88, 166, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, height);
      ctx.stroke();

      // Axis labels
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#58a6ff';
      ctx.fillText('O (0,0)', originX + 8, originY + 18);
      ctx.fillText('X', width - 24, originY - 8);
      ctx.fillText('Y', originX + 8, 24);

      // Coordinate tick labels
      if (simStateRef.current.showGridCoordinates) {
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        for (let x = originX + 100; x < width; x += 100) {
          ctx.fillText(`${toMathX(x, originX)}`, x - 10, originY + 14);
        }
        for (let x = originX - 100; x > 0; x -= 100) {
          ctx.fillText(`${toMathX(x, originX)}`, x - 14, originY + 14);
        }
        for (let y = originY - 100; y > 0; y -= 100) {
          ctx.fillText(`${toMathY(y, originY)}`, originX + 6, y + 4);
        }
        for (let y = originY + 100; y < height; y += 100) {
          ctx.fillText(`${toMathY(y, originY)}`, originX + 6, y + 4);
        }
      }

      // Mouse Crosshair Guides & Live Coordinate Pill
      const mouse = mouseRef.current;
      if (mouse.x !== null && mouse.y !== null) {
        ctx.strokeStyle = 'rgba(240, 136, 62, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(mouse.x, 0);
        ctx.lineTo(mouse.x, height);
        ctx.moveTo(0, mouse.y);
        ctx.lineTo(width, mouse.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '11px monospace';
        ctx.fillStyle = 'rgba(240, 136, 62, 0.95)';
        ctx.fillText(`(${toMathX(mouse.x, originX)}, ${toMathY(mouse.y, originY)})`, mouse.x + 12, mouse.y - 12);
      }

      // 2. Draw Shapes
      const currentShapes = shapesRef.current;
      currentShapes.forEach((s) => {
        const shapeColor = s.color || '#58a6ff';
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = `${shapeColor}99`;
        ctx.fillStyle = `${shapeColor}14`;

        if (s.type === 'circle') {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (s.type === 'star') {
          const pts = getStarPoints(s.x, s.y, 5, s.size, s.size * 0.45);
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (s.vertices) {
          const wpts = getWorldVertices(s);
          if (wpts.length > 0) {
            ctx.beginPath();
            ctx.moveTo(wpts[0].x, wpts[0].y);
            for (let i = 1; i < wpts.length; i++) ctx.lineTo(wpts[i].x, wpts[i].y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Draw vertex drag handles
            wpts.forEach((pt) => {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
              ctx.fillStyle = shapeColor;
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            });
          }
        }

        // Shape Center Drag & Name Indicator
        ctx.font = '11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = `${shapeColor}ee`;
        ctx.fillText(`✛ ${s.name}`, s.x - 20, s.y - s.size - 10);
      });

      // 3. Draw Stakes (杭)
      const currentStakes = stakesRef.current;
      currentStakes.forEach((stk) => {
        ctx.beginPath();
        ctx.arc(stk.x, stk.y, stk.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#8957e5';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(stk.x, stk.y, stk.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(137, 87, 229, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(stk.x, stk.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.font = '11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#d2a8ff';
        ctx.fillText(`📍 ${stk.name}`, stk.x - 14, stk.y - 16);
      });

      // 4. Update & Draw Points
      const currentPoints = pointsRef.current;
      const sim = simStateRef.current;
      const isSimRunning = sim.isRunning;
      const speedMult = sim.speedMultiplier;
      const query = searchQueryRef.current.trim().toLowerCase();

      currentPoints.forEach((p) => {
        // Physics update (only when running or during drag)
        if (isSimRunning && !p.isBeingDragged) {
          // Check hover
          if (mouse.x !== null && mouse.y !== null) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            if (Math.hypot(dx, dy) < 35) {
              p.isHovered = true;
            } else {
              p.isHovered = false;
            }
          } else {
            p.isHovered = false;
          }

          if (!p.isHovered) {
            // Leash Constraint
            if (p.hasLeash) {
              let anchor: { x: number; y: number } | null = null;
              if (p.leashTarget === 'mouse') {
                if (mouse.x !== null && mouse.y !== null) {
                  anchor = { x: mouse.x, y: mouse.y };
                }
              } else if (p.leashTarget.startsWith('stake:')) {
                const sId = parseInt(p.leashTarget.split(':')[1], 10);
                const stake = currentStakes.find((s) => s.id === sId);
                if (stake) anchor = { x: stake.x, y: stake.y };
              }

              if (anchor) {
                // Apply wander with speed multiplier
                p.angle += (Math.random() - 0.5) * 0.22;
                if (Math.random() < 0.03) {
                  p.angle += (Math.random() - 0.5) * (Math.PI * 0.8);
                }
                p.speed = p.baseSpeed * (0.8 + Math.random() * 0.4) * speedMult;
                p.vx = Math.cos(p.angle) * p.speed;
                p.vy = Math.sin(p.angle) * p.speed;

                let nextX = p.x + p.vx;
                let nextY = p.y + p.vy;
                const dx = nextX - anchor.x;
                const dy = nextY - anchor.y;
                const dist = Math.hypot(dx, dy);

                if (dist > p.leashLength) {
                  const nx = dx / (dist || 1);
                  const ny = dy / (dist || 1);
                  nextX = anchor.x + nx * p.leashLength;
                  nextY = anchor.y + ny * p.leashLength;

                  const tx = -ny;
                  const ty = nx;
                  const tangentSpeed = p.vx * tx + p.vy * ty;
                  p.vx = tx * tangentSpeed;
                  p.vy = ty * tangentSpeed;

                  p.angle = Math.atan2(p.vy - ny * 0.5, p.vx - nx * 0.5);
                }

                p.x = nextX;
                p.y = nextY;
              }
            } else if (p.transition) {
              // Smooth mode transition
              const now = performance.now();
              const elapsed = now - p.transition.startTime;
              const t = elapsed / p.transition.duration;

              if (t >= 1) {
                p.x = p.transition.targetX;
                p.y = p.transition.targetY;
                p.mode = p.transition.targetMode;
                p.transition = null;
              } else {
                const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                p.x = p.transition.startX + (p.transition.targetX - p.transition.startX) * ease;
                p.y = p.transition.startY + (p.transition.targetY - p.transition.startY) * ease;
              }
            } else if (p.pauseTimer > 0) {
              p.pauseTimer--;
            } else if (Math.random() < 0.004) {
              p.pauseTimer = Math.floor(30 + Math.random() * 50);
            } else {
              // Normal Movement modes
              let targetShape: ShapeData | undefined;
              let modeType = 'free';
              if (p.mode !== 'free') {
                const [type, shapeId] = p.mode.split(':');
                targetShape = currentShapes.find((s) => s.id === parseInt(shapeId, 10));
                if (targetShape) {
                  modeType = type;
                } else {
                  p.mode = 'free';
                }
              }

              if (modeType === 'outline' && targetShape) {
                // Outline orbit
                if (Math.random() < 0.005) p.pathDir *= -1;
                if (Math.random() < 0.05) p.currentPathSpeed = p.pathSpeed * (0.4 + Math.random() * 1.8);

                p.progress = (p.progress + p.pathDir * p.currentPathSpeed * speedMult + 1) % 1;

                if (targetShape.type === 'circle') {
                  const theta = p.progress * Math.PI * 2;
                  p.x = targetShape.x + Math.cos(theta) * targetShape.size;
                  p.y = targetShape.y + Math.sin(theta) * targetShape.size;
                } else if (targetShape.type === 'star') {
                  const pts = getStarPoints(targetShape.x, targetShape.y, 5, targetShape.size, targetShape.size * 0.45);
                  const total = pts.length;
                  const sp = p.progress * total;
                  const idx = Math.floor(sp);
                  const t = sp - idx;
                  const p1 = pts[idx];
                  const p2 = pts[(idx + 1) % total];
                  p.x = p1.x + (p2.x - p1.x) * t;
                  p.y = p1.y + (p2.y - p1.y) * t;
                } else if (targetShape.vertices) {
                  const wpts = getWorldVertices(targetShape);
                  const segLengths: number[] = [];
                  let totalLen = 0;
                  for (let i = 0; i < wpts.length; i++) {
                    const pNext = wpts[(i + 1) % wpts.length];
                    const d = Math.hypot(pNext.x - wpts[i].x, pNext.y - wpts[i].y);
                    segLengths.push(d);
                    totalLen += d;
                  }

                  let dProgress = p.progress * totalLen;
                  for (let i = 0; i < wpts.length; i++) {
                    if (dProgress <= segLengths[i] || i === wpts.length - 1) {
                      const t = Math.min(1, Math.max(0, dProgress / (segLengths[i] || 1)));
                      const pNext = wpts[(i + 1) % wpts.length];
                      p.x = wpts[i].x + (pNext.x - wpts[i].x) * t;
                      p.y = wpts[i].y + (pNext.y - wpts[i].y) * t;
                      break;
                    }
                    dProgress -= segLengths[i];
                  }
                }
              } else if (modeType === 'inside' && targetShape) {
                // Inside polygon / circle bounce wander
                p.angle += (Math.random() - 0.5) * 0.22;
                p.speed = p.baseSpeed * (0.8 + Math.random() * 0.4) * speedMult;
                p.vx = Math.cos(p.angle) * p.speed;
                p.vy = Math.sin(p.angle) * p.speed;

                const nextX = p.x + p.vx;
                const nextY = p.y + p.vy;

                if (targetShape.type === 'circle') {
                  const dx = nextX - targetShape.x;
                  const dy = nextY - targetShape.y;
                  const dist = Math.hypot(dx, dy);
                  const maxR = targetShape.size - p.radius;
                  if (dist > maxR) {
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);
                    const baseAngle = Math.atan2(-ny, -nx);
                    p.angle = baseAngle + (Math.random() - 0.5) * (Math.PI * 0.8);
                    p.vx = Math.cos(p.angle) * p.speed;
                    p.vy = Math.sin(p.angle) * p.speed;
                    p.x = targetShape.x + nx * maxR;
                    p.y = targetShape.y + ny * maxR;
                  } else {
                    p.x = nextX;
                    p.y = nextY;
                  }
                } else if (targetShape.vertices) {
                  const poly = getWorldVertices(targetShape);
                  if (!isPointInPoly({ x: nextX, y: nextY }, poly)) {
                    let bestDist = Infinity;
                    let bestNormal = { x: 0, y: 0 };
                    for (let i = 0; i < poly.length; i++) {
                      const p1 = poly[i];
                      const p2 = poly[(i + 1) % poly.length];
                      const ex = p2.x - p1.x;
                      const ey = p2.y - p1.y;
                      const len = Math.hypot(ex, ey) || 1;
                      const nx = -ey / len;
                      const ny = ex / len;
                      const midX = (p1.x + p2.x) / 2;
                      const midY = (p1.y + p2.y) / 2;
                      const d = Math.hypot(nextX - midX, nextY - midY);
                      if (d < bestDist) {
                        bestDist = d;
                        bestNormal = { x: nx, y: ny };
                      }
                    }
                    const dot = p.vx * bestNormal.x + p.vy * bestNormal.y;
                    p.vx -= 2 * dot * bestNormal.x;
                    p.vy -= 2 * dot * bestNormal.y;
                    p.angle = Math.atan2(p.vy, p.vx) + (Math.random() - 0.5) * 0.6;
                    p.vx = Math.cos(p.angle) * p.speed;
                    p.vy = Math.sin(p.angle) * p.speed;
                  } else {
                    p.x = nextX;
                    p.y = nextY;
                  }
                } else {
                  // Inside star
                  const maxR = targetShape.size * 0.45 - p.radius;
                  const dx = nextX - targetShape.x;
                  const dy = nextY - targetShape.y;
                  if (Math.hypot(dx, dy) > maxR) {
                    p.angle += Math.PI + (Math.random() - 0.5);
                    p.vx = Math.cos(p.angle) * p.speed;
                    p.vy = Math.sin(p.angle) * p.speed;
                  } else {
                    p.x = nextX;
                    p.y = nextY;
                  }
                }
              } else {
                // Free screen roam
                p.angle += (Math.random() - 0.5) * 0.22;
                if (Math.random() < 0.03) {
                  p.angle += (Math.random() - 0.5) * (Math.PI * 0.8);
                }
                p.speed = p.baseSpeed * (0.8 + Math.random() * 0.4) * speedMult;
                p.vx = Math.cos(p.angle) * p.speed;
                p.vy = Math.sin(p.angle) * p.speed;

                p.x += p.vx;
                p.y += p.vy;

                let bounced = false;
                if (p.x - p.radius < 0) {
                  p.x = p.radius;
                  p.vx = Math.abs(p.vx);
                  bounced = true;
                } else if (p.x + p.radius > width) {
                  p.x = width - p.radius;
                  p.vx = -Math.abs(p.vx);
                  bounced = true;
                }
                if (p.y - p.radius < 0) {
                  p.y = p.radius;
                  p.vy = Math.abs(p.vy);
                  bounced = true;
                } else if (p.y + p.radius > height) {
                  p.y = height - p.radius;
                  p.vy = -Math.abs(p.vy);
                  bounced = true;
                }

                if (bounced) {
                  p.angle = Math.atan2(p.vy, p.vx) + (Math.random() - 0.5) * 0.6;
                  p.vx = Math.cos(p.angle) * p.speed;
                  p.vy = Math.sin(p.angle) * p.speed;
                }
              }
            }
          }
        }

        // Add to trail if enabled
        if (sim.showTrails) {
          if (!p.trail) p.trail = [];
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 200) {
            p.trail.shift();
          }

          // Draw trail
          if (p.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let i = 1; i < p.trail.length; i++) {
              ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }
            const activeTrailColor = p.trailColor || p.color || '#58a6ff';
            ctx.strokeStyle = `${activeTrailColor}77`;
            ctx.lineWidth = 2.0;
            ctx.stroke();
          }
        }

        // Draw Leash Tether & Catenary Arc
        if (p.hasLeash) {
          let anchor: { x: number; y: number } | null = null;
          if (p.leashTarget === 'mouse') {
            if (mouse.x !== null && mouse.y !== null) {
              anchor = { x: mouse.x, y: mouse.y };
            }
          } else if (p.leashTarget.startsWith('stake:')) {
            const sId = parseInt(p.leashTarget.split(':')[1], 10);
            const stake = currentStakes.find((s) => s.id === sId);
            if (stake) anchor = { x: stake.x, y: stake.y };
          }

          if (anchor) {
            const activeLeashColor = p.leashColor || '#f0883e';

            // Dashed tether range circle
            ctx.beginPath();
            ctx.arc(anchor.x, anchor.y, p.leashLength, 0, Math.PI * 2);
            ctx.strokeStyle = `${activeLeashColor}33`;
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);

            // Elastic rope curve
            const dx = anchor.x - p.x;
            const dy = anchor.y - p.y;
            const dist = Math.hypot(dx, dy);

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            const slack = Math.max(0, p.leashLength - dist) * 0.35;
            const midX = (p.x + anchor.x) / 2;
            const midY = (p.y + anchor.y) / 2 + slack;
            ctx.quadraticCurveTo(midX, midY, anchor.x, anchor.y);
            ctx.strokeStyle = dist >= p.leashLength - 1 ? activeLeashColor : `${activeLeashColor}cc`;
            ctx.lineWidth = dist >= p.leashLength - 1 ? 2.5 : 1.8;
            ctx.stroke();

            // Collar ring
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = activeLeashColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        // Point rendering
        const isMatched = query !== '' && p.name.toLowerCase().includes(query);
        const pointColor = p.isBeingDragged
          ? '#f0883e'
          : p.isHovered
            ? '#ff7b72'
            : isMatched
              ? '#f1e05a'
              : p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = pointColor;
        ctx.fill();

        if (p.isBeingDragged) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = '#f0883e';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (p.isHovered) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#ff7b72';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Name Tag
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = isMatched ? '#f1e05a' : '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(p.name, p.x + (p.radius || 6) + 5, p.y - 4);
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Pointer event handlers for dragging, clicking to rename, and vertex handles
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // If clicking on control panel, ignore
    if ((e.target as HTMLElement).closest('.control-panel')) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    dragStartPosRef.current = { x: clientX, y: clientY };
    hasMovedRef.current = false;

    // 1. Check Vertex handles of shapes
    const currentShapes = shapesRef.current;
    for (let i = currentShapes.length - 1; i >= 0; i--) {
      const s = currentShapes[i];
      if (s.vertices) {
        const wpts = getWorldVertices(s);
        for (let vi = 0; vi < wpts.length; vi++) {
          if (Math.hypot(wpts[vi].x - clientX, wpts[vi].y - clientY) < 16) {
            draggingVertexRef.current = { shapeId: s.id, index: vi };
            return;
          }
        }
      }
    }

    // 2. Check Points
    const currentPoints = pointsRef.current;
    for (let i = currentPoints.length - 1; i >= 0; i--) {
      const p = currentPoints[i];
      if (Math.hypot(p.x - clientX, p.y - clientY) < Math.max(24, (p.radius || 6) + 8)) {
        draggingObjRef.current = { type: 'point', id: p.id };
        p.isBeingDragged = true;
        dragOffsetRef.current = { x: clientX - p.x, y: clientY - p.y };
        return;
      }
    }

    // 3. Check Stakes
    const currentStakes = stakesRef.current;
    for (let i = currentStakes.length - 1; i >= 0; i--) {
      const stk = currentStakes[i];
      if (Math.hypot(stk.x - clientX, stk.y - clientY) < 22) {
        draggingObjRef.current = { type: 'stake', id: stk.id };
        dragOffsetRef.current = { x: clientX - stk.x, y: clientY - stk.y };
        return;
      }
    }

    // 4. Check Shape Centers
    for (let i = currentShapes.length - 1; i >= 0; i--) {
      const s = currentShapes[i];
      if (Math.hypot(s.x - clientX, s.y - clientY) < 45) {
        draggingObjRef.current = { type: 'shape', id: s.id };
        dragOffsetRef.current = { x: clientX - s.x, y: clientY - s.y };
        return;
      }
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = Math.round(e.clientX - rect.left);
      const clientY = Math.round(e.clientY - rect.top);

      mouseRef.current = { x: clientX, y: clientY };

      const originX = window.innerWidth / 2;
      const originY = window.innerHeight / 2;
      onHoverCoordsChange({
        x: toMathX(clientX, originX),
        y: toMathY(clientY, originY),
      });

      if (Math.hypot(clientX - dragStartPosRef.current.x, clientY - dragStartPosRef.current.y) > 4) {
        hasMovedRef.current = true;
      }

      // Dragging vertex
      if (draggingVertexRef.current) {
        const { shapeId, index } = draggingVertexRef.current;
        onShapesUpdate((prev) =>
          prev.map((s) => {
            if (s.id === shapeId && s.vertices) {
              const newVerts = [...s.vertices];
              newVerts[index] = {
                x: clientX - s.x,
                y: clientY - s.y,
              };
              return { ...s, vertices: newVerts };
            }
            return s;
          })
        );
        return;
      }

      // Dragging object (point, stake, shape)
      const dragging = draggingObjRef.current;
      if (dragging) {
        const targetX = clientX - dragOffsetRef.current.x;
        const targetY = clientY - dragOffsetRef.current.y;

        if (dragging.type === 'point') {
          onPointsUpdate((prev) =>
            prev.map((p) => {
              if (p.id === dragging.id) {
                return { ...p, x: targetX, y: targetY };
              }
              return p;
            })
          );
        } else if (dragging.type === 'stake') {
          onStakesUpdate((prev) =>
            prev.map((stk) => {
              if (stk.id === dragging.id) {
                return { ...stk, x: targetX, y: targetY };
              }
              return stk;
            })
          );
        } else if (dragging.type === 'shape') {
          onShapesUpdate((prev) =>
            prev.map((s) => {
              if (s.id === dragging.id) {
                return { ...s, x: targetX, y: targetY };
              }
              return s;
            })
          );
        }
      }
    },
    [onHoverCoordsChange, onPointsUpdate, onShapesUpdate, onStakesUpdate]
  );

  const handlePointerUp = useCallback(() => {
    if (draggingVertexRef.current) {
      draggingVertexRef.current = null;
      onSaveState();
    }

    const dragging = draggingObjRef.current;
    if (dragging) {
      if (dragging.type === 'point' && !hasMovedRef.current) {
        const targetPoint = pointsRef.current.find((p) => p.id === dragging.id);
        if (targetPoint) {
          onPointNameChangePrompt(targetPoint);
        }
      }

      if (dragging.type === 'point') {
        onPointsUpdate((prev) =>
          prev.map((p) => (p.id === dragging.id ? { ...p, isBeingDragged: false } : p))
        );
      }

      draggingObjRef.current = null;
      onSaveState();
    }
  }, [onPointNameChangePrompt, onPointsUpdate, onSaveState]);

  const handlePointerLeave = useCallback(() => {
    mouseRef.current = { x: null, y: null };
    onHoverCoordsChange(null);
    if (draggingObjRef.current && draggingObjRef.current.type === 'point') {
      const pId = draggingObjRef.current.id;
      onPointsUpdate((prev) =>
        prev.map((p) => (p.id === pId ? { ...p, isBeingDragged: false } : p))
      );
    }
    draggingObjRef.current = null;
    draggingVertexRef.current = null;
  }, [onHoverCoordsChange, onPointsUpdate]);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className="absolute inset-0 block w-full h-full cursor-crosshair touch-none select-none"
    />
  );
};
