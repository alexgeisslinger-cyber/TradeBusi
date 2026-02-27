export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    // Search specifically for Bitcoin/BTC markets with high volume
    const url = 'https://gamma-api.polymarket.com/markets?' + new URLSearchParams({
      active: 'true',
      closed: 'false',
      limit: '100',
      order: 'volume24hr',
      ascending: 'false'
    });

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) throw new Error(`Polymarket HTTP ${response.status}`);
    const data = await response.json();

    // Filter only BTC/Bitcoin markets
    const btcKeywords = ['bitcoin', 'btc', 'bitcoin price', 'btc price'];
    const btcMarkets = data.filter(m => {
      const q = (m.question || '').toLowerCase();
      return btcKeywords.some(k => q.includes(k));
    });

    // Return top 8 BTC markets by volume
    res.status(200).json(btcMarkets.slice(0, 8));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
