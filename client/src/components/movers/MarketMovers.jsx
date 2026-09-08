import React from "react";
const MarketMovers = ({ data }) => {
    const formatPrice = (value) =>
        Number(value).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    const formatSymbol = (symbol) =>
        symbol.replace(".NS", "");
    const renderMover = (stock, type) => {
        const isGainer = type === "gainer";
        return (
            <div
                className="mover-row"
                key={stock.symbol}
            >
                <div className="mover-name">
                    <strong>
                        {stock.name}
                    </strong>
                    <small>
                        {formatSymbol(stock.symbol)}
                    </small>
                </div>
                <div className="mover-price">
                    <span>
                        ₹{formatPrice(stock.price)}
                    </span>
                    <strong
                        className={
                            isGainer? "positive":"negative"
                        }
                    >
                        {isGainer ? "+" : ""}
                        {Number(
                            stock.changePercent
                        ).toFixed(2)}
                        %
                    </strong>
                </div>
            </div>
        );
    };
    return (
        <div className="market-movers-card">
            <div className="market-movers-header">
                <div>
                    <h2>Market Movers</h2>
                    <p>
                        Top gainers, losers and market breadth
                    </p>
                </div>
                <span className="market-movers-badge">
                    Today
                </span>
            </div>
            <div className="movers-grid">
                <div className="movers-group">
                    <div className="movers-group-header">
                        <h3>Top Gainers</h3>
                        <span className="positive">
                            ↑
                        </span>
                    </div>
                    <div className="movers-list">
                        {data.gainers.map((stock) =>
                            renderMover(stock, "gainer")
                        )}
                    </div>
                </div>
                <div className="movers-group">
                    <div className="movers-group-header">
                        <h3>Top Losers</h3>
                        <span className="negative">
                            ↓
                        </span>
                    </div>
                    <div className="movers-list">
                        {data.losers.map((stock) =>
                            renderMover(stock, "loser")
                        )}
                    </div>
                </div>
            </div>
            <div className="market-breadth">
                <div className="market-breadth-header">
                    <div>
                        <h3>Market Breadth</h3>
                        <p>
                            Participation across tracked stocks
                        </p>
                    </div>
                    <strong
                        className={data.breadth.status ==="Bullish breadth"? "positive":
                             data.breadth.status ==="Bearish breadth"? "negative": ""}
                    >
                        {data.breadth.status}
                    </strong>
                </div>
                <div className="breadth-grid">
                    <div className="breadth-item">
                        <span>Advances</span>
                        <strong className="positive">
                            {data.breadth.advances}
                        </strong>
                    </div>
                    <div className="breadth-item">
                        <span>Declines</span>
                        <strong className="negative">
                            {data.breadth.declines}
                        </strong>
                    </div>
                    <div className="breadth-item">
                        <span>Unchanged</span>
                        <strong>
                            {data.breadth.unchanged}
                        </strong>
                    </div>
                    <div className="breadth-item">
                        <span>A/D Ratio</span>
                        <strong>
                            {Number(
                                data.breadth.advanceDeclineRatio
                            ).toFixed(2)}
                        </strong>
                    </div>
                </div>
            </div>
            <div className="market-movers-footer">
                <span>
                    Tracked universe:{" "}
                    {data.universeSize} stocks
                </span>
                <span>
                    Source: {data.source}
                </span>
            </div>
        </div>
    );
};
export default MarketMovers;