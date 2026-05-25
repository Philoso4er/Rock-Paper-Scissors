import React from 'react';
import { Settings, Play, Pause, RotateCcw, Image as ImageIcon, Timer, Trophy, Users } from 'lucide-react';
import { EmojiType, GameSettings, EMOJI_MAP } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface UIProps {
  settings: GameSettings;
  counts: Record<EmojiType, number>;
  timeRemaining: number;
  isPaused: boolean;
  isGameOver: boolean;
  winner: EmojiType | 'draw' | null;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onTogglePause: () => void;
  onReset: () => void;
  onStart: () => void;
  isGameStarted: boolean;
}

const UI: React.FC<UIProps> = ({
  settings,
  counts,
  timeRemaining,
  isPaused,
  isGameOver,
  winner,
  onUpdateSettings,
  onTogglePause,
  onReset,
  onStart,
  isGameStarted,
}) => {
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpdateSettings({ background: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const defaultBackgrounds = [
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000',
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col p-6">
      {/* HUD - Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex gap-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20">
          {Object.entries(counts).map(([type, count]) => (
            <div key={type} className="flex flex-col items-center min-w-[60px]">
              <span className="text-2xl">{EMOJI_MAP[type as EmojiType]}</span>
              <span className="font-mono font-bold text-lg">{count}</span>
            </div>
          ))}
        </div>

        {settings.mode === 'timed' && isGameStarted && !isGameOver && (
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 flex items-center gap-3">
            <Timer className="w-6 h-6 text-indigo-600" />
            <span className="font-mono font-bold text-2xl">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          {isGameStarted && !isGameOver && (
            <button
              onClick={onTogglePause}
              className="p-3 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/20 hover:bg-white transition-colors"
            >
              {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
            </button>
          )}
          <button
            onClick={onReset}
            className="p-3 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/20 hover:bg-white transition-colors"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto z-50"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border border-white/20">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Battle Over!</h2>
              <p className="text-xl mb-6">
                {winner === 'draw' ? (
                  "It's a Draw!"
                ) : (
                  <>
                    Winner: <span className="text-4xl">{EMOJI_MAP[winner as EmojiType]}</span>
                  </>
                )}
              </p>
              <button
                onClick={onReset}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel - Left Side */}
      <AnimatePresence>
        {!isGameStarted && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="mt-auto mb-auto w-full max-w-md bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 pointer-events-auto overflow-y-auto max-h-[80vh]"
          >
            <div className="flex items-center gap-3 mb-8">
              <Settings className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold tracking-tight">Battle Settings</h1>
            </div>

            <div className="space-y-8">
              {/* Emoji Counts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Starting Numbers
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateSettings({ rockCount: 20, paperCount: 20, scissorsCount: 20 })}
                      className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Even
                    </button>
                    <button
                      onClick={() => onUpdateSettings({
                        rockCount: Math.floor(Math.random() * 40) + 10,
                        paperCount: Math.floor(Math.random() * 40) + 10,
                        scissorsCount: Math.floor(Math.random() * 40) + 10
                      })}
                      className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Random
                    </button>
                  </div>
                </div>
                {(['rock', 'paper', 'scissors'] as EmojiType[]).map((type) => (
                  <div key={type} className="flex items-center gap-4">
                    <span className="text-2xl w-8">{EMOJI_MAP[type]}</span>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={settings[`${type}Count` as keyof GameSettings] as number}
                      onChange={(e) => onUpdateSettings({ [`${type}Count`]: parseInt(e.target.value) })}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="font-mono font-bold w-8 text-right">
                      {settings[`${type}Count` as keyof GameSettings] as number}
                    </span>
                  </div>
                ))}
              </div>

              {/* Game Mode */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Match Mode</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onUpdateSettings({ mode: 'last-man-standing' })}
                    className={`p-4 rounded-2xl border-2 transition-all text-sm font-bold ${
                      settings.mode === 'last-man-standing'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    Last Standing
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ mode: 'timed' })}
                    className={`p-4 rounded-2xl border-2 transition-all text-sm font-bold ${
                      settings.mode === 'timed'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    Timed Match
                  </button>
                </div>
                {settings.mode === 'timed' && (
                  <div className="flex items-center gap-4 pt-2">
                    <Timer className="w-5 h-5 text-gray-400" />
                    <input
                      type="range"
                      min="10"
                      max="300"
                      step="10"
                      value={settings.timeLimit}
                      onChange={(e) => onUpdateSettings({ timeLimit: parseInt(e.target.value) })}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="font-mono font-bold w-12">{settings.timeLimit}s</span>
                  </div>
                )}
              </div>

              {/* Backgrounds */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Battle Background
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  <label className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                    <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </label>
                  <button
                    onClick={() => onUpdateSettings({ background: null })}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 ${
                      !settings.background ? 'border-indigo-600' : 'border-transparent'
                    } bg-gray-100`}
                  />
                  {defaultBackgrounds.map((bg, i) => (
                    <button
                      key={i}
                      onClick={() => onUpdateSettings({ background: bg })}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden ${
                        settings.background === bg ? 'border-indigo-600' : 'border-transparent'
                      }`}
                    >
                      <img src={bg} alt="bg" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed Control */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Simulation Speed</h3>
                <div className="flex items-center gap-4">
                  <Play className="w-5 h-5 text-gray-400" />
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={settings.speed}
                    onChange={(e) => onUpdateSettings({ speed: parseFloat(e.target.value) })}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="font-mono font-bold w-12">{settings.speed}x</span>
                </div>
              </div>

              <button
                onClick={onStart}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6 fill-current" />
                START BATTLE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UI;
