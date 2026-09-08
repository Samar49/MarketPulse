import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {tooltipContentStyle,tooltipLabelStyle,tooltipItemStyle,tooltipCursor,} from "../../theme/chartTheme";

function formatPrice(value) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
export default function StockDetail({ data, loading, error, onClose }) {
  return (
    <div className="stock-detail-overlay" onClick={onClose}>
      <div className="stock-detail-panel" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="stock-detail-close" onClick={onClose}>
          ✕
        </button>
        {loading && <p className="chart-message">Loading stock data...</p>}
        {error && !loading && <p className="chart-message">{error}</p>}
        {data && !loading && !error && (
          <>
            <div className="stock-detail-header">
              <div>
                <h2>{data.stock.name}</h2>
                <span>{data.stock.symbol}</span>
              </div>
              <span className="stock-detail-period">{data.period.label}</span>
            </div>
            <div className="stock-detail-price-row">
              <span className="stock-detail-price">₹{formatPrice(data.performance.latestPrice)}</span>
              <span className={data.performance.change >= 0 ? "positive" : "negative"}>
                {data.performance.change >= 0 ? "+" : ""}
                {formatPrice(data.performance.change)} (
                {data.performance.changePercent >= 0 ? "+" : ""}
                {Number(data.performance.changePercent).toFixed(2)}%)
              </span>
            </div>
            <div className="stock-detail-chart">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.history}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    cursor={tooltipCursor}
                  />
                  <Line type="monotone" dataKey="close" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="stock-detail-stats">
              <div>
                <span>Highest</span>
                <strong>₹{formatPrice(data.performance.highest)}</strong>
              </div>
              <div>
                <span>Lowest</span>
                <strong>₹{formatPrice(data.performance.lowest)}</strong>
              </div>
              <div>
                <span>Sessions</span>
                <strong>{data.period.sessions}</strong>
              </div>
            </div>
            <p className="stock-detail-source">Source: {data.source}</p>
          </>
        )}
      </div>
    </div>
  );
}
