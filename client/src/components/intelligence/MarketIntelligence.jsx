import React from "react";
const MarketIntelligence = ({ data, loading }) => {
  if (loading) {
    return (
      <section className="intelligence-section">
        <div className="intelligence-card">
          <p className="chart-message">Generating market intelligence...</p>
        </div>
      </section>
    );
  }
  if (!data) {
    return (
      <section className="intelligence-section">
        <div className="intelligence-card">
          <p className="chart-message">Market intelligence unavailable</p>
        </div>
      </section>
    );
  }
  const getToneClass = (tone) => {
    if (tone === "Positive") return "intelligence-positive";
    if (tone === "Negative") return "intelligence-negative";
    return "intelligence-neutral";
  };
  const getSignalIcon = (type) => {
    if (type === "positive") return "↑";
    if (type === "negative") return "↓";
    return "→";
  };
  const getSignalClass = (type) => {
    if (type === "positive") return "intelligence-positive";
    if (type === "negative") return "intelligence-negative";
    return "intelligence-neutral";
  };

  return (
    <section className="intelligence-section">
      <div className="intelligence-card">
        <div className="intelligence-header">
          <div>
            <div className="intelligence-title-row">
              <h2>MarketPulse Intelligence</h2>
              <span className="intelligence-ai-badge">AI READY</span>
            </div>
            <p>Automated market context from current MarketPulse data</p>
          </div>

          <span className={`intelligence-tone ${getToneClass(data.marketTone)}`}>
            {data.marketTone}
          </span>
        </div>

        <div className="intelligence-summary">
          <p>{data.summary}</p>
        </div>

        <div className="intelligence-block">
          <div className="intelligence-block-header">
            <h3>Key Signals</h3>
          </div>

          <div className="intelligence-signals">
            {Array.isArray(data.signals) &&
              data.signals.map((signal, index) => (
                <div
                  className="intelligence-signal"
                  key={`${signal.title}-${index}`}
                >
                  <span
                    className={`intelligence-signal-icon ${getSignalClass(
                      signal.type
                    )}`}
                  >
                    {getSignalIcon(signal.type)}
                  </span>

                  <div className="intelligence-signal-content">
                    <strong>{signal.title}</strong>
                    <span>{signal.message}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        {Array.isArray(data.watchItems) && data.watchItems.length > 0 && (
          <div className="intelligence-block">
            <div className="intelligence-block-header">
              <h3>What to Watch</h3>
            </div>
            <div className="intelligence-watch-list">
              {data.watchItems.map((item, index) => (
                <div className="intelligence-watch-item" key={index}>
                  <span>•</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="intelligence-footer">
          <span>Source: MarketPulse internal market data</span>
          <span>Automated analysis</span>
        </div>
      </div>
    </section>
  );
};
export default MarketIntelligence;