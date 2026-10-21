import React, { useState } from 'react';
import {
  RotateCcw,
  Minus,
  Plus,
  Trash2,
  Search,
  Circle,
  Square,
  Triangle,
  Star,
  MapPin,
  Check,
} from 'lucide-react';
import { PointData, ShapeData, StakeData, BoardData, ShapeType } from '../types';
import { getNextAvailablePointName } from '../utils/math';

interface ControlPanelProps {
  boards: BoardData[];
  currentBoardId: string;
  points: PointData[];
  shapes: ShapeData[];
  stakes: StakeData[];
  searchQuery: string;
  hoverCoords: { x: number; y: number } | null;
  onSearchChange: (query: string) => void;
  onSwitchBoard: (id: string) => void;
  onCreateBoard: (name?: string) => void;
  onDeleteBoard: (id: string) => void;
  onRenameBoard: (newName: string) => void;
  onResetCurrentBoard: () => void;
  onAddPoint: (name?: string) => void;
  onDeletePoint: (id: string) => void;
  onUpdatePoint: (id: string, partial: Partial<PointData>) => void;
  onAddShape: (type: ShapeType) => void;
  onDeleteShape: (id: number) => void;
  onUpdateShape: (id: number, partial: Partial<ShapeData>) => void;
  onAddStake: () => void;
  onDeleteStake: (id: number) => void;
  onUpdateStake: (id: number, partial: Partial<StakeData>) => void;
  onSaveState: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  boards,
  currentBoardId,
  points,
  shapes,
  stakes,
  searchQuery,
  hoverCoords,
  onSearchChange,
  onSwitchBoard,
  onCreateBoard,
  onDeleteBoard,
  onRenameBoard,
  onResetCurrentBoard,
  onAddPoint,
  onDeletePoint,
  onUpdatePoint,
  onAddShape,
  onDeleteShape,
  onUpdateShape,
  onAddStake,
  onDeleteStake,
  onUpdateStake,
  onSaveState,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [newPointInput, setNewPointInput] = useState('');

  const currentBoard = boards.find((b) => b.id === currentBoardId);
  const nextPointName = getNextAvailablePointName(points.map((p) => p.name));

