const YahooFinance = require("yahoo-finance2").default;

const { getCache, setCache } = require("./cacheService");
const { findStock, resolveStock } = require("./stockService");

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const CHART_CACHE_TTL = 60 * 1000;

const normalizeText = (text) => {
  return String(text || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[.,!?;:()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// Chart analysis needs more historical data than ordinary performance
// analysis. Defaults to 3 months.
const detectChartPeriod = (userMessage) => {
  const text = normalizeText(userMessage);

  if (text.includes("1 year") || text.includes("one year") || text.includes("year")) {
    return { type: "1y", label: "1 Year", days: 365 };
  }

  if (text.includes("6 months") || text.includes("six months")) {
    return { type: "6m", label: "6 Months", days: 180 };
  }

  if (text.includes("3 months") || text.includes("three months")) {
    return { type: "3m", label: "3 Months", days: 90 };
  }

  if (text.includes("1 month") || text.includes("one month") || text.includes("30 days")) {
    return { type: "1m", label: "1 Month", days: 30 };
  }

  if (text.includes("1 week") || text.includes("one week") || text.includes("7 days")) {
    return { type: "1w", label: "1 Week", days: 7 };
  }

  return { type: "3m", label: "3 Months", days: 90 };
};

const fetchChartHistory = async (symbol, days) => {
  const period2 = new Date();
  const period1 = new Date();

  // Extra history is required for SMA 50 and RSI calculations.
  period1.setDate(period1.getDate() - (days + 100));

  console.log(`Fetching chart history: ${symbol}`);

  const result = await yahooFinance.chart(symbol, { period1, period2, interval: "1d" });
  const quotes = result?.quotes || [];

  const history = quotes
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

  if (history.length < 20) {
    throw new Error(`Insufficient chart data available for ${symbol}`);
  }

  return history;
};

const calculateSMA = (history, period) => {
  if (history.length < period) return null;

  const selected = history.slice(-period);
  const total = selected.reduce((sum, item) => sum + item.close, 0);

  return Number((total / period).toFixed(2));
};

const calculateRSI = (history, period = 14) => {
  if (history.length <= period) return null;

  const recent = history.slice(-(period + 1));
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < recent.length; i++) {
    const change = recent[i].close - recent[i - 1].close;

    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  if (averageLoss === 0) return 100;

  const relativeStrength = averageGain / averageLoss;
  const rsi = 100 - 100 / (1 + relativeStrength);

  return Number(rsi.toFixed(2));
};

const calculateAverageVolume = (history, period = 20) => {
  const selected = history.slice(-period);
  if (selected.length === 0) return null;

  const total = selected.reduce((sum, item) => sum + item.volume, 0);

  return Math.round(total / selected.length);
};

// Uses the recent 20 trading sessions. Support = lowest low, resistance = highest high.
const calculateLevels = (history, period = 20) => {
  const selected = history.slice(-period);
  if (selected.length === 0) return { support: null, resistance: null };

  const support = Math.min(...selected.map((item) => item.low));
  const resistance = Math.max(...selected.map((item) => item.high));

  return {
    support: Number(support.toFixed(2)),
    resistance: Number(resistance.toFixed(2)),
  };
};

const determineTrend = (latestPrice, sma20, sma50) => {
  if (sma20 === null || sma50 === null) return "Insufficient data";
  if (latestPrice > sma20 && sma20 > sma50) return "Bullish";
  if (latestPrice < sma20 && sma20 < sma50) return "Bearish";
  return "Mixed / Sideways";
};

const interpretRSI = (rsi) => {
  if (rsi === null) return "Unavailable";
  if (rsi >= 70) return "Potentially overbought";
  if (rsi <= 30) return "Potentially oversold";
  if (rsi >= 50) return "Positive momentum";
  return "Negative momentum";
};

const interpretVolume = (latestVolume, averageVolume) => {
  if (!averageVolume || averageVolume === 0) return "Unavailable";

  const ratio = latestVolume / averageVolume;

  if (ratio >= 1.5) return "High volume";
  if (ratio <= 0.7) return "Low volume";
  return "Normal volume";
};

const buildChartAnalysis = (stock, history, chartPeriod) => {
  const latest = history[history.length - 1];
  const periodHistory = history.slice(-Math.min(chartPeriod.days, history.length));
  const first = periodHistory[0];

  const periodChange = latest.close - first.close;
  const periodChangePercent = first.close !== 0 ? (periodChange / first.close) * 100 : 0;

  const sma20 = calculateSMA(history, 20);
  const sma50 = calculateSMA(history, 50);
  const rsi14 = calculateRSI(history, 14);
  const averageVolume = calculateAverageVolume(history, 20);
  const levels = calculateLevels(history, 20);

  const trend = determineTrend(latest.close, sma20, sma50);
  const rsiInterpretation = interpretRSI(rsi14);
  const volumeInterpretation = interpretVolume(latest.volume, averageVolume);

  return {
    stock: {
      key: stock.key,
      name: stock.name,
      symbol: stock.symbol,
    },
    period: {
      type: chartPeriod.type,
      label: chartPeriod.label,
      start: first.date,
      end: latest.date,
    },
    price: {
      latestClose: latest.close,
      open: latest.open,
      high: latest.high,
      low: latest.low,
      change: Number(periodChange.toFixed(2)),
      changePercent: Number(periodChangePercent.toFixed(2)),
    },
    trend: {
      direction: trend,
      sma20,
      sma50,
    },
    momentum: {
      rsi14,
      interpretation: rsiInterpretation,
    },
    volume: {
      latest: latest.volume,
      average20: averageVolume,
      interpretation: volumeInterpretation,
    },
    levels: {
      support: levels.support,
      resistance: levels.resistance,
    },
    recentHistory: periodHistory.slice(-30),
    source: "Yahoo Finance",
  };
};

const getChartAnalysis = async (userMessage) => {
  const stock = await resolveStock(userMessage);

  if (!stock) {
    throw new Error(
      "Unable to identify the stock for chart analysis. Try using a NIFTY 50 company name or NSE symbol."
    );
  }

  const chartPeriod = detectChartPeriod(userMessage);
  const cacheKey = `chart-analysis-${stock.symbol}-${chartPeriod.type}`;
  const cached = getCache(cacheKey);

  if (cached) return cached;

  console.log(`Chart stock: ${stock.name} (${stock.symbol})`);
  console.log(`Chart period: ${chartPeriod.label}`);

  const history = await fetchChartHistory(stock.symbol, chartPeriod.days);
  const analysis = buildChartAnalysis(stock, history, chartPeriod);

  setCache(cacheKey, analysis, CHART_CACHE_TTL);

  return analysis;
};

module.exports = {
  getChartAnalysis,
  detectChartPeriod,
  calculateSMA,
  calculateRSI,
  calculateAverageVolume,
  calculateLevels,
};