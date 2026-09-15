import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useMarketData } from '../hooks/useMarketData';
import { Settings2, BarChart2, LineChart as LineChartIcon, Activity, PenTool, Move, ArrowUpRight, AlignJustify, TrendingUp, Layers } from 'lucide-react';
import { cn } from '../lib/utils';

const timeframes = [
  { label: '1D', range: '1d', interval: '1m' },
  { label: '5D', range: '5d', interval: '5m' },
  { label: '1M', range: '1mo', interval: '15m' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' },
  { label: '5Y', range: '5y', interval: '1wk' },
];

const CustomCandlestick = (props: any) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? '#00C896' : '#FF4757';
  
  const diff = Math.abs(close - open);
  const pxPerUnit = height / Math.max(diff, 0.0001);
  const maxOC = Math.max(open, close);
  
  const highY = y - (high - maxOC) * pxPerUnit;
  const lowY = y + height + ((Math.min(open, close) - low) * pxPerUnit);
  const bodyHeight = Math.max(height, 1);
  
  return (
    <g>
      <line x1={x + width / 2} y1={highY} x2={x + width / 2} y2={lowY} stroke={color} strokeWidth={1} />
      <rect x={x} y={y} width={width} height={bodyHeight} fill={isUp ? 'transparent' : color} stroke={color} strokeWidth={1} />
    </g>
  );
};

