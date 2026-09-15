import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Filter, Layers, List, Table, Grid, GitBranch, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const mockScreenerData = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 173.50, change: 1.2, pe: 28.5, rsi: 55, volumeSurge: false, sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 405.20, change: -0.5, pe: 35.2, rsi: 61, volumeSurge: false, sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 175.34, change: -3.2, pe: 42.1, rsi: 28, volumeSurge: true, sector: 'Consumer Cyclical' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 880.08, change: 4.5, pe: 73.4, rsi: 72, volumeSurge: true, sector: 'Technology' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 165.23, change: 2.1, pe: 45.6, rsi: 58, volumeSurge: false, sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 505.10, change: 0.8, pe: 25.3, rsi: 48, volumeSurge: false, sector: 'Communication Services' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 180.20, change: -1.2, pe: 65.4, rsi: 45, volumeSurge: false, sector: 'Consumer Cyclical' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 195.40, change: 0.5, pe: 11.2, rsi: 65, volumeSurge: false, sector: 'Financials' },
  { symbol: 'BAC', name: 'Bank of America', price: 37.50, change: 1.1, pe: 10.5, rsi: 68, volumeSurge: false, sector: 'Financials' },
  { symbol: 'DIS', name: 'Walt Disney Co.', price: 115.30, change: -0.8, pe: 22.4, rsi: 35, volumeSurge: false, sector: 'Communication Services' },
];

const mockOptionsChain = [
  { strike: 170, callBid: 4.50, callAsk: 4.60, callVol: '12k', callOi: '45k', callIv: '24%', putBid: 1.20, putAsk: 1.25, putVol: '5k', putOi: '15k', putIv: '26%' },
  { strike: 172.5, callBid: 2.80, callAsk: 2.85, callVol: '25k', callOi: '80k', callIv: '23%', putBid: 2.10, putAsk: 2.15, putVol: '18k', putOi: '35k', putIv: '25%' },
  { strike: 175, callBid: 1.40, callAsk: 1.45, callVol: '45k', callOi: '120k', callIv: '22%', putBid: 3.50, putAsk: 3.60, putVol: '30k', putOi: '65k', putIv: '24%' },
  { strike: 177.5, callBid: 0.60, callAsk: 0.65, callVol: '18k', callOi: '60k', callIv: '22%', putBid: 5.40, putAsk: 5.50, putVol: '8k', putOi: '25k', putIv: '26%' },
  { strike: 180, callBid: 0.25, callAsk: 0.28, callVol: '8k', callOi: '40k', callIv: '23%', putBid: 7.60, putAsk: 7.80, putVol: '3k', putOi: '18k', putIv: '28%' },
];

const mockOrderBookData = {
  bids: [
    { price: 173.45, size: 450 },
    { price: 173.40, size: 1250 },
    { price: 173.35, size: 800 },
    { price: 173.30, size: 2500 },
    { price: 173.25, size: 150 },
  ],
  asks: [
    { price: 173.55, size: 300 },
    { price: 173.60, size: 850 },
    { price: 173.65, size: 1200 },
    { price: 173.70, size: 4000 },
    { price: 173.75, size: 500 },
  ]
};

const correlationAssets = ['AAPL', 'MSFT', 'TSLA', 'SPY', 'QQQ', 'BTC'];
const correlationMatrixData = [
  [1.00, 0.85, 0.45, 0.92, 0.95, 0.25],
  [0.85, 1.00, 0.38, 0.88, 0.91, 0.20],
  [0.45, 0.38, 1.00, 0.65, 0.70, 0.48],
  [0.92, 0.88, 0.65, 1.00, 0.98, 0.35],
  [0.95, 0.91, 0.70, 0.98, 1.00, 0.38],
  [0.25, 0.20, 0.48, 0.35, 0.38, 1.00],
];

