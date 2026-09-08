const cache = new Map();

const setCache = (key, data, ttl) => {
  const expiresAt = Date.now() + ttl;

  cache.set(key, {
    data,
    expiresAt,
  });
};

const getCache = (key) => {
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expiresAt) {
    cache.delete(key);
    return null;
  }

  return cached.data;
};

const deleteCache = (key) => {
  cache.delete(key);
};

module.exports = {
  setCache,
  getCache,
  deleteCache,
};
