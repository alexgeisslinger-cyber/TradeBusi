export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Try multiple sources per ticker for reliability
  const fetchYahoo = async (symbol, key, label) => {
    const urls = [
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
    ];
    for (const url of urls) {
      try {
        const r = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Referer': 'https://finance.yahoo.com/',
            'Origin': 'https://finance.yahoo.com'
          }
        });
        if (!r.ok) continue;
        const data = await r.json();
        const result = data?.chart?.result?.[0];
        if (!result) continue;

        const closes = result.indicators?.quote?.[0]?.close?.filter(v => v != null);
        if (!closes || closes.length < 2) continue;

        const price = closes[closes.length - 1];
        const prev  = closes[closes.length - 2];
        const change = price - prev;
        const changePct = (change / prev) * 100;

        return { key, label, price, change, changePct };
      } catch(e) { continue; }
    }
    return { key, label, error: 'Unavailable' };
  };

  try {
    const results = await Promise.all([
      fetchYahoo('%5EGSPC',  'sp500',  'S&P 500'),
      fetchYahoo('DX-Y.NYB', 'dxy',    'DXY'),
      fetchYahoo('GC%3DF',   'gold',   'Gold'),
      fetchYahoo('%5ETNX',   'yields', 'US 10Y Yield'),
    ]);

    res.status(200).json(results);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}
