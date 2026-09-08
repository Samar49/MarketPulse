const YahooFinance = require("yahoo-finance2").default;

const { setCache, getCache } = require("./cacheService");

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const INDEX_SYMBOLS = {
  NIFTY50: "^NSEI",
  BANKNIFTY: "^NSEBANK",
  SENSEX: "^BSESN",
  SP500: "^GSPC",
  NASDAQ: "^IXIC",
};

const GLOBAL_MARKET_SYMBOLS = {
  DOWJONES: "^DJI",
  NIKKEI: "^N225",
  HANGSENG: "^HSI",
  FTSE100: "^FTSE",
};

const GLOBAL_MARKET_NAMES = {
  DOWJONES: "Dow Jones",
  NIKKEI: "Nikkei 225",
  HANGSENG: "Hang Seng",
  FTSE100: "FTSE 100",
};

const SECTOR_SYMBOLS = {
  IT: "^CNXIT",
  PHARMA: "^CNXPHARMA",
  AUTO: "^CNXAUTO",
  METAL: "^CNXMETAL",
  FMCG: "^CNXFMCG",
};

const MARKET_OVERVIEW_CACHE_TTL = 15 * 1000;
const SECTOR_CACHE_TTL = 30 * 1000;
const GLOBAL_MARKET_CACHE_TTL = 30 * 1000;
const INTRADAY_CACHE_TTL = 60 * 1000;

const normalizeQuote = (quote, displaySymbol) => {
  if (!quote) return null;

  return {
    symbol: displaySymbol,
    price: quote.regularMarketPrice ?? null,
    change: quote.regularMarketChange ?? null,
    changePercent: quote.regularMarketChangePercent ?? null,
  };
};

const getQuote = async (symbol, displaySymbol) => {
  try {
    const quote = await yahooFinance.quote(symbol);
    const normalized = normalizeQuote(quote, displaySymbol);

    if (!normalized) {
      throw new Error(`No quote data returned for ${symbol}`);
    }

    return normalized;
  } catch (error) {
    console.error(`Yahoo quote failed for ${symbol}:`, error.message);
    throw error;
  }
};

// Used when we want one failed Yahoo request to not break the entire dashboard.
const getSafeQuote = async (symbol, displaySymbol) => {
  try {
    const data = await getQuote(symbol, displaySymbol);
    return { success: true, data };
  } catch (error) {
    return { success: false, data: null, error: error.message };
  }
};

const getMarketOverview = async () => {
  const cachedData = getCache("marketOverview");

  if (cachedData) {
    console.log("Market overview served from cache");
    return cachedData;
  }

  console.log("Fetching fresh market overview");

  const results = await Promise.allSettled([
    getQuote(INDEX_SYMBOLS.NIFTY50, "NIFTY50"),
    getQuote(INDEX_SYMBOLS.BANKNIFTY, "BANKNIFTY"),
    getQuote(INDEX_SYMBOLS.SP500, "SP500"),
    getQuote(INDEX_SYMBOLS.NASDAQ, "NASDAQ"),
  ]);

  const [niftyResult, bankNiftyResult, sp500Result, nasdaqResult] = results;

  const data = {
    nifty50: niftyResult.status === "fulfilled" ? niftyResult.value : null,
    bankNifty: bankNiftyResult.status === "fulfilled" ? bankNiftyResult.value : null,
    sp500: sp500Result.status === "fulfilled" ? sp500Result.value : null,
    nasdaq: nasdaqResult.status === "fulfilled" ? nasdaqResult.value : null,
  };

  const successfulCount = Object.values(data).filter((item) => item !== null).length;

  if (successfulCount > 0) {
    setCache("marketOverview", data, MARKET_OVERVIEW_CACHE_TTL);
  }

  if (successfulCount < Object.keys(data).length) {
    console.warn("Some market overview quotes failed");
  }

  return data;
};

// Used for 1W / 1M / 3M / 6M / 1Y — daily historical candles.
const getHistoricalPrices = async (symbol, period1, period2, interval = "1d") => {
  if (!symbol) {
    throw new Error("Symbol is required");
  }

  const history = await yahooFinance.historical(symbol, { period1, period2, interval });

  if (!Array.isArray(history)) return [];

  return history.map((item) => ({
    date: item.date,
    open: item.open ?? null,
    high: item.high ?? null,
    low: item.low ?? null,
    close: item.close ?? null,
    volume: item.volume ?? 0,
  }));
};

