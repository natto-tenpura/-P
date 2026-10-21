import React, { useState, useEffect } from 'react';

interface RenameModalProps {
  isOpen: boolean;
  initialName: string;
  onConfirm: (newName: string) => void;
  onClose: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  initialName,
  onConfirm,
  onClose,
}) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xs bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-4 text-[#e6edf3]">
        <h3 className="text-sm font-semibold text-[#f0883e] mb-2 flex items-center gap-1.5">
          <span>🏷️ 点の名前を変更</span>
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white focus:outline-none focus:border-[#58a6ff]"
            placeholder="点の名前を入力..."
          />
          <div className="flex justify-end gap-2 text-xs">
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
              変更する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
