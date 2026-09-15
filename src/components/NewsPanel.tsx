import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Filter, BookOpen, Clock, Calendar } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  publisher: string;
  link: string;
  timestamp: number;
  tickers: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

export function NewsPanel({ activeSymbol = "AAPL" }: { activeSymbol?: string }) {
  const [activeTab, setActiveTab] = useState<'news' | 'bi' | 'eco'>('news');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [ecoEvents, setEcoEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEco, setLoadingEco] = useState(false);
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    let unmounted = false;
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (!unmounted && Array.isArray(data)) {
              setNews(data);
              setLoading(false);
            }
          } else {
             if (!unmounted) setLoading(false);
          }
        } else {
          if (!unmounted) setLoading(false);
        }
      } catch (e) {
        if (!unmounted) setLoading(false);
      }
    };
    
    const fetchEco = async () => {
      try {
        setLoadingEco(true);
        const res = await fetch('/api/eco-calendar');
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const data = await res.json();
           if (!unmounted) {
             if (Array.isArray(data)) {
               setEcoEvents(data);
             }
           }
        } else {
           throw new Error("API returned non-JSON response");
        }
      } catch (e: any) {
        console.warn("Using fallback for eco calendar due to:", e.message || e);
        if (!unmounted) {
          setEcoEvents([
            { title: "(Fallback) NFP Employment Change", country: "USD", date: new Date(Date.now() + 86400000).toISOString(), impact: "High", forecast: "190K", previous: "175K" },
            { title: "(Fallback) CPI m/m", country: "USD", date: new Date(Date.now() + 172800000).toISOString(), impact: "High", forecast: "0.3%", previous: "0.2%" },
            { title: "(Fallback) ECB Rate Decision", country: "EUR", date: new Date(Date.now() + 259200000).toISOString(), impact: "High", forecast: "4.00%", previous: "4.00%" }
          ]);
        }
      } finally {
        if (!unmounted) setLoadingEco(false);
      }
    };
    
    fetchNews();
    fetchEco();
    const newsInterval = setInterval(fetchNews, 60000); // 1 minute
    const ecoInterval = setInterval(fetchEco, 120000); // 2 minutes
    
    return () => {
      unmounted = true;
      clearInterval(newsInterval);
      clearInterval(ecoInterval);
    };
  }, []);

  const formatTime = (ts: number | string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(new Date(ts));
    } catch {
      return '00:00:00';
    }
  };

  const formatDate = (ts: number | string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        month: 'short',
        day: 'numeric'
      }).format(new Date(ts));
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg-panel border border-border-subtle rounded-md">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-bg-panel shrink-0">
         <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('news')}
            className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${activeTab === 'news' ? 'text-amber-500' : 'text-text-muted hover:text-text-primary/80'}`}
          >
            {activeTab === 'news' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse blur-[1px]"></span>}
            Live Headlines
          </button>
          <button 
             onClick={() => setActiveTab('bi')}
            className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${activeTab === 'bi' ? 'text-blue-400' : 'text-text-muted hover:text-text-primary/80'}`}
          >
            <BookOpen className="w-3 h-3" />
            BI Research
          </button>
          <button 
             onClick={() => setActiveTab('eco')}
            className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${activeTab === 'eco' ? 'text-emerald-400' : 'text-text-muted hover:text-text-primary/80'}`}
          >
            <Calendar className="w-3 h-3" />
            Eco Calendar
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-text-muted" />
          <select 
            value={tz} 
            onChange={(e) => setTz(e.target.value)}
            className="bg-transparent text-[10px] text-text-muted border-none outline-none cursor-pointer hover:text-text-primary"
          >
            <option value="UTC" className="bg-bg-panel">UTC</option>
            <option value="America/New_York" className="bg-bg-panel">NY (EST)</option>
            <option value="Europe/London" className="bg-bg-panel">LDN (GMT)</option>
            <option value="Asia/Tokyo" className="bg-bg-panel">TKO (JST)</option>
            <option value={Intl.DateTimeFormat().resolvedOptions().timeZone} className="bg-bg-panel">Local</option>
          </select>
        </div>
      </div>
      
      {activeTab === 'news' && (
          <div className="flex-1 overflow-y-auto w-full">
            {loading ? (
              <div className="p-4 text-[11px] text-text-muted font-mono text-center">Loading headlines...</div>
            ) : (
              news.map((item) => (
                <div key={item.id} onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')} className="group px-3 py-2 border-b border-border-subtle hover:bg-text-primary/5 cursor-pointer flex gap-3 transition-colors last:border-b-0 w-full relative">
                  <span className="text-[10px] font-mono text-text-muted shrink-0 pt-0.5 w-[55px] text-right">{formatTime(item.timestamp)}</span>
                  <div className="flex flex-col w-full pr-2">
                    <span className="text-[11px] leading-tight group-hover:underline block w-full text-text-primary/80 group-hover:text-blue-400 mb-1 flex items-start gap-1">
                      {item.title}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </span>
                    <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-text-primary/30 font-bold">
                      <span className="text-amber-500/80">{item.publisher}</span>
                      {item.tickers.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-blue-400/80">{item.tickers.slice(0, 3).join(', ')}</span>
                        </>
                      )}
                      {(item.sentiment) && (
                        <>
                          <span className={`px-1.5 py-0.5 rounded uppercase text-[8px] font-bold tracking-widest ${item.sentiment === 'bullish' ? "bg-green-500/10 text-green-500" : item.sentiment === 'bearish' ? "bg-red-500/10 text-red-500" : "bg-text-primary/5 text-text-muted"}`}>
                            {item.sentiment}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
      )}
      
      {activeTab === 'bi' && (
          <div className="flex-1 overflow-y-auto w-full p-3 space-y-3" role="list" aria-label="BI Research">
             <div 
               role="listitem"
               tabIndex={0}
               onClick={() => window.open(`https://www.google.com/search?q=${activeSymbol}+earnings+Bloomberg+Intelligence`, '_blank', 'noopener,noreferrer')}
               className="group border border-border-subtle bg-text-primary/5 p-3 rounded cursor-pointer hover:border-blue-500/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all relative"
               onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); }}
             >
                <div className="flex items-center gap-2 mb-2 text-[10px] font-mono text-text-muted justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold">BI <span className="text-text-muted ml-1">{'<GO>'}</span></span>
                    <span>|</span>
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className="text-amber-500 font-medium px-1.5 py-0.5 bg-amber-500/10 rounded">ACTIONABLE</span>
                </div>
                <h4 className="text-[13px] font-bold text-gray-200 mb-1.5 group-hover:text-blue-400 group-focus:text-blue-400 transition-colors flex items-start gap-1">
                  {activeSymbol} Earnings Potential and Margin Expansion
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </h4>
                <p className="text-[11px] text-text-primary/60 leading-relaxed mb-3">Our analysis indicates that {activeSymbol}'s operational efficiency improvements and pricing power could drive significant gross margin expansion over the next 4 quarters, exceeding consensus estimates.</p>
                <div className="flex items-center gap-4 text-[10px] bg-bg-base/40 p-2 rounded border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-text-muted mb-0.5">Recommendation</span>
                    <span className="text-green-400 font-bold">ACCUMULATE</span>
                  </div>
                  <div className="w-px h-6 bg-white/10"></div>
                  <div className="flex flex-col">
                    <span className="text-text-muted mb-0.5">Implied Upside</span>
                    <span className="text-text-primary font-mono">+14.5%</span>
                  </div>
                  <div className="w-px h-6 bg-white/10"></div>
                  <div className="flex flex-col">
                    <span className="text-text-muted mb-0.5">Conviction</span>
                    <span className="text-text-primary font-mono">High</span>
                  </div>
                </div>
             </div>
             
             <div 
               role="listitem"
               tabIndex={0}
               onClick={() => window.open(`https://www.google.com/search?q=${activeSymbol}+sector+rotation+Bloomberg+Intelligence`, '_blank', 'noopener,noreferrer')}
               className="group border border-border-subtle bg-text-primary/5 p-3 rounded cursor-pointer hover:border-blue-500/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all relative"
               onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); }}
             >
                <div className="flex items-center gap-2 mb-2 text-[10px] font-mono text-text-muted">
                  <span className="text-blue-400 font-bold">BI <span className="text-text-muted ml-1">{'<GO>'}</span></span>
                  <span>|</span>
                  <span>10:15:00</span>
                  <span>|</span>
                  <span>Global Macro</span>
                </div>
                <h4 className="text-[13px] font-bold text-gray-200 mb-1.5 group-hover:text-blue-400 group-focus:text-blue-400 transition-colors flex items-start gap-1">
                  Sector Rotation Impacts on {activeSymbol}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </h4>
                <p className="text-[11px] text-text-primary/60 leading-relaxed">Current capital flows suggest institutional investors are rebalancing their exposure. {activeSymbol} may experience elevated volatility due to macro risks but maintains strong fundamentals.</p>
             </div>
             
             <div 
               role="listitem"
               tabIndex={0}
               onClick={() => window.open(`https://www.google.com/search?q=${activeSymbol}+technical+analysis+Bloomberg+Intelligence`, '_blank', 'noopener,noreferrer')}
               className="group border border-border-subtle bg-text-primary/5 p-3 rounded cursor-pointer hover:border-blue-500/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all relative"
               onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); }}
             >
                <div className="flex items-center gap-2 mb-2 text-[10px] font-mono text-text-muted justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold">BI <span className="text-text-muted ml-1">{'<GO>'}</span></span>
                    <span>|</span>
                    <span>08:30:15</span>
                  </div>
                  <span className="text-blue-400 font-medium px-1.5 py-0.5 bg-blue-500/10 rounded">TECHNICALS</span>
                </div>
                <h4 className="text-[13px] font-bold text-gray-200 mb-1.5 group-hover:text-blue-400 group-focus:text-blue-400 transition-colors flex items-start gap-1">
                  Key Resistance Levels Reached for {activeSymbol}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </h4>
                <p className="text-[11px] text-text-primary/60 leading-relaxed mb-3">Moving average crossovers and momentum indicators suggest that {activeSymbol} is testing a long-term resistance band. A breakout could signal further upside potential in the near term.</p>
                <div className="flex items-center gap-4 text-[10px] bg-bg-base/40 p-2 rounded border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-text-muted mb-0.5">14-Day RSI</span>
                    <span className="text-amber-400 font-mono">68.4 (Overbought)</span>
                  </div>
                  <div className="w-px h-6 bg-white/10"></div>
                  <div className="flex flex-col">
                    <span className="text-text-muted mb-0.5">50D MA Cross</span>
                    <span className="text-green-400 font-mono">Bullish</span>
                  </div>
                </div>
             </div>
          </div>
      )}

      {activeTab === 'eco' && (
          <div className="flex-1 overflow-y-auto w-full p-3 space-y-3" role="list" aria-label="Economic Calendar">
            {loadingEco ? (
               <div className="p-4 text-[11px] text-text-muted font-mono text-center">Loading calendar...</div>
            ) : (
               ecoEvents && ecoEvents.length > 0 ? (
                 ecoEvents.map((item, index) => (
                   <div 
                     key={index}
                     role="listitem"
                     tabIndex={0}
                     onClick={() => window.open(`https://www.google.com/search?q=economic+calendar+${encodeURIComponent(item.title)}`, '_blank', 'noopener,noreferrer')}
                     className="group border border-border-subtle bg-text-primary/5 p-3 rounded cursor-pointer hover:border-blue-500/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all relative"
                     onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); }}
                   >
                      <div className="flex items-center justify-between gap-2 mb-2 text-[10px] font-mono text-text-muted">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">ECO <span className="text-text-muted ml-1">{'<GO>'}</span></span>
                          <span>|</span>
                          <span>{formatDate(item.timestamp)}</span>
                          <span>|</span>
                          <span>{formatTime(item.timestamp)}</span>
                          <span className="ml-1 uppercase">{item.country}</span>
                        </div>
                        {item.impact === 'High' && <span className="text-red-400 font-medium px-1.5 py-0.5 bg-red-500/10 rounded">HIGH</span>}
                        {item.impact === 'Medium' && <span className="text-amber-400 font-medium px-1.5 py-0.5 bg-amber-500/10 rounded">MED</span>}
                        {item.impact === 'Low' && <span className="text-blue-400 font-medium px-1.5 py-0.5 bg-blue-500/10 rounded">LOW</span>}
                        {item.impact === 'Holiday' && <span className="text-purple-400 font-medium px-1.5 py-0.5 bg-purple-500/10 rounded">HOLIDAY</span>}
                      </div>
                      <h4 className="text-[13px] font-bold text-gray-200 mb-1.5 group-hover:text-blue-400 transition-colors flex items-start gap-1">
                        {item.title}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </h4>
                      
                      {item.impact !== 'Holiday' && (
                        <div className="flex items-center gap-4 text-[10px] bg-bg-base/40 p-2 rounded border border-white/5 mt-2">
                          <div className="flex flex-col">
                            <span className="text-text-muted mb-0.5">Consensus</span>
                            <span className="text-text-primary font-mono">{item.forecast || '--'}</span>
                          </div>
                          <div className="w-px h-6 bg-white/10"></div>
                          <div className="flex flex-col">
                            <span className="text-text-muted mb-0.5">Previous</span>
                            <span className="text-text-primary font-mono">{item.previous || '--'}</span>
                          </div>
                          <div className="w-px h-6 bg-white/10"></div>
                          <div className="flex flex-col">
                            <span className="text-text-muted mb-0.5">Actual</span>
                            <span className={`font-mono ${item.actual ? 'text-green-400' : 'text-text-muted italic'}`}>
                              {item.actual || 'Pending'}
                            </span>
                          </div>
                        </div>
                      )}
                   </div>
                 ))
               ) : (
                 <div className="p-4 text-[11px] text-text-muted font-mono text-center">No upcoming events found</div>
               )
            )}
          </div>
      )}
    </div>
  );
}
