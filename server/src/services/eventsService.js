const YahooFinance = require("yahoo-finance2").default;

const { setCache, getCache } = require("./cacheService");

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const TRACKED_COMPANIES = [
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

const CACHE_KEY = "corporateEvents";
const CACHE_TTL = 30 * 60 * 1000;
const DEFAULT_DAYS = 30;

const toDate = (value) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const isWithinRange = (date, startDate, endDate) => {
  const eventDate = toDate(date);
  if (!eventDate) return false;

  return eventDate >= startDate && eventDate <= endDate;
};

// Yahoo can return dates in slightly different shapes depending on the endpoint/version.
const extractDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === "number") {
    // Yahoo timestamps are normally seconds.
    if (value < 10000000000) return new Date(value * 1000);
    return new Date(value);
  }

  if (typeof value === "object") {
    if (value.raw !== undefined) return extractDate(value.raw);
    if (value.date !== undefined) return extractDate(value.date);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addEvent = (events, company, type, date) => {
  const parsedDate = extractDate(date);
  if (!parsedDate) return;

  events.push({
    symbol: company.symbol,
    name: company.name,
    type,
    date: parsedDate.toISOString(),
  });
};

const extractCalendarEvents = (company, calendarEvents, startDate, endDate) => {
  const events = [];

  if (!calendarEvents) return events;

  // Earnings
  const earningsDate = calendarEvents.earnings?.earningsDate;

  if (Array.isArray(earningsDate)) {
    earningsDate.forEach((date) => {
      const parsedDate = extractDate(date);

      if (isWithinRange(parsedDate, startDate, endDate)) {
        addEvent(events, company, "Earnings", parsedDate);
      }
    });
  } else {
    const parsedDate = extractDate(earningsDate);

    if (isWithinRange(parsedDate, startDate, endDate)) {
      addEvent(events, company, "Earnings", parsedDate);
    }
  }

  // Dividend date
  const dividendDate = extractDate(calendarEvents.dividendDate);
  if (isWithinRange(dividendDate, startDate, endDate)) {
    addEvent(events, company, "Dividend", dividendDate);
  }

  // Ex-dividend date
  const exDividendDate = extractDate(calendarEvents.exDividendDate);
  if (isWithinRange(exDividendDate, startDate, endDate)) {
    addEvent(events, company, "Ex-Dividend", exDividendDate);
  }

  // Dividend payment date
  const dividendPayDate = extractDate(calendarEvents.dividendPayDate);
  if (isWithinRange(dividendPayDate, startDate, endDate)) {
    addEvent(events, company, "Dividend Payment", dividendPayDate);
  }

  return events;
};

const fetchCompanyEvents = async (company, startDate, endDate) => {
  try {
    const result = await yahooFinance.quoteSummary(company.symbol, {
      modules: ["calendarEvents"],
    });

    const calendarEvents = result?.calendarEvents;

    if (!calendarEvents) {
      console.warn(`No calendar event data for ${company.symbol}`);
      return [];
    }

    return extractCalendarEvents(company, calendarEvents, startDate, endDate);
  } catch (error) {
    console.error(`Corporate events failed for ${company.symbol}:`, error.message);
    return [];
  }
};

const getCorporateEvents = async (days = DEFAULT_DAYS) => {
  const safeDays = Number.isFinite(Number(days))
    ? Math.max(1, Math.min(Number(days), 90))
    : DEFAULT_DAYS;

  const cacheKey = `${CACHE_KEY}:${safeDays}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    console.log("Corporate events served from cache");
    return cachedData;
  }

  console.log(`Fetching corporate events for next ${safeDays} days`);

  const startDate = new Date();

  // Start slightly before current time so today's event isn't accidentally excluded.
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + safeDays);

  // Fetch in controlled batches
  const allEvents = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < TRACKED_COMPANIES.length; i += BATCH_SIZE) {
    const batch = TRACKED_COMPANIES.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map((company) => fetchCompanyEvents(company, startDate, endDate))
    );

    results.forEach((events) => {
      allEvents.push(...events);
    });
  }

  // Remove duplicates
  const uniqueEvents = Array.from(
    new Map(allEvents.map((event) => [`${event.symbol}-${event.type}-${event.date}`, event])).values()
  );

  // Sort by date
  uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  const data = {
    days: safeDays,
    events: uniqueEvents,
    total: uniqueEvents.length,
    source: "Yahoo Finance",
  };

  setCache(cacheKey, data, CACHE_TTL);

  console.log(`Corporate events ready: ${uniqueEvents.length}`);

  return data;
};

module.exports = {
  TRACKED_COMPANIES,
  getCorporateEvents,
};