const { setCache, getCache } = require("./cacheService");

const MACRO_EVENTS_CACHE_KEY = "macro-events";

const MACRO_EVENTS_CACHE_TTL = 60 * 60 * 1000;


const MACRO_EVENTS = [
  {
    name: "Consumer Price Index (CPI)",
    type: "Inflation",
    country: "India",
    importance: "High",
    source: "MOSPI",
    description: "India's consumer inflation data",
  },

  {
    name: "Index of Industrial Production (IIP)",
    type: "Economic Activity",
    country: "India",
    importance: "High",
    source: "MOSPI",
    description: "India's industrial production data",
  },

  {
    name: "Gross Domestic Product (GDP)",
    type: "Growth",
    country: "India",
    importance: "High",
    source: "MOSPI",
    description: "India's economic growth data",
  },

  {
    name: "RBI Monetary Policy",
    type: "Monetary Policy",
    country: "India",
    importance: "High",
    source: "RBI",
    description: "Reserve Bank of India monetary policy decision",
  },
];


const getMacroEvents = async () => {
  const cachedData = getCache(MACRO_EVENTS_CACHE_KEY);

  if (cachedData) {
    console.log("Macro events cache hit");

    return cachedData;
  }


  const data = {
    events: MACRO_EVENTS,
    total: MACRO_EVENTS.length,
    source: "MOSPI / RBI",
  };

  setCache(MACRO_EVENTS_CACHE_KEY, data, MACRO_EVENTS_CACHE_TTL);

  return data;
};

module.exports = {
  getMacroEvents,
};
