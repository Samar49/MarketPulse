const { getMarketOverview, getSectorPerformance, getGlobalMarkets } = require("./marketService");

const { getInstitutionalFlows } = require("./fiiDiiService");
const { getMarketMovers } = require("./moversService");
const { getFinancialNews } = require("./newsService");
const { getCorporateEvents } = require("./eventsService");
const { getMacroEvents } = require("./macroEventsService");
const { setCache, getCache } = require("./cacheService");


const INTELLIGENCE_CACHE_KEY = "market-intelligence";
const INTELLIGENCE_CACHE_TTL = 60 * 1000; // 1 minute


const getDirection = (value) => {
  const number = Number(value);

  if (number > 0) return "positive";
  if (number < 0) return "negative";
  return "neutral";
};

// ========================================
// MARKET TONE
// ========================================

const determineMarketTone = ({ nifty, breadth, fiiNet, diiNet, globalMarkets }) => {
  let score = 0;

  // NIFTY
  if (nifty > 0) score += 2;
  else if (nifty < 0) score -= 2;

  // Market breadth
  if (breadth > 1) score += 2;
  else if (breadth < 1) score -= 2;

  // FII
  if (fiiNet > 0) score += 1;
  else if (fiiNet < 0) score -= 1;

  // DII
  if (diiNet > 0) score += 1;
  else if (diiNet < 0) score -= 1;

  // Global markets
  const positiveGlobalMarkets = globalMarkets.filter(
    (market) => Number(market.changePercent) > 0
  ).length;

  const negativeGlobalMarkets = globalMarkets.filter(
    (market) => Number(market.changePercent) < 0
  ).length;

  if (positiveGlobalMarkets > negativeGlobalMarkets) score += 1;
  if (negativeGlobalMarkets > positiveGlobalMarkets) score -= 1;

  if (score >= 4) return "Positive";
  if (score <= -4) return "Negative";
  return "Mixed";
};


const generateSummary = ({ nifty, breadth, fiiNet, diiNet }) => {
  const statements = [];

  // NIFTY
  if (nifty > 0) {
    statements.push("NIFTY is trading higher.");
  } else if (nifty < 0) {
    statements.push("NIFTY is trading lower.");
  } else {
    statements.push("NIFTY is relatively flat.");
  }

  // Breadth
  if (breadth > 1.5) {
    statements.push("Market breadth is strongly positive.");
  } else if (breadth > 1) {
    statements.push("Market breadth is positive.");
  } else if (breadth < 0.67) {
    statements.push("Market breadth is strongly negative.");
  } else if (breadth < 1) {
    statements.push("Market breadth is negative.");
  } else {
    statements.push("Market breadth is balanced.");
  }

  // FII / DII
  if (fiiNet < 0 && diiNet > 0) {
    statements.push("Foreign selling is being offset by domestic institutional buying.");
  } else if (fiiNet > 0 && diiNet > 0) {
    statements.push("Both foreign and domestic institutions are net buyers.");
  } else if (fiiNet < 0 && diiNet < 0) {
    statements.push("Both foreign and domestic institutions are net sellers.");
  } else if (fiiNet > 0) {
    statements.push("Foreign institutions are providing buying support.");
  } else if (diiNet > 0) {
    statements.push("Domestic institutions are providing buying support.");
  }

  return statements.join(" ");
};


const generateSignals = ({ nifty, breadth, fiiNet, diiNet, globalMarkets }) => {
  const signals = [];

  if (nifty > 0) {
    signals.push({ type: "positive", title: "NIFTY", message: "Index is trading higher." });
  } else if (nifty < 0) {
    signals.push({ type: "negative", title: "NIFTY", message: "Index is trading lower." });
  }

  if (breadth > 1) {
    signals.push({
      type: "positive",
      title: "Breadth",
      message: "Advances are outnumbering declines.",
    });
  } else if (breadth < 1) {
    signals.push({
      type: "negative",
      title: "Breadth",
      message: "Declines are outnumbering advances.",
    });
  }

  if (fiiNet > 0) {
    signals.push({
      type: "positive",
      title: "FII/FPI",
      message: "Foreign institutions are net buyers.",
    });
  } else if (fiiNet < 0) {
    signals.push({
      type: "negative",
      title: "FII/FPI",
      message: "Foreign institutions are net sellers.",
    });
  }

  if (diiNet > 0) {
    signals.push({
      type: "positive",
      title: "DII",
      message: "Domestic institutions are net buyers.",
    });
  } else if (diiNet < 0) {
    signals.push({
      type: "negative",
      title: "DII",
      message: "Domestic institutions are net sellers.",
    });
  }

  const globalPositive = globalMarkets.filter((market) => Number(market.changePercent) > 0).length;

  const globalNegative = globalMarkets.filter((market) => Number(market.changePercent) < 0).length;

  if (globalPositive > globalNegative) {
    signals.push({
      type: "positive",
      title: "Global Markets",
      message: "Global market cues are broadly positive.",
    });
  } else if (globalNegative > globalPositive) {
    signals.push({
      type: "negative",
      title: "Global Markets",
      message: "Global market cues are broadly negative.",
    });
  } else {
    signals.push({
      type: "neutral",
      title: "Global Markets",
      message: "Global market cues are mixed.",
    });
  }

  return signals;
};


