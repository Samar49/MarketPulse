import React from "react";
import {LineChart,Line,BarChart,Bar,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,} from "recharts";

import {tooltipContentStyle,tooltipLabelStyle,tooltipItemStyle,tooltipCursor,tooltipCursorFill,} from "../../theme/chartTheme";

const NiftyChart = ({
  historicalData = [],
  chartLoading,
  selectedRange,
  setSelectedRange,
  marketData,
}) => {
  // Available ranges: 1D uses intraday 5-minute candles, everything else uses daily candles.
  const ranges = ["1D", "1W", "1M", "3M", "6M", "1Y"];

  const isIntraday = selectedRange === "1D";

  // marketData comes from the existing market overview.
  const currentNifty = marketData?.nifty50;
  const currentPrice =
    currentNifty?.price ?? historicalData?.[historicalData.length - 1]?.close ?? null;
  const currentChange = currentNifty?.change ?? null;
  const currentChangePercent = currentNifty?.changePercent ?? null;
  const isPositive = Number(currentChange) >= 0;

  const formatPrice = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "--";
    }

    return Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Backend gives timestamps like "2026-09-07T03:45:00.000Z" — convert to "09:15".
  const formatIntradayTime = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
  };

  const formatHistoricalDate = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  // Backend intraday data has full timestamps, historical data has daily timestamps.
  // Recharts just gets a simple display-friendly "date" value either way.
  const chartData = historicalData.map((item) => ({
    ...item,
    date: isIntraday ? formatIntradayTime(item.date) : formatHistoricalDate(item.date),
    close: Number(item.close) || 0,
    volume: Number(item.volume) || 0,
  }));

  const intradaySessionDate =
    historicalData.length > 0
      ? new Date(historicalData[historicalData.length - 1].date)
      : null;

  const sessionDateLabel =
    intradaySessionDate && !Number.isNaN(intradaySessionDate.getTime())
      ? intradaySessionDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        })
      : null;

  return (
    <section className="chart-section">
      {/* Header */}
      <div className="section-heading">
        <div>
          <div className="nifty-chart-title-row">
            <h2>NIFTY 50</h2>
            {isIntraday && (
              <span className="chart-live-badge">
                <span className="chart-live-dot" />
                INTRADAY
              </span>
            )}
          </div>

          <p>
            {isIntraday
              ? sessionDateLabel
                ? `Intraday movement · ${sessionDateLabel}`
                : "Today's intraday movement"
              : "Historical closing price"}
          </p>
        </div>

        {/* Current price */}
        {currentPrice !== null && (
          <div className="nifty-chart-current">
            <strong>{formatPrice(currentPrice)}</strong>

            {currentChange !== null && (
              <span className={isPositive ? "positive" : "negative"}>
                {isPositive ? "+" : ""}
                {Number(currentChange).toFixed(2)}{" "}
                {currentChangePercent !== null && (
                  <>
                    ({isPositive ? "+" : ""}
                    {Number(currentChangePercent).toFixed(2)}%)
                  </>
                )}
              </span>
            )}
          </div>
        )}

        {/* Range buttons */}
        <div className="chart-ranges">
          {ranges.map((range) => (
            <button
              key={range}
              type="button"
              className={selectedRange === range ? "range-button active" : "range-button"}
              onClick={() => setSelectedRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="chart-container">
        {chartLoading ? (
          <p className="chart-message">
            {isIntraday ? "Loading today's NIFTY movement..." : "Loading chart..."}
          </p>
        ) : chartData.length === 0 ? (
          <p className="chart-message">
            {isIntraday ? "Intraday NIFTY data unavailable." : "Historical data unavailable"}
          </p>
        ) : (
          <div className="charts-wrapper">
            {/* Price chart */}
            <div className="price-chart">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" minTickGap={isIntraday ? 45 : 30} />
                  <YAxis
                    domain={["auto", "auto"]}
                    tickFormatter={(value) =>
                      Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                    }
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    cursor={tooltipCursor}
                    formatter={(value) => [formatPrice(value), "NIFTY 50"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Volume chart */}
            {!isIntraday && (
              <div className="volume-chart">
                <p className="volume-label">Volume</p>

                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" tick={false} axisLine={false} />
                    <YAxis tick={false} axisLine={false} width={0} />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      labelStyle={tooltipLabelStyle}
                      itemStyle={tooltipItemStyle}
                      cursor={tooltipCursorFill}
                    />
                    <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
                      {chartData.map((entry, index) => {
                        const previousClose = index > 0 ? chartData[index - 1].close : entry.close;
                        const isBarPositive = entry.close >= previousClose;

                        return (
                          <Cell
                            key={`volume-${index}`}
                            fill={isBarPositive ? "#22c55e" : "#ef4444"}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Footer */}
      <div className="chart-footer">
        <span>Source: Yahoo Finance</span>
        <span id="chart-footer-source">
          {selectedRange === "1D" ? "5-minute candles" : "Daily candles"}
        </span>
      </div>
    </section>
  );
};
export default NiftyChart;