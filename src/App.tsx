import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Target, Zap, Globe, RefreshCw, Trophy, AlertTriangle } from 'lucide-react';
import GameEngine from './components/GameEngine';
import { GameState, Battery } from './types';
import { STRINGS } from './constants';
import { getGameIntro } from './services/geminiService';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [score, setScore] = useState(0);
  const [aiIntro, setAiIntro] = useState('');
  const [batteries, setBatteries] = useState<Battery[]>([]);

  const t = STRINGS[lang];

  useEffect(() => {
    getGameIntro(lang).then(setAiIntro);
  }, [lang]);

  const handleStart = () => {
    setGameState('PLAYING');
    setScore(0);
  };

  const handleGameOver = (won: boolean) => {
    setGameState(won ? 'WON' : 'LOST');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-emerald-500/30">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'START' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="mb-8 p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl"
            >
              <Shield className="w-20 h-20 text-emerald-400" />
            </motion.div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 uppercase italic">
              {t.title}
            </h1>

            <div className="max-w-2xl mb-12 space-y-6">
              <p className="text-xl text-white/60 font-light leading-relaxed">
                {aiIntro || t.intro}
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-xs font-mono uppercase tracking-widest text-white/40">
                <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
                  <Target className="w-3 h-3" /> {lang === 'zh' ? '精准打击' : 'Precision Strike'}
                </span>
                <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
                  <Zap className="w-3 h-3" /> {lang === 'zh' ? '快速反应' : 'Rapid Response'}
                </span>
                <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
                  <Globe className="w-3 h-3" /> {lang === 'zh' ? '全球防御' : 'Global Defense'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleStart}
                className="group relative px-12 py-4 bg-emerald-500 text-black font-bold text-xl rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                <span className="relative">{t.start}</span>
              </button>
              
              <button
                onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')}
                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-full hover:bg-white/10 transition-all"
              >
                {lang === 'zh' ? 'English' : '中文'}
              </button>
            </div>
            
            <p className="mt-12 text-sm text-white/30 max-w-md italic">
              {t.instructions}
            </p>
          </motion.div>
        )}

        {gameState === 'PLAYING' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-screen flex flex-col"
          >
            {/* HUD */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 pointer-events-none">
              <div className="space-y-1">
                <div className="text-xs font-mono text-white/40 uppercase tracking-widest">{t.score}</div>
                <div className="text-4xl font-black italic tracking-tighter text-emerald-400">{score.toString().padStart(4, '0')}</div>
              </div>
              
              <div className="flex gap-4">
                {batteries.map(b => (
                  <div key={b.id} className={`p-3 rounded-xl border backdrop-blur-md transition-all ${b.destroyed ? 'bg-red-500/10 border-red-500/20 opacity-50' : 'bg-white/5 border-white/10'}`}>
                    <div className="text-[10px] font-mono text-white/40 uppercase mb-1">{b.id}</div>
                    <div className="flex items-end gap-1">
                      <div className="text-2xl font-bold leading-none">{b.ammo}</div>
                      <div className="text-[10px] text-white/20 mb-0.5">/ {b.maxAmmo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 relative">
              <GameEngine 
                gameState={gameState} 
                onScoreChange={setScore} 
                onGameOver={handleGameOver}
                onAmmoUpdate={setBatteries}
              />
            </div>
          </motion.div>
        )}

        {(gameState === 'WON' || gameState === 'LOST') && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <div className="max-w-md w-full p-12 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-2xl text-center">
              <div className={`inline-flex p-6 rounded-full mb-8 ${gameState === 'WON' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {gameState === 'WON' ? <Trophy className="w-16 h-16" /> : <AlertTriangle className="w-16 h-16" />}
              </div>
              
              <h2 className="text-4xl font-black italic mb-4 uppercase tracking-tighter">
                {gameState === 'WON' ? t.win : t.loss}
              </h2>
              
              <div className="mb-12">
                <div className="text-sm font-mono text-white/40 uppercase tracking-widest mb-1">{t.score}</div>
                <div className="text-6xl font-black italic text-white">{score}</div>
              </div>

              <button
                onClick={handleStart}
                className="w-full group relative py-5 bg-white text-black font-bold text-xl rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
              >
                <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                <span>{t.restart}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
