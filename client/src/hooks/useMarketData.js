import { useEffect, useState } from "react";

import {getMarketOverview,getHistoricalMarketData,getIntradayMarketData,getSectorPerformance,getGlobalMarkets,getInstitutionalFlows,getInstitutionalHistory,getFinancialNews,getMarketMovers,getCorporateEvents,getMacroEvents,getMarketIntelligence,
} from "../services/marketApi";

// Date range helper
const getStartDate = (range) => {
  const startDate = new Date();

  switch (range) {
    case "1W":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "1M":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "3M":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "6M":
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "1Y":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  return startDate;
};

// Historical data formatter
const formatHistoricalData = (data) => {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item) => item && item.date && item.close !== null && item.close !== undefined)
    .map((item) => ({
      date: item.date,
      close: Number(item.close),
      volume: Number(item.volume || 0),
      open: item.open !== null && item.open !== undefined ? Number(item.open) : null,
      high: item.high !== null && item.high !== undefined ? Number(item.high) : null,
      low: item.low !== null && item.low !== undefined ? Number(item.low) : null,
    }));
};

// Intraday data formatter
//
// Backend response: { symbol, interval, sessionDate, dataStatus, data: [...] }
// We keep the original timestamp here — NiftyChart.jsx converts it to
// Indian market time for display.
const formatIntradayData = (response) => {
  if (!response) return [];

  // The intraday service returns response.data as the actual candle array.
  const candles = Array.isArray(response) ? response : response.data;
  if (!Array.isArray(candles)) return [];

  return candles
    .filter((item) => item && item.date && item.close !== null && item.close !== undefined)
    .map((item) => ({
      date: item.date,
      close: Number(item.close),
      volume: Number(item.volume || 0),
      open: item.open !== null && item.open !== undefined ? Number(item.open) : null,
      high: item.high !== null && item.high !== undefined ? Number(item.high) : null,
      low: item.low !== null && item.low !== undefined ? Number(item.low) : null,
    }));
};

