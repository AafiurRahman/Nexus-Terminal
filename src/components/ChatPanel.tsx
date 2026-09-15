import { MoreHorizontal, Bot } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const XIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-3 h-3 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
  </svg>
);

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
}

export function ChatPanel() {
  const [activeTab, setActiveTab] = useState<'x' | 'askb'>('x');
  const [xLoggedIn, setXLoggedIn] = useState(false);
  const [xUser, setXUser] = useState<any>(null);
  const [xToken, setXToken] = useState<string | null>(null);
  const [xFeed, setXFeed] = useState<any[]>([]);
  const [tweetText, setTweetText] = useState('');
  const [xLoginError, setXLoginError] = useState<string | null>(null);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { user, token } = event.data;
        setXUser(user);
        setXToken(token);
        setXLoggedIn(true);
        fetchXFeed(token);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleXLogin = async () => {
    try {
      setXLoginError(null);
      const origin = window.location.origin;
      const res = await fetch(`/api/auth/x/url?origin=${encodeURIComponent(origin)}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get auth URL');
      }
      const { url } = await res.json();
      
      const authWindow = window.open(url, 'x_oauth_popup', 'width=600,height=700');
      if (!authWindow) setXLoginError('Please allow popups for this site to connect your X account.');
    } catch (e: any) {
      console.error(e);
      setXLoginError(e.message === 'X OAuth credentials not configured in environment variables' ? 'Please set X_CLIENT_ID and X_CLIENT_SECRET in Environment Variables' : `Login failed: ${e.message}`);
    }
  };

  const fetchXFeed = async (token: string) => {
    try {
       const res = await fetch('/api/x/feed', { headers: { 'Authorization': `Bearer ${token}` } });
       if (res.ok) {
          const data = await res.json();
          setXFeed(data);
       }
    } catch (e) {
       console.error("Failed to fetch feed");
    }
  };

  const handlePostTweet = async () => {
    if (!tweetText.trim() || !xToken) return;
    try {
      const res = await fetch('/api/x/tweet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xToken}`
        },
        body: JSON.stringify({ text: tweetText })
      });
      if (res.ok) {
        setTweetText('');
        fetchXFeed(xToken);
      } else {
        alert('Failed to post tweet.');
      }
    } catch (e) {
      alert('Failed to post tweet.');
    }
  };

  const handleAskBSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const navMessage = inputMessage;
    setInputMessage('');
    
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: navMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const currentHistory = [...chatHistory];
    setChatHistory([...currentHistory, newUserMsg]);
    setIsTyping(true);

    try {
      const formattedHistory = currentHistory.map(msg => ({ role: msg.role, text: msg.text }));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: navMessage, history: formattedHistory })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const newModelMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, newModelMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: `Error: ${data.error || 'Failed to communicate with AI'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Error: Unable to reach AI service.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-panel border border-border-subtle rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle shrink-0">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('x')}
            className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${activeTab === 'x' ? 'text-text-primary' : 'text-text-muted hover:text-text-primary/80'}`}
          >
            <XIcon />
            Feed
          </button>
          <button 
             onClick={() => setActiveTab('askb')}
            className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${activeTab === 'askb' ? 'text-text-primary' : 'text-text-muted hover:text-text-primary/80'}`}
          >
            <Bot className="w-3 h-3 text-purple-500" />
            ASKB AI
          </button>
        </div>
        <button className="text-text-muted hover:text-text-primary"><MoreHorizontal className="w-3 h-3" /></button>
      </div>
      
      {activeTab === 'x' ? (
        <div className="flex-1 overflow-hidden flex flex-col pt-4 items-center w-full">
          {!xLoggedIn ? (
            <div className="max-w-[240px] space-y-4 m-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <XIcon />
                </div>
              </div>
              <h3 className="text-sm font-bold text-text-primary">Connect your X Account</h3>
              <p className="text-[11px] text-text-muted">
                Login to access your real-time financial timeline and interact with Fintwit directly from the terminal.
              </p>
              <button 
                onClick={handleXLogin}
                className="w-full bg-text-primary text-bg-base font-bold text-[11px] py-2 rounded-full hover:bg-text-primary/90 transition-colors"
              >
                Log in to X
              </button>
              {xLoginError && (
                <div className="text-[10px] text-red-400 bg-red-400/10 p-2 rounded mt-2 text-left border border-red-500/30">
                  {xLoginError}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className="p-3 border-b border-border-subtle flex items-center gap-3">
                {xUser?.profile_image_url ? (
                  <img src={xUser.profile_image_url} alt={xUser.name} className="w-8 h-8 rounded-full" />
                ) : (
                   <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[10px]">YOU</div>
                )}
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={tweetText}
                    onChange={(e) => setTweetText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostTweet()}
                    placeholder="What is happening?!" 
                    className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none" 
                  />
                </div>
                <button 
                  onClick={handlePostTweet}
                  disabled={!tweetText.trim()}
                  className="bg-blue-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-full disabled:opacity-50"
                 >
                  Post
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {xFeed.length > 0 ? (
                  <div className="divide-y divide-border-subtle">
                     {xFeed.map((tweet) => (
                       <div key={tweet.id} className="p-3 hover:bg-white/5 transition-colors">
                          <div className="flex gap-3">
                             {xUser?.profile_image_url ? (
                                <img src={xUser.profile_image_url} alt={xUser.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0">YOU</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-0.5 whitespace-nowrap overflow-hidden">
                                   <span className="font-bold text-[13px] truncate">{xUser?.name}</span>
                                   <span className="text-[11px] text-text-muted truncate">@{xUser?.username}</span>
                                   <span className="text-[11px] text-text-muted">· {tweet.created_at ? new Date(tweet.created_at).toLocaleDateString() : 'Just now'}</span>
                                </div>
                                <p className="text-[13px] text-text-primary/90 leading-snug break-words">{tweet.text}</p>
                                {tweet.public_metrics && (
                                   <div className="flex gap-6 mt-2 text-[11px] text-text-muted">
                                      <span>💬 {tweet.public_metrics.reply_count || 0}</span>
                                      <span>🔄 {tweet.public_metrics.retweet_count || 0}</span>
                                      <span>♥ {tweet.public_metrics.like_count || 0}</span>
                                   </div>
                                )}
                              </div>
                          </div>
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-text-muted space-y-2">
                    <XIcon />
                    <p className="text-xs">Your timeline will appear here.</p>
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-border-subtle text-center">
                 <button onClick={() => { setXLoggedIn(false); setXToken(null); setXUser(null); }} className="text-[10px] underline opacity-50 hover:opacity-100">Log out @{xUser?.username}</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div className="text-[11px]">
               <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-bold text-purple-400 uppercase">ASKB Agent</span>
                  <span className="font-mono text-[9px] text-text-primary/20">System</span>
                </div>
                <div className="bg-purple-900/10 p-2 rounded leading-snug text-text-primary/80 border-l border-purple-500/50">
                  Hello. I am your ASKB Intelligence Assistant. You can query terminal data using natural language.<br/><br/>Try asking:<br/>- "Summarize AAPL Q4 earnings"<br/>- "What's the macro impact of the latest CPI?"<br/>- "Run a stress test on my PORT for a 10% market correction."
                </div>
            </div>

            {chatHistory.map((msg) => (
              <div key={msg.id} className="text-[11px]">
                 <div className="flex items-baseline gap-2 mb-1">
                    <span className={`font-bold uppercase ${msg.role === 'user' ? 'text-blue-400' : 'text-purple-400'}`}>
                      {msg.role === 'user' ? 'You' : 'ASKB Agent'}
                    </span>
                    <span className="font-mono text-[9px] text-text-primary/20">{msg.time}</span>
                  </div>
                  <div className={`p-2 rounded leading-snug text-text-primary/90 border-l ${msg.role === 'user' ? 'bg-blue-900/10 border-blue-500/50' : 'bg-purple-900/10 border-purple-500/50'}`}>
                    {msg.role === 'model' ? (
                      <div className="prose prose-invert prose-sm max-w-none text-[11px] prose-p:my-1 prose-headings:my-2 prose-ul:my-1">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    )}
                  </div>
              </div>
            ))}

            {isTyping && (
              <div className="text-[11px]">
                 <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-purple-400 uppercase">ASKB Agent</span>
                  </div>
                  <div className="bg-purple-900/10 p-2 rounded border-l border-purple-500/50 flex space-x-1 w-12">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                  </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-2 bg-bg-base border-t border-border-subtle shrink-0">
            <form onSubmit={handleAskBSubmit} className="relative">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask anything about finance..." 
                disabled={isTyping}
                className="w-full bg-bg-base border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-purple-500 transition-colors placeholder:text-text-primary/30 disabled:opacity-50 pr-8"
              />
              <button 
                type="submit" 
                disabled={!inputMessage.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-purple-400 disabled:opacity-50 disabled:hover:text-text-muted transition-colors"
               >
                <div className="w-4 h-4 flex items-center justify-center">⇧</div>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
