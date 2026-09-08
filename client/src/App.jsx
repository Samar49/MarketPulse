import { useRef, useState } from "react";

import TopNav from "./components/layout/TopNav";

import MarketPulseAI from "./components/MarketPulseAI";
import MarketCard from "./components/market/MarketCard";
import NiftyChart from "./components/market/NiftyChart";
import SectorPerformance from "./components/market/SectorPerformance";
import GlobalMarkets from "./components/global/GlobalMarkets";
import InstitutionalFlows from "./components/institutional/InstitutionalFlows";
import InstitutionalFlowChart from "./components/institutional/InstitutionalFlowChart";
import MarketMovers from "./components/movers/MarketMovers";
import FinancialNews from "./components/news/FinancialNews";
import CorporateEvents from "./components/events/CorporateEvents";
import MacroEvents from "./components/events/MacroEvents";
import MarketIntelligence from "./components/intelligence/MarketIntelligence";
import StockDetail from "./components/stock/StockDetail";

import useMarketData from "./hooks/useMarketData";
import { getStockDetail } from "./services/marketApi";

import "./App.css";

function Panel({ loading, empty, loadingText, emptyText, className, children }) {
  if (loading) {
    return (
      <div className={className}>
        <p className="chart-message">{loadingText}</p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className={className}>
        <p className="chart-message">{emptyText}</p>
      </div>
    );
  }

  return children;
}

function App() {
  const {
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

    error,
    lastUpdated,

    selectedRange,
    setSelectedRange,
  } = useMarketData();

  // Navigation
  const [activeSection, setActiveSection] = useState("dashboard");

  // Stock detail
  const [stockDetail, setStockDetail] = useState(null);
  const [stockDetailLoading, setStockDetailLoading] = useState(false);
  const [stockDetailError, setStockDetailError] = useState(null);

  // Section refs
  const sectionRefs = {
    dashboard: useRef(null),
    markets: useRef(null),
    sectors: useRef(null),
    news: useRef(null),
    events: useRef(null),
  };

  const handleNavigate = (key) => {
    setActiveSection(key);
    sectionRefs[key].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelectStock = async (key) => {
    setStockDetail(null);
    setStockDetailError(null);
    setStockDetailLoading(true);

    try {
      const data = await getStockDetail(key);
      setStockDetail(data);
    } catch (err) {
      setStockDetailError(err.message || "Unable to load stock");
    } finally {
      setStockDetailLoading(false);
    }
  };

  const handleCloseStockDetail = () => {
    setStockDetail(null);
    setStockDetailError(null);
    setStockDetailLoading(false);
  };

  if (loading) {
    return (
      <div className="app loading-screen">
        <h1>Loading MarketPulse...</h1>
      </div>
    );
  }

  if (error && !marketData) {
    return (
      <div className="app loading-screen">
        <h1>{error}</h1>
      </div>
    );
  }

  return (
    <div className="app">
      <TopNav
        lastUpdated={lastUpdated}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onSelectStock={handleSelectStock}
      />

      {(stockDetail || stockDetailLoading || stockDetailError) && (
        <StockDetail
          data={stockDetail}
          loading={stockDetailLoading}
          error={stockDetailError}
          onClose={handleCloseStockDetail}
        />
      )}

      <div className="app-shell">
        <main className="main-column">
          {/* Dashboard / hero */}
          <section ref={sectionRefs.dashboard} className="hero">
            <div>
              <h1>Good morning, Trader</h1>
              <p>Here's what's moving the markets today.</p>
            </div>
          </section>

          {/* Market overview */}
          <section className="content-block">
            <div className="market-grid">
              <MarketCard name="NIFTY 50" market={marketData.nifty50} />
              <MarketCard name="BANK NIFTY" market={marketData.bankNifty} />
              <MarketCard name="S&P 500" market={marketData.sp500} />
              <MarketCard name="NASDAQ" market={marketData.nasdaq} />
            </div>
          </section>

          {/* NIFTY 50 chart */}
          <section className="content-block">
            <NiftyChart
              historicalData={historicalData}
              chartLoading={chartLoading}
              selectedRange={selectedRange}
              setSelectedRange={setSelectedRange}
              // Current market overview data — NiftyChart uses this to display
              // the latest NIFTY price and change.
              marketData={marketData}
            />
          </section>

          {/* Market intelligence */}
          <section className="content-block">
            <MarketIntelligence data={marketIntelligence} loading={marketIntelligenceLoading} />
          </section>

          {/* Sector performance */}
          <section ref={sectionRefs.sectors} className="content-block">
            <Panel
              className="sector-card"
              loading={sectorLoading}
              empty={sectors.length === 0}
              loadingText="Loading sector performance..."
              emptyText="Sector data unavailable"
            >
              <SectorPerformance sectors={sectors} />
            </Panel>
          </section>

          {/* Markets section heading */}
          <section ref={sectionRefs.markets} className="content-block section-heading-block">
            <h2 className="section-title">Markets</h2>
          </section>

          {/* Global markets + movers */}
          <section className="content-block equal-row">
            <Panel
              className="global-markets-card"
              loading={globalLoading}
              empty={globalMarkets.length === 0}
              loadingText="Loading global markets..."
              emptyText="Global market data unavailable"
            >
              <GlobalMarkets markets={globalMarkets} />
            </Panel>

            <Panel
              className="market-movers-card"
              loading={marketMoversLoading}
              empty={!marketMovers}
              loadingText="Loading market movers..."
              emptyText="Market mover data unavailable"
            >
              <MarketMovers data={marketMovers} />
            </Panel>
          </section>

          {/* Institutional flows */}
          <section className="content-block">
            <Panel
              className="institutional-card"
              loading={institutionalLoading}
              empty={!institutionalFlows}
              loadingText="Loading institutional flows..."
              emptyText="Institutional flow data unavailable"
            >
              <InstitutionalFlows data={institutionalFlows} />
            </Panel>
          </section>

          {/* Institutional flow chart */}
          <section className="content-block">
            <InstitutionalFlowChart
              data={institutionalHistory}
              loading={institutionalHistoryLoading}
            />
          </section>

          {/* Financial news */}
          <section ref={sectionRefs.news} className="content-block">
            <Panel
              className="financial-news-card"
              loading={newsLoading}
              empty={news.length === 0}
              loadingText="Loading financial news..."
              emptyText="Financial news unavailable"
            >
              <FinancialNews news={news} />
            </Panel>
          </section>

          {/* Events */}
          <section ref={sectionRefs.events} className="content-block split-row">
            <CorporateEvents data={corporateEvents} loading={corporateEventsLoading} />
            <MacroEvents data={macroEvents} loading={macroEventsLoading} />
          </section>
        </main>

        <aside className="ai-column">
          <MarketPulseAI />
        </aside>
      </div>
    </div>
  );
}

export default App;