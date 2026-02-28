export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const url = 'https://gamma-api.polymarket.com/markets?' + new URLSearchParams({
      active: 'true',
      closed: 'false',
      limit: '200',
      order: 'volume24hr',
      ascending: 'false'
    });

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) throw new Error(`Polymarket HTTP ${response.status}`);
    const data = await response.json();

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const filtered = data.filter(m => {
      const q = (m.question || '').toLowerCase();

      // Must be BTC/Bitcoin/crypto related
      if (!q.includes('bitcoin') && !q.includes('btc') && !q.includes('crypto')) return false;

      // Must end at least 1 day from now
      if (m.endDate) {
        const end = new Date(m.endDate).getTime();
        if (end - now < oneDayMs) return false;
      }

      // Not completely decided (between 3% and 97%)
      if (m.outcomePrices) {
        try {
          const prices = JSON.parse(m.outcomePrices);
          const yesPrice = parseFloat(prices[0]);
          if (yesPrice < 0.03 || yesPrice > 0.97) return false;
        } catch(e) {}
      }

      return true;
    });

    filtered.sort((a, b) => (parseFloat(b.volume24hr) || 0) - (parseFloat(a.volume24hr) || 0));
    
    // If still empty, just return top BTC markets without price filter
    if (filtered.length === 0) {
      const fallback = data.filter(m => {
        const q = (m.question || '').toLowerCase();
        return q.includes('bitcoin') || q.includes('btc') || q.includes('crypto');
      });
      return res.status(200).json(fallback.slice(0, 6));
    }

    res.status(200).json(filtered.slice(0, 6));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
