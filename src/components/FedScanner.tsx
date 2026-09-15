import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, ShieldCheck, Database } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export function FedScanner() {
  const [data, setData] = useState<any>(null);
  const [fredData, setFredData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unmounted = false;
    const fetchFedData = async () => {
       setLoading(true);
       try {
         const res = await fetch("/api/fed-repo");
         if (!res.ok) throw new Error("Failed to fetch NY Fed");
         const json = await res.json();
         
         const fredRes1 = await fetch("/api/fred/DFF").catch(() => null);
         let dffLatest = null;
         if (fredRes1?.ok) {
            const fredJson1 = await fredRes1.json();
            if (fredJson1.observations && fredJson1.observations.length > 0) {
               dffLatest = Number(fredJson1.observations[0].value).toFixed(2);
            }
         }

         const fredRes2 = await fetch("/api/fred/RRPONTSYD").catch(() => null);
         let rrpLatest = null;
         if (fredRes2?.ok) {
            const fredJson2 = await fredRes2.json();
            if (fredJson2.observations && fredJson2.observations.length > 0) {
               rrpLatest = Number(fredJson2.observations[0].value).toFixed(2);
            }
         }

         if (unmounted) return;
         
         if (dffLatest || rrpLatest) {
           setFredData({
             dff: dffLatest,
             rrp: rrpLatest
           });
         }
         
         const ops = json?.repo?.operations || [];
         const reverseRepos = ops.filter((op: any) => op.operationType === "Reverse Repo");
         
         if (reverseRepos.length > 0) {
           const latest = reverseRepos[0];
           
           const totalSubmitted = (latest.totalAmtSubmitted || 0) / 1000000000; // Convert to Billions
           const totalAccepted = (latest.totalAmtAccepted || 0) / 1000000000;
           const ratio = totalAccepted > 0 ? (totalSubmitted / totalAccepted) : 0;

           const history = reverseRepos.slice().reverse().map((op: any) => {
              const s = op.totalAmtSubmitted || 0;
              const a = op.totalAmtAccepted || 0;
              const d = op.operationDate ? op.operationDate.substring(5) : ''; // e.g. "05-07"
              const r = a > 0 ? s / a : 1;
              return { date: d, ratio: Number(r.toFixed(2)) };
           });

           setData({
              date: latest.lastUpdated || new Date().toISOString(),
              totalSubmittedAmt: totalSubmitted,
              totalAcceptedAmt: totalAccepted,
              ratio,
              raw: latest,
              history
           });
         } else {
           throw new Error("No operations found");
         }
       } catch (err) {
         console.error(err);
         if (!unmounted) {
            setData({ error: true });
         }
       } finally {
         if (!unmounted) setLoading(false);
       }
    };

    fetchFedData();
    const interval = setInterval(fetchFedData, 30000); // 30s refresh
    return () => {
      unmounted = true;
      clearInterval(interval);
    }
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col h-full bg-bg-panel border border-border-subtle rounded-md overflow-hidden p-4 items-center justify-center">
        <Activity className="w-6 h-6 text-text-muted animate-pulse mb-2" />
        <span className="text-xs text-text-muted uppercase tracking-widest font-mono">Connecting NY Fed...</span>
      </div>
    );
  }

  if (data?.error) {
    return (
      <div className="flex flex-col h-full bg-bg-panel border border-border-subtle rounded-md overflow-hidden p-4 items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-500 mb-2" />
        <span className="text-xs text-red-500 uppercase tracking-widest font-mono">NY Fed API Unavailable</span>
      </div>
    );
  }

  const r = data?.ratio || 0;
  const isRed = r >= 3.0;
  const isGreen = r <= 2.0;
  const isNeutral = !isRed && !isGreen;

  return (
    <div className="flex flex-col h-full bg-bg-panel border border-border-subtle rounded-md overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-bg-base/50 shrink-0">
        <div className="flex items-center gap-2">
           <Database className="w-3.5 h-3.5 text-blue-500" />
           <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary">Fed Liquidity & Panic Scanner</span>
        </div>
        <div className="flex items-center gap-1.5">
           <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-purple-accent animate-pulse' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></div>
           <span className="text-[9px] font-mono text-text-muted">LIVE_NYFRB</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-center min-h-0">
         <div className="flex flex-col lg:flex-row gap-6 h-full">
           
           {/* Left side: Gauges */}
           <div className="flex flex-col justify-between w-full lg:w-1/3 shrink-0">
              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="flex flex-col">
                   <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">RRP Award</span>
                   <span className="text-lg font-mono text-text-primary">
                     ${data.totalAcceptedAmt ? data.totalAcceptedAmt.toFixed(2) : '0.00'}B
                   </span>
                 </div>
                 <div className="flex flex-col text-right">
                   <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Total ON RRP (FRED)</span>
                   <span className="text-lg font-mono text-text-primary">
                     ${fredData?.rrp ? Number(fredData.rrp).toLocaleString() : '---'}B
                   </span>
                 </div>
                 <div className="flex flex-col mt-2 col-span-2 text-center bg-bg-base/30 border border-border-subtle rounded py-2">
                   <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Effective Fed Funds Rate (DFF)</span>
                   <span className="text-xl font-mono font-bold text-blue-400">
                     {fredData?.dff ? `${fredData.dff}%` : '---'}
                   </span>
                 </div>
              </div>

              {/* The Big Gauge */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 border border-border-subtle rounded-lg bg-bg-base/30 relative overflow-hidden">
                 <span className="text-xs text-text-muted uppercase font-bold tracking-widest mb-2 z-10">Bid-to-Cover Ratio</span>
                 
                 <div className={`text-5xl font-mono font-bold z-10 transition-colors ${isRed ? 'text-red-500' : isGreen ? 'text-green-500' : 'text-purple-accent'}`}>
                   {r.toFixed(2)}x
                 </div>

                 <div className={`mt-3 flex items-center gap-1.5 z-10 uppercase text-[10px] font-bold tracking-widest ${isRed ? 'text-red-500' : isGreen ? 'text-green-500' : 'text-purple-accent'}`}>
                    {isRed && <><AlertTriangle className="w-3.5 h-3.5"/> Panic / Bullish</>}
                    {isGreen && <><ShieldCheck className="w-3.5 h-3.5"/> Calm / Bearish</>}
                    {isNeutral && <><Activity className="w-3.5 h-3.5"/> Watching</>}
                 </div>

                 {/* Glowing background effect */}
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 blur-[50px] opacity-20 transition-colors ${isRed ? 'bg-red-500' : isGreen ? 'bg-green-500' : 'bg-purple-accent'}`}></div>
              </div>
           </div>
           
           {/* Right side: Chart */}
           <div className="flex-1 min-h-0 min-w-0 flex flex-col border border-border-subtle bg-bg-base/30 rounded-lg p-2 relative">
             <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest absolute top-2 left-3 z-10">Timeline (7 Ops)</span>
             <div className="flex-1 min-h-[120px] pt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={data.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorRatio" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor={isRed ? "#FF4757" : isGreen ? "#00C896" : "#6B7FD4"} stopOpacity={0.3}/>
                       <stop offset="95%" stopColor={isRed ? "#FF4757" : isGreen ? "#00C896" : "#6B7FD4"} stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="date" tick={{fontSize: 10, fill: 'var(--text-muted)'}} stroke="var(--border-subtle)" />
                   <YAxis tick={{fontSize: 10, fill: 'var(--text-muted)'}} stroke="var(--border-subtle)" />
                   <Tooltip 
                     contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-subtle)', fontSize: '12px' }}
                     itemStyle={{ color: 'var(--text-primary)' }}
                     labelStyle={{ color: 'var(--text-muted)' }}
                   />
                   <ReferenceLine y={3} stroke="#FF4757" strokeDasharray="3 3" opacity={0.5} />
                   <ReferenceLine y={2} stroke="#00C896" strokeDasharray="3 3" opacity={0.5} />
                   <Area 
                     type="monotone" 
                     dataKey="ratio" 
                     stroke={isRed ? "#FF4757" : isGreen ? "#00C896" : "#6B7FD4"} 
                     fillOpacity={1} 
                     fill="url(#colorRatio)" 
                   />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           </div>

         </div>
      </div>
    </div>
  );
}
