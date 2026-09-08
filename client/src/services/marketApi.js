const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const fetchApi = async (endpoint, errorMessage) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);

    if (!response.ok) {
      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || errorMessage);
    }

    return result.data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw new Error(error.message || errorMessage);
  }
};

// Market overview
export const getMarketOverview = async () => {
  return fetchApi("/market/overview", "Failed to fetch market data");
};

// Historical market data
export const getHistoricalMarketData = async ({
  symbol = "^NSEI",
  period1,
  period2,
  interval = "1d",
}) => {
  const params = new URLSearchParams({ symbol, period1, period2, interval });

  return fetchApi(`/market/history?${params.toString()}`, "Failed to fetch historical market data");
};

// Intraday market data, used for the NIFTY 50 1D chart.
// e.g. /api/market/history/intraday?symbol=%5ENSEI&interval=5m
// Backend returns { symbol, interval, sessionDate, dataStatus, data }
export const getIntradayMarketData = async ({ symbol = "^NSEI", interval = "5m" } = {}) => {
  const params = new URLSearchParams({ symbol, interval });

  return fetchApi(`/market/history/intraday?${params.toString()}`, "Failed to fetch intraday market data");
};

// Sector performance
export const getSectorPerformance = async () => {
  return fetchApi("/market/sectors", "Failed to fetch sector performance");
};

// Global markets
export const getGlobalMarkets = async () => {
  return fetchApi("/market/global", "Failed to fetch global markets");
};

// Institutional flows
export const getInstitutionalFlows = async () => {
  return fetchApi("/market/institutional", "Failed to fetch institutional flows");
};

// Institutional history
export const getInstitutionalHistory = async (days = 10) => {
  return fetchApi(`/market/institutional/history?days=${days}`, "Failed to fetch institutional history");
};

// Financial news
export const getFinancialNews = async (limit = 12) => {
  return fetchApi(`/market/news?limit=${limit}`, "Failed to fetch financial news");
};

// Market movers
export const getMarketMovers = async () => {
  return fetchApi("/market/movers", "Failed to fetch market movers");
};

// Corporate events
export const getCorporateEvents = async (days = 30) => {
  return fetchApi(`/market/events?days=${days}`, "Failed to fetch corporate events");
};

// Macro events
export const getMacroEvents = async () => {
  return fetchApi("/market/macro-events", "Failed to fetch macro events");
};

// Market intelligence
export const getMarketIntelligence = async () => {
  return fetchApi("/market/intelligence", "Failed to fetch market intelligence");
};

// Stock search
export const searchStocks = async (query) => {
  return fetchApi(`/market/stocks/search?q=${encodeURIComponent(query)}`, "Failed to search stocks");
};

// Stock detail
export const getStockDetail = async (key) => {
  return fetchApi(`/market/stocks/${encodeURIComponent(key)}`, "Failed to fetch stock detail");
};

// AI chat
export const sendChatMessage = async (message) => {
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Unable to generate AI response");
  }

  return result.data;
};