const useMarketData = () => {
  // Data state
  const [marketData, setMarketData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [globalMarkets, setGlobalMarkets] = useState([]);
  const [institutionalFlows, setInstitutionalFlows] = useState(null);
  const [institutionalHistory, setInstitutionalHistory] = useState(null);
  const [news, setNews] = useState([]);
  const [marketMovers, setMarketMovers] = useState(null);
  const [corporateEvents, setCorporateEvents] = useState(null);
  const [macroEvents, setMacroEvents] = useState(null);
  const [marketIntelligence, setMarketIntelligence] = useState(null);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [sectorLoading, setSectorLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [institutionalLoading, setInstitutionalLoading] = useState(true);
  const [institutionalHistoryLoading, setInstitutionalHistoryLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [marketMoversLoading, setMarketMoversLoading] = useState(true);
  const [corporateEventsLoading, setCorporateEventsLoading] = useState(true);
  const [macroEventsLoading, setMacroEventsLoading] = useState(true);
  const [marketIntelligenceLoading, setMarketIntelligenceLoading] = useState(true);

  // General state
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedRange, setSelectedRange] = useState("1M");

  // Market overview
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const data = await getMarketOverview();
        setMarketData(data);
        setLastUpdated(new Date());
        setError("");
        setLoading(false);
      } catch (error) {
        console.error("Market data error:", error);
        setError("Unable to load market data");
        setLoading(false);
      }
    };

    fetchMarketData();

    // Refresh market overview every 30 seconds.
    const intervalId = setInterval(fetchMarketData, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // NIFTY chart data
  //
  // 1D -> intraday 5-minute candles
  // 1W / 1M / 3M / 6M / 1Y -> daily candles
  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    const fetchChartData = async () => {
      try {
        setChartLoading(true);

        // 1D -> intraday
        if (selectedRange === "1D") {
          console.log("Fetching NIFTY intraday data...");

          const response = await getIntradayMarketData({ symbol: "^NSEI", interval: "5m" });
          if (cancelled) return;

          const formattedData = formatIntradayData(response);
          setHistoricalData(formattedData);
          setChartLoading(false);

          // Refresh the intraday chart every 60 seconds.
          intervalId = setInterval(async () => {
            try {
              const latestResponse = await getIntradayMarketData({
                symbol: "^NSEI",
                interval: "5m",
              });

              if (cancelled) return;

              const latestData = formatIntradayData(latestResponse);
              if (latestData.length > 0) setHistoricalData(latestData);
            } catch (refreshError) {
              console.error("Intraday refresh error:", refreshError);
            }
          }, 60000);

          return;
        }

        // Historical daily data
        console.log(`Fetching NIFTY historical data: ${selectedRange}`);

        const endDate = new Date();
        const startDate = getStartDate(selectedRange);
        const period1 = startDate.toISOString().split("T")[0];
        const period2 = endDate.toISOString().split("T")[0];

        const data = await getHistoricalMarketData({
          symbol: "^NSEI",
          period1,
          period2,
          interval: "1d",
        });

        if (cancelled) return;

        const formattedData = formatHistoricalData(data);
        setHistoricalData(formattedData);
        setChartLoading(false);
      } catch (error) {
        if (cancelled) return;

        console.error("NIFTY chart data error:", error);
        setHistoricalData([]);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    };

    fetchChartData();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedRange]);

  // Sector performance
  useEffect(() => {
    const fetchData = async () => {
      try {
        setSectorLoading(true);
        const data = await getSectorPerformance();
        setSectors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Sector performance error:", error);
        setSectors([]);
      } finally {
        setSectorLoading(false);
      }
    };

    fetchData();
  }, []);

  // Global markets
  useEffect(() => {
    const fetchData = async () => {
      try {
        setGlobalLoading(true);
        const data = await getGlobalMarkets();
        setGlobalMarkets(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Global market error:", error);
        setGlobalMarkets([]);
      } finally {
        setGlobalLoading(false);
      }
    };

    fetchData();
  }, []);

  // Current institutional flows
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInstitutionalLoading(true);
        const data = await getInstitutionalFlows();
        setInstitutionalFlows(data);
      } catch (error) {
        console.error("Institutional flow error:", error);
        setInstitutionalFlows(null);
      } finally {
        setInstitutionalLoading(false);
      }
    };

    fetchData();
  }, []);

  // Institutional history
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInstitutionalHistoryLoading(true);
        const data = await getInstitutionalHistory(10);
        setInstitutionalHistory(data);
      } catch (error) {
        console.error("Institutional history error:", error);
        setInstitutionalHistory(null);
      } finally {
        setInstitutionalHistoryLoading(false);
      }
    };

    fetchData();
  }, []);

  // Financial news
  useEffect(() => {
    const fetchData = async () => {
      try {
        setNewsLoading(true);
        const data = await getFinancialNews(12);
        setNews(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Financial news error:", error);
        setNews([]);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Market movers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setMarketMoversLoading(true);
        const data = await getMarketMovers();
        setMarketMovers(data);
      } catch (error) {
        console.error("Market movers error:", error);
        setMarketMovers(null);
      } finally {
        setMarketMoversLoading(false);
      }
    };

    fetchData();
  }, []);

  // Corporate events
  useEffect(() => {
    const fetchData = async () => {
      try {
        setCorporateEventsLoading(true);
        const data = await getCorporateEvents(30);
        setCorporateEvents(data);
      } catch (error) {
        console.error("Corporate events error:", error);
        setCorporateEvents(null);
      } finally {
        setCorporateEventsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Macro economic events
  useEffect(() => {
    const fetchData = async () => {
      try {
        setMacroEventsLoading(true);
        const data = await getMacroEvents();
        setMacroEvents(data);
      } catch (error) {
        console.error("Macro events error:", error);
        setMacroEvents(null);
      } finally {
        setMacroEventsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Market intelligence
  useEffect(() => {
    const fetchData = async () => {
      try {
        setMarketIntelligenceLoading(true);
        const data = await getMarketIntelligence();
        setMarketIntelligence(data);
      } catch (error) {
        console.error("Market intelligence error:", error);
        setMarketIntelligence(null);
      } finally {
        setMarketIntelligenceLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    // Data
    marketData,
    historicalData,
    sectors,
    globalMarkets,
    institutionalFlows,
    institutionalHistory,
    news,
    marketMovers,
    corporateEvents,
    macroEvents,
    marketIntelligence,

    // Loading
    loading,
    chartLoading,
    sectorLoading,
    globalLoading,
    institutionalLoading,
    institutionalHistoryLoading,
    newsLoading,
    marketMoversLoading,
    corporateEventsLoading,
    macroEventsLoading,
    marketIntelligenceLoading,

    // General
    error,
    lastUpdated,

    // Chart controls
    selectedRange,
    setSelectedRange,
  };
};

export default useMarketData;