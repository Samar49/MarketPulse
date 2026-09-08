import React from "react";

const CorporateEvents = ({ data, loading }) => {
  const formatEventDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="corporate-events-card">
        <p className="chart-message">Loading corporate events...</p>
      </div>
    );
  }

  if (!data || !Array.isArray(data.events)) {
    return (
      <div className="corporate-events-card">
        <p className="chart-message">Corporate event data unavailable</p>
      </div>
    );
  }

  return (
    <div className="corporate-events-card">
      <div className="corporate-events-header">
        <div>
          <h2>Upcoming Corporate Events</h2>
          <p>Earnings, dividends and other company events</p>
        </div>
        <span className="corporate-events-badge">Next {data.days} Days</span>
      </div>

      {data.events.length === 0 ? (
        <div className="corporate-events-empty">
          <strong>No upcoming events found</strong>
          <span>
            No tracked companies have qualifying events in the selected period.
          </span>
        </div>
      ) : (
        <div className="corporate-events-list">
          <div className="corporate-event-row corporate-event-header">
            <span>Company</span>
            <span>Event</span>
            <span>Date</span>
          </div>

          {data.events.map((event, index) => (
            <div
              className="corporate-event-row"
              key={`${event.symbol}-${event.type}-${event.date}-${index}`}
            >
              <div className="corporate-event-company">
                <strong>{event.name}</strong>
                <small>{event.symbol.replace(".NS", "")}</small>
              </div>
              <span className="corporate-event-type">{event.type}</span>
              <span className="corporate-event-date">
                {formatEventDate(event.date)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="corporate-events-footer">
        <span>Source: {data.source || "Yahoo Finance"}</span>
        <span>Events: {data.total || 0}</span>
      </div>
    </div>
  );
};

export default CorporateEvents;