const Parser = require("rss-parser");
const { setCache, getCache } = require("./cacheService");

const parser = new Parser();

// RSS feeds
const NEWS_FEEDS = [
  {
    name: "Business Standard",
    url: "https://www.business-standard.com/rss/markets-106.rss",
  },
  {
    name: "Economic Times",
    url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
  },
];

// Cache
const NEWS_CACHE_KEY = "financial-news";
const NEWS_CACHE_TTL = 5 * 60 * 1000;

// Fetch a single RSS feed
const fetchNewsFeed = async (feed) => {
  try {
    console.log(`Fetching news from ${feed.name}...`);

    const result = await parser.parseURL(feed.url);

    if (!result || !Array.isArray(result.items)) {
      throw new Error("Invalid RSS feed response");
    }

    return result.items.map((item) => ({
      title: item.title || "",
      url: item.link || "",
      publishedAt: item.isoDate || item.pubDate || null,
      source: feed.name,
    }));
  } catch (error) {
    console.error(`${feed.name} news error:`, error.message);
    return [];
  }
};

// Normalize news (filter invalid, dedupe, format dates, sort newest first)
const normalizeNews = (articles) => {
  const seen = new Set();

  return articles
    // Remove invalid articles
    .filter((article) => article.title && article.url)
    // Remove duplicates
    .filter((article) => {
      const key = article.url.trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    // Convert dates
    .map((article) => ({
      title: article.title.trim(),
      url: article.url.trim(),
      source: article.source,
      publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString() : null,
    }))
    // Newest first
    .sort((a, b) => {
      if (!a.publishedAt) {
        return 1;
      }
      if (!b.publishedAt) {
        return -1;
      }
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });
};

// Get financial news
const getFinancialNews = async (limit = 20) => {
  const requestedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

  // Check cache
  const cachedData = getCache(NEWS_CACHE_KEY);
  if (cachedData) {
    console.log("Financial news cache hit");
    return cachedData.slice(0, requestedLimit);
  }

  // Fetch and combine feeds
  const results = await Promise.all(NEWS_FEEDS.map(fetchNewsFeed));
  const combinedNews = results.flat();

  // Normalize
  const normalizedNews = normalizeNews(combinedNews);

  // Fail if all sources failed
  if (normalizedNews.length === 0) {
    throw new Error("Unable to fetch financial news");
  }

  // Keep latest 50 and cache
  const limitedNews = normalizedNews.slice(0, 50);
  setCache(NEWS_CACHE_KEY, limitedNews, NEWS_CACHE_TTL);

  // Return requested amount
  return limitedNews.slice(0, requestedLimit);
};

module.exports = {
  getFinancialNews,
};