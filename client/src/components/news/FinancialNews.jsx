import React from "react";

const FinancialNews = ({ news }) => {
  const formatPublishedTime = (publishedAt) => {
    if (!publishedAt) return "Time unavailable";

    const date = new Date(publishedAt);
    if (Number.isNaN(date.getTime())) return "Time unavailable";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="financial-news-card">
      <div className="financial-news-header">
        <div>
          <h2>Financial News</h2>
          <p>Latest market and business headlines</p>
        </div>
        <span className="financial-news-badge">Latest</span>
      </div>

      <div className="financial-news-list">
        {news.map((article, index) => (
          <a
            key={`${article.url}-${index}`}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="financial-news-item"
          >
            <div className="financial-news-content">
              <h3>{article.title}</h3>
              <div className="financial-news-meta">
                <span>{article.source}</span>
                <span>•</span>
                <span>{formatPublishedTime(article.publishedAt)}</span>
              </div>
            </div>

            <span className="financial-news-arrow">↗</span>
          </a>
        ))}
      </div>

      <div className="financial-news-footer">
        <span>Headlines from Business Standard & Economic Times</span>
        <span>Click a headline to read the full article</span>
      </div>
    </div>
  );
};

export default FinancialNews;