// Used by the NIFTY 50 1D chart (default interval: 5m). Fetches a small
// recent window and keeps only the latest available trading session.
const getIntradayPrices = async (symbol = INDEX_SYMBOLS.NIFTY50, interval = "5m") => {
  if (!symbol) {
    throw new Error("Symbol is required");
  }

  // Only allow intervals Yahoo Finance supports for intraday chart data.
  const allowedIntervals = ["1m", "2m", "5m", "15m", "30m", "60m"];

  if (!allowedIntervals.includes(interval)) {
    throw new Error(`Unsupported intraday interval: ${interval}`);
  }

  // Cache key includes symbol + interval, e.g. intraday-^NSEI-5m
  const cacheKey = `intraday-${symbol}-${interval}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    console.log(`Intraday data served from cache: ${symbol} ${interval}`);
    return cachedData;
  }

  console.log(`Fetching intraday data: ${symbol} ${interval}`);

  // Fetch the last two calendar days — enough to handle weekends and other
  // non-trading periods while keeping the request small.
  const period2 = new Date();
  const period1 = new Date();
  period1.setDate(period1.getDate() - 2);

  const result = await yahooFinance.chart(symbol, { period1, period2, interval });
  const quotes = result?.quotes || [];

  if (!quotes.length) {
    throw new Error("No intraday market data available");
  }

  const normalizedData = quotes
    .filter((item) => item && item.date && item.close !== null && item.close !== undefined)
    .map((item) => ({
      date: item.date,
      open: item.open ?? null,
      high: item.high ?? null,
      low: item.low ?? null,
      close: item.close ?? null,
      volume: item.volume ?? 0,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!normalizedData.length) {
    throw new Error("No valid intraday market data available");
  }

  // Use the latest available candle rather than today's calendar date — this
  // matters when the market is closed, on weekends, or on an NSE holiday.
  const latestCandle = normalizedData[normalizedData.length - 1];
  const latestDate = new Date(latestCandle.date);
  const latestYear = latestDate.getUTCFullYear();
  const latestMonth = latestDate.getUTCMonth();
  const latestDay = latestDate.getUTCDate();

  // Keep only candles belonging to the latest available trading session.
  const latestSessionData = normalizedData.filter((item) => {
    const itemDate = new Date(item.date);

    return (
      itemDate.getUTCFullYear() === latestYear &&
      itemDate.getUTCMonth() === latestMonth &&
      itemDate.getUTCDate() === latestDay
    );
  });

  if (!latestSessionData.length) {
    throw new Error("Unable to determine latest intraday session");
  }

  // Metadata lets the frontend know whether it's displaying today's session
  // or the latest completed session.
  const sessionDate = `${latestYear}-${String(latestMonth + 1).padStart(2, "0")}-${String(
    latestDay
  ).padStart(2, "0")}`;

  const resultData = {
    symbol,
    interval,
    sessionDate,
    dataStatus: "latest_available_session",
    data: latestSessionData,
  };

  // Intraday data changes much more frequently than daily historical data — refresh every 60s.
  setCache(cacheKey, resultData, INTRADAY_CACHE_TTL);

  return resultData;
};

const getSectorPerformance = async () => {
  const cachedData = getCache("sectorPerformance");

  if (cachedData) {
    console.log("Sector performance served from cache");
    return cachedData;
  }

  console.log("Fetching fresh sector performance");

  const entries = Object.entries(SECTOR_SYMBOLS);

  const results = await Promise.allSettled(
    entries.map(async ([sector, symbol]) => {
      const quote = await yahooFinance.quote(symbol);

      return {
        sector,
        symbol,
        price: quote.regularMarketPrice ?? null,
        change: quote.regularMarketChange ?? null,
        changePercent: quote.regularMarketChangePercent ?? null,
      };
    })
  );

  const sectors = [];

  results.forEach((result, index) => {
    const [sector, symbol] = entries[index];

    if (result.status === "fulfilled") {
      sectors.push(result.value);
    } else {
      console.error(
        `Sector quote failed for ${sector} (${symbol}):`,
        result.reason?.message || result.reason
      );
    }
  });

  sectors.sort((a, b) => {
    const bValue = Number(b.changePercent);
    const aValue = Number(a.changePercent);

    return (Number.isFinite(bValue) ? bValue : -Infinity) - (Number.isFinite(aValue) ? aValue : -Infinity);
  });

  if (sectors.length > 0) {
    setCache("sectorPerformance", sectors, SECTOR_CACHE_TTL);
  }

  return sectors;
};

const getGlobalMarkets = async () => {
  const cachedData = getCache("globalMarkets");

  if (cachedData) {
    console.log("Global markets served from cache");
    return cachedData;
  }

  console.log("Fetching fresh global markets");

  const entries = Object.entries(GLOBAL_MARKET_SYMBOLS);

  const results = await Promise.allSettled(
    entries.map(async ([market, symbol]) => {
      const quote = await yahooFinance.quote(symbol);

      return {
        market,
        name: GLOBAL_MARKET_NAMES[market] ?? market,
        symbol,
        price: quote.regularMarketPrice ?? null,
        change: quote.regularMarketChange ?? null,
        changePercent: quote.regularMarketChangePercent ?? null,
        currency: quote.currency ?? null,
      };
    })
  );

  const markets = [];

  results.forEach((result, index) => {
    const [market, symbol] = entries[index];

    if (result.status === "fulfilled") {
      markets.push(result.value);
    } else {
      console.error(
        `Global market quote failed for ${market} (${symbol}):`,
        result.reason?.message || result.reason
      );
    }
  });

  if (markets.length > 0) {
    setCache("globalMarkets", markets, GLOBAL_MARKET_CACHE_TTL);
  }

  return markets;
};

// Resolves a free-text question like "why is bank nifty up?" to a specific
// index. More specific phrases are listed before broader phrases.
const INDEX_KEYWORD_MAP = [
  { keywords: ["bank nifty", "banknifty", "nifty bank"], key: "BANKNIFTY", name: "Bank Nifty", symbol: INDEX_SYMBOLS.BANKNIFTY },
  { keywords: ["nifty it"], key: "NIFTYIT", name: "Nifty IT", symbol: SECTOR_SYMBOLS.IT },
  { keywords: ["nifty pharma"], key: "NIFTYPHARMA", name: "Nifty Pharma", symbol: SECTOR_SYMBOLS.PHARMA },
  { keywords: ["nifty auto"], key: "NIFTYAUTO", name: "Nifty Auto", symbol: SECTOR_SYMBOLS.AUTO },
  { keywords: ["nifty metal"], key: "NIFTYMETAL", name: "Nifty Metal", symbol: SECTOR_SYMBOLS.METAL },
  { keywords: ["nifty fmcg"], key: "NIFTYFMCG", name: "Nifty FMCG", symbol: SECTOR_SYMBOLS.FMCG },
  { keywords: ["nifty"], key: "NIFTY50", name: "Nifty 50", symbol: INDEX_SYMBOLS.NIFTY50 },
  { keywords: ["sensex"], key: "SENSEX", name: "Sensex", symbol: INDEX_SYMBOLS.SENSEX },
  { keywords: ["s&p 500", "s&p500", "sp500"], key: "SP500", name: "S&P 500", symbol: INDEX_SYMBOLS.SP500 },
  { keywords: ["nasdaq"], key: "NASDAQ", name: "Nasdaq", symbol: INDEX_SYMBOLS.NASDAQ },
  { keywords: ["dow jones"], key: "DOWJONES", name: "Dow Jones", symbol: GLOBAL_MARKET_SYMBOLS.DOWJONES },
  { keywords: ["nikkei"], key: "NIKKEI", name: "Nikkei 225", symbol: GLOBAL_MARKET_SYMBOLS.NIKKEI },
  { keywords: ["hang seng"], key: "HANGSENG", name: "Hang Seng", symbol: GLOBAL_MARKET_SYMBOLS.HANGSENG },
  { keywords: ["ftse"], key: "FTSE100", name: "FTSE 100", symbol: GLOBAL_MARKET_SYMBOLS.FTSE100 },
];

const resolveIndexFromMessage = (message) => {
  const text = String(message || "").toLowerCase();

  const matched = INDEX_KEYWORD_MAP.find((entry) =>
    entry.keywords.some((keyword) => text.includes(keyword))
  );

  return matched || INDEX_KEYWORD_MAP.find((entry) => entry.key === "NIFTY50");
};

const getIndexPerformanceFromQuestion = async (message) => {
  const matched = resolveIndexFromMessage(message);
  const quote = await getQuote(matched.symbol, matched.key);

  return {
    index: matched.name,
    ...quote,
  };
};

module.exports = {
  INDEX_SYMBOLS,
  GLOBAL_MARKET_SYMBOLS,
  SECTOR_SYMBOLS,
  getQuote,
  getSafeQuote,
  getMarketOverview,
  getHistoricalPrices,
  getIntradayPrices,
  getSectorPerformance,
  getGlobalMarkets,
  getIndexPerformanceFromQuestion,
};