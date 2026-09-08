import React from "react";
import {LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,} from "recharts";

import {tooltipContentStyle,tooltipLabelStyle,tooltipItemStyle,tooltipCursor,} from "../../theme/chartTheme";
const InstitutionalFlowChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="institutional-history-card">
        <p className="chart-message">Loading institutional flow history...</p>
      </div>
    );
  }
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="institutional-history-card">
        <p className="chart-message">Institutional history unavailable</p>
      </div>
    );
  }
  const chartData = [...data.data].reverse().map((item) => ({
    date: item.date,
    FII: Number(item.fii.net),
    DII: Number(item.dii.net),
  }));
  const formatNet = (value) => `₹${Number(value).toLocaleString("en-IN")} Cr`;
  const formatSummaryValue = (value) =>
    `${value >= 0 ? "+" : "-"}₹${Math.abs(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Cr`;
  return (
    <div className="institutional-history-card">
      <div className="institutional-history-header">
        <div>
          <h2>Institutional Flow Trend</h2>
          <p>Daily FII/FPI and DII net activity</p>
        </div>
        <span>Last {data.days} Sessions</span>
      </div>

      <div className="institutional-history-chart">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={formatNet}
              contentStyle={tooltipContentStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
              cursor={tooltipCursor}
            />
            <Line
              type="monotone"
              dataKey="FII"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="DII"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="institutional-history-summary">
        <div className="institutional-summary-item">
          <span>FII Net</span>
          <strong
            className={
              data.summary.fiiNet >= 0
                ? "institutional-positive"
                : "institutional-negative"
            }
          >
            {formatSummaryValue(data.summary.fiiNet)}
          </strong>
        </div>
        <div className="institutional-summary-item">
          <span>DII Net</span>
          <strong
            className={
              data.summary.diiNet >= 0
                ? "institutional-positive"
                : "institutional-negative"
            }
          >
            {formatSummaryValue(data.summary.diiNet)}
          </strong>
        </div>
      </div>

      <div className="institutional-history-footer">
        <span>Source: NSE-sourced historical dataset</span>
        <span>Historical provider: {data.historicalProvider}</span>
      </div>
    </div>
  );
};
export default InstitutionalFlowChart;