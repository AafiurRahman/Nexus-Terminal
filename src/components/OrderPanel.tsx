import { useState, useEffect } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function OrderPanel({ activeSymbol = "AAPL" }: { activeSymbol?: string }) {
  const [activeTab, setActiveTab] = useState<'exec' | 'port'>('exec');
  const marketData = useMarketData(activeSymbol);

  const [alpacaAccount, setAlpacaAccount] = useState<any>(null);
  const [alpacaPositions, setAlpacaPositions] = useState<any[]>(null);
  const [alpacaError, setAlpacaError] = useState<string | null>(null);
  const [alpacaLoading, setAlpacaLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'port') {
      const fetchAlpaca = async () => {
        setAlpacaLoading(true);
        try {
          const accRes = await fetch('/api/alpaca/account');
          if (accRes.status === 401) {
            setAlpacaError("Alpaca API Keys missing. Configure them in the Settings menu (Secrets).");
            setAlpacaLoading(false);
            return;
          }
          if (!accRes.ok) {
            setAlpacaError("Failed to fetch Alpaca account.");
            setAlpacaLoading(false);
            return;
          }
          const accData = await accRes.json();
          setAlpacaAccount(accData);
          setAlpacaError(null);

          const posRes = await fetch('/api/alpaca/positions');
          if (posRes.ok) {
            const posData = await posRes.json();
            setAlpacaPositions(posData);
          }
        } catch (e) {
          console.error(e);
          setAlpacaError("Network error connecting to Alpaca.");
        } finally {
          setAlpacaLoading(false);
        }
      };
      
      fetchAlpaca();
    }
  }, [activeTab]);

  const price = marketData.price || 0;
  const bid = (price * 0.9995).toFixed(2);
  const ask = (price * 1.0005).toFixed(2);

  // Deterministic mock data generation based on symbol
  const symbolHash = activeSymbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const mockShares = (symbolHash * 13) % 5000 + 100; // between 100 and 5100 shares
  const mockTotalEquity = (mockShares * price).toFixed(2);
  const dayChangePct = marketData.percentChange || 0;
  const dayPnL = (mockShares * price * (dayChangePct / 100)).toFixed(2);
  const beta = (0.8 + (symbolHash % 100) / 100).toFixed(2);
  
  const varValue = (mockShares * price * 0.05).toFixed(2); // Mock 5% VaR
  const trackingErr = (1.5 + (symbolHash % 50) / 10).toFixed(1);
  const liquidityRisk = (symbolHash % 3) === 0 ? 'HIGH' : (symbolHash % 3) === 1 ? 'MEDIUM' : 'LOW';

  const mockAllocations = [
    { name: activeSymbol, value: 45, color: '#2D7DD2' },
    { name: 'CASH', value: 20, color: '#00C896' },
    { name: 'BONDS', value: 15, color: '#6B7FD4' },
    { name: 'OTHER', value: 20, color: '#8892A4' }
  ];

  return (
    <div className="flex flex-col h-full bg-bg-panel border border-border-subtle rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle shrink-0">
         <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('exec')}
               className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'exec' ? 'text-text-primary' : 'text-text-muted hover:text-text-primary/80'}`}
          >
            Execution
          </button>
          <button 
             onClick={() => setActiveTab('port')}
             className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'port' ? 'text-text-primary' : 'text-text-muted hover:text-text-primary/80'}`}
          >
            Portfolio (PORT)
          </button>
        </div>
      </div>
      
      {activeTab === 'exec' ? (
        <div className="p-3 flex-1 flex flex-col gap-3 overflow-y-auto">
          
          <div className="flex items-center justify-between bg-text-primary/5 border border-border-subtle rounded px-2 py-1.5">
             <span className="text-text-primary font-bold">{activeSymbol} <span className="text-xs text-text-muted ml-1 font-normal">EQUITY</span></span>
             <span className="text-xs font-mono text-text-primary/60">LMT</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-text-primary/5 border border-border-subtle rounded p-2 text-center cursor-pointer hover:bg-white/10 transition-colors">
              <div className="text-[10px] text-text-muted uppercase font-bold mb-1">Bid</div>
              <div className="text-red-500 font-mono text-xl">{marketData.loading ? '...' : bid}</div>
              <div className="text-text-muted text-[10px] font-mono mt-1">12,400</div>
            </div>
            <div className="bg-text-primary/5 border border-border-subtle rounded p-2 text-center cursor-pointer hover:bg-white/10 transition-colors">
              <div className="text-[10px] text-text-muted uppercase font-bold mb-1">Ask</div>
              <div className="text-green-500 font-mono text-xl">{marketData.loading ? '...' : ask}</div>
              <div className="text-text-muted text-[10px] font-mono mt-1">8,200</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted uppercase font-bold tracking-wider">Account</span>
              <select className="bg-bg-base border border-border-subtle text-text-primary text-xs px-2 py-1 rounded outline-none w-32">
                <option>MAIN-EQ-01</option>
                <option>MARGIN-02</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted uppercase font-bold tracking-wider">Type</span>
              <select className="bg-bg-base border border-border-subtle text-text-primary text-xs px-2 py-1 rounded outline-none w-32">
                <option>LIMIT</option>
                <option>MARKET</option>
                <option>STOP</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
               <div>
                 <div className="text-[10px] text-text-muted uppercase mb-1">Quantity</div>
                 <input type="text" defaultValue="100" className="w-full bg-bg-base border border-border-subtle text-text-primary text-xs px-2 py-1.5 rounded font-mono focus:border-blue-500 outline-none text-right" />
               </div>
               <div>
                 <div className="text-[10px] text-text-muted uppercase mb-1">Price</div>
                 <input type="text" value={marketData.loading ? '' : price.toFixed(2)} readOnly className="w-full bg-bg-base border border-border-subtle text-text-primary text-xs px-2 py-1.5 rounded font-mono focus:border-blue-500 outline-none text-right" />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
            <button className="bg-red-600 hover:bg-red-500 text-[10px] font-bold text-text-primary py-2 rounded-sm uppercase transition-colors shadow-sm">
              Sell
            </button>
            <button className="bg-blue-600 hover:bg-blue-500 text-[10px] font-bold text-text-primary py-2 rounded-sm uppercase transition-colors shadow-sm">
              Buy
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 flex-1 flex flex-col gap-3 overflow-y-auto">
          {alpacaLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-2 mt-10">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-xs font-mono uppercase tracking-widest">Connecting to Broker...</span>
            </div>
          ) : alpacaError ? (
            <div className="mt-4 bg-text-primary/5 border border-border-subtle rounded p-4 text-center flex flex-col items-center">
               <AlertTriangle className="w-6 h-6 text-yellow-500 mb-2" />
               <span className="text-xs text-text-primary font-bold mb-1">Live Broker Needed</span>
               <span className="text-[10px] text-text-muted mb-3">To view your real portfolio and connect to Alpaca Paper Trading, provide your Alpaca keys.</span>
               <div className="text-left w-full text-[10px] font-mono text-text-primary/70 bg-bg-base p-2 border border-border-subtle rounded">
                 ALPACA_API_KEY<br/>
                 ALPACA_API_SECRET
               </div>
            </div>
          ) : alpacaAccount ? (
            <>
              <div className="bg-text-primary/5 border border-border-subtle rounded p-3">
                 <h4 className="text-[10px] font-bold uppercase text-text-primary/60 mb-2">Alpaca Holdings</h4>
                 <div className="space-y-1.5 text-[11px] font-mono">
                   {(() => {
                     const position = (alpacaPositions || []).find((p: any) => p.symbol === activeSymbol);
                     return (
                       <div className="flex justify-between">
                         <span className="text-blue-400 font-bold">{activeSymbol} POSITION</span>
                         <span className="text-text-primary">{position ? position.qty : "0"} SHARES</span>
                       </div>
                     );
                   })()}
                   <div className="flex justify-between"><span>TOTAL EQUITY</span><span className="text-text-primary">${Number(alpacaAccount.equity).toLocaleString()}</span></div>
                   <div className="flex justify-between"><span>EOD BUYING POWER</span><span className="text-text-primary">${Number(alpacaAccount.buying_power).toLocaleString()}</span></div>
                   <div className="flex justify-between"><span>DAY P&L</span><span className={Number(alpacaAccount.equity) >= Number(alpacaAccount.last_equity) ? "text-green-400" : "text-red-400"}>{Number(alpacaAccount.equity) >= Number(alpacaAccount.last_equity) ? '+' : ''}${(Number(alpacaAccount.equity) - Number(alpacaAccount.last_equity)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                 </div>
              </div>
              
              <div className="bg-text-primary/5 border border-border-subtle rounded p-3 h-32 flex flex-col">
                <h4 className="text-[10px] font-bold uppercase text-text-primary/60 mb-1">Account Allocation</h4>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-subtle)', fontSize: '10px' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Pie
                        data={[
                           { name: 'Equity', value: (alpacaPositions || []).reduce((acc: number, p: any) => acc + Number(p.market_value), 0), color: '#2D7DD2' },
                           { name: 'Cash', value: Number(alpacaAccount.cash), color: '#00C896' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={45}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {[
                           { color: '#2D7DD2' },
                           { color: '#00C896' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-text-primary/5 border border-border-subtle rounded p-3">
                 <h4 className="text-[10px] font-bold uppercase text-text-primary/60 mb-2 flex justify-between">
                   MARS Risk Analysis
                   <span className="text-red-400">Stress Test Active</span>
                 </h4>
                 <div className="space-y-1.5 text-[11px] font-mono">
                   <div className="flex justify-between"><span>VAR (95% 1D)</span><span className="text-red-400">-${(Number(alpacaAccount.equity) * 0.05).toLocaleString()}</span></div>
                   <div className="flex justify-between"><span>TRACKING ERR</span><span className="text-text-primary">{trackingErr}%</span></div>
                   <div className="flex justify-between text-yellow-500"><span>LIQUIDITY RISK</span><span className={liquidityRisk === 'HIGH' ? 'text-red-400' : liquidityRisk === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'}>{liquidityRisk}</span></div>
                 </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
