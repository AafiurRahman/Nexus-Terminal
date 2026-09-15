import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { TwitterApi } from "twitter-api-v2";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple in-memory cache
  const cache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_TTL = 15 * 1000; // 15 seconds
  const authStates = new Map<string, { codeVerifier: string, redirectUri: string }>();

  // X OAuth Endpoints
  app.get('/api/auth/x/url', (req, res) => {
    try {
      const clientId = process.env.X_CLIENT_ID;
      const clientSecret = process.env.X_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'X OAuth credentials not configured in environment variables' });
      }

      // Pass the base URL from the frontend to ensure we have the correct origin
      const baseUrl = req.query.origin as string;
      if (!baseUrl) {
        return res.status(400).json({ error: 'Missing origin parameter' });
      }
      
      const redirectUri = `${baseUrl}/api/auth/x/callback`;
      
      const client = new TwitterApi({ clientId, clientSecret });
      // Generate auth url
      const { url, codeVerifier, state } = client.generateOAuth2AuthLink(redirectUri, { scope: ['tweet.read', 'users.read', 'tweet.write'] });
      
      // Store codeVerifier with state
      authStates.set(state, { codeVerifier, redirectUri });
      
      res.json({ url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  });

  app.get(['/api/auth/x/callback', '/api/auth/x/callback/'], async (req, res) => {
    try {
      const { state, code } = req.query;
      
      if (!state || !code || typeof state !== 'string' || typeof code !== 'string') {
        return res.status(400).send('Invalid callback parameters');
      }
      
      const authState = authStates.get(state);
      if (!authState) {
        return res.status(400).send('Invalid state or session expired');
      }
      
      const { codeVerifier, redirectUri } = authState;
      authStates.delete(state);
      
      const clientId = process.env.X_CLIENT_ID!;
      const clientSecret = process.env.X_CLIENT_SECRET!;
      const client = new TwitterApi({ clientId, clientSecret });
      
      const { client: loggedClient, accessToken, refreshToken } = await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri
      });
      
      // Get user info
      const user = await loggedClient.v2.me({ "user.fields": ["profile_image_url"] });
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(user.data)}, token: '${accessToken}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err) {
      console.error(err);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/x/feed', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
      const client = new TwitterApi(token);
      const me = await client.v2.me();
      const tweets = await client.v2.userTimeline(me.data.id, { max_results: 10, "tweet.fields": ["created_at", "public_metrics"] });
      
      res.json(tweets.data.data || []);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch X feed' });
    }
  });

  app.post('/api/x/tweet', async (req, res) => {
     try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'No token provided' });
      const client = new TwitterApi(token);
      const { text } = req.body;
      const rwClient = client.readWrite;
      await rwClient.v2.tweet(text);
      res.json({ success: true });
     } catch (err) {
       console.error(err);
       res.status(500).json({ error: 'Failed to post tweet' });
     }
  });

  // Real-time market data proxy to bypass CORS and API limits
  app.get("/api/market/:symbol", async (req, res) => {
    try {
      const symbol = req.params.symbol;
      const range = (req.query.range as string) || "1d";
      const interval = (req.query.interval as string) || "1m";
      
      const cacheKey = `${symbol}_${range}_${interval}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }

      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`);
      if (!response.ok) {
        // Return a 404 gracefully without logging to avoid console spam for invalid symbols
        return res.status(404).json({ error: `Yahoo Finance API returned ${response.status}`, symbol });
      }
      const data = await response.json();
      
      const chart = data.chart?.result?.[0];
      if (!chart) {
        return res.status(404).json({ error: "Symbol not found" });
      }

      const meta = chart.meta;
      const timestamps = chart.timestamp || [];
      const quotes = chart.indicators?.quote?.[0] || {};
      
      const history = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (quotes.close[i] !== null) {
          history.push({
            time: new Date(timestamps[i] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            date: new Date(timestamps[i] * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            price: quotes.close[i],
            open: quotes.open[i],
            high: quotes.high[i],
            low: quotes.low[i],
            close: quotes.close[i],
            volume: quotes.volume?.[i] || 0,
            timestamp: timestamps[i] * 1000
          });
        }
      }

      const result = {
        symbol: meta.symbol,
        price: meta.regularMarketPrice,
        previousClose: meta.previousClose,
        change: meta.regularMarketPrice - meta.previousClose,
        percentChange: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        volume: meta.regularMarketVolume || 0,
        history: history.slice(-500) // Keep more points for different timeframes
      };

      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  // Live News from Yahoo Finance
  app.get("/api/news", async (req, res) => {
    try {
      const query = (req.query.q as string) || "markets";
      
      const cached = cache.get(`news_${query}`);
      if (cached && Date.now() - cached.timestamp < 300000) { // cache news for 5 mins
        return res.json(cached.data);
      }

      const response = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${query}&newsCount=15`);
      if (!response.ok) {
        return res.status(response.status).json({ error: `Yahoo Finance API returned ${response.status}` });
      }
      const data = await response.json();
      
      const news = data.news || [];
      const formattedNews = news.map((item: any) => {
        const text = item.title.toLowerCase();
        let sentiment = 'neutral';
        if (text.match(/(soar|surge|jump|gain|up|buy|bull|positive|grow|beat|high|top|outperform|upgrade|soars|surges)/)) sentiment = 'bullish';
        else if (text.match(/(plunge|sink|drop|fall|down|sell|bear|negative|shrink|miss|low|cut|slash|slump|downgrade|falls|drops)/)) sentiment = 'bearish';
        
        return {
          id: item.uuid,
          title: item.title,
          publisher: item.publisher,
          link: item.link,
          timestamp: item.providerPublishTime * 1000,
          tickers: item.relatedTickers || [],
          sentiment
        };
      });

      cache.set(`news_${query}`, { data: formattedNews, timestamp: Date.now() });
      res.json(formattedNews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news data" });
    }
  });

  // Economic Calendar from free JSON feed
  app.get("/api/eco-calendar", async (req, res) => {
    try {
      const cached = cache.get('eco_calendar');
      if (cached && Date.now() - cached.timestamp < 60000) { // cache for 1 minute
        return res.json(cached.data);
      }

      const response = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        if (cached) return res.json(cached.data);
        throw new Error(`Forex Factory API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter out past events and sort by date
      const now = new Date().getTime();
      const formattedCalendar = (data || [])
        .map((item: any) => ({
           title: item.title,
           country: item.country,
           date: item.date,
           timestamp: new Date(item.date).getTime(),
           impact: item.impact, // "High", "Medium", "Low", "Holiday"
           forecast: item.forecast,
           previous: item.previous,
           actual: item.actual || item.actual_formatted || item.Actual || item.ActualValue
        }))
        //.filter((item: any) => item.timestamp > now - 86400000) // Keep last 24h as well
        .sort((a: any, b: any) => a.timestamp - b.timestamp);
        
      cache.set('eco_calendar', { data: formattedCalendar, timestamp: Date.now() });
      res.json(formattedCalendar);
    } catch (error: any) {
      console.warn("Using fallback for eco calendar due to:", error.message);
      const cached = cache.get('eco_calendar');
      if (cached) return res.json(cached.data);
      
      // Fallback mock data
      res.json([
        { title: "NFP Employment Change", country: "USD", date: new Date(Date.now() + 86400000).toISOString(), impact: "High", forecast: "190K", previous: "175K" },
        { title: "CPI m/m", country: "USD", date: new Date(Date.now() + 172800000).toISOString(), impact: "High", forecast: "0.3%", previous: "0.2%" },
        { title: "ECB Rate Decision", country: "EUR", date: new Date(Date.now() + 259200000).toISOString(), impact: "High", forecast: "4.00%", previous: "4.00%" }
      ]);
    }
  });

  // FRED API proxy for macroeconomic data
  app.get("/api/fred/:series", async (req, res) => {
    try {
      const seriesId = req.params.series;
      const cached = cache.get(`fred_${seriesId}`);
      if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hr cache
        return res.json(cached.data);
      }

      const apiKey = "572b3816e261273fa971c0c50b8a05cb";
      const response = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=30&sort_order=desc`);
      if (!response.ok) {
        return res.status(response.status).json({ error: `FRED API error: ${response.status}` });
      }
      
      const data = await response.json();
      cache.set(`fred_${seriesId}`, { data, timestamp: Date.now() });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FRED data" });
    }
  });

  // NY Fed Repo Operations proxy (gets last 7 operations)
  app.get("/api/fed-repo", async (req, res) => {
    try {
      const response = await fetch("https://markets.newyorkfed.org/api/rp/all/all/results/last/7.json");
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch NY Fed data" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Internal server error fetching NY Fed data" });
    }
  });

  // Alpaca API connection
  app.get("/api/alpaca/account", async (req, res) => {
    try {
      const apiKey = process.env.ALPACA_API_KEY;
      const apiSecret = process.env.ALPACA_API_SECRET;
      
      if (!apiKey || !apiSecret) {
        return res.status(401).json({ error: "ALPACA_API_KEY and ALPACA_API_SECRET are missing. Please configure them in the environment." });
      }

      const response = await fetch("https://paper-api.alpaca.markets/v2/account", {
        headers: {
          "APCA-API-KEY-ID": apiKey,
          "APCA-API-SECRET-KEY": apiSecret
        }
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: `Alpaca API returned ${response.status}` });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to connect to Alpaca API" });
    }
  });

  app.get("/api/alpaca/positions", async (req, res) => {
    try {
      const apiKey = process.env.ALPACA_API_KEY;
      const apiSecret = process.env.ALPACA_API_SECRET;
      
      if (!apiKey || !apiSecret) {
        return res.status(401).json({ error: "Alpaca API keys missing" });
      }

      const response = await fetch("https://paper-api.alpaca.markets/v2/positions", {
        headers: {
          "APCA-API-KEY-ID": apiKey,
          "APCA-API-SECRET-KEY": apiSecret
        }
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: `Alpaca API returned ${response.status}` });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Alpaca positions" });
    }
  });

  // AI Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(401).json({ error: "GEMINI_API_KEY is not set" });
      }

      const { message, history } = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const contents = [
        {
          role: 'user',
          parts: [{ text: "You are the ASKB AI Assistant, a sophisticated artificial intelligence designed to provide objective, institutional-grade context on financial markets, macroeconomics, and trading. Keep answers concise, precise, and formatted suitably for a terminal UI." }]
        },
        {
          role: 'model',
          parts: [{ text: "Acknowledged. System initialized. Real-time data synthesis enabled. How can I assist?" }]
        }
      ];

      if (history && history.length > 0) {
        history.forEach((msg: any) => {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        });
      }

      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents
      });

      res.json({ reply: response.text });
    } catch (error) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
