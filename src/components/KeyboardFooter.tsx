import React, { useState } from 'react';
import { cn } from '../lib/utils';

export function KeyboardFooter({ onCategorySelect, activeSymbol }: { onCategorySelect?: (sym: string) => void, activeSymbol?: string }) {
  const categoryMap: Record<number, string> = {
    0: '^GSPC', // Index
    1: '^TNX',  // Govt
    2: 'LQD',   // Corp
    3: 'MBB',   // Mtge
    4: 'BIL',   // M-Mkt
    5: 'MUB',   // Muni
    6: 'PFF',   // Pfd
    7: 'AAPL',  // Equity
    8: 'CL=F',  // Comdty
    9: 'EURUSD=X', // Currency
  };

  const activeBtn = Object.keys(categoryMap).find(key => categoryMap[Number(key)] === activeSymbol);
  const activeBtnIndex = activeBtn !== undefined ? Number(activeBtn) : null;

  const handleClick = (index: number) => {
    if (onCategorySelect && categoryMap[index]) {
      onCategorySelect(categoryMap[index]);
    }
  };

  return (
    <footer className="h-10 border-t border-border-subtle bg-bg-base flex items-center px-1 gap-1 shrink-0 select-none">
      <div className="flex-1 grid grid-cols-12 gap-1 h-7">
        {['Index','Govt','Corp','Mtge','M-Mkt','Muni'].map((lbl, i) => (
          <button 
            key={i} 
            onClick={() => handleClick(i)}
            className={cn("text-[8px] font-bold uppercase rounded-sm flex items-center justify-center transition-colors shadow-sm", activeBtnIndex === i ? 'bg-yellow-500/80 text-black border-yellow-500' : 'bg-yellow-600/20 border border-yellow-600/40 text-yellow-600 hover:bg-yellow-600/40 cursor-pointer active:bg-yellow-500/60')}
          >{lbl}</button>
        ))}
        {['Pfd','Equity','Comdty','Currency'].map((lbl, i) => {
          const index = i + 6;
          return (
            <button 
              key={index} 
              onClick={() => handleClick(index)}
              className={cn("text-[8px] font-bold uppercase rounded-sm flex items-center justify-center transition-colors shadow-sm", activeBtnIndex === index ? 'bg-blue-500/80 text-black border-blue-500' : 'bg-blue-600/20 border border-blue-600/40 text-blue-400 hover:bg-blue-600/40 cursor-pointer active:bg-blue-500/60')}
            >{lbl}</button>
          );
        })}
        <button 
          onClick={() => handleClick(10)} 
          className={cn("text-[8px] font-bold uppercase rounded-sm flex items-center justify-center transition-colors shadow-sm", activeBtnIndex === 10 ? 'bg-white text-black border-white' : 'bg-white/10 border border-border-subtle text-text-primary/60 hover:bg-white/20 cursor-pointer active:bg-white/40')}
        >Client</button>
        <button 
          onClick={() => handleClick(11)} 
          className={cn("text-[8px] font-bold uppercase rounded-sm flex items-center justify-center transition-colors shadow-sm", activeBtnIndex === 11 ? 'bg-red-500/80 text-text-primary border-red-500' : 'bg-red-900/40 border border-red-600 text-red-500 hover:bg-red-900/60 cursor-pointer active:bg-red-600/60')}
        >Cancel</button>
      </div>
      <div className="px-3 flex items-center gap-2 border-l border-border-subtle ml-2">
        <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-900 to-blue-500 opacity-50 flex items-center justify-center">
          <div className="w-3 h-4 border border-white/30 rounded-full"></div>
        </div>
        <span className="text-[8px] font-mono text-text-muted uppercase leading-none">Biometric<br/>Auth OK</span>
      </div>
    </footer>
  );
}