export function MainChart({ symbol = "AAPL" }: { symbol?: string }) {
  const [tf, setTf] = useState(timeframes[0]);
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar' | 'candlestick'>('candlestick');
  const [visibleRange, setVisibleRange] = useState<{ start: number, end: number } | null>(null);
  
  const [activeTool, setActiveTool] = useState<'cursor' | 'pan' | 'trendline' | 'fib'>('cursor');
  const [drawings, setDrawings] = useState<any[]>([]);
  const [currentDraw, setCurrentDraw] = useState<any>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  
  const aaplData = useMarketData(symbol, tf.range, tf.interval);

  // Reset zoom on symbol/tf change
  useEffect(() => {
    setVisibleRange(null);
    setDrawings([]);
  }, [symbol, tf]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTool('cursor');
        setCurrentDraw(null);
      } else if (e.key.toLowerCase() === 'v') setActiveTool('cursor');
      else if (e.key.toLowerCase() === 'h') setActiveTool('pan');
      else if (e.key.toLowerCase() === 't') setActiveTool('trendline');
      else if (e.key.toLowerCase() === 'f') setActiveTool('fib');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!aaplData.history.length) return;
    let { start, end } = visibleRange || { start: 0, end: aaplData.history.length };
    const currentLen = end - start;

    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      e.preventDefault();
      const zoomAmount = Math.max(1, Math.floor(currentLen * 0.1 * (e.deltaY > 0 ? 1 : -1)));
      start -= zoomAmount;
      end += zoomAmount;
      if (end - start < 10 && e.deltaY < 0) return;
    } else {
      const actualPan = e.deltaX !== 0 ? Math.floor(e.deltaX / 3) : Math.floor(e.deltaY / 3);
      start += actualPan;
      end += actualPan;
    }

    if (start < 0) {
      end -= start;
      start = 0;
    }
    if (end > aaplData.history.length) {
      const diff = end - aaplData.history.length;
      start -= diff;
      end = aaplData.history.length;
    }
    start = Math.max(0, start);
    end = Math.min(aaplData.history.length, end);
    setVisibleRange({ start, end });
  }, [aaplData.history.length, visibleRange]);

  const handleChartClick = (e: any) => {
    if (!e || !e.activePayload) return;
    const pt = e.activePayload[0].payload;
    const clickPoint = { label: pt.label, price: pt.close }; // Or snap to high/low if near

    if (activeTool === 'trendline' || activeTool === 'fib') {
      if (!currentDraw) {
        setCurrentDraw({ type: activeTool, start: clickPoint });
      } else {
        setDrawings([...drawings, { ...currentDraw, end: clickPoint, id: Date.now() }]);
        setCurrentDraw(null);
        setActiveTool('cursor');
      }
    }
  };

  const handleChartMouseMove = (e: any) => {
    if (e && e.activePayload) {
      setHoveredPoint(e.activePayload[0].payload);
    } else {
      setHoveredPoint(null);
    }
  };
  
  const rawChartData = useMemo(() => {
    return aaplData.history.map((d, i, arr) => {
      let pt: any = { ...d, label: (tf.range === '1d' || tf.range === '5d') ? d.time.slice(0, 5) : d.date };
      
      // Calculate SMA 20 and BB
      if (i >= 19) {
        let sum = 0;
        for (let j = i - 19; j <= i; j++) sum += arr[j].close;
        const sma = sum / 20;
        pt.sma20 = sma;
        
        let varSum = 0;
        for (let j = i - 19; j <= i; j++) varSum += Math.pow(arr[j].close - sma, 2);
        const stdev = Math.sqrt(varSum / 20);
        pt.upperBB = sma + 2 * stdev;
        pt.lowerBB = sma - 2 * stdev;
      }
      return pt;
    });
  }, [aaplData.history, tf.range]);

  if (aaplData.loading) {
    return (
      <div className="flex flex-col h-full bg-bg-base flex-1 relative group rounded-md border border-border-subtle overflow-hidden items-center justify-center">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-xl font-bold text-text-primary tracking-tight">{symbol}</h2>
        </div>
        <div className="animate-pulse text-text-muted font-mono text-sm mt-4">FETCHING FROM EXCHANGE...</div>
      </div>
    );
  }

  if (aaplData.error || !aaplData.history.length) {
    return (
      <div className="flex flex-col h-full bg-bg-base flex-1 relative group rounded-md border border-border-subtle overflow-hidden items-center justify-center">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-xl font-bold text-text-primary tracking-tight">{symbol}</h2>
        </div>
        <div className="text-red-400 font-mono text-sm mt-4">INVALID SYMBOL OR DATA UNAVAILABLE</div>
      </div>
    );
  }

  const isUp = aaplData.change >= 0;
  const strokeColor = isUp ? '#00C896' : '#FF4757'; 
  const fillColor = isUp ? 'url(#colorUp)' : 'url(#colorDown)';

  const activeStart = visibleRange ? visibleRange.start : 0;
  const activeEnd = visibleRange ? visibleRange.end : aaplData.history.length;
  
  const chartData = rawChartData.slice(activeStart, activeEnd);

  const prices = chartData.flatMap(d => [d.low, d.high, d.upperBB, d.lowerBB]).filter(p => p != null && !isNaN(p));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 100;
  
  const priceMargin = (maxPrice - minPrice) * 0.1;
  const yMin = minPrice - priceMargin;
  const yMax = maxPrice + priceMargin;

  const volumes = chartData.map(d => d.volume).filter(v => v != null && !isNaN(v));
  const maxVolume = volumes.length ? Math.max(...volumes) : 100;
  const vMax = maxVolume * 4; // Scale volume so it occupies bottom 25%

  const chartMargin = { top: 10, right: 0, left: -20, bottom: 20 };

  // Generate ReferenceLines for drawings
  const renderDrawings = () => {
    const allDocs = [...drawings];
    if (currentDraw && hoveredPoint) {
       allDocs.push({ ...currentDraw, end: { label: hoveredPoint.label, price: hoveredPoint.close }, id: 'preview' });
    }
    
    return allDocs.map(d => {
      if (d.type === 'trendline') {
        return <ReferenceLine key={d.id} yAxisId="price" segment={[{ x: d.start.label, y: d.start.price }, { x: d.end.label, y: d.end.price }]} stroke="#2D7DD2" strokeWidth={2} />;
      }
      if (d.type === 'fib') {
        const high = Math.max(d.start.price, d.end.price);
        const low = Math.min(d.start.price, d.end.price);
        const diff = high - low;
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        return levels.map(lf => {
           const y = d.start.price > d.end.price ? d.start.price - (diff * lf) : d.start.price + (diff * lf);
           return <ReferenceLine key={`${d.id}-${lf}`} y={y} yAxisId="price" stroke="rgba(45, 125, 210, 0.5)" strokeDasharray="3 3" label={{ position: 'insideRight', value: `${(lf*100).toFixed(1)}%`, fill: 'rgba(45, 125, 210, 0.8)', fontSize: 10, fontFamily: 'monospace' }} />;
        });
      }
      return null;
    });
  };

  return (
    <div className="flex flex-col h-full bg-bg-base flex-1 relative group rounded-md border border-border-subtle overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-end justify-between px-4 py-3 border-b border-border-subtle bg-bg-panel shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-text-primary tracking-tight">{symbol}</h2>
            <span className="text-xs text-text-muted">EQUITY (USD)</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className={cn("text-3xl font-mono tracking-tighter", isUp ? "text-green-500" : "text-red-500")}>
              {aaplData.price?.toFixed?.(2) || '0.00'}
            </span>
            <span className={cn("text-sm font-mono flex items-center", isUp ? "text-green-500" : "text-red-500")}>
              {isUp ? "+" : ""}{aaplData.change?.toFixed?.(2) || '0.00'} ({isUp ? "+" : ""}{aaplData.percentChange?.toFixed?.(2) || '0.00'}%)
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {timeframes.map(t => (
            <button key={t.label} onClick={() => setTf(t)} className={cn("text-xs font-mono px-2 py-1 rounded transition-colors", tf.label === t.label ? 'bg-blue-600 text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-text-primary/5')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Toolbar overlay */}
      <div className="absolute left-4 top-24 z-20 flex flex-col gap-1.5 bg-bg-panel/80 backdrop-blur border border-border-subtle rounded p-1 shadow-xl">
        <button onClick={() => setActiveTool('cursor')} className={cn("p-1.5 rounded hover:text-text-primary", activeTool === 'cursor' ? 'bg-blue-600/30 text-blue-400' : 'text-text-primary/60')} title="Cursor (V)"><ArrowUpRight className="w-4 h-4" /></button>
        <button onClick={() => setActiveTool('pan')} className={cn("p-1.5 rounded hover:text-text-primary", activeTool === 'pan' ? 'bg-blue-600/30 text-blue-400' : 'text-text-primary/60')} title="Pan (H)"><Move className="w-4 h-4" /></button>
        <div className="w-full h-px bg-white/10 my-0.5"></div>
        <button onClick={() => setActiveTool('trendline')} className={cn("p-1.5 rounded hover:text-text-primary", activeTool === 'trendline' ? 'bg-blue-600/30 text-blue-400' : 'text-text-primary/60')} title="Trendline (T)"><TrendingUp className="w-4 h-4" /></button>
        <button onClick={() => setActiveTool('fib')} className={cn("p-1.5 rounded hover:text-text-primary", activeTool === 'fib' ? 'bg-blue-600/30 text-blue-400' : 'text-text-primary/60')} title="Fibonacci (F)"><AlignJustify className="w-4 h-4" /></button>
        <div className="w-full h-px bg-white/10 my-0.5"></div>
        <button onClick={() => setChartType('candlestick')} className={cn("p-1.5 rounded hover:text-text-primary", chartType === 'candlestick' ? 'bg-blue-600/30 text-blue-400' : 'text-text-primary/60')} title="Candlestick"><BarChart2 className="w-4 h-4" /></button>
        <button onClick={() => setChartType('area')} className={cn("p-1.5 rounded hover:text-text-primary", chartType === 'area' ? 'bg-blue-600/30 text-blue-400' : 'text-text-primary/60')} title="Area Chart"><Activity className="w-4 h-4" /></button>
        <button onClick={() => setChartType('line')} className={cn("p-1.5 rounded hover:text-text-primary", chartType === 'line' ? 'bg-blue-600/30 text-blue-400' : 'text-text-primary/60')} title="Line Chart"><LineChartIcon className="w-4 h-4" /></button>
      </div>

      {/* Chart Area */}
      <div 
        className={cn("flex-1 w-full relative pt-4 bg-gradient-to-b from-bg-panel to-black", activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : (activeTool !== 'cursor' ? 'cursor-crosshair' : 'cursor-default'))}
        onWheel={handleWheel}
        ref={containerRef}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <ResponsiveContainer width="100%" height="100%" className="relative z-10">
          <ComposedChart data={chartData} margin={chartMargin} onClick={handleChartClick} onMouseMove={handleChartMouseMove}>
            <defs>
              <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C896" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00C896" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF4757" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#FF4757" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--border-subtle)" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickMargin={12} minTickGap={30} angle={-35} textAnchor="end" />
            <YAxis yAxisId="price" domain={[yMin, yMax]} stroke="var(--border-subtle)" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} tickFormatter={(val) => val.toFixed(2)} orientation="right" axisLine={false} tickLine={false} />
            <YAxis yAxisId="volume" domain={[0, vMax]} hide={true} />
            
            <Tooltip 
              cursor={{ stroke: 'var(--border-subtle)', strokeWidth: 1, strokeDasharray: '3 3' }} 
              contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontFamily: 'JetBrains Mono' }} 
              itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }} 
              labelStyle={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '4px' }} 
              formatter={(v: number, n: string) => [v?.toFixed ? v.toFixed(2) : v, n]} 
              animationDuration={100} 
            />
            <ReferenceLine y={aaplData.price} yAxisId="price" stroke="var(--border-subtle)" strokeDasharray="3 3" />
            
            <Bar yAxisId="volume" dataKey="volume" fill="var(--border-subtle)" opacity={0.3} isAnimationActive={false} />

            {/* Overlays */}
            <Line yAxisId="price" type="monotone" dataKey="sma20" stroke="#6B7FD4" strokeWidth={1} dot={false} isAnimationActive={false} />
            <Line yAxisId="price" type="monotone" dataKey="upperBB" stroke="#2D7DD2" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} opacity={0.5} />
            <Line yAxisId="price" type="monotone" dataKey="lowerBB" stroke="#2D7DD2" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} opacity={0.5} />

            {chartType === 'candlestick' ? (
              <Bar yAxisId="price" dataKey={(d: any) => [d.open, d.close] as any} shape={<CustomCandlestick />} isAnimationActive={false} />
            ) : chartType === 'area' ? (
              <Area yAxisId="price" type="monotone" dataKey="price" stroke={strokeColor} strokeWidth={2} fillOpacity={1} fill={fillColor} isAnimationActive={false} />
            ) : chartType === 'line' ? (
              <Line yAxisId="price" type="monotone" dataKey="price" stroke={strokeColor} strokeWidth={2} dot={false} isAnimationActive={false} />
            ) : (
              <Bar yAxisId="price" dataKey="price" fill={strokeColor} isAnimationActive={false} />
            )}
            
            {renderDrawings()}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

