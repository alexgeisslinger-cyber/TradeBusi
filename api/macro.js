export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const tickers = [
    { symbol: '%5EGSPC', key: 'sp500', label: 'S&P 500', btcImpact: 'positive' },
    { symbol: 'DX-Y.NYB', key: 'dxy', label: 'DXY', btcImpact: 'negative' },
    { symbol: 'GC%3DF', key: 'gold', label: 'Gold', btcImpact: 'positive' },
    { symbol: '%5ETNX', key: 'yields', label: 'US 10Y Yield', btcImpact: 'negative' }
  ];

  try {
    const results = await Promise.all(tickers.map(async (t) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${t.symbol}?interval=1d&range=2d`;
        const r = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://finance.yahoo.com'
          }
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) throw new Error('No meta');

        const price = meta.regularMarketPrice;
        const prevClose = meta.previousClose || meta.chartPreviousClose;
        const change = price - prevClose;
        const changePct = (change / prevClose) * 100;

        return {
          key: t.key,
          label: t.label,
          price,
          change,
          changePct,
          btcImpact: t.btcImpact,
          currency: meta.currency || 'USD'
        };
      } catch(e) {
        return { key: t.key, label: t.label, error: e.message };
      }
    }));

    res.status(200).json(results);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}
