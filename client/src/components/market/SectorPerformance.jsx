function SectorPerformance({ sectors }) {
  // Find the largest absolute sector movement
  const maxChange = Math.max(
    ...sectors.map((sector) => Math.abs(Number(sector.changePercent))),
    0
  );

  return (
    <div className="sector-card">
      {/* Header */}
      <div className="sector-header">
        <div>
          <h2>Sector Performance</h2>
          <p>Today's sector movement</p>
        </div>
      </div>

      {/* Sector rows */}
      <div className="sector-list">
        {sectors.map((sector) => {
          const change = Number(sector.changePercent);
          const isPositive = change >= 0;
          const absoluteChange = Math.abs(change);

          // Dynamic scaling: max movement = 90% of the bar track, so each side maxes at 45%.
          const barWidth = maxChange > 0 ? (absoluteChange / maxChange) * 45 : 0;

          return (
            <div className="sector-row" key={sector.symbol}>
              {/* Sector name */}
              <div className="sector-name">{sector.sector}</div>

              {/* Bar */}
              <div className="sector-bar-wrapper">
                {/* Center 0 line */}
                <div className="sector-zero-line" />

                {/* Positive → RIGHT */}
                {isPositive && (
                  <div
                    className="sector-bar positive-bar"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 0,
                      width: `${barWidth}%`,
                      height: "100%",
                      borderRadius: "0 999px 999px 0",
                    }}
                  />
                )}

                {/* Negative → LEFT */}
                {!isPositive && (
                  <div
                    className="sector-bar negative-bar"
                    style={{
                      position: "absolute",
                      right: "50%",
                      top: 0,
                      width: `${barWidth}%`,
                      height: "100%",
                      borderRadius: "999px 0 0 999px",
                    }}
                  />
                )}
              </div>

              {/* Percentage */}
              <div className={`sector-percent ${isPositive ? "positive" : "negative"}`}>
                {isPositive ? "+" : ""}
                {change.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SectorPerformance;