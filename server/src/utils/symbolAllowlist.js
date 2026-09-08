const {
  INDEX_SYMBOLS,
  GLOBAL_MARKET_SYMBOLS,
  SECTOR_SYMBOLS,
} = require("../services/marketService");

const { STOCKS } = require("../services/stockService");


const buildAllowedSymbols = () => {
  const symbols = new Set([
    ...Object.values(INDEX_SYMBOLS),
    ...Object.values(GLOBAL_MARKET_SYMBOLS),
    ...Object.values(SECTOR_SYMBOLS),
    ...Object.values(STOCKS).map((stock) => stock.symbol),
  ]);

  return symbols;
};

const ALLOWED_SYMBOLS = buildAllowedSymbols();

const isAllowedSymbol = (symbol) => ALLOWED_SYMBOLS.has(symbol);

module.exports = {
  ALLOWED_SYMBOLS,
  isAllowedSymbol,
};
