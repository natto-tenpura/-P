import React, { useState, useEffect } from 'react';
import { POINT_COLOR_PALETTE } from '../types';
import { Check } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  initialName: string;
  initialColor?: string;
  onConfirm: (newName: string, newColor?: string) => void;
  onClose: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  initialName,
  initialColor = '#58a6ff',
  onConfirm,
  onClose,
}) => {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    setName(initialName);
    setColor(initialColor);
  }, [initialName, initialColor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim(), color);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xs bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-4 text-[#e6edf3]">
        <h3 className="text-sm font-semibold text-[#f0883e] mb-3 flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full inline-block border border-white/40 shadow-xs"
            style={{ backgroundColor: color }}
          />
          <span>点の名前と色を変更</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] text-[#8b949e] mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white focus:outline-none focus:border-[#58a6ff]"
              placeholder="点の名前を入力..."
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#8b949e] mb-1.5">色を選択</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {POINT_COLOR_PALETTE.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-transform ${
                    color.toLowerCase() === c.value.toLowerCase()
                      ? 'scale-110 border-white ring-2 ring-white/30'
                      : 'border-white/20 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {color.toLowerCase() === c.value.toLowerCase() && (
                    <Check className="w-3 h-3 text-white drop-shadow-md stroke-[3]" />
                  )}
                </button>
              ))}

              {/* Custom Color input */}
              <label
                className="w-6 h-6 rounded-full border border-white/30 overflow-hidden relative cursor-pointer hover:scale-105 flex items-center justify-center bg-[#0d1117]"
                title="カスタムカラー"
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="text-[10px] text-white/80 font-bold">＋</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 text-xs pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-[#30363d] bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d]"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-[#238636] text-white font-medium hover:bg-[#2ea043]"
            >
              保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
