import useStockSearch from "../../hooks/useStockSearch";
const NAV_LINKS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "markets", label: "Markets" },
  { key: "sectors", label: "Sectors" },
  { key: "news", label: "News" },
  { key: "events", label: "Events" }
];
function TopNav({ lastUpdated, activeSection, onNavigate, onSelectStock }) {
  const { query, setQuery, results, loading, clear } = useStockSearch();
  const handleSelect = (stock) => {
    onSelectStock(stock.key);
    clear();
  };
  return (
    <header className="top-nav">
      <div className="top-nav-left">
        {/* MarketPulse Logo */}
        <div className="brand">
          <img
            src="/logo.png"
            alt="MarketPulse"
            className="brand-logo"
          />
        </div>
        {/* Navigation */}
        <nav className="nav-links">
          {NAV_LINKS.map((link) => (
            <button
              key={link.key}
              type="button"
              className={
                activeSection === link.key
                  ? "nav-link active"
                  : "nav-link"
              }
              onClick={() => onNavigate(link.key)}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="top-nav-right">
        {/* Stock Search */}
        <div className="nav-search">
          <span className="nav-search-icon">⌕</span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search stocks, indices..."
            className="nav-search-input"
          />
          {query.trim().length >= 2 && (
            <div className="nav-search-dropdown">

              {loading && (
                <div className="nav-search-empty">
                  Searching...
                </div>
              )}
              {!loading && results.length === 0 && (
                <div className="nav-search-empty">
                  No stocks found
                </div>
              )}

              {!loading &&
                results.map((stock) => (
                  <button
                    key={stock.key}
                    type="button"
                    className="nav-search-result"
                    onClick={() => handleSelect(stock)}
                  >
                    <span className="nav-search-result-name">
                      {stock.name}
                    </span>

                    <span className="nav-search-result-symbol">
                      {stock.symbol}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Market Status */}
        <div className="nav-status">
          <span className="live-dot" />
          <span>Live</span>
          {lastUpdated && (
            <span className="nav-status-time">
              {lastUpdated.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopNav;