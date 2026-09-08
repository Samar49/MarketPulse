function MarketCard({ name, market }) {
  const isPositive = market.change >= 0;

  return (
    <div className="market-card">
      <div className="market-card-header">
        <h3>{name}</h3>
        <span className={`market-status ${isPositive ? "positive" : "negative"}`}>
          {isPositive ? "↑" : "↓"}
        </span>
      </div>

      <p className="market-price">
        {market.price.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>

      <div className={`market-change ${isPositive ? "positive" : "negative"}`}>
        <span>
          {isPositive ? "+" : ""}
          {market.change.toFixed(2)}
        </span>
        <span>
          ({isPositive ? "+" : ""}
          {market.changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}

export default MarketCard;