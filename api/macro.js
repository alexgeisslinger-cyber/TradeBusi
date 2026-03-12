export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const tickers = [
    { symbol: '^spx',   key: 'sp500',  label: 'S&P 500',     btcImpact: 'positive' },
    { symbol: 'usdx',   key: 'dxy',    label: 'DXY',          btcImpact: 'negative' },
    { symbol: 'xauusd', key: 'gold',   label: 'Gold',         btcImpact: 'positive' },
    { symbol: '^tnx',   key: 'yields', label: 'US 10Y Yield', btcImpact: 'negative' }
  ];

  try {
    const results = await Promise.all(tickers.map(async (t) => {
      try {
        const url = `https://stooq.com/q/d/l/?s=${t.symbol}&i=d`;
        const r = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        const text = await r.text();
        const lines = text.trim().split('\n');

        // CSV format: Date,Open,High,Low,Close,Volume
        if (lines.length < 3) throw new Error('Not enough data');

        const parse = (line) => {
          const cols = line.split(',');
          return { date: cols[0], close: parseFloat(cols[4]) };
        };

        const latest = parse(lines[lines.length - 1]);
        const prev   = parse(lines[lines.length - 2]);

        if (isNaN(latest.close) || isNaN(prev.close)) throw new Error('Invalid price data');

        const change    = latest.close - prev.close;
        const changePct = (change / prev.close) * 100;

        return {
          key:       t.key,
          label:     t.label,
          price:     latest.close,
          change,
          changePct,
          btcImpact: t.btcImpact
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