export function ScreenerPanel({ activeSymbol = "AAPL" }: { activeSymbol?: string }) {
  const [activeTab, setActiveTab] = useState<'screener' | 'options' | 'orderflow' | 'correlation'>('screener');
  const [filterPe, setFilterPe] = useState(false);
  const [filterRsi, setFilterRsi] = useState(false);
  const [filterVol, setFilterVol] = useState(false);
  const [orderBook, setOrderBook] = useState(mockOrderBookData);
  const [lastPrice, setLastPrice] = useState(173.50);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down'>('up');

  const [optionsChain, setOptionsChain] = useState(mockOptionsChain);
  const [sectorData, setSectorData] = useState([
    { name: 'Technology', change: 2.4, col: 2, row: 2 },
    { name: 'Financials', change: -1.2, col: 1, row: 1 },
    { name: 'Energy', change: 0.0, col: 1, row: 1 },
    { name: 'Healthcare', change: 1.5, col: 1, row: 1 },
    { name: 'Consumer', change: -2.1, col: 2, row: 1 },
  ]);

  useEffect(() => {
    if (activeTab !== 'orderflow' && activeTab !== 'options') return;
    
    let isUp = true;
    const interval = setInterval(() => {
      if (activeTab === 'orderflow') {
        setOrderBook(prev => {
          // Randomly adjust sizes to simulate flow
          const newBids = prev.bids.map(b => ({ ...b, size: Math.max(10, b.size + (Math.random() - 0.5) * 500) }));
          const newAsks = prev.asks.map(a => ({ ...a, size: Math.max(10, a.size + (Math.random() - 0.5) * 500) }));
          return { bids: newBids, asks: newAsks };
        });

        // Flash Heatmap
        setSectorData(prev => prev.map(s => ({
          ...s,
          change: s.change + (Math.random() - 0.5) * 0.2
        })));
      }

      if (activeTab === 'options') {
        setOptionsChain(prev => prev.map(row => ({
          ...row,
          callBid: Math.max(0.01, row.callBid + (Math.random() - 0.5) * 0.1),
          callAsk: Math.max(0.01, row.callAsk + (Math.random() - 0.5) * 0.1),
          putBid: Math.max(0.01, row.putBid + (Math.random() - 0.5) * 0.1),
          putAsk: Math.max(0.01, row.putAsk + (Math.random() - 0.5) * 0.1),
        })));
      }
      
      if (Math.random() > 0.7) {
         setLastPrice(prev => {
           const change = (Math.random() > 0.5 ? 1 : -1) * 0.05;
           const next = prev + change;
           isUp = change > 0;
           setPriceDirection(isUp ? 'up' : 'down');
           return next;
         });
      }
    }, 400); // Update every 400ms for that realistic "live" feel

    return () => clearInterval(interval);
  }, [activeTab]);

  const getFilteredData = () => {
    let data = [...mockScreenerData];
    if (filterPe) data = data.filter(d => d.pe < 25);
    if (filterRsi) data = data.filter(d => d.rsi < 40);
    if (filterVol) data = data.filter(d => d.volumeSurge);
    return data;
  };

  const filteredData = getFilteredData();

  return (
    <div className="flex flex-col h-full bg-bg-base flex-1 relative rounded border border-border-subtle overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-border-subtle bg-bg-panel shrink-0 p-1 gap-1">
        <button 
          onClick={() => setActiveTab('screener')}
          className={cn("px-3 py-1.5 text-xs font-mono rounded flex-1 flex items-center justify-center gap-2 transition-colors", activeTab === 'screener' ? 'bg-blue-600 outline outline-1 outline-blue-400 text-white' : 'text-text-muted hover:bg-white/5 hover:text-text-primary')}
        >
          <Filter className="w-3.5 h-3.5" /> SCREENER
        </button>
        <button 
          onClick={() => setActiveTab('options')}
          className={cn("px-3 py-1.5 text-xs font-mono rounded flex-1 flex items-center justify-center gap-2 transition-colors", activeTab === 'options' ? 'bg-blue-600 outline outline-1 outline-blue-400 text-white' : 'text-text-muted hover:bg-white/5 hover:text-text-primary')}
        >
          <Layers className="w-3.5 h-3.5" /> OPTIONS CHAIN
        </button>
        <button 
          onClick={() => setActiveTab('orderflow')}
          className={cn("px-3 py-1.5 text-xs font-mono rounded flex-1 flex items-center justify-center gap-2 transition-colors", activeTab === 'orderflow' ? 'bg-blue-600 outline outline-1 outline-blue-400 text-white' : 'text-text-muted hover:bg-white/5 hover:text-text-primary')}
        >
          <Table className="w-3.5 h-3.5" /> HEATMAP & FLOW
        </button>
        <button 
          onClick={() => setActiveTab('correlation')}
          className={cn("px-3 py-1.5 text-xs font-mono rounded flex-1 flex items-center justify-center gap-2 transition-colors", activeTab === 'correlation' ? 'bg-blue-600 outline outline-1 outline-blue-400 text-white' : 'text-text-muted hover:bg-white/5 hover:text-text-primary')}
        >
          <Grid className="w-3.5 h-3.5" /> CORRELATION
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        
        {/* SCREENER TAB */}
        {activeTab === 'screener' && (
          <div className="flex flex-col h-full">
            <div className="p-2 border-b border-white/5 bg-black/20 flex gap-2 w-full overflow-x-auto shrink-0">
              <button onClick={() => setFilterPe(!filterPe)} className={cn("px-2 py-1 text-[10px] font-mono rounded border whitespace-nowrap", filterPe ? "bg-amber-500/20 text-amber-500 border-amber-500/50" : "bg-bg-panel text-text-muted border-border-subtle hover:text-text-primary")}>P/E {'<'} 25</button>
              <button onClick={() => setFilterRsi(!filterRsi)} className={cn("px-2 py-1 text-[10px] font-mono rounded border whitespace-nowrap", filterRsi ? "bg-red-500/20 text-red-500 border-red-500/50" : "bg-bg-panel text-text-muted border-border-subtle hover:text-text-primary")}>RSI Oversold ({'<'} 40)</button>
              <button onClick={() => setFilterVol(!filterVol)} className={cn("px-2 py-1 text-[10px] font-mono rounded border whitespace-nowrap", filterVol ? "bg-blue-500/20 text-blue-400 border-blue-500/50" : "bg-bg-panel text-text-muted border-border-subtle hover:text-text-primary")}>Volume Surge (2x)</button>
              <button className="px-2 py-1 text-[10px] font-mono rounded border bg-bg-panel text-text-muted border-border-subtle hover:text-text-primary ml-auto whitespace-nowrap"><Filter className="w-3 h-3 inline mr-1"/> CUSTOM</button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs font-mono text-left whitespace-nowrap">
                <thead className="sticky top-0 bg-bg-panel text-[10px] text-text-muted border-b border-border-subtle z-10">
                  <tr>
                    <th className="px-3 py-2 font-normal">Symbol</th>
                    <th className="px-3 py-2 font-normal">Name</th>
                    <th className="px-3 py-2 font-normal text-right">Price</th>
                    <th className="px-3 py-2 font-normal text-right">% Chg</th>
                    <th className="px-3 py-2 font-normal text-right">P/E</th>
                    <th className="px-3 py-2 font-normal text-right">RSI(14)</th>
                    <th className="px-3 py-2 font-normal text-center">Vol Surge</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(d => (
                    <tr key={d.symbol} className="border-b border-white/5 hover:bg-white/5 cursor-pointer">
                      <td className="px-3 py-1.5 font-bold text-blue-400">{d.symbol}</td>
                      <td className="px-3 py-1.5 text-text-primary/70">{d.name}</td>
                      <td className="px-3 py-1.5 text-right">{d.price.toFixed(2)}</td>
                      <td className={cn("px-3 py-1.5 text-right", d.change >= 0 ? "text-green-500" : "text-red-500")}>{d.change > 0 ? '+' : ''}{d.change}%</td>
                      <td className="px-3 py-1.5 text-right">{d.pe.toFixed(1)}</td>
                      <td className={cn("px-3 py-1.5 text-right", d.rsi < 40 ? "text-red-400" : d.rsi > 70 ? "text-green-400" : "")}>{d.rsi}</td>
                      <td className="px-3 py-1.5 text-center">{d.volumeSurge ? <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span> : <span className="inline-block w-2 h-2 rounded-full bg-border-subtle"></span>}</td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-text-muted">No matches found for selected filters</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OPTIONS CHAIN TAB */}
        {activeTab === 'options' && (
          <div className="flex flex-col h-full bg-black/40">
            <div className="p-2 border-b border-white/5 flex gap-2 items-center text-xs font-mono justify-between">
              <div>
                <span className="text-text-muted">Underlying: </span><strong className="text-white">{activeSymbol} @ {lastPrice.toFixed(2)}</strong>
              </div>
              <div className="flex gap-2">
                <select className="bg-bg-panel border border-border-subtle rounded px-2 py-1 text-[10px] text-text-primary outline-none">
                  <option>19 May 2026 (12d)</option>
                  <option>16 Jun 2026 (40d)</option>
                  <option>21 Jul 2026 (75d)</option>
                </select>
                <select className="bg-bg-panel border border-border-subtle rounded px-2 py-1 text-[10px] text-text-primary outline-none">
                  <option>Strikes: 10</option>
                  <option>Strikes: 20</option>
                  <option>Strikes: All</option>
                </select>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[10px] font-mono text-right whitespace-nowrap">
                <thead className="sticky top-0 bg-bg-panel z-10 shadow-md border-b border-border-subtle">
                  <tr>
                    <th colSpan={5} className="py-1 px-2 border-r border-border-subtle text-center text-green-500/80 bg-green-500/5">CALLS</th>
                    <th className="py-1 px-2 text-center text-text-primary bg-bg-panel border-r border-border-subtle w-[80px]">STRIKE</th>
                    <th colSpan={5} className="py-1 px-2 text-center text-red-500/80 bg-red-500/5">PUTS</th>
                  </tr>
                  <tr className="text-text-muted border-t border-white/5">
                    <th className="py-1 px-2 font-normal">IV</th>
                    <th className="py-1 px-2 font-normal">Vol</th>
                    <th className="py-1 px-2 font-normal">OI</th>
                    <th className="py-1 px-2 font-normal border-l border-white/5 bg-white/5 text-text-primary">Bid</th>
                    <th className="py-1 px-2 font-normal border-r border-border-subtle bg-white/5 text-text-primary">Ask</th>
                    <th className="py-1 px-2 font-normal border-r border-border-subtle bg-bg-base/50"></th>
                    <th className="py-1 px-2 font-normal bg-white/5 text-text-primary">Bid</th>
                    <th className="py-1 px-2 font-normal border-r border-white/5 bg-white/5 text-text-primary">Ask</th>
                    <th className="py-1 px-2 font-normal">Vol</th>
                    <th className="py-1 px-2 font-normal">OI</th>
                    <th className="py-1 px-2 font-normal">IV</th>
                  </tr>
                </thead>
                <tbody>
                  {optionsChain.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 relative group">
                      <td className="py-1.5 px-2 text-text-muted">{row.callIv}</td>
                      <td className="py-1.5 px-2 text-text-primary">{row.callVol}</td>
                      <td className="py-1.5 px-2 text-text-muted">{row.callOi}</td>
                      <td className="py-1.5 px-2 border-l border-white/5 font-bold cursor-pointer hover:bg-green-500/20 text-green-400 transition-colors">{row.callBid.toFixed(2)}</td>
                      <td className="py-1.5 px-2 border-r border-border-subtle font-bold cursor-pointer hover:bg-red-500/20 text-red-400 transition-colors">{row.callAsk.toFixed(2)}</td>
                      
                      <td className={cn("py-1.5 px-2 text-center font-bold border-r border-border-subtle", row.strike <= lastPrice ? "bg-amber-500/10 text-amber-500" : "bg-bg-panel text-white")}>{row.strike.toFixed(1)}</td>
                      
                      <td className="py-1.5 px-2 font-bold cursor-pointer hover:bg-green-500/20 text-green-400 transition-colors">{row.putBid.toFixed(2)}</td>
                      <td className="py-1.5 px-2 border-r border-white/5 font-bold cursor-pointer hover:bg-red-500/20 text-red-400 transition-colors">{row.putAsk.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-text-primary">{row.putVol}</td>
                      <td className="py-1.5 px-2 text-text-muted">{row.putOi}</td>
                      <td className="py-1.5 px-2 text-text-muted">{row.putIv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDER FLOW / HEATMAP */}
        {activeTab === 'orderflow' && (
          <div className="h-full flex flex-col xl:flex-row gap-2 p-2">
            <div className="flex-1 flex flex-col border border-border-subtle rounded bg-black overflow-hidden relative group">
              <div className="absolute inset-0 p-1 grid grid-cols-3 grid-rows-3 gap-1">
                {sectorData.map((sector) => {
                  const isPos = sector.change >= 0;
                  const intensity = Math.min(100, Math.abs(sector.change) * 30);
                  const bgColor = isPos ? `rgba(34, 197, 94, ${intensity / 100})` : `rgba(239, 68, 68, ${intensity / 100})`;
                  return (
                    <div 
                      key={sector.name} 
                      className={`col-span-${sector.col} row-span-${sector.row} rounded relative flex items-center justify-center shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] transition-colors duration-500`}
                      style={{ backgroundColor: bgColor }}
                    >
                      <div className="flex flex-col items-center">
                        <span className={`font-bold text-xs ${sector.col > 1 ? 'md:text-xl' : 'md:text-sm'} text-white mix-blend-difference`}>{sector.name}</span>
                        <span className="font-mono text-white/80 text-xs mix-blend-difference">{sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="w-[280px] shrink-0 border border-border-subtle rounded bg-bg-panel overflow-hidden flex flex-col text-xs font-mono">
              <div className="bg-black text-[10px] text-text-muted p-1 text-center border-b border-border-subtle font-bold tracking-widest uppercase">Order Book: {activeSymbol}</div>
              <div className="flex-1 flex flex-col justify-end gap-0.5 p-1 relative">
                <div className="absolute inset-0 opacity-10 flex flex-col pointer-events-none">
                  {orderBook.asks.map((a,i) => <div key={i} className="flex-1 flex justify-end items-center"><div className="bg-red-500 h-full transition-all duration-300" style={{width: `${Math.min(100, a.size/40)}%`, opacity: 0.8}}></div></div>).reverse()}
                  <div className="h-4"></div>
                  {orderBook.bids.map((b,i) => <div key={i} className="flex-1 flex justify-end items-center"><div className="bg-green-500 h-full transition-all duration-300" style={{width: `${Math.min(100, b.size/40)}%`, opacity: 0.8}}></div></div>)}
                </div>
                {orderBook.asks.map((a,i) => (
                  <div key={i} className="flex justify-between px-2 text-red-400 items-center h-full">
                    <span>{a.price.toFixed(2)}</span>
                    <span className="text-white relative">
                      <span className="font-mono">{Math.floor(a.size)}</span>
                    </span>
                  </div>
                )).reverse()}
                <div className={cn("text-center py-1 font-bold border-y border-white/10 my-1 transition-colors z-10 flex items-center justify-center gap-1", priceDirection === 'up' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10')}>
                  {lastPrice.toFixed(2)} 
                  {priceDirection === 'up' ? <ArrowUpRight className="w-3 h-3 inline animate-pulse"/> : <ArrowDownRight className="w-3 h-3 inline animate-pulse"/>}
                </div>
                {orderBook.bids.map((b,i) => (
                  <div key={i} className="flex justify-between px-2 text-green-400 items-center h-full">
                    <span>{b.price.toFixed(2)}</span>
                    <span className="text-white relative">
                       <span className="font-mono">{Math.floor(b.size)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CORRELATION MATRIX */}
        {activeTab === 'correlation' && (() => {
          const dynamicCorrelationAssets = [activeSymbol, ...correlationAssets.filter(a => a !== activeSymbol).slice(0, 5)];
          return (
          <div className="p-4 flex items-center justify-center h-full">
             <div className="bg-bg-panel border border-border-subtle rounded inline-block overflow-hidden">
               <div className="p-2 border-b border-white/5 bg-black/40 text-xs font-bold font-mono tracking-widest text-center text-text-muted">1-Year Matrix Context ({activeSymbol})</div>
               <table className="font-mono text-xs">
                 <thead>
                   <tr>
                     <th className="p-2 border-b border-r border-white/5 bg-black/20"></th>
                     {dynamicCorrelationAssets.map(a => <th key={a} className="p-2 border-b border-white/5 bg-black/20 text-text-muted px-4">{a}</th>)}
                   </tr>
                 </thead>
                 <tbody>
                   {dynamicCorrelationAssets.map((rowAsset, i) => (
                     <tr key={rowAsset}>
                       <th className="p-2 border-r border-white/5 bg-black/20 text-text-muted hover:text-white transition-colors">{rowAsset}</th>
                       {dynamicCorrelationAssets.map((colAsset, j) => {
                         const val = correlationMatrixData[i][j];
                         // Color mapping: 1.0 = green, 0.5 = dark green, <0 = red
                         const bgColor = val === 1 ? 'rgba(0, 200, 150, 0.4)' : 
                                       val > 0.8 ? 'rgba(0, 200, 150, 0.2)' : 
                                       val > 0.5 ? 'rgba(0, 200, 150, 0.1)' : 
                                       val < 0.3 ? 'rgba(255, 71, 87, 0.1)' : 'transparent';
                         
                         return (
                           <td key={colAsset} className="p-2 text-center border-t border-l border-white/5 hover:bg-white/10 transition-colors" style={{backgroundColor: bgColor}}>
                             {val.toFixed(2)}
                           </td>
                         );
                       })}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}
