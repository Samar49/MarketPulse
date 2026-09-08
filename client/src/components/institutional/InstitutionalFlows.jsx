function formatCr(value) {
  return `₹${Math.abs(value).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })} Cr`;
}

function getSentiment(fiiNet, diiNet) {
  if (fiiNet >= 0 && diiNet >= 0) return "Bullish";
  if (fiiNet < 0 && diiNet < 0) return "Bearish";
  if (fiiNet < 0 && diiNet >= 0) return "Cautious";
  return "Mixed";
}

function getActivityLevel(totalTurnover) {
  if (totalTurnover >= 50000) return "Very High Activity";
  if (totalTurnover >= 25000) return "High Activity";
  if (totalTurnover >= 10000) return "Moderate Activity";
  return "Low Activity";
}

function getInsight(fiiNet, diiNet) {
  if (fiiNet < 0 && diiNet >= 0) {
    return "FII selling but DII absorbing — domestic institutions providing floor, watch for FII trend reversal.";
  }
  if (fiiNet >= 0 && diiNet < 0) {
    return "FII buying while DII books profits — foreign flows currently driving the move.";
  }
  if (fiiNet >= 0 && diiNet >= 0) {
    return "Both FII and DII are net buyers — broad-based institutional support in the latest session.";
  }
  return "Both FII and DII are net sellers — institutional flows are broadly cautious in the latest session.";
}
function formatInstitutionalDate(date) {
  if (!date) return "Date unavailable";
  // If NSE already provides a display-friendly date like 04-Sep-2026, store it
  if (typeof date === "string" && /^[0-9]{2}-[A-Za-z]{3}-[0-9]{4}$/.test(date)) {
    return date;
  }
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date;
  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function FlowBlock({ title, subtitle, group }) {
  const total = group.buy + group.sell;
  const buyPct = total > 0 ? (group.buy / total) * 100 : 0;
  const sellPct = total > 0 ? (group.sell / total) * 100 : 0;
  const isNetBuyer = group.net >= 0;

  return (
    <div className="flow-block">
      <div className="flow-block-header">
        <div>
          <h3>{title}</h3>
          <span>{subtitle}</span>
        </div>
        <span
          className={
            isNetBuyer ? "flow-badge flow-badge-buy" : "flow-badge flow-badge-sell"
          }
        >
          {isNetBuyer ? "NET BUYER" : "NET SELLER"}
        </span>
      </div>
      <div className="flow-net-value">
        <span className={isNetBuyer ? "positive" : "negative"}>
          {isNetBuyer ? "+" : "-"}
          {formatCr(group.net)}
        </span>
      </div>
      <div className="flow-bar">
        <div className="flow-bar-buy" style={{ width: `${buyPct}%` }} />
        <div className="flow-bar-sell" style={{ width: `${sellPct}%` }} />
      </div>
      <div className="flow-bar-labels">
        <span>
          Buy {formatCr(group.buy)} ({buyPct.toFixed(1)}%)
        </span>
        <span>
          Sell {formatCr(group.sell)} ({sellPct.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}
export default function InstitutionalFlows({ data }) {
  // Protect the component from incomplete API responses.
  if (!data || !data.fii || !data.dii) {
    return (
      <div className="institutional-card">
        <div className="institutional-header">
          <h2>FII / DII Activity</h2>
        </div>
        <div className="institutional-empty">
          Institutional flow data is currently unavailable.
        </div>
      </div>
    );
  }
  const fiiNet = Number(data.fii.net) || 0;
  const diiNet = Number(data.dii.net) || 0;
  const fiiBuy = Number(data.fii.buy) || 0;
  const fiiSell = Number(data.fii.sell) || 0;
  const diiBuy = Number(data.dii.buy) || 0;
  const diiSell = Number(data.dii.sell) || 0;
  const netFlow = fiiNet + diiNet;
  const totalTurnover = fiiBuy + fiiSell + diiBuy + diiSell;
  const sentiment = getSentiment(fiiNet, diiNet);
  const activityLevel = getActivityLevel(totalTurnover);
  const dominant = Math.abs(diiNet) >= Math.abs(fiiNet) ? "DII" : "FII";
  const sessionDate = formatInstitutionalDate(data.date);

  // New explicit data-status metadata. Falls back safely for older API responses.
  const dataLabel = data.dataLabel || "Latest completed session";
  const isProvisional = data.provisional !== false;
  return (
    <div className="institutional-card">
      {/* Header */}
      <div className="institutional-header">
        <div>
          <h2>FII / DII Activity</h2>
          <div className="institutional-date-wrapper">
            <span className="institutional-date-label">{dataLabel}</span>
            <span className="institutional-date">{sessionDate}</span>
          </div>
        </div>
      </div>
      {/* Status */}
      <div className="institutional-status-row">
        <span className={`sentiment-badge sentiment-${sentiment.toLowerCase()}`}>
          <span className="sentiment-dot" />
          {sentiment}
        </span>
        <span className="activity-badge">
          {activityLevel.toUpperCase().replace(/ /g, "_")}
        </span>
      </div>

      {/* FII / DII blocks */}
      <div className="flow-grid">
        <FlowBlock
          title="FII / FPI (Foreign)"
          subtitle="Foreign Institutions"
          group={{ buy: fiiBuy, sell: fiiSell, net: fiiNet }}
        />
        <FlowBlock
          title="DII (Domestic)"
          subtitle="Domestic Institutions"
          group={{ buy: diiBuy, sell: diiSell, net: diiNet }}
        />
      </div>
      {/* Summary */}
      <div className="institutional-summary-grid">
        <div className="institutional-summary-cell">
          <span>Net Flow</span>
          <strong className={netFlow >= 0 ? "positive" : "negative"}>
            {netFlow >= 0 ? "+" : "-"}
            {formatCr(netFlow)}
          </strong>
        </div>

        <div className="institutional-summary-cell">
          <span>Total Turnover</span>
          <strong>{formatCr(totalTurnover)}</strong>
        </div>

        <div className="institutional-summary-cell">
          <span>Dominant</span>
          <strong>
            {dominant === "DII" ? "DII providing support" : "FII driving flow"}
          </strong>
        </div>
      </div>

      {/* AI-style interpretation */}
      <p className="institutional-insight">{getInsight(fiiNet, diiNet)}</p>

      {/* Footer */}
      <div className="institutional-footer">
        <span>Source: {data.source || "NSE"}</span>
        <span>
          {isProvisional
            ? "Values are provisional and subject to change."
            : "Values finalized."}
        </span>
      </div>
    </div>
  );
}