const YahooFinance = require("yahoo-finance2").default;
const { setCache, getCache } = require("./cacheService");

// Yahoo Finance client
const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

// Tracked Stock Universe
// MarketPulse tracks a curated set of liquid Indian large-cap stocks.
const TRACKED_STOCKS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank" },
  { symbol: "INFY.NS", name: "Infosys" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services" },
  { symbol: "ITC.NS", name: "ITC" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel" },
  { symbol: "LT.NS", name: "Larsen & Toubro" },
  { symbol: "AXISBANK.NS", name: "Axis Bank" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki" },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel" },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises" },
  { symbol: "NTPC.NS", name: "NTPC" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation" },
];

// Configuration
const CACHE_KEY = "marketMovers";
const CACHE_TTL = 60000; // 60 seconds
const BATCH_SIZE = 5;
const TOP_COUNT = 5;

// Fetch a single stock quote
const fetchStockQuote = async (stock) => {
  try {
    const quote = await yahooFinance.quote(stock.symbol);

    if (!quote) {
      throw new Error(`No quote returned for ${stock.symbol}`);
    }

    const price = Number(quote.regularMarketPrice);
    let change = Number(quote.regularMarketChange);
    let changePercent = Number(quote.regularMarketChangePercent);

    // Calculate change if Yahoo doesn't provide it
    if (!Number.isFinite(changePercent)) {
      const previousClose = Number(quote.regularMarketPreviousClose);
      if (Number.isFinite(price) && Number.isFinite(previousClose) && previousClose !== 0) {
        change = price - previousClose;
        changePercent = (change / previousClose) * 100;
      }
    }

    // Validate quote
    if (!Number.isFinite(price)) {
      throw new Error(`Invalid price for ${stock.symbol}`);
    }
    if (!Number.isFinite(changePercent)) {
      throw new Error(`Invalid change percentage for ${stock.symbol}`);
    }

    return {
      symbol: stock.symbol,
      name: stock.name,
      price: Number(price.toFixed(2)),
      change: Number.isFinite(change) ? Number(change.toFixed(2)) : 0,
      changePercent: Number(changePercent.toFixed(2)),
    };
  } catch (error) {
    console.error(`Mover quote failed for ${stock.symbol}:`, error.message);
    // Return null instead of throwing so one failed stock doesn't block the rest
    return null;
  }
};

// Fetch stocks in controlled batches (20 stocks -> 4 batches of 5)
const fetchTrackedStocks = async () => {
  const results = [];

  for (let i = 0; i < TRACKED_STOCKS.length; i += BATCH_SIZE) {
    const batch = TRACKED_STOCKS.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`Fetching market mover batch ${batchNumber}`);

    const batchResults = await Promise.all(batch.map((stock) => fetchStockQuote(stock)));
    for (const result of batchResults) {
      if (result) {
        results.push(result);
      }
    }
  }

  return results;
};

// Calculate market breadth
const calculateBreadth = (stocks) => {
  let advances = 0;
  let declines = 0;
  let unchanged = 0;

  for (const stock of stocks) {
    const changePercent = Number(stock.changePercent);
    if (changePercent > 0) {
      advances++;
    } else if (changePercent < 0) {
      declines++;
    } else {
      unchanged++;
    }
  }

  let advanceDeclineRatio = 0;
  if (declines === 0) {
    advanceDeclineRatio = advances > 0 ? advances : 0;
  } else {
    advanceDeclineRatio = advances / declines;
  }

  let status = "Neutral breadth";
  if (advances > declines) {
    status = "Bullish breadth";
  } else if (declines > advances) {
    status = "Bearish breadth";
  }

  return {
    advances,
    declines,
    unchanged,
    advanceDeclineRatio: Number(advanceDeclineRatio.toFixed(2)),
    status,
  };
};

// Get market movers
const getMarketMovers = async () => {
  const cachedData = getCache(CACHE_KEY);
  if (cachedData) {
    console.log("Market movers served from cache");
    return cachedData;
  }

  console.log("Fetching fresh market movers");
  const stocks = await fetchTrackedStocks();

  // Fail only if everything failed
  if (stocks.length === 0) {
    throw new Error("Unable to retrieve market mover data from Yahoo Finance");
  }

  const sortedStocks = [...stocks].sort((a, b) => b.changePercent - a.changePercent);

  const gainers = sortedStocks.filter((stock) => stock.changePercent > 0).slice(0, TOP_COUNT);

  const losers = [...sortedStocks]
    .filter((stock) => stock.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, TOP_COUNT);

  const breadth = calculateBreadth(stocks);

  const data = {
    gainers,
    losers,
    breadth,
    universeSize: stocks.length,
    source: "Yahoo Finance",
  };

  setCache(CACHE_KEY, data, CACHE_TTL);
  console.log(`Market movers ready: ${stocks.length}/${TRACKED_STOCKS.length} stocks`);

  return data;
};

module.exports = {
  TRACKED_STOCKS,
  getMarketMovers,
};