  const handleAddNewPoint = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onAddPoint(newPointInput.trim() || undefined);
    setNewPointInput('');
  };

  const handleCreateNewBoard = () => {
    const defaultName = `世界 ${boards.length + 1}`;
    const name = window.prompt('新しい世界（ボード）の名前を入力してください:', defaultName);
    if (name !== null && name.trim() !== '') {
      onCreateBoard(name.trim());
    }
  };

  const handleDeleteCurrentBoard = () => {
    if (boards.length <= 1) {
      alert('これ以上世界を削除できません。');
      return;
    }
    if (currentBoard && window.confirm(`「${currentBoard.name}」を削除しますか？`)) {
      onDeleteBoard(currentBoard.id);
    }
  };

  const handleResetBoard = () => {
    if (currentBoard && window.confirm(`現在の「${currentBoard.name}」を初期状態に戻しますか？`)) {
      onResetCurrentBoard();
    }
  };

  return (
    <div
      className={`control-panel absolute top-3 left-3 bg-[#161b22]/95 border border-[#30363d] rounded-xl shadow-2xl backdrop-blur-md z-20 flex flex-col transition-all text-[#e6edf3] ${
        isMinimized
          ? 'w-auto min-w-[285px] max-w-[350px] p-2.5 gap-0'
          : 'w-[370px] max-h-[calc(100vh-24px)] p-3 gap-2.5'
      }`}
    >
      {/* Panel Header */}
      <div
        className={`flex items-center justify-between gap-2.5 flex-nowrap whitespace-nowrap ${
          isMinimized ? 'border-b-0 pb-0' : 'border-b border-[#30363d]/50 pb-2'
        }`}
      >
        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          <span className="font-black text-lg text-[#f0883e] tracking-tight whitespace-nowrap shrink-0 select-none">
            📐 点P
          </span>
          <div className="text-xs font-mono font-bold text-[#58a6ff] whitespace-nowrap shrink-0 bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
            {hoverCoords ? `X: ${hoverCoords.x}, Y: ${hoverCoords.y}` : 'X: -, Y: -'}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
          <button
            onClick={handleResetBoard}
            className="w-7 h-7 flex items-center justify-center bg-[#21262d] border border-[#30363d] rounded-md text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#58a6ff] transition-colors shrink-0"
            title="現在の世界を初期化"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-7 h-7 flex items-center justify-center bg-[#21262d] border border-[#30363d] rounded-md text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#58a6ff] transition-colors shrink-0"
            title={isMinimized ? '展開' : '最小化'}
          >
            {isMinimized ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Panel Content (hidden when minimized) */}
      {!isMinimized && (
        <div className="flex flex-col gap-3 overflow-y-auto pr-1 text-xs">
          {/* Board (World) Control Box */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 flex flex-col gap-2">
            <div className="flex justify-between items-center text-[11px] font-bold text-[#8b949e] uppercase">
              <span>世界 (ボード)</span>
              <span className="text-[10px] text-[#58a6ff] font-normal">{boards.length}個の世界</span>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={currentBoardId}
                onChange={(e) => onSwitchBoard(e.target.value)}
                className="flex-1 px-2 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-md text-white text-xs focus:outline-none focus:border-[#58a6ff]"
              >
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    🌍 {b.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCreateNewBoard}
                className="px-2.5 py-1.5 bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-white rounded-md font-medium whitespace-nowrap transition-colors"
                title="新しい世界を作成"
              >
                ＋ 新規
              </button>
              <button
                onClick={handleDeleteCurrentBoard}
                disabled={boards.length <= 1}
                className="px-2.5 py-1.5 bg-[#da3633] text-white hover:bg-[#f85149] disabled:opacity-40 disabled:cursor-not-allowed rounded-md font-medium whitespace-nowrap transition-colors"
                title="現在の世界を削除"
              >
                削除
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8b949e] whitespace-nowrap">名前:</span>
              <input
                type="text"
                value={currentBoard?.name || ''}
                onChange={(e) => onRenameBoard(e.target.value)}
                placeholder="現在の世界名"
                className="flex-1 px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded-md text-white text-xs focus:outline-none focus:border-[#58a6ff]"
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8b949e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="点を名前で検索..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-md text-white text-xs placeholder:text-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
            />
          </div>

          {/* Shapes & Stakes Addition Bar */}
          <div>
            <div className="text-[11px] font-bold text-[#8b949e] uppercase mb-1.5">
              図形・杭を追加 <span className="font-normal lowercase text-[10px] text-[#8b949e]">(角を引張って変形)</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              <button
                onClick={() => onAddShape('circle')}
                className="flex items-center justify-center gap-1 py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded text-[11px] font-medium transition-colors"
                title="円を追加"
              >
                <Circle className="w-3 h-3" />
                <span>円</span>
              </button>
              <button
                onClick={() => onAddShape('triangle')}
                className="flex items-center justify-center gap-1 py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded text-[11px] font-medium transition-colors"
                title="変形可能な三角形を追加"
              >
                <Triangle className="w-3 h-3" />
                <span>三角</span>
              </button>
              <button
                onClick={() => onAddShape('rect')}
                className="flex items-center justify-center gap-1 py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded text-[11px] font-medium transition-colors"
                title="変形可能な四角形を追加"
              >
                <Square className="w-3 h-3" />
                <span>四角</span>
              </button>
              <button
                onClick={() => onAddShape('star')}
                className="flex items-center justify-center gap-1 py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded text-[11px] font-medium transition-colors"
                title="星型を追加"
              >
                <Star className="w-3 h-3" />
                <span>星</span>
              </button>
              <button
                onClick={onAddStake}
                className="flex items-center justify-center gap-1 py-1.5 bg-[#8957e5] hover:bg-[#a371f7] text-white rounded text-[11px] font-medium transition-colors"
                title="リードを繋げる杭を追加"
              >
                <MapPin className="w-3 h-3" />
                <span>杭</span>
              </button>
            </div>
          </div>

          {/* Active Shapes & Stakes List */}
          <div>
            <div className="text-[11px] font-bold text-[#8b949e] uppercase mb-1 flex justify-between items-center">
              <span>配置中のオブジェクト</span>
              <span className="text-[10px] text-[#8b949e] font-normal">{shapes.length + stakes.length}個</span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
              {shapes.length === 0 && stakes.length === 0 ? (
                <div className="text-[#6e7681] text-[11px] py-1">オブジェクトはありません</div>
              ) : (
                <>
                  {shapes.map((s) => (
                    <div
                      key={s.id}
                      className="bg-[#161b22] border border-[#21262d] p-2 rounded-md flex flex-col gap-1.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) => onUpdateShape(s.id, { name: e.target.value })}
                          className="flex-1 px-2 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-white text-xs focus:outline-none focus:border-[#58a6ff]"
                          title="オブジェクト名を変更"
                        />
                        <button
                          onClick={() => onDeleteShape(s.id)}
                          className="px-2 py-0.5 bg-[#da3633] text-white hover:bg-[#f85149] rounded text-[11px] transition-colors"
                        >
                          ✕ 削除
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#58a6ff] bg-[#58a6ff]/5 px-2 py-0.5 rounded">
                        <span className="whitespace-nowrap">サイズ:</span>
                        <input
                          type="range"
                          min="40"
                          max="220"
                          value={s.size}
                          onChange={(e) => {
                            const newSize = parseInt(e.target.value, 10);
                            const oldSize = s.size;
                            let newVertices = s.vertices;
                            if (s.vertices) {
                              const scale = newSize / oldSize;
                              newVertices = s.vertices.map((v) => ({
                                x: v.x * scale,
                                y: v.y * scale,
                              }));
                            }
                            onUpdateShape(s.id, { size: newSize, vertices: newVertices });
                          }}
                          className="flex-1 cursor-pointer accent-[#58a6ff]"
                        />
                        <span className="font-mono text-[10px] w-7 text-right">{s.size}</span>
                      </div>
                    </div>
                  ))}

                  {stakes.map((stk) => (
                    <div
                      key={stk.id}
                      className="bg-[#161b22] border border-[#8957e5]/40 p-2 rounded-md flex items-center gap-1.5"
                    >
                      <span className="text-[#8957e5] font-bold">📍</span>
                      <input
                        type="text"
                        value={stk.name}
                        onChange={(e) => onUpdateStake(stk.id, { name: e.target.value })}
                        className="flex-1 px-2 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-white text-xs focus:outline-none focus:border-[#8957e5]"
                        title="杭の名前を変更"
                      />
                      <button
                        onClick={() => onDeleteStake(stk.id)}
                        className="px-2 py-0.5 bg-[#da3633] text-white hover:bg-[#f85149] rounded text-[11px] transition-colors"
                      >
                        ✕ 削除
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Add New Point Bar */}
          <div>
            <div className="text-[11px] font-bold text-[#8b949e] uppercase mb-1">新しい点を追加</div>
            <form onSubmit={handleAddNewPoint} className="flex gap-1.5">
              <input
                type="text"
                value={newPointInput}
                onChange={(e) => setNewPointInput(e.target.value)}
                placeholder={`点の名前 (空欄で ${nextPointName})`}
                className="flex-1 px-2.5 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-md text-white text-xs focus:outline-none focus:border-[#58a6ff]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white font-bold rounded-md text-xs transition-colors whitespace-nowrap"
              >
                追加
              </button>
            </form>
          </div>

          {/* Registered Points List */}
          <div>
            <div className="text-[11px] font-bold text-[#8b949e] uppercase mb-1.5 flex justify-between items-center">
              <span>登録中の点</span>
              <span className="text-[#58a6ff] font-mono">{points.length}件</span>
            </div>

            <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
              {points.map((p) => {
                const isMatched =
                  searchQuery.trim() !== '' &&
                  p.name.toLowerCase().includes(searchQuery.trim().toLowerCase());

                return (
                  <div
                    key={p.id}
                    className={`p-2 rounded-md border flex flex-col gap-1.5 transition-all ${
                      isMatched
                        ? 'border-[#d29922] bg-[#d29922]/10'
                        : 'border-[#21262d] bg-[#161b22]'
                    }`}
                  >
                    {/* Top Row: Name, Leash Toggle, Delete */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => onUpdatePoint(p.id, { name: e.target.value })}
                        className="flex-1 px-2 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-white text-xs focus:outline-none focus:border-[#58a6ff]"
                        title="点の名前を変更"
                      />

                      {/* Leash checkbox */}
                      <label
                        className="flex items-center gap-1 text-[11px] text-[#f0883e] bg-[#f0883e]/10 border border-[#f0883e]/30 px-1.5 py-0.5 rounded cursor-pointer whitespace-nowrap select-none"
                        title="リードを付けると自律移動の設定は拘束されます"
                      >
                        <input
                          type="checkbox"
                          checked={p.hasLeash}
                          onChange={(e) => onUpdatePoint(p.id, { hasLeash: e.target.checked })}
                          className="accent-[#f0883e] cursor-pointer"
                        />
                        <span>リード</span>
                      </label>

                      {/* Delete */}
                      <button
                        onClick={() => onDeletePoint(p.id)}
                        className="w-5 h-5 flex items-center justify-center bg-[#da3633] text-white hover:bg-[#f85149] rounded text-[10px] font-bold"
                        title="点を削除"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Leash details if enabled */}
                    {p.hasLeash && (
                      <div className="flex flex-col gap-1 bg-[#f0883e]/5 border border-[#f0883e]/20 p-1.5 rounded">
                        <div className="flex items-center gap-2 text-[11px] text-[#f0883e]">
                          <span className="whitespace-nowrap">繋ぎ先:</span>
                          <select
                            value={p.leashTarget}
                            onChange={(e) => onUpdatePoint(p.id, { leashTarget: e.target.value })}
                            className="flex-1 px-1.5 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-white text-[11px] focus:outline-none focus:border-[#f0883e]"
                          >
                            <option value="mouse">🖱 マウス</option>
                            {stakes.map((stk) => (
                              <option key={stk.id} value={`stake:${stk.id}`}>
                                📍 {stk.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#f0883e]">
                          <span className="whitespace-nowrap">長さ:</span>
                          <input
                            type="range"
                            min="30"
                            max="300"
                            value={p.leashLength}
                            onChange={(e) =>
                              onUpdatePoint(p.id, { leashLength: parseInt(e.target.value, 10) })
                            }
                            className="flex-1 cursor-pointer accent-[#f0883e]"
                          />
                          <span className="font-mono text-[10px] w-9 text-right">
                            {p.leashLength}px
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Motion Mode Selection */}
                    <select
                      disabled={p.hasLeash}
                      value={p.transition ? p.transition.targetMode : p.mode}
                      onChange={(e) => {
                        const newMode = e.target.value;
                        if (p.mode === newMode) return;
                        // Trigger smooth transition
                        const [type, shapeId] = newMode.split(':');
                        let targetX = p.x;
                        let targetY = p.y;
                        if (newMode !== 'free' && shapeId) {
                          const s = shapes.find((shp) => shp.id === parseInt(shapeId, 10));
                          if (s) {
                            if (type === 'outline') {
                              if (s.type === 'circle') {
                                const angle = Math.atan2(p.y - s.y, p.x - s.x);
                                targetX = s.x + Math.cos(angle) * s.size;
                                targetY = s.y + Math.sin(angle) * s.size;
                              } else if (s.vertices) {
                                targetX = s.x + s.vertices[0].x;
                                targetY = s.y + s.vertices[0].y;
                              } else {
                                targetX = s.x;
                                targetY = s.y - s.size;
                              }
                            } else {
                              targetX = s.x + (Math.random() - 0.5) * 20;
                              targetY = s.y + (Math.random() - 0.5) * 20;
                            }
                          }
                        }

                        onUpdatePoint(p.id, {
                          transition: {
                            startX: p.x,
                            startY: p.y,
                            targetX,
                            targetY,
                            targetMode: newMode,
                            startTime: performance.now(),
                            duration: 650,
                          },
                        });
                      }}
                      className="w-full px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-white text-[11px] focus:outline-none focus:border-[#58a6ff] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {p.hasLeash ? (
                        <option>動き: [リード拘束中]</option>
                      ) : (
                        <>
                          <option value="free">動き: 画面全体 (ランダム放浪)</option>
                          {shapes.map((s) => (
                            <React.Fragment key={s.id}>
                              <option value={`outline:${s.id}`}>
                                動き: [{s.name}] の輪郭 (周回)
                              </option>
                              <option value={`inside:${s.id}`}>
                                動き: [{s.name}] の内側 (放浪)
                              </option>
                            </React.Fragment>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Practical Tips */}
          <div className="bg-[#0d1117] border border-[#30363d]/60 rounded-md p-2 text-[10.5px] text-[#8b949e] leading-relaxed">
            <div>
              💡 どの世界でも<b>必ず「点P」から始まります</b>
            </div>
            <div>
              💡 <b>新規世界</b>を作れば複数の画面を行き来できます
            </div>
            <div>
              💡 三角・四角の<b>角をドラッグ</b>して自在に変形可能
            </div>
            <div>
              💡 点を<b>クリック</b>すると名前を直接変更できます
            </div>
          </div>

          {/* Auto-save status */}
          <div className="flex items-center justify-end gap-1 text-[10px] text-[#3fb950]">
            <Check className="w-3 h-3" />
            <span>自動保存済み</span>
          </div>
        </div>
      )}
    </div>
  );
};