const generateWatchItems = ({
  fiiNet,
  diiNet,
  breadth,
  globalMarkets,
  corporateEvents,
  macroEvents,
}) => {
  const watchItems = [];

  if (fiiNet < 0) {
    watchItems.push("Monitor continued FII/FPI selling pressure.");
  }

  if (diiNet > 0) {
    watchItems.push("Watch whether DII buying continues to support the market.");
  }

  if (breadth < 1) {
    watchItems.push("Watch for continued weakness in market breadth.");
  }

  const globalNegative = globalMarkets.filter((market) => Number(market.changePercent) < 0).length;

  if (globalNegative >= Math.ceil(globalMarkets.length / 2)) {
    watchItems.push("Monitor global market weakness for possible impact on Indian equities.");
  }

  if (corporateEvents && corporateEvents.total > 0) {
    watchItems.push("Review upcoming company-specific events.");
  }

  if (macroEvents && macroEvents.total > 0) {
    watchItems.push("Keep upcoming macroeconomic indicators on the radar.");
  }

  return watchItems.slice(0, 5);
};

const getMarketIntelligence = async () => {
  const cachedData = getCache(INTELLIGENCE_CACHE_KEY);

  if (cachedData) {
    console.log("Market intelligence cache hit");
    return cachedData;
  }

  console.log("Generating market intelligence...");

  const [
    marketData,
    sectors,
    globalMarkets,
    institutionalFlows,
    marketMovers,
    news,
    corporateEvents,
    macroEvents,
  ] = await Promise.all([
    getMarketOverview(),
    getSectorPerformance(),
    getGlobalMarkets(),
    getInstitutionalFlows(),
    getMarketMovers(),
    getFinancialNews(5),
    getCorporateEvents(30),
    getMacroEvents(),
  ]);

  const niftyChangePercent = Number(marketData?.nifty50?.changePercent) || 0;
  const breadthRatio = Number(marketMovers?.breadth?.advanceDeclineRatio) || 0;
  const fiiNet = Number(institutionalFlows?.fii?.net) || 0;
  const diiNet = Number(institutionalFlows?.dii?.net) || 0;
  const safeGlobalMarkets = Array.isArray(globalMarkets) ? globalMarkets : [];

  const tone = determineMarketTone({
    nifty: niftyChangePercent,
    breadth: breadthRatio,
    fiiNet,
    diiNet,
    globalMarkets: safeGlobalMarkets,
  });

  const summary = generateSummary({
    nifty: niftyChangePercent,
    breadth: breadthRatio,
    fiiNet,
    diiNet,
  });

  const signals = generateSignals({
    nifty: niftyChangePercent,
    breadth: breadthRatio,
    fiiNet,
    diiNet,
    globalMarkets: safeGlobalMarkets,
  });

  const watchItems = generateWatchItems({
    fiiNet,
    diiNet,
    breadth: breadthRatio,
    globalMarkets: safeGlobalMarkets,
    corporateEvents,
    macroEvents,
  });

  const data = {
    timestamp: new Date().toISOString(),
    marketTone: tone,
    summary,
    signals,
    watchItems,
    context: {
      nifty50: marketData?.nifty50 || null,
      bankNifty: marketData?.bankNifty || null,
      globalMarkets: globalMarkets || [],
      sectors: sectors || [],
      institutionalFlows: institutionalFlows || null,
      breadth: marketMovers?.breadth || null,
      corporateEvents: corporateEvents || null,
      macroEvents: macroEvents || null,
      topNews: news || [],
    },
    source: "MarketPulse internal market data",
  };

  setCache(INTELLIGENCE_CACHE_KEY, data, INTELLIGENCE_CACHE_TTL);

  return data;
};

module.exports = {
  getMarketIntelligence,
};
