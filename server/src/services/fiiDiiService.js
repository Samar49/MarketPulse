const { setCache, getCache } = require("./cacheService");

const NSE_BASE_URL = "https://www.nseindia.com";
const HISTORICAL_API_URL = "https://fii-diidata.mrchartist.com/api/history";

const CURRENT_CACHE_KEY = "institutional-flow";
const HISTORY_CACHE_KEY = "institutional-flow-history";

const CURRENT_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const HISTORY_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const MIN_HISTORY_DAYS = 1;
const MAX_HISTORY_DAYS = 60;
const DEFAULT_HISTORY_DAYS = 10;

const NSE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: NSE_BASE_URL,
};

const createNseSession = async () => {
  const response = await fetch(NSE_BASE_URL, {
    headers: {
      ...NSE_HEADERS,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`NSE session failed: ${response.status}`);
  }

  // Node versions that support getSetCookie() return cookies individually.
  // This prevents cookie corruption when NSE sends multiple Set-Cookie headers.
  const cookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : (response.headers.get("set-cookie") || "").split(", ");

  return cookies.join("; ");
};

const fetchNseFiiDiiData = async () => {
  const cookies = await createNseSession();

  const response = await fetch(`${NSE_BASE_URL}/api/fiidiiTradeReact`, {
    headers: { ...NSE_HEADERS, Cookie: cookies },
  });

  if (!response.ok) {
    throw new Error(`NSE FII/DII request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("NSE returned empty FII/DII data");
  }

  return data;
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;

  return Number(String(value).replace(/,/g, "").replace(/₹/g, "").trim()) || 0;
};

// Get the latest completed NSE FII/DII session
const getInstitutionalFlows = async () => {
  const cachedData = getCache(CURRENT_CACHE_KEY);

  if (cachedData) {
    console.log("Institutional flow cache hit");
    return cachedData;
  }

  console.log("Fetching latest completed FII/DII session from NSE...");

  const data = await fetchNseFiiDiiData();

  const fiiData = data.find(
    (item) => item.category === "FII/FPI" || item.category === "FII" || item.category === "FPI"
  );
  const diiData = data.find((item) => item.category === "DII");

  if (!fiiData || !diiData) {
    throw new Error("Invalid NSE FII/DII response format");
  }

  // NSE reports FII/DII as a completed/reportable institutional flow figure
  // rather than an intraday live feed, so we preserve the actual NSE date
  // instead of forcing today's calendar date.
  const sessionDate = fiiData.date || diiData.date || null;

  if (!sessionDate) {
    throw new Error("NSE FII/DII response does not contain a valid date");
  }

  const result = {
    date: sessionDate,
    dataStatus: "latest_completed_session",
    dataLabel: "Latest completed session",
    source: "NSE",
    provisional: true,
    fii: {
      buy: toNumber(fiiData.buyValue),
      sell: toNumber(fiiData.sellValue),
      net: toNumber(fiiData.netValue),
    },
    dii: {
      buy: toNumber(diiData.buyValue),
      sell: toNumber(diiData.sellValue),
      net: toNumber(diiData.netValue),
    },
  };

  setCache(CURRENT_CACHE_KEY, result, CURRENT_CACHE_TTL);

  return result;
};

const fetchHistoricalFiiDiiData = async () => {
  console.log("Fetching historical FII/DII data...");

  const response = await fetch(HISTORICAL_API_URL, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
  });

  if (!response.ok) {
    throw new Error(`Historical FII/DII request failed: ${response.status}`);
  }

  const responseData = await response.json();

  // The provider normally returns an array, but also supports
  // { data: [...] } or { history: [...] }.
  let data = responseData;

  if (responseData && Array.isArray(responseData.data)) {
    data = responseData.data;
  } else if (responseData && Array.isArray(responseData.history)) {
    data = responseData.history;
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Historical FII/DII API returned empty data");
  }

  console.log(`Historical API returned ${data.length} records`);

  return data;
};

const normalizeHistoricalData = (data) => {
  return data
    .map((item) => {
      // Support compact fields (d, fb, fs, fn, db, ds, dn) as well as expanded field names.
      const date = item.d ?? item.date;
      const fiiBuy = item.fb ?? item.fii_buy ?? item.fiiBuy;
      const fiiSell = item.fs ?? item.fii_sell ?? item.fiiSell;
      const fiiNet = item.fn ?? item.fii_net ?? item.fiiNet;
      const diiBuy = item.db ?? item.dii_buy ?? item.diiBuy;
      const diiSell = item.ds ?? item.dii_sell ?? item.diiSell;
      const diiNet = item.dn ?? item.dii_net ?? item.diiNet;

      return {
        date,
        fii: { buy: toNumber(fiiBuy), sell: toNumber(fiiSell), net: toNumber(fiiNet) },
        dii: { buy: toNumber(diiBuy), sell: toNumber(diiSell), net: toNumber(diiNet) },
      };
    })
    .filter((item) => item.date);
};

const sortHistoricalData = (data) => {
  return [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const getInstitutionalFlowHistory = async (days = DEFAULT_HISTORY_DAYS) => {
  const requestedDays = Math.min(
    Math.max(Number(days) || DEFAULT_HISTORY_DAYS, MIN_HISTORY_DAYS),
    MAX_HISTORY_DAYS
  );

  const cacheKey = `${HISTORY_CACHE_KEY}-${requestedDays}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    console.log(`Institutional history cache hit: ${requestedDays} days`);
    return cachedData;
  }

  console.log(`Fetching FII/DII history: ${requestedDays} days`);

  const rawData = await fetchHistoricalFiiDiiData();
  const normalizedData = normalizeHistoricalData(rawData);

  if (normalizedData.length === 0) {
    throw new Error("No historical FII/DII data available after normalization");
  }

  // Don't assume the external historical provider returns newest -> oldest;
  // sort it ourselves so the chart always gets the latest completed sessions first.
  const sortedData = sortHistoricalData(normalizedData);
  const limitedData = sortedData.slice(0, requestedDays);

  const fiiNet = limitedData.reduce((total, day) => total + day.fii.net, 0);
  const diiNet = limitedData.reduce((total, day) => total + day.dii.net, 0);

  const result = {
    days: limitedData.length,
    data: limitedData,
    summary: {
      fiiNet: Number(fiiNet.toFixed(2)),
      diiNet: Number(diiNet.toFixed(2)),
    },
    source: "NSE",
    historicalProvider: "Mr. Chartist",
    provisional: true,
    dataStatus: "last_completed_sessions",
  };

  setCache(cacheKey, result, HISTORY_CACHE_TTL);

  return result;
};

module.exports = {
  getInstitutionalFlows,
  getInstitutionalFlowHistory,
};