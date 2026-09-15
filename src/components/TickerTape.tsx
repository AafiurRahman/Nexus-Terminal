import { useMarketData } from '../hooks/useMarketData';
import { cn } from '../lib/utils';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const TickerItem: React.FC<{ symbol: string, name: string }> = ({ symbol, name }) => {
  const data = useMarketData(symbol);
  
  if (data.loading) {
    return (
      <div className="flex items-center gap-3 border-r border-border-subtle px-4 min-w-[200px] shrink-0 opacity-50">
        <div className="flex flex-col">
          <span className="text-[10px] text-blue-400 font-bold tracking-wide uppercase">{name}</span>
          <span className="font-mono text-sm text-gray-200">...</span>
        </div>
      </div>
    );
  }

  const isUp = data.change >= 0;
  const isCurrency = symbol.includes('=X');
  
  const formatPrice = (val: number) => {
    if (!val) return '0.00';
    return isCurrency ? val.toFixed(4) : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const formatChange = (val: number) => {
    if (!val) return '0.00';
    return isCurrency ? val.toFixed(4) : val.toFixed(2);
  };

  return (
    <div className="flex items-center gap-3 border-r border-border-subtle px-4 min-w-[200px] shrink-0">
      <div className="flex flex-col">
        <span className="text-[10px] text-blue-400 font-bold tracking-wide uppercase">{name}</span>
        <span className="font-mono text-sm text-gray-200">{formatPrice(data.price)}</span>
      </div>
      <div className={cn("flex flex-col items-end flex-1", isUp ? "text-green-500" : "text-red-500")}>
        <div className="flex items-center text-[10px] font-bold">
          {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
          {(isUp && data.change > 0 ? "+" : "") + formatChange(Math.abs(data.change))}
        </div>
        <div className="text-[10px] font-mono">
          {(isUp && data.percentChange > 0 ? "+" : "") + Math.abs(data.percentChange).toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

export function TickerTape() {
  const tickers = [
    { symbol: "^GSPC", name: "S&P 500" },
    { symbol: "^NDX", name: "NASDAQ 100" },
    { symbol: "^DJI", name: "DOW JONES" },
    { symbol: "^RUT", name: "RUSSELL 2000" },
    { symbol: "^VIX", name: "CBOE VOLATILITY" },
    { symbol: "EURUSD=X", name: "EUR/USD" },
    { symbol: "GBPUSD=X", name: "GBP/USD" },
    { symbol: "JPY=X", name: "USD/JPY" },
    { symbol: "GC=F", name: "GOLD CORE" },
    { symbol: "CL=F", name: "WTI CRUDE" },
    { symbol: "BTC-USD", name: "BITCOIN" }
  ];

  return (
    <div className="h-12 border-b border-border-subtle bg-bg-panel flex items-center overflow-x-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-bg-panel to-transparent z-10" />
      
      <div className="flex items-center h-full animate-[marquee_40s_linear_infinite] hover:[animation-play-state:paused] w-max">
        {/* First Set */}
        {tickers.map(t => <TickerItem key={t.symbol} symbol={t.symbol} name={t.name} />)}
        {/* Duplicate Set for smooth loop (transform will go to -50% and jump back) */}
        {tickers.map(t => <TickerItem key={`dup-${t.symbol}`} symbol={t.symbol} name={t.name} />)}
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg-panel to-transparent z-10" />
    </div>
  );
}
