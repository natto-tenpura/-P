import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PointData,
  ShapeData,
  StakeData,
  BoardData,
  ShapeType,
  SimulationState,
  POINT_COLOR_PALETTE,
} from './types';
import {
  createInitialVertices,
  getNextAvailablePointName,
} from './utils/math';
import { CanvasStage } from './components/CanvasStage';
import { ControlPanel } from './components/ControlPanel';
import { PlaybackHUD } from './components/PlaybackHUD';
import { RenameModal } from './components/RenameModal';

const STORAGE_KEY = 'ten_p_multi_boards_data';

export default function App() {
  const [boards, setBoards] = useState<BoardData[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string>('');
  const [points, setPoints] = useState<PointData[]>([]);
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [stakes, setStakes] = useState<StakeData[]>([]);
  const [shapeCounter, setShapeCounter] = useState<number>(0);
  const [stakeCounter, setStakeCounter] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: true,
    speedMultiplier: 1,
    showTrails: false,
    showGridCoordinates: true,
  });

  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    pointId: string;
    currentName: string;
    currentColor: string;
  }>({
    isOpen: false,
    pointId: '',
    currentName: '',
    currentColor: '#58a6ff',
  });

  const isInitializedRef = useRef<boolean>(false);

  // Sync state into active board object and save to localStorage
  const saveAllState = useCallback(() => {
    if (!isInitializedRef.current || !currentBoardId) return;

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2;

    setBoards((prevBoards) => {
      const updated = prevBoards.map((b) => {
        if (b.id === currentBoardId) {
          return {
            ...b,
            points: points.map((p) => ({
              id: p.id,
              name: p.name,
              relX: p.x - originX,
              relY: p.y - originY,
              mode: p.mode,
              hasLeash: p.hasLeash,
              leashTarget: p.leashTarget,
              leashLength: p.leashLength,
              color: p.color,
            })),
            shapes: shapes.map((s) => ({
              id: s.id,
              type: s.type,
              name: s.name,
              relX: s.x - originX,
              relY: s.y - originY,
              size: s.size,
              vertices: s.vertices ? JSON.parse(JSON.stringify(s.vertices)) : null,
            })),
            stakes: stakes.map((stk) => ({
              id: stk.id,
              name: stk.name,
              relX: stk.x - originX,
              relY: stk.y - originY,
            })),
            shapeCounter,
            stakeCounter,
          };
        }
        return b;
      });

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            currentBoardId,
            boards: updated,
          })
        );
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }

      return updated;
    });
  }, [currentBoardId, points, shapes, stakes, shapeCounter, stakeCounter]);

  // Load board by ID
  const loadBoardData = useCallback(
    (board: BoardData) => {
      const originX = window.innerWidth / 2;
      const originY = window.innerHeight / 2;

      setShapeCounter(board.shapeCounter || 0);
      setStakeCounter(board.stakeCounter || 0);

      setStakes(
        (board.stakes || []).map(
          (stk) =>
            ({
              id: stk.id,
              name: stk.name,
              x: originX + stk.relX,
              y: originY + stk.relY,
              radius: 10,
            } as StakeData)
        )
      );

      setShapes(
        (board.shapes || []).map(
          (s) =>
            ({
              id: s.id,
              type: s.type,
              name: s.name,
              x: originX + s.relX,
              y: originY + s.relY,
              size: s.size,
              vertices: s.vertices ? JSON.parse(JSON.stringify(s.vertices)) : null,
            } as ShapeData)
        )
      );

      setPoints(
        (board.points || []).map((p) => {
          const baseSpeed = 1.6 + Math.random() * 0.8;
          const angle = Math.random() * Math.PI * 2;
          return {
            id: p.id,
            name: p.name,
            x: originX + p.relX,
            y: originY + p.relY,
            radius: 6,
            color: p.color || '#58a6ff',
            baseSpeed,
            speed: baseSpeed,
            angle,
            vx: Math.cos(angle) * baseSpeed,
            vy: Math.sin(angle) * baseSpeed,
            progress: Math.random(),
            pathDir: 1,
            pathSpeed: 0.002 + Math.random() * 0.001,
            currentPathSpeed: 0.002,
            pauseTimer: 0,
            mode: p.mode || 'free',
            transition: null,
            isHovered: false,
            isBeingDragged: false,
            hasLeash: !!p.hasLeash,
            leashTarget: p.leashTarget || 'mouse',
            leashLength: p.leashLength || 120,
            trail: [],
          };
        })
      );
    },
    []
  );

  // Initial Load from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.boards && parsed.boards.length > 0) {
          const validBoardId = parsed.boards.find((b: BoardData) => b.id === parsed.currentBoardId)
            ? parsed.currentBoardId
            : parsed.boards[0].id;

          setBoards(parsed.boards);
          setCurrentBoardId(validBoardId);
          const targetBoard = parsed.boards.find((b: BoardData) => b.id === validBoardId);
          if (targetBoard) {
            loadBoardData(targetBoard);
          }
          isInitializedRef.current = true;
          return;
        }
      } catch (err) {
        console.error('Error reading localStorage:', err);
      }
    }

    // Default initial board
    const initialBoardId = 'board_' + Date.now();
    const defaultBoard: BoardData = {
      id: initialBoardId,
      name: '世界 1',
      points: [
        {
          id: 'pt_' + Date.now(),
          name: '点P',
          relX: 0,
          relY: 0,
          mode: 'free',
          hasLeash: false,
          leashTarget: 'mouse',
          leashLength: 120,
        },
      ],
      shapes: [],
      stakes: [],
      shapeCounter: 0,
      stakeCounter: 0,
    };

    setBoards([defaultBoard]);
    setCurrentBoardId(initialBoardId);
    loadBoardData(defaultBoard);
    isInitializedRef.current = true;
  }, [loadBoardData]);

  // Window beforeunload save
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveAllState();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveAllState]);

  // Switch World
  const handleSwitchBoard = (targetBoardId: string) => {
    saveAllState();
    setCurrentBoardId(targetBoardId);
    const target = boards.find((b) => b.id === targetBoardId);
    if (target) {
      loadBoardData(target);
    }
  };

  // Create World
  const handleCreateBoard = (name?: string) => {
    saveAllState();
    const newId = 'board_' + Date.now();
    const boardName = name || `世界 ${boards.length + 1}`;
    const newBoard: BoardData = {
      id: newId,
      name: boardName,
      points: [
        {
          id: 'pt_' + Date.now(),
          name: '点P', // Every world strictly starts with Point P
          relX: (Math.random() - 0.5) * 80,
          relY: (Math.random() - 0.5) * 80,
          mode: 'free',
          hasLeash: false,
          leashTarget: 'mouse',
          leashLength: 120,
        },
      ],
      shapes: [],
      stakes: [],
      shapeCounter: 0,
      stakeCounter: 0,
    };

    setBoards((prev) => [...prev, newBoard]);
    setCurrentBoardId(newId);
    loadBoardData(newBoard);
  };

  // Delete World
  const handleDeleteBoard = (idToDelete: string) => {
    if (boards.length <= 1) return;
    const remaining = boards.filter((b) => b.id !== idToDelete);
    setBoards(remaining);
    const nextBoard = remaining[0];
    setCurrentBoardId(nextBoard.id);
    loadBoardData(nextBoard);
  };

  // Rename World
  const handleRenameBoard = (newName: string) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === currentBoardId ? { ...b, name: newName || '無名の世界' } : b))
    );
  };

  // Reset World
  const handleResetCurrentBoard = () => {
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2;
    const baseSpeed = 1.6 + Math.random() * 0.8;
    const angle = Math.random() * Math.PI * 2;

    const initialPoint: PointData = {
      id: 'pt_' + Date.now(),
      name: '点P',
      x: originX,
      y: originY,
      radius: 6,
      color: '#58a6ff',
      baseSpeed,
      speed: baseSpeed,
      angle,
      vx: Math.cos(angle) * baseSpeed,
      vy: Math.sin(angle) * baseSpeed,
      progress: Math.random(),
      pathDir: 1,
      pathSpeed: 0.002,
      currentPathSpeed: 0.002,
      pauseTimer: 0,
      mode: 'free',
      transition: null,
      isHovered: false,
      isBeingDragged: false,
      hasLeash: false,
      leashTarget: 'mouse',
      leashLength: 120,
      trail: [],
    };

    setPoints([initialPoint]);
    setShapes([]);
    setStakes([]);
    setShapeCounter(0);
    setStakeCounter(0);
    saveAllState();
  };

  // Add Point
  const handleAddPoint = (customName?: string) => {
    const name = customName || getNextAvailablePointName(points.map((p) => p.name));
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2;
    const baseSpeed = 1.6 + Math.random() * 0.8;
    const angle = Math.random() * Math.PI * 2;
    const assignedColor = POINT_COLOR_PALETTE[points.length % POINT_COLOR_PALETTE.length].value;

    const newPt: PointData = {
      id: 'pt_' + Math.random().toString(36).substring(2, 9),
      name,
      x: originX + (Math.random() - 0.5) * 150,
      y: originY + (Math.random() - 0.5) * 150,
      radius: 6,
      color: assignedColor,
      baseSpeed,
      speed: baseSpeed,
      angle,
      vx: Math.cos(angle) * baseSpeed,
      vy: Math.sin(angle) * baseSpeed,
      progress: Math.random(),
      pathDir: 1,
      pathSpeed: 0.002 + Math.random() * 0.001,
      currentPathSpeed: 0.002,
      pauseTimer: 0,
      mode: 'free',
      transition: null,
      isHovered: false,
      isBeingDragged: false,
      hasLeash: false,
      leashTarget: 'mouse',
      leashLength: 120,
      trail: [],
    };

    setPoints((prev) => [...prev, newPt]);
    saveAllState();
  };

  // Delete Point
  const handleDeletePoint = (id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id));
    saveAllState();
  };

  // Update Point
  const handleUpdatePoint = (id: string, partial: Partial<PointData>) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, ...partial } : p)));
    saveAllState();
  };

  // Add Shape
  const handleAddShape = (type: ShapeType) => {
    const newId = shapeCounter + 1;
    setShapeCounter(newId);

    const typeLabels: Record<ShapeType, string> = {
      circle: '円',
      triangle: '三角',
      rect: '四角',
      star: '星',
    };

    const size = 100;
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2;

    const newShape: ShapeData = {
      id: newId,
      type,
      name: `${typeLabels[type]} ${newId}`,
      x: originX + (Math.random() - 0.5) * 160,
      y: originY + (Math.random() - 0.5) * 160,
      size,
      vertices:
        type === 'triangle' || type === 'rect' ? createInitialVertices(type, size) : null,
    };

    setShapes((prev) => [...prev, newShape]);
    saveAllState();
  };

  // Delete Shape
  const handleDeleteShape = (id: number) => {
    setShapes((prev) => prev.filter((s) => s.id !== id));
    // Reset points that were bound to this shape
    setPoints((prev) =>
      prev.map((p) => {
        if (p.mode.includes(`:${id}`)) {
          return { ...p, mode: 'free' };
        }
        return p;
      })
    );
    saveAllState();
  };

  // Update Shape
  const handleUpdateShape = (id: number, partial: Partial<ShapeData>) => {
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...partial } : s)));
    saveAllState();
  };

  // Add Stake (杭)
  const handleAddStake = () => {
    const newId = stakeCounter + 1;
    setStakeCounter(newId);

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2;

    const newStake: StakeData = {
      id: newId,
      name: `杭 ${newId}`,
      x: originX + (Math.random() - 0.5) * 150,
      y: originY + (Math.random() - 0.5) * 150,
      radius: 10,
    };

    setStakes((prev) => [...prev, newStake]);
    saveAllState();
  };

  // Delete Stake
  const handleDeleteStake = (id: number) => {
    setStakes((prev) => prev.filter((stk) => stk.id !== id));
    // Fall back leashed points to mouse
    setPoints((prev) =>
      prev.map((p) => {
        if (p.leashTarget === `stake:${id}`) {
          return { ...p, leashTarget: 'mouse' };
        }
        return p;
      })
    );
    saveAllState();
  };

  // Update Stake
  const handleUpdateStake = (id: number, partial: Partial<StakeData>) => {
    setStakes((prev) => prev.map((stk) => (stk.id === id ? { ...stk, ...partial } : stk)));
    saveAllState();
  };

  // Clear Trails
  const handleClearTrails = () => {
    setPoints((prev) => prev.map((p) => ({ ...p, trail: [] })));
  };

  // Prompt rename when point clicked on canvas
  const handlePointNameChangePrompt = (point: PointData) => {
    setRenameModal({
      isOpen: true,
      pointId: point.id,
      currentName: point.name,
      currentColor: point.color || '#58a6ff',
    });
  };

  const handleConfirmRename = (newName: string, newColor?: string) => {
    if (renameModal.pointId) {
      handleUpdatePoint(renameModal.pointId, {
        name: newName,
        ...(newColor ? { color: newColor } : {}),
      });
    }
    setRenameModal({ isOpen: false, pointId: '', currentName: '', currentColor: '#58a6ff' });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0d1117] font-sans text-[#e6edf3] select-none">
      {/* Interactive HTML5 Canvas Simulation Stage */}
      <CanvasStage
        points={points}
        shapes={shapes}
        stakes={stakes}
        simulationState={simulationState}
        searchQuery={searchQuery}
        onPointsUpdate={setPoints}
        onShapesUpdate={setShapes}
        onStakesUpdate={setStakes}
        onPointNameChangePrompt={handlePointNameChangePrompt}
        onHoverCoordsChange={setHoverCoords}
        onSaveState={saveAllState}
      />

      {/* Floating Control Panel on Top Left */}
      <ControlPanel
        boards={boards}
        currentBoardId={currentBoardId}
        points={points}
        shapes={shapes}
        stakes={stakes}
        searchQuery={searchQuery}
        hoverCoords={hoverCoords}
        onSearchChange={setSearchQuery}
        onSwitchBoard={handleSwitchBoard}
        onCreateBoard={handleCreateBoard}
        onDeleteBoard={handleDeleteBoard}
        onRenameBoard={handleRenameBoard}
        onResetCurrentBoard={handleResetCurrentBoard}
        onAddPoint={handleAddPoint}
        onDeletePoint={handleDeletePoint}
        onUpdatePoint={handleUpdatePoint}
        onAddShape={handleAddShape}
        onDeleteShape={handleDeleteShape}
        onUpdateShape={handleUpdateShape}
        onAddStake={handleAddStake}
        onDeleteStake={handleDeleteStake}
        onUpdateStake={handleUpdateStake}
        onSaveState={saveAllState}
      />

      {/* Playback & HUD Controls on Top Right */}
      <PlaybackHUD
        simulationState={simulationState}
        onSimulationStateChange={setSimulationState}
        onClearTrails={handleClearTrails}
      />

      {/* Canvas Click Rename & Color Modal */}
      <RenameModal
        isOpen={renameModal.isOpen}
        initialName={renameModal.currentName}
        initialColor={renameModal.currentColor}
        onConfirm={handleConfirmRename}
        onClose={() =>
          setRenameModal({ isOpen: false, pointId: '', currentName: '', currentColor: '#58a6ff' })
        }
      />
    </div>
  );
}
