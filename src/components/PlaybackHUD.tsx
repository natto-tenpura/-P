import React from 'react';
import { Play, Pause, FastForward, Route, Hash, Trash2 } from 'lucide-react';
import { SimulationState } from '../types';

interface PlaybackHUDProps {
  simulationState: SimulationState;
  onSimulationStateChange: (updater: (prev: SimulationState) => SimulationState) => void;
  onClearTrails: () => void;
}

export const PlaybackHUD: React.FC<PlaybackHUDProps> = ({
  simulationState,
  onSimulationStateChange,
  onClearTrails,
}) => {
  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 p-1.5 bg-[#161b22]/90 border border-[#30363d] rounded-xl shadow-lg backdrop-blur-md text-xs text-[#c9d1d9]">
      {/* Play/Pause Button */}
      <button
        onClick={() =>
          onSimulationStateChange((prev) => ({ ...prev, isRunning: !prev.isRunning }))
        }
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
          simulationState.isRunning
            ? 'bg-[#238636] hover:bg-[#2ea043] text-white'
            : 'bg-[#d29922] hover:bg-[#e3b341] text-black font-semibold'
        }`}
        title={simulationState.isRunning ? 'シミュレーション一時停止' : 'シミュレーション再開'}
      >
        {simulationState.isRunning ? (
          <>
            <Pause className="w-3.5 h-3.5" />
            <span>一時停止</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>再生</span>
          </>
        )}
      </button>

      {/* Speed multiplier buttons */}
      <div className="flex items-center bg-[#0d1117] rounded-lg p-0.5 border border-[#30363d]">
        {[0.5, 1, 2].map((s) => (
          <button
            key={s}
            onClick={() => onSimulationStateChange((prev) => ({ ...prev, speedMultiplier: s }))}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              simulationState.speedMultiplier === s
                ? 'bg-[#388bfd] text-white font-bold'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Trails / Locus toggle */}
      <button
        onClick={() =>
          onSimulationStateChange((prev) => ({ ...prev, showTrails: !prev.showTrails }))
        }
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-all ${
          simulationState.showTrails
            ? 'bg-[#1f6feb]/20 border-[#388bfd] text-[#58a6ff]'
            : 'bg-transparent border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'
        }`}
        title="点Pの軌跡（動いた跡）を描画します"
      >
        <Route className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">軌跡</span>
      </button>

      {simulationState.showTrails && (
        <button
          onClick={onClearTrails}
          className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#f85149] hover:bg-[#30363d] transition-colors"
          title="軌跡をクリア"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Coordinate ticks toggle */}
      <button
        onClick={() =>
          onSimulationStateChange((prev) => ({
            ...prev,
            showGridCoordinates: !prev.showGridCoordinates,
          }))
        }
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-all ${
          simulationState.showGridCoordinates
            ? 'bg-[#21262d] border-[#58a6ff]/40 text-[#58a6ff]'
            : 'bg-transparent border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'
        }`}
        title="グリッド目盛り表示切替"
      >
        <Hash className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">目盛</span>
      </button>
    </div>
  );
};
