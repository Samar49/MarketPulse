function GlobalMarkets({ markets }) {
  return (
    <div className="global-markets-card">
      <div className="global-markets-header">
        <div>
          <h2>Global Markets</h2>
          <p>Global index movement and market context</p>
        </div>
        <span className="global-markets-badge">Global</span>
      </div>
      <div className="global-markets-grid">
        {markets.map((market) => {
          const isPositive = Number(market.changePercent) >= 0;

          return (
            <div className="global-market-item" key={market.symbol}>
              <div className="global-market-top">
                <div className="global-market-name">
                  <strong>{market.name}</strong>
                  <small>{market.symbol}</small>
                </div>
                <span
                  className={`global-market-direction ${
                    isPositive ? "positive" : "negative"
                  }`}
                >
                  {isPositive ? "↑" : "↓"}
                </span>
              </div>

              <div className="global-market-price">
                {Number(market.price).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div
                className={`global-market-change ${
                  isPositive ? "positive" : "negative"
                }`}
              >
                {isPositive ? "+" : ""}
                {Number(market.change).toFixed(2)}{" "}
                ({isPositive ? "+" : ""}
                {Number(market.changePercent).toFixed(2)}%)
              </div>
            </div>
          );
        })}
      </div>
      <div className="global-markets-footer">
        <span>Source: Yahoo Finance</span>
        <span>Global market context</span>
      </div>
    </div>
  );
}
export default GlobalMarkets;