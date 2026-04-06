export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'Missing from/to params' });

  try {
    // Binance monthly klines - covers full range in one call
    // Max 1000 candles per call, monthly = plenty for DCA
    const allCandles = [];
    let startTime = parseInt(from);
    const endTime = parseInt(to);

    while (startTime < endTime) {
      const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=1000`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Binance HTTP ${r.status}`);
      const data = await r.json();
      if (!data.length) break;

      allCandles.push(...data);
      // Move start to after last candle
      startTime = data[data.length - 1][0] + 86400000;
      if (data.length < 1000) break;
    }

    // Return simplified [timestamp, closePrice]
    const prices = allCandles.map(c => [c[0], parseFloat(c[4])]);
    res.status(200).json({ prices });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}
