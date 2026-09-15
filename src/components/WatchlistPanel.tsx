import { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { cn } from '../lib/utils';
import { Search, Star } from 'lucide-react';

const classColors: Record<string, string> = {
  Stocks: "text-blue-400 border-blue-400/20 bg-blue-400/10",
  ETFs: "text-purple-400 border-purple-400/20 bg-purple-400/10",
  Indices: "text-indigo-400 border-indigo-400/20 bg-indigo-400/10",
  Rates: "text-pink-400 border-pink-400/20 bg-pink-400/10",
  Commodities: "text-amber-400 border-amber-400/20 bg-amber-400/10",
  Currencies: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
};

const Sparkline = ({ data, isUp }: { data: number[], isUp: boolean }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const color = isUp ? '#00C896' : '#FF4757';

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible py-1">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="4"
        vectorEffect="non-scaling-stroke"
        points={points}
      />
    </svg>
  );
};

const WatchlistItem: React.FC<{ symbol: string, name: string, isActive?: boolean, onSelect?: () => void, isFav?: boolean, onToggleFav?: () => void, isCategoryHeader?: boolean, assetClass?: string }> = ({ symbol, name, isActive, onSelect, isFav, onToggleFav, isCategoryHeader, assetClass }) => {
  const data = useMarketData(symbol);
  
  if (isCategoryHeader) {
    return <div className="px-3 py-1 text-[10px] font-bold text-text-primary/60 bg-text-primary/5 uppercase mt-1 sticky top-0 z-10 backdrop-blur-md">{name}</div>;
  }
  
  if (data.loading) {
    return (
      <div className={cn("grid grid-cols-12 gap-2 py-0.5 px-3 hover:bg-text-primary/5 items-center group cursor-pointer transition-colors border-b border-white/5 last:border-0 opacity-50", isActive && "bg-white/10")} onClick={onSelect}>
        <div className="col-span-4 flex items-center gap-1.5 overflow-hidden">
          {onToggleFav && (
            <button onClick={(e) => { e.stopPropagation(); onToggleFav(); }} className="shrink-0">
              <Star className={cn("w-3 h-3 hover:text-yellow-500 transition-colors", isFav ? "fill-yellow-500 text-yellow-500" : "text-text-primary/20")} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-text-primary/60 text-[11px] truncate">{symbol}</span>
              {assetClass && <span className={cn("text-[8px] px-1 py-[1px] rounded leading-none uppercase border", classColors[assetClass] || "text-text-muted border-border-subtle bg-text-primary/5")}>{assetClass}</span>}
            </div>
            <div className="text-[10px] text-text-muted uppercase truncate" title={name}>{name}</div>
          </div>
        </div>
        <div className="col-span-2 h-6 flex items-center justify-center opacity-20">
          <div className="w-full h-px bg-white/20"></div>
        </div>
        <div className="col-span-2 text-right font-mono text-xs text-text-primary">...</div>
        <div className="col-span-4"></div>
      </div>
    );
  }

  const isUp = data.change >= 0;
  
  const formatVolume = (vol: number) => {
    if (!vol) return '--';
    if (vol >= 1e9) return (vol / 1e9).toFixed(1) + 'B';
    if (vol >= 1e6) return (vol / 1e6).toFixed(1) + 'M';
    if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K';
    return vol.toString();
  };
  
  // Format price based on asset class (FX has more precision)
  const formatPrice = (price: number, assetClass?: string) => {
    if (!price) return '0.00';
    if (assetClass === 'Currencies') return price.toFixed(4);
    return price.toFixed(2);
  };

  const sparklineData = data.history.map(d => d.close).slice(-20);

  return (
    <div onClick={onSelect} className={cn("grid grid-cols-12 gap-2 py-0.5 px-3 hover:bg-text-primary/5 items-center group cursor-pointer transition-colors border-b border-white/5 last:border-0", isActive && "bg-white/10")}>
      <div className="col-span-4 flex items-center gap-1.5 overflow-hidden">
        {onToggleFav && (
          <button onClick={(e) => { e.stopPropagation(); onToggleFav(); }} className="shrink-0">
            <Star className={cn("w-3 h-3 hover:text-yellow-500 transition-colors", isFav ? "fill-yellow-500 text-yellow-500" : "text-text-primary/20")} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-text-primary/60 text-[11px] truncate">{symbol}</span>
            {assetClass && <span className={cn("text-[8px] px-1 py-[1px] rounded-sm leading-none uppercase border shrink-0", classColors[assetClass] || "text-text-muted border-border-subtle bg-text-primary/5")}>{assetClass}</span>}
          </div>
          <div className="text-[10px] text-text-muted uppercase truncate" title={name}>{name}</div>
        </div>
      </div>
      <div className="col-span-2 h-6 flex items-center opacity-70 group-hover:opacity-100 transition-opacity pr-2">
        <Sparkline data={sparklineData} isUp={isUp} />
      </div>
      <div className="col-span-2 text-right font-mono text-[11px] xl:text-xs">
        <div className="text-text-primary">{formatPrice(data.price, assetClass)}</div>
        <div className="text-text-muted text-[9px] xl:text-[10px]">{formatVolume(data.volume)}</div>
      </div>
      <div className={cn("col-span-2 text-right font-mono text-[11px] xl:text-xs", isUp ? "text-green-500" : "text-red-500")}>
        <div>{isUp && data.change > 0 ? "+" : ""}{formatPrice(data.change, assetClass)}</div>
      </div>
      <div className="col-span-2 text-right">
        <div className={cn("inline-block px-1 py-0.5 rounded font-mono text-[9px] xl:text-[10px]", isUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
          {isUp && data.percentChange > 0 ? "+" : ""}{data.percentChange?.toFixed?.(2) || '0.00'}%
        </div>
      </div>
    </div>
  );
}

export function WatchlistPanel({ activeSymbol, onSymbolSelect }: { activeSymbol?: string, onSymbolSelect?: (sym: string) => void }) {
  const [activeTab, setActiveTab] = useState<'monitor' | 'econ' | 'fav'>('monitor');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [favorites, setFavorites] = useState<string[]>(['AAPL']);

  const symbols = [
    { symbol: "AAPL", name: "Apple Inc", assetClass: "Stocks" },
    { symbol: "MSFT", name: "Microsoft Corp", assetClass: "Stocks" },
    { symbol: "NVDA", name: "NVIDIA Corp", assetClass: "Stocks" },
    { symbol: "GOOG", name: "Alphabet Inc", assetClass: "Stocks" },
    { symbol: "AMZN", name: "Amazon.com Inc", assetClass: "Stocks" },
    { symbol: "META", name: "Meta Platforms", assetClass: "Stocks" },
    { symbol: "TSLA", name: "Tesla Inc", assetClass: "Stocks" },
    { symbol: "BRK-B", name: "Berkshire Hathaway", assetClass: "Stocks" },
    { symbol: "LLY", name: "Eli Lilly & Co", assetClass: "Stocks" },
    { symbol: "AVGO", name: "Broadcom Inc", assetClass: "Stocks" },
    { symbol: "JPM", name: "JPMorgan Chase", assetClass: "Stocks" },
    { symbol: "V", name: "Visa Inc", assetClass: "Stocks" },
    { symbol: "UNH", name: "UnitedHealth", assetClass: "Stocks" },
    { symbol: "XOM", name: "Exxon Mobil", assetClass: "Stocks" },
    { symbol: "JNJ", name: "Johnson & Johnson", assetClass: "Stocks" },
    { symbol: "^GSPC", name: "S&P 500", assetClass: "Indices" },
    { symbol: "SPY", name: "S&P 500 ETF", assetClass: "ETFs" },
    { symbol: "^TNX", name: "10-Yr Bond Yield", assetClass: "Rates" },
    { symbol: "DX-Y.NYB", name: "US Dollar Index", assetClass: "Currencies" },
    { symbol: "LQD", name: "iShares iBoxx Inv Grade", assetClass: "ETFs" },
    
    // Commodities & Metals
    { symbol: "CL=F", name: "Crude Oil (WTI)", assetClass: "Commodities" },
    { symbol: "BZ=F", name: "Brent Crude", assetClass: "Commodities" },
    { symbol: "NG=F", name: "Natural Gas", assetClass: "Commodities" },
    { symbol: "GC=F", name: "Gold", assetClass: "Commodities" },
    { symbol: "SI=F", name: "Silver", assetClass: "Commodities" },
    { symbol: "HG=F", name: "Copper", assetClass: "Commodities" },
    { symbol: "PL=F", name: "Platinum", assetClass: "Commodities" },
    { symbol: "PA=F", name: "Palladium", assetClass: "Commodities" },
    { symbol: "ZC=F", name: "Corn", assetClass: "Commodities" },
    { symbol: "ZW=F", name: "Wheat", assetClass: "Commodities" },
    { symbol: "ZS=F", name: "Soybeans", assetClass: "Commodities" },

    // Currencies
    { symbol: "EURUSD=X", name: "EUR/USD", assetClass: "Currencies" },
    { symbol: "GBPUSD=X", name: "GBP/USD", assetClass: "Currencies" },
    { symbol: "JPY=X", name: "USD/JPY", assetClass: "Currencies" },
    { symbol: "USDCAD=X", name: "USD/CAD", assetClass: "Currencies" },
    { symbol: "USDCHF=X", name: "USD/CHF", assetClass: "Currencies" },
    { symbol: "AUDUSD=X", name: "AUD/USD", assetClass: "Currencies" },
    { symbol: "NZDUSD=X", name: "NZD/USD", assetClass: "Currencies" },
    { symbol: "USDCNY=X", name: "USD/CNY", assetClass: "Currencies" }
  ];

  const handleToggleFav = (symbol: string) => {
    setFavorites(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  const filteredSymbols = symbols.filter(s => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'All' || s.assetClass === filterClass;
    return matchesSearch && matchesClass;
  });

  let displaySymbols = filteredSymbols;
  if (activeTab === 'fav') {
     displaySymbols = filteredSymbols.filter(s => favorites.includes(s.symbol));
  } else if (activeTab === 'econ') {
     displaySymbols = filteredSymbols.filter(s => ['Indices', 'Rates', 'Commodities', 'Currencies'].includes(s.assetClass));
  }

  const groupedSymbols: Record<string, typeof displaySymbols> = {};
  displaySymbols.forEach(s => {
    if (!groupedSymbols[s.assetClass]) groupedSymbols[s.assetClass] = [];
    groupedSymbols[s.assetClass].push(s);
  });

  const categoryOrder = ['Stocks', 'ETFs', 'Indices', 'Rates', 'Currencies', 'Commodities'];
  const sortedCategories = Object.keys(groupedSymbols).sort((a, b) => {
    const ia = categoryOrder.indexOf(a);
    const ib = categoryOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg-base/40">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-text-primary/5 shrink-0">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('monitor')}
            className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'monitor' ? 'text-blue-400' : 'text-text-muted hover:text-text-primary/80'}`}
          >
            Monitor
          </button>
          <button 
            onClick={() => setActiveTab('fav')}
            className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'fav' ? 'text-blue-400' : 'text-text-muted hover:text-text-primary/80'}`}
          >
            Favorites
          </button>
          <button 
            onClick={() => setActiveTab('econ')}
            className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'econ' ? 'text-blue-400' : 'text-text-muted hover:text-text-primary/80'}`}
          >
            Macro / FICC
          </button>
        </div>
      </div>

      <div className="px-2 py-1.5 border-b border-border-subtle bg-bg-base flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Search className="w-3 h-3 text-text-muted" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol or name..." 
            className="bg-transparent border-none outline-none text-[10px] w-full text-text-primary/80 placeholder:text-text-primary/20 uppercase"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {(['All', ...categoryOrder]).map(cls => (
             <button 
               key={cls}
               onClick={() => setFilterClass(cls)}
               className={cn("text-[9px] uppercase px-2 py-0.5 rounded-full whitespace-nowrap transition-colors", filterClass === cls ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-text-primary/5 text-text-muted border border-border-subtle hover:bg-white/10")}
             >
               {cls}
             </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-12 gap-2 px-3 py-1.5 border-b border-border-subtle bg-text-primary/5 text-[10px] uppercase text-text-muted font-bold tracking-wider shrink-0 sticky top-0 z-20 shadow-md">
          <div className="col-span-4">Symbol</div>
          <div className="col-span-2 text-center">Trend</div>
          <div className="col-span-2 text-right">Last</div>
          <div className="col-span-2 text-right">Chg</div>
          <div className="col-span-2 text-right">% Chg</div>
        </div>
        
        {displaySymbols.length === 0 ? (
          <div className="p-4 text-center text-[10px] text-text-muted font-mono">No symbols found.</div>
        ) : (
          (searchQuery || filterClass !== 'All') ? (
            // Flat list if actively filtered/searched
            displaySymbols.map(s => (
              <WatchlistItem 
                key={s.symbol} 
                symbol={s.symbol} 
                name={s.name} 
                assetClass={s.assetClass}
                isActive={activeSymbol === s.symbol}
                onSelect={() => onSymbolSelect && onSymbolSelect(s.symbol)}
                isFav={favorites.includes(s.symbol)}
                onToggleFav={() => handleToggleFav(s.symbol)}
              />
            ))
          ) : (
            // Grouped view by default
            sortedCategories.map(category => (
              <div key={category}>
                <WatchlistItem symbol="" name={category} isCategoryHeader={true} />
                {groupedSymbols[category].map(s => (
                  <WatchlistItem 
                    key={s.symbol} 
                    symbol={s.symbol} 
                    name={s.name} 
                    assetClass={s.assetClass}
                    isActive={activeSymbol === s.symbol}
                    onSelect={() => onSymbolSelect && onSymbolSelect(s.symbol)}
                    isFav={favorites.includes(s.symbol)}
                    onToggleFav={() => handleToggleFav(s.symbol)}
                  />
                ))}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
