import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const MatrixDigitalRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'; // Blue text
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-5" />;
};

export const LoadingScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [equitiesDone, setEquitiesDone] = useState(false);
  const [fxDone, setFxDone] = useState(false);
  const [commoditiesDone, setCommoditiesDone] = useState(false);
  const [fedDone, setFedDone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setEquitiesDone(true), 500);
    const t2 = setTimeout(() => setFxDone(true), 1000);
    const t3 = setTimeout(() => setCommoditiesDone(true), 1500);
    const t4 = setTimeout(() => setFedDone(true), 2000);
    const t5 = setTimeout(() => onComplete(), 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    }
  }, [onComplete]);

  const title = "ARBANALYTICS";
  
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[100] overflow-hidden font-mono"
    >
      <MatrixDigitalRain />

      <div className="z-10 flex flex-col items-center max-w-2xl w-full px-4">
        <div className="relative mb-8 flex items-center gap-4">
          <div className="w-12 h-12 border-2 border-blue-500 flex items-center justify-center bg-blue-500/10 font-bold text-blue-500 text-2xl">Δ</div>
          {/* Logo */}
          <div className="flex font-bold text-4xl tracking-[0.2em] relative overflow-hidden text-transparent bg-clip-text bg-white">
            {title.split('').map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.1, delay: index * 0.05 }}
                className={char === ' ' ? 'w-4' : ''}
              >
                {char}
              </motion.span>
            ))}
            
            {/* Scanline Effect */}
            <motion.div
              initial={{ top: '-10%' }}
              animate={{ top: '110%' }}
              transition={{ duration: 2, ease: "linear", repeat: Infinity }}
              className="absolute left-0 right-0 h-[2px] bg-blue-400 shadow-[0_0_10px_2px_rgba(59,130,246,0.7)] z-20 pointer-events-none"
            />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-text-muted text-sm space-y-4 w-full max-w-md"
        >
          <div className="flex items-center gap-2 animate-pulse text-blue-400 font-bold text-xs tracking-widest uppercase">
            Connecting to markets...
          </div>
          
          <div className="flex justify-between items-center text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5">
              <span>Equities</span>
              <span className={cn("font-bold transition-colors", equitiesDone ? "text-blue-500" : "text-text-muted/30")}>
                {equitiesDone ? '✓' : '...'}
              </span>
            </div>
            <div className="w-px h-3 bg-white/20"></div>
            <div className="flex items-center gap-1.5">
              <span>FX</span>
              <span className={cn("font-bold transition-colors", fxDone ? "text-blue-500" : "text-text-muted/30")}>
                {fxDone ? '✓' : '...'}
              </span>
            </div>
            <div className="w-px h-3 bg-white/20"></div>
            <div className="flex items-center gap-1.5">
              <span>Commodities</span>
              <span className={cn("font-bold transition-colors", commoditiesDone ? "text-blue-500" : "text-text-muted/30")}>
                {commoditiesDone ? '✓' : '...'}
              </span>
            </div>
            <div className="w-px h-3 bg-white/20"></div>
            <div className="flex items-center gap-1.5">
              <span>Fed Data</span>
              <span className={cn("font-bold transition-colors", fedDone ? "text-blue-500" : "text-text-muted/30")}>
                {fedDone ? '✓' : '...'}
              </span>
            </div>
          </div>
          
          {/* Main progress bar line */}
          <div className="w-full h-[1px] bg-white/10 mt-4 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.2, ease: "linear" }}
              className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
