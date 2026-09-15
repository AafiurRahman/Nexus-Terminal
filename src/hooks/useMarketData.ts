import { useState, useEffect } from 'react';

export type Tick = { time: string; date: string; price: number; open: number; high: number; low: number; close: number; volume: number; timestamp: number };

export function useMarketData(symbol: string, range: string = '1d', interval: string = '1m') {
  const [data, setData] = useState<{ price: number; change: number; percentChange: number; volume: number; history: Tick[], loading: boolean, error?: boolean }>({ price: 0, change: 0, percentChange: 0, volume: 0, history: [], loading: true });

  useEffect(() => {
    if (!symbol) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    let unmounted = false;
    let pollInterval: ReturnType<typeof setInterval>;

    const fetchRealData = async () => {
      try {
        const res = await fetch(`/api/market/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`);
        if (res.status === 404) {
          // Stop polling if symbol doesn't exist
          if (pollInterval) clearInterval(pollInterval);
          if (unmounted) return;
          if (data.loading) setData(prev => ({...prev, loading: false, error: true}));
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        
        if (unmounted) return;

        if (json.price) {
          setData({
            price: json.price,
            change: json.change,
            percentChange: json.percentChange,
            volume: json.volume || 0,
            history: json.history || [],
            loading: false
          });
        }
      } catch (e) {
        // Suppress console error to avoid spamming the console
        if (!unmounted && data.loading) setData(prev => ({...prev, loading: false, error: true}));
      }
    };

    // Initial fetch
    fetchRealData();
    
    // Poll every 15 seconds for real updates
    pollInterval = setInterval(fetchRealData, 15000);

    return () => {
      unmounted = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [symbol, range, interval]);

  return data;
}
