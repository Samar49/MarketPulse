const {
  getMarketOverview,
  getHistoricalPrices,
  getIntradayPrices,
  getSectorPerformance,
  getGlobalMarkets,
} = require("../services/marketService");

const { getMarketIntelligence } = require("../services/intelligenceService");
const { getMacroEvents } = require("../services/macroEventsService");
const { getCorporateEvents } = require("../services/eventsService");
const { getMarketMovers } = require("../services/moversService");

const {
  getInstitutionalFlows,
  getInstitutionalFlowHistory,
} = require("../services/fiiDiiService");

const { getFinancialNews } = require("../services/newsService");
const { searchStocks, getStockPerformance } = require("../services/stockService");
const { isAllowedSymbol } = require("../utils/symbolAllowlist");

const ALLOWED_HISTORY_INTERVALS = new Set(["1d", "1wk", "1mo"]);
const ALLOWED_INTRADAY_INTERVALS = new Set(["1m", "2m", "5m", "15m", "30m", "60m"]);
const MAX_HISTORY_RANGE_MS = 5 * 365 * 24 * 60 * 60 * 1000; // ~5 years

// Market overview
const getMarketOverviewController = async (req, res) => {
  try {
    const data = await getMarketOverview();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Market overview error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch market data" });
  }
};

// Historical prices
const getHistoricalPricesController = async (req, res) => {
  try {
    const { symbol, period1, period2, interval } = req.query;

    if (!symbol || !period1 || !period2) {
      return res.status(400).json({
        success: false,
        message: "symbol, period1 and period2 are required",
      });
    }

    if (!isAllowedSymbol(symbol)) {
      return res.status(400).json({ success: false, message: "Unsupported symbol" });
    }

    const requestedInterval = interval || "1d";

    if (!ALLOWED_HISTORY_INTERVALS.has(requestedInterval)) {
      return res.status(400).json({ success: false, message: "Unsupported interval" });
    }

    const start = new Date(period1);
    const end = new Date(period2);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return res.status(400).json({
        success: false,
        message: "period1 and period2 must be valid dates, with period1 before period2",
      });
    }

    if (end.getTime() - start.getTime() > MAX_HISTORY_RANGE_MS) {
      return res.status(400).json({
        success: false,
        message: "Date range is too large — 5 years maximum",
      });
    }

    const data = await getHistoricalPrices(symbol, period1, period2, requestedInterval);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Historical market data error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch historical market data" });
  }
};

// Intraday prices, used by the NIFTY 50 1D chart.
// e.g. GET /api/market/history/intraday?symbol=%5ENSEI&interval=5m
const getIntradayPricesController = async (req, res) => {
  try {
    const { symbol, interval } = req.query;

    // Default to NIFTY 50 (^NSEI is encoded as %5ENSEI in the URL).
    const requestedSymbol = symbol || "^NSEI";

    if (!isAllowedSymbol(requestedSymbol)) {
      return res.status(400).json({ success: false, message: "Unsupported symbol" });
    }

    // MarketPulse uses 5-minute candles for the intraday chart.
    const requestedInterval = interval || "5m";

    if (!ALLOWED_INTRADAY_INTERVALS.has(requestedInterval)) {
      return res.status(400).json({ success: false, message: "Unsupported interval" });
    }

    const data = await getIntradayPrices(requestedSymbol, requestedInterval);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Intraday market data error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch intraday market data" });
  }
};

// Sector performance
const getSectorPerformanceController = async (req, res) => {
  try {
    const data = await getSectorPerformance();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Sector performance error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch sector performance" });
  }
};

// Global markets
const getGlobalMarketsController = async (req, res) => {
  try {
    const data = await getGlobalMarkets();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Global markets error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch global market data" });
  }
};

// Institutional flows
const getInstitutionalFlowsController = async (req, res) => {
  try {
    const data = await getInstitutionalFlows();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Institutional flow error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch institutional flow data" });
  }
};

// Institutional flow history
const getInstitutionalFlowHistoryController = async (req, res) => {
  try {
    let days = Number(req.query.days || 10);

    // Only allow the ranges our frontend needs.
    if (![5, 10, 30].includes(days)) {
      days = 10;
    }

    const data = await getInstitutionalFlowHistory(days);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Institutional history error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch institutional flow history",
    });
  }
};

// Financial news
const getFinancialNewsController = async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const data = await getFinancialNews(limit);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Financial news error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch financial news" });
  }
};

// Market movers
const getMarketMoversController = async (req, res) => {
  try {
    const data = await getMarketMovers();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Market movers error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch market movers" });
  }
};

// Corporate events
const getCorporateEventsController = async (req, res) => {
  try {
    const days = req.query.days || 30;
    const data = await getCorporateEvents(days);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Corporate events error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch corporate events" });
  }
};

// Macro events
const getMacroEventsController = async (req, res) => {
  try {
    const data = await getMacroEvents();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Macro events error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch macro events" });
  }
};

// Market intelligence
const getMarketIntelligenceController = async (req, res) => {
  try {
    const data = await getMarketIntelligence();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Market intelligence error:", error.message);
    res.status(500).json({ success: false, message: "Failed to generate market intelligence" });
  }
};

// Stock search
const searchStocksController = (req, res) => {
  try {
    const { q } = req.query;
    const results = searchStocks(q);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Stock search error:", error.message);
    res.status(500).json({ success: false, message: "Failed to search stocks" });
  }
};

// Stock detail
const getStockDetailController = async (req, res) => {
  try {
    const { key } = req.params;
    const data = await getStockPerformance(key);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Stock detail error:", error.message);
    res.status(404).json({ success: false, message: "Stock not found" });
  }
};

module.exports = {
  getMarketOverviewController,
  getHistoricalPricesController,
  getIntradayPricesController,
  getSectorPerformanceController,
  getGlobalMarketsController,
  getInstitutionalFlowsController,
  getInstitutionalFlowHistoryController,
  getFinancialNewsController,
  getMarketMoversController,
  getCorporateEventsController,
  getMacroEventsController,
  getMarketIntelligenceController,
  searchStocksController,
  getStockDetailController,
};