const YahooFinance = require("yahoo-finance2").default;
const { setCache, getCache } = require("./cacheService");

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

// NIFTY 50 stock universe
// MarketPulse maintains a known-stock registry for fast and reliable
// recognition of common NIFTY 50 companies. Yahoo Finance NSE symbols
// use the ".NS" suffix.
const STOCKS = {
  HDFCBANK: { symbol: "HDFCBANK.NS", name: "HDFC Bank", aliases: ["hdfc bank", "hdfcbank", "hdfc"] },
  ICICIBANK: { symbol: "ICICIBANK.NS", name: "ICICI Bank", aliases: ["icici bank", "icicibank", "icici"] },
  RELIANCE: { symbol: "RELIANCE.NS", name: "Reliance Industries", aliases: ["reliance", "reliance industries", "ril"] },
  BHARTIARTL: { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", aliases: ["airtel", "bharti airtel", "bharti"] },
  LT: { symbol: "LT.NS", name: "Larsen & Toubro", aliases: ["l&t", "l and t", "larsen", "larsen and toubro", "larsen & toubro"] },
  SBIN: { symbol: "SBIN.NS", name: "State Bank of India", aliases: ["sbi", "sbin", "state bank of india"] },
  INFY: { symbol: "INFY.NS", name: "Infosys", aliases: ["infosys", "infy"] },
  AXISBANK: { symbol: "AXISBANK.NS", name: "Axis Bank", aliases: ["axis bank", "axisbank", "axis"] },
  BAJFINANCE: { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", aliases: ["bajaj finance", "bajfinance", "bajajfin"] },
  "M&M": { symbol: "M&M.NS", name: "Mahindra & Mahindra", aliases: ["m&m", "m and m", "mahindra", "mahindra and mahindra", "mahindra & mahindra"] },
  ADANIENT: { symbol: "ADANIENT.NS", name: "Adani Enterprises", aliases: ["adani", "adani enterprises", "adanient"] },
  ADANIPORTS: { symbol: "ADANIPORTS.NS", name: "Adani Ports", aliases: ["adani ports", "adani port", "adan ports", "adaniports"] },
  APOLLOHOSP: { symbol: "APOLLOHOSP.NS", name: "Apollo Hospitals", aliases: ["apollo hospitals", "apollo hospital", "apollo"] },
  ASIANPAINT: { symbol: "ASIANPAINT.NS", name: "Asian Paints", aliases: ["asian paints", "asianpaint"] },
  BAJAJ_AUTO: { symbol: "BAJAJ-AUTO.NS", name: "Bajaj Auto", aliases: ["bajaj auto", "bajajauto"] },
  BAJAJFINSV: { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv", aliases: ["bajaj finserv", "bajajfinsv"] },
  BEL: { symbol: "BEL.NS", name: "Bharat Electronics", aliases: ["bel", "bharat electronics", "bharat electronics limited"] },
  CIPLA: { symbol: "CIPLA.NS", name: "Cipla", aliases: ["cipla"] },
  COALINDIA: { symbol: "COALINDIA.NS", name: "Coal India", aliases: ["coal india", "coalindia"] },
  DRREDDY: {
    symbol: "DRREDDY.NS",
    name: "Dr. Reddy's Laboratories",
    aliases: ["dr reddy", "dr reddys", "dr reddy's", "dr reddy laboratories", "dr reddys laboratories"],
  },
  EICHERMOT: { symbol: "EICHERMOT.NS", name: "Eicher Motors", aliases: ["eicher", "eicher motors"] },
  ETERNAL: { symbol: "ETERNAL.NS", name: "Eternal", aliases: ["eternal", "zomato"] },
  GRASIM: { symbol: "GRASIM.NS", name: "Grasim Industries", aliases: ["grasim", "grasim industries"] },
  HCLTECH: { symbol: "HCLTECH.NS", name: "HCL Technologies", aliases: ["hcl", "hcl tech", "hcltech", "hcl technologies"] },
  HDFCLIFE: { symbol: "HDFCLIFE.NS", name: "HDFC Life Insurance", aliases: ["hdfc life", "hdfclife", "hdfc life insurance"] },
  HINDALCO: { symbol: "HINDALCO.NS", name: "Hindalco", aliases: ["hindalco", "hindalco industries"] },
  HINDUNILVR: { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", aliases: ["hindustan unilever", "hul", "hindunilvr"] },
  ITC: { symbol: "ITC.NS", name: "ITC", aliases: ["itc"] },
  INDIGO: { symbol: "INDIGO.NS", name: "InterGlobe Aviation", aliases: ["indigo", "indigo airlines", "interglobe aviation"] },
  JSWSTEEL: { symbol: "JSWSTEEL.NS", name: "JSW Steel", aliases: ["jsw steel", "jswsteel", "jsw"] },
  JIOFIN: { symbol: "JIOFIN.NS", name: "Jio Financial Services", aliases: ["jio financial", "jio finance", "jiofin"] },
  KOTAKBANK: { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", aliases: ["kotak", "kotak bank", "kotak mahindra bank", "kotakbank"] },
  MARUTI: { symbol: "MARUTI.NS", name: "Maruti Suzuki", aliases: ["maruti", "maruti suzuki"] },
  MAXHEALTH: { symbol: "MAXHEALTH.NS", name: "Max Healthcare", aliases: ["max healthcare", "max health", "maxhealth"] },
  NTPC: { symbol: "NTPC.NS", name: "NTPC", aliases: ["ntpc"] },
  NESTLEIND: { symbol: "NESTLEIND.NS", name: "Nestle India", aliases: ["nestle", "nestle india", "nestleind"] },
  ONGC: { symbol: "ONGC.NS", name: "Oil & Natural Gas Corporation", aliases: ["ongc", "oil and natural gas corporation", "oil & natural gas corporation"] },
  POWERGRID: { symbol: "POWERGRID.NS", name: "Power Grid", aliases: ["power grid", "powergrid", "pgcil"] },
  SBILIFE: { symbol: "SBILIFE.NS", name: "SBI Life Insurance", aliases: ["sbi life", "sbilife"] },
  SHRIRAMFIN: { symbol: "SHRIRAMFIN.NS", name: "Shriram Finance", aliases: ["shriram finance", "shriramfin", "shriram"] },
  SUNPHARMA: { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical Industries", aliases: ["sun pharma", "sunpharma", "sun pharmaceutical"] },
  TCS: { symbol: "TCS.NS", name: "Tata Consultancy Services", aliases: ["tcs", "tata consultancy services"] },
  TATACONSUM: { symbol: "TATACONSUM.NS", name: "Tata Consumer Products", aliases: ["tata consumer", "tata consumer products", "tataconsum"] },
  TMPV: { symbol: "TMPV.NS", name: "Tata Motors Passenger Vehicles", aliases: ["tata motors passenger vehicles", "tata motors", "tata motor", "tmpv"] },
  TATASTEEL: { symbol: "TATASTEEL.NS", name: "Tata Steel", aliases: ["tata steel", "tatasteel"] },
  TECHM: { symbol: "TECHM.NS", name: "Tech Mahindra", aliases: ["tech mahindra", "techm"] },
  TITAN: { symbol: "TITAN.NS", name: "Titan Company", aliases: ["titan", "titan company"] },
  TRENT: { symbol: "TRENT.NS", name: "Trent", aliases: ["trent", "trent ltd", "trent limited"] },
  ULTRACEMCO: { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", aliases: ["ultratech", "ultratech cement", "ultracemco"] },
  WIPRO: { symbol: "WIPRO.NS", name: "Wipro", aliases: ["wipro"] },
};

// Configuration
const STOCK_CACHE_TTL = 60 * 1000;

// Normalize text
const normalizeText = (text) => {
  return String(text || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[.,!?;:()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// Escape regex
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Search stocks (typeahead)
// Substring match over name, symbol and key — used by the search bar.
// Unlike findStock/findStocks (word-boundary alias matching for free-text
// AI questions), this matches partial input as the user types.
const searchStocks = (query, limit = 8) => {
  const text = normalizeText(query);

  if (!text) {
    return [];
  }

  const results = [];

  for (const [key, stock] of Object.entries(STOCKS)) {
    const haystacks = [key, stock.name, stock.symbol, ...stock.aliases].map((value) =>
      normalizeText(value)
    );

    const isMatch = haystacks.some((haystack) => haystack.includes(text));

    if (isMatch) {
      results.push({
        key,
        symbol: stock.symbol,
        name: stock.name,
      });
    }
  }

  return results.slice(0, limit);
};

// Find stock in registry
const findStock = (userMessage) => {
  const text = normalizeText(userMessage);
  const candidates = [];

  for (const [key, stock] of Object.entries(STOCKS)) {
    for (const alias of stock.aliases) {
      const normalizedAlias = normalizeText(alias);
      const regex = new RegExp(`(^|\\s)${escapeRegex(normalizedAlias)}(?=\\s|$)`, "i");

      if (regex.test(text)) {
        candidates.push({
          key,
          symbol: stock.symbol,
          name: stock.name,
          matchedAlias: alias,
          matchLength: normalizedAlias.length,
        });
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => b.matchLength - a.matchLength);

  return candidates[0];
};

// Find multiple stocks
const findStocks = (userMessage) => {
  const text = normalizeText(userMessage);
  const matches = [];

  for (const [key, stock] of Object.entries(STOCKS)) {
    let matched = false;

    for (const alias of stock.aliases) {
      const normalizedAlias = normalizeText(alias);
      const regex = new RegExp(`(^|\\s)${escapeRegex(normalizedAlias)}(?=\\s|$)`, "i");

      if (regex.test(text)) {
        matched = true;
        break;
      }
    }

    if (matched) {
      matches.push({
        key,
        symbol: stock.symbol,
        name: stock.name,
      });
    }
  }

  return matches;
};

// Dynamic Yahoo stock search
const searchYahooStock = async (userMessage) => {
  try {
    const results = await yahooFinance.search(userMessage);
    const quotes = results?.quotes || [];

    const indianStocks = quotes.filter(
      (item) =>
        typeof item.symbol === "string" &&
        (item.symbol.endsWith(".NS") || item.symbol.endsWith(".BO"))
    );

    if (indianStocks.length === 0) {
      return null;
    }

    // Prefer NSE over BSE
    const selected = indianStocks.find((item) => item.symbol.endsWith(".NS")) || indianStocks[0];
    const symbol = selected.symbol;
    const key = symbol.replace(".NS", "").replace(".BO", "");

    return {
      key,
      symbol,
      name: selected.longname || selected.shortname || key,
      aliases: [],
      dynamic: true,
    };
  } catch (error) {
    console.error("Yahoo stock search failed:", error.message);
    return null;
  }
};

// Resolve one stock
const resolveStock = async (userMessage) => {
  const knownStock = findStock(userMessage);

  if (knownStock) {
    return knownStock;
  }

  return await searchYahooStock(userMessage);
};

// Resolve multiple stocks
const resolveMultipleStocks = async (userMessage) => {
  const knownStocks = findStocks(userMessage);

  if (knownStocks.length >= 2) {
    return knownStocks.slice(0, 2);
  }

  // Comparison separators
  const parts = normalizeText(userMessage)
    .split(/\s+(?:vs|versus|and|with|against)\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    const first = await resolveStock(parts[0]);
    const second = await resolveStock(parts[1]);
    const resolved = [first, second].filter(Boolean);

    const unique = resolved.filter(
      (stock, index, array) => array.findIndex((item) => item.symbol === stock.symbol) === index
    );

    if (unique.length >= 2) {
      return unique.slice(0, 2);
    }
  }

  return [];
};

// Detect time period
// Supports:
// Daily: "today", "yesterday"
// Weekly: "this week", "current week", "last week", "previous week"
// Short ranges: "last 7 days", "last 30 days"
// Monthly: "this month", "last month"
// Longer ranges: "last 3 months", "last 6 months"
// Year: "this year", "year to date", "ytd"
const detectTimePeriod = (userMessage) => {
  const text = normalizeText(userMessage);

  if (text.includes("yesterday")) {
    return { type: "yesterday", label: "Yesterday", tradingSessions: 1 };
  }

  if (text.includes("today")) {
    return { type: "today", label: "Today", tradingSessions: 1 };
  }

  if (text.includes("this week") || text.includes("current week")) {
    return { type: "this_week", label: "This Week", tradingSessions: null };
  }

  if (text.includes("last week") || text.includes("previous week")) {
    return { type: "last_week", label: "Last Week", tradingSessions: null };
  }

  if (
    text.includes("last 7 days") ||
    text.includes("last seven days") ||
    text.includes("past 7 days") ||
    text.includes("past seven days")
  ) {
    return { type: "last_7_days", label: "Last 7 Days", tradingSessions: 7 };
  }

  if (
    text.includes("last 30 days") ||
    text.includes("last thirty days") ||
    text.includes("past 30 days") ||
    text.includes("past thirty days") ||
    text.includes("30 days")
  ) {
    return { type: "last_30_days", label: "Last 30 Days", tradingSessions: 30 };
  }

  if (
    text.includes("last 3 months") ||
    text.includes("last three months") ||
    text.includes("past 3 months") ||
    text.includes("past three months") ||
    text.includes("3 months")
  ) {
    return { type: "last_3_months", label: "Last 3 Months", tradingSessions: 66 };
  }

  if (
    text.includes("last 6 months") ||
    text.includes("last six months") ||
    text.includes("past 6 months") ||
    text.includes("past six months") ||
    text.includes("6 months")
  ) {
    return { type: "last_6_months", label: "Last 6 Months", tradingSessions: 130 };
  }

  if (text.includes("this year") || text.includes("year to date") || text.includes("ytd")) {
    return { type: "ytd", label: "Year to Date", tradingSessions: null };
  }

  if (text.includes("last month") || text.includes("previous month")) {
    return { type: "last_month", label: "Last Month", tradingSessions: null };
  }

  if (text.includes("this month") || text.includes("current month")) {
    return { type: "this_month", label: "This Month", tradingSessions: null };
  }

  if (text.includes("recent") || text.includes("recently") || text.includes("lately")) {
    return { type: "recent", label: "Recent", tradingSessions: 7 };
  }

  // Default
  return { type: "recent", label: "Recent", tradingSessions: 7 };
};

// Get calendar range
// Calendar-based periods: this_week, last_week, this_month, last_month, ytd
const getCalendarRange = (periodType) => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  // This week (Monday -> current day)
  if (periodType === "this_week") {
    const day = now.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);

    return { start: weekStart, end };
  }

  // Last week (previous Monday -> previous Sunday)
  if (periodType === "last_week") {
    const day = now.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    const thisWeekMonday = new Date(now);
    thisWeekMonday.setDate(now.getDate() - daysFromMonday);
    thisWeekMonday.setHours(0, 0, 0, 0);

    const lastWeekMonday = new Date(thisWeekMonday);
    lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);

    const lastWeekSunday = new Date(thisWeekMonday);
    lastWeekSunday.setDate(lastWeekSunday.getDate() - 1);
    lastWeekSunday.setHours(23, 59, 59, 999);

    return { start: lastWeekMonday, end: lastWeekSunday };
  }

  // This month
  if (periodType === "this_month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    return { start: monthStart, end };
  }

  // Last month
  if (periodType === "last_month") {
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    lastMonthStart.setHours(0, 0, 0, 0);

    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    return { start: lastMonthStart, end: lastMonthEnd };
  }

  // Year to date
  if (periodType === "ytd") {
    const yearStart = new Date(now.getFullYear(), 0, 1);
    yearStart.setHours(0, 0, 0, 0);

    return { start: yearStart, end };
  }

  return null;
};

// Fetch stock history
const fetchStockHistory = async (symbol, tradingSessions = 7, calendarStart = null) => {
  const period2 = new Date();
  const period1 = new Date();

  // Calendar-based query
  if (calendarStart) {
    period1.setTime(calendarStart.getTime());
    // Add a small buffer so the first requested trading session is not missed.
    period1.setDate(period1.getDate() - 7);
  } else {
    // Trading-session-based query
    period1.setDate(period1.getDate() - (tradingSessions * 2 + 15));
  }

  console.log(`Fetching stock history: ${symbol}`);

  const result = await yahooFinance.chart(symbol, {
    period1,
    period2,
    interval: "1d",
  });

  const quotes = result?.quotes || [];

  if (quotes.length === 0) {
    throw new Error(`No historical data available for ${symbol}`);
  }

  return quotes
    .filter((quote) => quote.close !== null && quote.close !== undefined)
    .map((quote) => ({
      date: quote.date,
      open: Number(quote.open),
      high: Number(quote.high),
      low: Number(quote.low),
      close: Number(quote.close),
      volume: Number(quote.volume || 0),
    }))
    .filter((quote) => Number.isFinite(quote.close))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

// Calculate daily performance
const calculateDailyPerformance = (history, index) => {
  const current = history[index];
  const previous = history[index - 1];

  if (!current) {
    throw new Error("Requested trading session was not found");
  }

  if (!previous) {
    return {
      date: current.date,
      previousClose: null,
      close: current.close,
      change: null,
      changePercent: null,
      open: current.open,
      high: current.high,
      low: current.low,
      volume: current.volume,
    };
  }

  const change = current.close - previous.close;
  const changePercent = previous.close !== 0 ? (change / previous.close) * 100 : 0;

  return {
    date: current.date,
    previousClose: previous.close,
    close: current.close,
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    open: current.open,
    high: current.high,
    low: current.low,
    volume: current.volume,
  };
};

// Calculate range performance
const calculateRangePerformance = (history, sessions) => {
  const selectedHistory = history.slice(-Math.min(sessions, history.length));

  if (selectedHistory.length === 0) {
    throw new Error("Insufficient historical data");
  }

  const first = selectedHistory[0];
  const latest = selectedHistory[selectedHistory.length - 1];
  const startPrice = first.close;
  const latestPrice = latest.close;
  const change = latestPrice - startPrice;
  const changePercent = startPrice !== 0 ? (change / startPrice) * 100 : 0;
  const highest = Math.max(...selectedHistory.map((item) => item.high));
  const lowest = Math.min(...selectedHistory.map((item) => item.low));

  return {
    startPrice,
    latestPrice,
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    highest: Number(highest.toFixed(2)),
    lowest: Number(lowest.toFixed(2)),
    history: selectedHistory,
  };
};

// Calculate calendar performance
const calculateCalendarPerformance = (history, start, end) => {
  const selectedHistory = history.filter((item) => {
    const date = new Date(item.date);
    return date >= start && date <= end;
  });

  if (selectedHistory.length === 0) {
    throw new Error("No trading data available for the requested period");
  }

  const first = selectedHistory[0];
  const latest = selectedHistory[selectedHistory.length - 1];
  const change = latest.close - first.close;
  const changePercent = first.close !== 0 ? (change / first.close) * 100 : 0;
  const highest = Math.max(...selectedHistory.map((item) => item.high));
  const lowest = Math.min(...selectedHistory.map((item) => item.low));

  return {
    startPrice: first.close,
    latestPrice: latest.close,
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    highest: Number(highest.toFixed(2)),
    lowest: Number(lowest.toFixed(2)),
    history: selectedHistory,
  };
};

// Period label
const getPeriodLabel = (period) => {
  const labels = {
    recent: "Recent",
    today: "Today",
    yesterday: "Yesterday",
    last_7_days: "Last 7 Days",
    this_week: "This Week",
    last_week: "Last Week",
    last_30_days: "Last 30 Days",
    last_month: "Last Month",
    this_month: "This Month",
    last_3_months: "Last 3 Months",
    last_6_months: "Last 6 Months",
    ytd: "Year to Date",
  };

  return labels[period] || "Recent";
};

// Get stock performance for one stock
const getStockPerformanceForStock = async (stock, period = "recent", tradingSessions = 7) => {
  const cacheKey = `stock-performance-${stock.symbol}-${period}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const calendarRange = getCalendarRange(period);
  const requiredSessions = Math.max(tradingSessions || 7, 7);
  const history = await fetchStockHistory(
    stock.symbol,
    requiredSessions,
    calendarRange?.start || null
  );

  let response;

  if (period === "today") {
    const index = history.length - 1;
    const daily = calculateDailyPerformance(history, index);

    response = {
      stock: { key: stock.key, name: stock.name, symbol: stock.symbol },
      period: {
        type: "today",
        label: "Today",
        description: "Latest available trading session",
        sessions: 1,
        start: daily.date,
        end: daily.date,
      },
      performance: daily,
      history: [history[index]],
      source: "Yahoo Finance",
    };
  } else if (period === "yesterday") {
    const index = Math.max(history.length - 2, 0);
    const daily = calculateDailyPerformance(history, index);

    response = {
      stock: { key: stock.key, name: stock.name, symbol: stock.symbol },
      period: {
        type: "yesterday",
        label: "Yesterday",
        description: "Previous available trading session",
        sessions: 1,
        start: daily.date,
        end: daily.date,
      },
      performance: daily,
      history: [history[index]],
      source: "Yahoo Finance",
    };
  } else if (calendarRange) {
    const performance = calculateCalendarPerformance(history, calendarRange.start, calendarRange.end);

    response = {
      stock: { key: stock.key, name: stock.name, symbol: stock.symbol },
      period: {
        type: period,
        label: getPeriodLabel(period),
        description: `${performance.history.length} trading sessions`,
        sessions: performance.history.length,
        start: performance.history[0].date,
        end: performance.history[performance.history.length - 1].date,
      },
      performance: {
        startPrice: performance.startPrice,
        latestPrice: performance.latestPrice,
        change: performance.change,
        changePercent: performance.changePercent,
        highest: performance.highest,
        lowest: performance.lowest,
      },
      history: performance.history,
      source: "Yahoo Finance",
    };
  } else {
    const performance = calculateRangePerformance(history, tradingSessions);

    response = {
      stock: { key: stock.key, name: stock.name, symbol: stock.symbol },
      period: {
        type: period,
        label: getPeriodLabel(period),
        description: `${performance.history.length} trading sessions`,
        sessions: performance.history.length,
        start: performance.history[0].date,
        end: performance.history[performance.history.length - 1].date,
      },
      performance: {
        startPrice: performance.startPrice,
        latestPrice: performance.latestPrice,
        change: performance.change,
        changePercent: performance.changePercent,
        highest: performance.highest,
        lowest: performance.lowest,
      },
      history: performance.history,
      source: "Yahoo Finance",
    };
  }

  setCache(cacheKey, response, STOCK_CACHE_TTL);

  return response;
};

// Get stock performance
const getStockPerformance = async (stockOrKey, period = "recent", tradingSessions = 7) => {
  let stock;

  if (typeof stockOrKey === "object" && stockOrKey?.symbol) {
    // Stock object
    stock = stockOrKey;
  } else if (STOCKS[stockOrKey]) {
    // Registry key
    stock = {
      key: stockOrKey,
      symbol: STOCKS[stockOrKey].symbol,
      name: STOCKS[stockOrKey].name,
    };
  } else if (
    typeof stockOrKey === "string" &&
    (stockOrKey.endsWith(".NS") || stockOrKey.endsWith(".BO"))
  ) {
    // Direct NSE/BSE symbol
    stock = {
      key: stockOrKey.replace(".NS", "").replace(".BO", ""),
      symbol: stockOrKey,
      name: stockOrKey,
    };
  } else {
    // Unsupported stock
    throw new Error(`Stock ${stockOrKey} is not supported`);
  }

  return await getStockPerformanceForStock(stock, period, tradingSessions);
};

// Stock performance from question
const getStockPerformanceFromQuestion = async (userMessage) => {
  const stock = await resolveStock(userMessage);

  if (!stock) {
    throw new Error("Unable to identify the stock. Try using the company name or NSE symbol.");
  }

  const timePeriod = detectTimePeriod(userMessage);

  console.log(`Detected stock: ${stock.name} (${stock.symbol})`);
  console.log(`Detected period: ${timePeriod.label}`);

  return await getStockPerformance(stock, timePeriod.type, timePeriod.tradingSessions || 7);
};

// Compare stocks
const compareStockPerformance = async (userMessage) => {
  const stocks = await resolveMultipleStocks(userMessage);

  if (stocks.length < 2) {
    throw new Error("Please provide two recognizable stocks to compare.");
  }

  const selectedStocks = stocks.slice(0, 2);
  const timePeriod = detectTimePeriod(userMessage);

  const results = await Promise.all(
    selectedStocks.map((stock) =>
      getStockPerformance(stock, timePeriod.type, timePeriod.tradingSessions || 7)
    )
  );

  const first = results[0];
  const second = results[1];
  const firstChange = Number(first.performance.changePercent);
  const secondChange = Number(second.performance.changePercent);

  let winner = null;

  if (Number.isFinite(firstChange) && Number.isFinite(secondChange)) {
    if (firstChange > secondChange) {
      winner = { key: first.stock.key, name: first.stock.name, changePercent: firstChange };
    } else if (secondChange > firstChange) {
      winner = { key: second.stock.key, name: second.stock.name, changePercent: secondChange };
    } else {
      winner = { key: null, name: "Tie", changePercent: firstChange };
    }
  }

  return {
    comparison: {
      period: timePeriod.type,
      label: timePeriod.label,
      sessions: timePeriod.tradingSessions,
      stocks: results,
      winner,
    },
    source: "Yahoo Finance",
  };
};

module.exports = {
  STOCKS,
  findStock,
  findStocks,
  searchStocks,
  resolveStock,
  resolveMultipleStocks,
  detectTimePeriod,
  getStockPerformance,
  getStockPerformanceFromQuestion,
  compareStockPerformance,
};