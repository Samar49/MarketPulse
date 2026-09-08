const express = require("express");

const {
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
} = require("../controllers/marketController");

const router = express.Router();

router.get("/overview", getMarketOverviewController);
router.get("/history", getHistoricalPricesController);

// Intraday prices, used by the NIFTY 50 1D chart.
// e.g. /api/market/history/intraday?symbol=%5ENSEI&interval=5m
router.get("/history/intraday", getIntradayPricesController);

router.get("/sectors", getSectorPerformanceController);
router.get("/global", getGlobalMarketsController);
router.get("/institutional", getInstitutionalFlowsController);
router.get("/institutional/history", getInstitutionalFlowHistoryController);
router.get("/news", getFinancialNewsController);
router.get("/movers", getMarketMoversController);
router.get("/events", getCorporateEventsController);
router.get("/macro-events", getMacroEventsController);
router.get("/intelligence", getMarketIntelligenceController);
router.get("/stocks/search", searchStocksController);
router.get("/stocks/:key", getStockDetailController);

module.exports = router;