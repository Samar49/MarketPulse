import React from "react";
const MacroEvents = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="macro-events-card">
        <p className="chart-message">Loading macro events...</p>
      </div>
    );
  }
  if (!data || !Array.isArray(data.events)) {
    return (
      <div className="macro-events-card">
        <p className="chart-message">Macro event data unavailable</p>
      </div>
    );
  }
  return (
    <div className="macro-events-card">
      <div className="macro-events-header">
        <div>
          <h2>Macro Economic Events</h2>
          <p>Key economic and monetary policy indicators</p>
        </div>
        <span className="macro-events-badge">India</span>
      </div>
      <div className="macro-events-list">
        {data.events.map((event, index) => (
          <div className="macro-event-row" key={`${event.name}-${index}`}>
            <div className="macro-event-main">
              <div className="macro-event-title">
                <strong>{event.name}</strong>
                <span
                  className={
                    event.importance === "High"
                      ? "macro-event-high"
                      : "macro-event-normal"
                  }
                >
                  {event.importance}
                </span>
              </div>
              <p>{event.description}</p>
            </div>
            <div className="macro-event-meta">
              <span className="macro-event-type">{event.type}</span>
              <span className="macro-event-source">{event.source}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="macro-events-footer">
        <span>Sources: MOSPI / RBI</span>
        <span>{data.total} indicators tracked</span>
      </div>
    </div>
  );
};
export default MacroEvents;