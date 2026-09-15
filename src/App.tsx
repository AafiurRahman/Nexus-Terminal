import { TickerTape } from './components/TickerTape';
import { TopBar } from './components/TopBar';
import { MainChart } from './components/MainChart';
import { WatchlistPanel } from './components/WatchlistPanel';
import { NewsPanel } from './components/NewsPanel';
import { ChatPanel } from './components/ChatPanel';
import { OrderPanel } from './components/OrderPanel';
import { KeyboardFooter } from './components/KeyboardFooter';
import { LoginTerminal } from './components/LoginTerminal';
import { FedScanner } from './components/FedScanner';
import { ScreenerPanel } from './components/ScreenerPanel';
import { LoadingScreen } from './components/LoadingScreen';
import { AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [activeSymbol, setActiveSymbol] = useState('AAPL');
  const [activeView, setActiveView] = useState<'stocks' | 'fed' | 'screener'>('stocks');
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loadingAnimationDone, setLoadingAnimationDone] = useState(false);
  const [layoutFormat, setLayoutFormat] = useState<'default' | 'grid' | 'minimal'>('default');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const isInitializing = !loadingAnimationDone || authChecking;

  return (
    <>
      {/* Mobile Portrait Overlay */}
      <div className="fixed inset-0 z-[9999] bg-bg-base/98 backdrop-blur-md flex-col items-center justify-center p-8 text-center hidden portrait:flex md:portrait:hidden">
        <div className="w-16 h-16 border-2 border-blue-500 flex items-center justify-center bg-blue-500/10 font-bold text-blue-500 text-3xl mb-6 shadow-[0_0_15px_rgba(59,130,246,0.3)]">Δ</div>
        <h2 className="text-xl tracking-[0.2em] font-bold text-white mb-8">ARBANALYTICS</h2>
        
        <div className="w-24 h-24 mb-8 relative flex items-center justify-center animate-[spin_2s_ease-in-out_infinite_alternate]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-blue-400 rotate-90">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        </div>
        
        <p className="text-text-primary font-mono text-sm max-w-[250px] leading-relaxed uppercase tracking-wider">
          <span className="text-blue-400 font-bold">Terminal requires horizontal screen space.</span><br/><br/>
          Please rotate your device to landscape orientation.
        </p>
      </div>

      <AnimatePresence>
        {isInitializing && (
          <LoadingScreen 
            key="loading-screen" 
            onComplete={() => setLoadingAnimationDone(true)} 
          />
        )}
      </AnimatePresence>
      
      {/* When initializing is done, show the app. If no user, it sits in background blurred. */}
      {!isInitializing && (
        <div className="h-screen w-screen flex flex-col bg-bg-base text-text-primary overflow-hidden font-sans select-none relative">
          
          {!user && (
            <div className="absolute inset-0 z-50 overflow-hidden">
              {/* Blur backdrop */}
              <div className="absolute inset-0 bg-bg-base/60 backdrop-blur-md z-40" />
              {/* Login terminal */}
              <div className="absolute inset-0 z-50 flex items-center justify-center">
                <LoginTerminal onLogin={() => {}} />
              </div>
            </div>
          )}

          <TopBar 
            onSearch={setActiveSymbol} 
            layoutFormat={layoutFormat} 
            setLayoutFormat={setLayoutFormat} 
          />
      <TickerTape />
      
      {/* Dynamic Layout */}
      <div className="flex-1 min-h-0 bg-bg-base relative p-2">
        {layoutFormat === 'default' && (
          <div className="h-full grid grid-cols-12 gap-2">
            <div className="col-span-3 flex flex-col border border-border-subtle rounded bg-bg-panel overflow-hidden">
              <WatchlistPanel onSymbolSelect={setActiveSymbol} activeSymbol={activeSymbol} />
            </div>
             <div className="col-span-6 flex flex-col gap-2">
              <div className="flex bg-bg-panel border border-border-subtle rounded p-1 gap-1 shrink-0">
                <button 
                  onClick={() => setActiveView('stocks')}
                  className={`flex-1 text-xs font-mono py-1 rounded transition-colors ${activeView === 'stocks' ? 'bg-blue-600 text-white' : 'text-text-muted hover:bg-white/5 hover:text-text-primary'}`}
                >
                  STOCK CHART
                </button>
                <button 
                  onClick={() => setActiveView('screener')}
                  className={`flex-1 text-xs font-mono py-1 rounded transition-colors ${activeView === 'screener' ? 'bg-blue-600 text-white' : 'text-text-muted hover:bg-white/5 hover:text-text-primary'}`}
                >
                  DATA & SCREENER
                </button>
                <button 
                  onClick={() => setActiveView('fed')}
                  className={`flex-1 text-xs font-mono py-1 rounded transition-colors ${activeView === 'fed' ? 'bg-blue-600 text-white' : 'text-text-muted hover:bg-white/5 hover:text-text-primary'}`}
                >
                  FED LIQUIDITY & PANIC
                </button>
              </div>
              <div className="flex-1 min-h-0">
                {activeView === 'stocks' ? <MainChart symbol={activeSymbol} /> : activeView === 'screener' ? <ScreenerPanel activeSymbol={activeSymbol} /> : <FedScanner />}
              </div>
              <div className="h-[250px] shrink-0">
                <NewsPanel activeSymbol={activeSymbol} />
              </div>
            </div>
            <div className="col-span-3 flex flex-col gap-2 rounded overflow-hidden">
              <div className="flex-1 min-h-0">
                <OrderPanel activeSymbol={activeSymbol} />
              </div>
              <div className="h-[280px] shrink-0 border border-border-subtle rounded">
                <ChatPanel />
              </div>
            </div>
          </div>
        )}

        {layoutFormat === 'grid' && (
          <div className="h-full grid grid-cols-2 grid-rows-2 gap-2">
            <div className="col-span-1 row-span-1 flex flex-col min-h-0">
              <MainChart symbol={activeSymbol} />
            </div>
            <div className="col-span-1 row-span-1 flex flex-col border border-border-subtle rounded bg-bg-panel min-h-0 overflow-hidden">
              <WatchlistPanel onSymbolSelect={setActiveSymbol} activeSymbol={activeSymbol} />
            </div>
            <div className="col-span-1 row-span-1 flex flex-col min-h-0">
              <OrderPanel activeSymbol={activeSymbol} />
            </div>
            <div className="col-span-1 row-span-1 flex flex-col min-h-0 border border-border-subtle rounded bg-bg-panel">
              <NewsPanel activeSymbol={activeSymbol} />
            </div>
          </div>
        )}

        {layoutFormat === 'minimal' && (
          <div className="h-full flex gap-2">
            <div className="flex-1 flex flex-col min-h-0">
              <MainChart symbol={activeSymbol} />
            </div>
            <div className="w-[320px] shrink-0 flex flex-col gap-2">
              <div className="flex-1 min-h-0">
                <OrderPanel activeSymbol={activeSymbol} />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <KeyboardFooter onCategorySelect={setActiveSymbol} activeSymbol={activeSymbol} />
    </div>
      )}
    </>
  );
}
