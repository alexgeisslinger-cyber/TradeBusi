export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Symbols: DXY, S&P500, Gold, 10Y Treasury
  const symbols = ['DX-Y.NYB', '^GSPC', 'GC=F', '^TNX'];
  const labels = ['DXY (US Dollar)', 'S&P 500', 'Gold', '10Y Treasury Yield'];

  try {
    const results = await Promise.all(symbols.map(async (symbol, i) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
        const r = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        const meta = data.chart.result[0].meta;
        const price = meta.regularMarketPrice;
        const prev = meta.previousClose || meta.chartPreviousClose;
        const change = price - prev;
        const changePct = (change / prev * 100);
        return {
          label: labels[i],
          price: price,
          change: change,
          changePct: changePct,
          symbol
        };
      } catch (e) {
        return { label: labels[i], error: e.message, symbol };
      }
    }));

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
