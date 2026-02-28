export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Fetch both regular markets AND events (for multiple choice)
    const [marketsRes, eventsRes] = await Promise.all([
      fetch('https://gamma-api.polymarket.com/markets?' + new URLSearchParams({
        active: 'true', closed: 'false', limit: '200', order: 'volume24hr', ascending: 'false'
      }), { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }),
      fetch('https://gamma-api.polymarket.com/events?' + new URLSearchParams({
        active: 'true', closed: 'false', limit: '100', order: 'volume24hr', ascending: 'false'
      }), { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } })
    ]);

    const marketsData = marketsRes.ok ? await marketsRes.json() : [];
    const eventsData = eventsRes.ok ? await eventsRes.json() : [];

    const keywords = ['bitcoin', 'btc', 'crypto', 'ethereum', 'eth'];

    // Filter regular markets
    const filteredMarkets = marketsData
      .filter(m => {
        const q = (m.question || '').toLowerCase();
        if (!keywords.some(k => q.includes(k))) return false;
        if (m.endDate && new Date(m.endDate).getTime() - now < oneDayMs) return false;
        return true;
      })
      .map(m => ({
        type: 'binary',
        question: m.question,
        endDate: m.endDate,
        volume24hr: parseFloat(m.volume24hr) || 0,
        outcomePrices: m.outcomePrices,
        outcomes: m.outcomes,
        url: m.slug ? `https://polymarket.com/event/${m.slug}` : 'https://polymarket.com'
      }));

    // Filter events (multiple choice)
    const filteredEvents = eventsData
      .filter(e => {
        const t = (e.title || '').toLowerCase();
        if (!keywords.some(k => t.includes(k))) return false;
        if (e.endDate && new Date(e.endDate).getTime() - now < oneDayMs) return false;
        return true;
      })
      .map(e => ({
        type: 'multi',
        question: e.title,
        endDate: e.endDate,
        volume24hr: parseFloat(e.volume24hr) || 0,
        markets: (e.markets || []).map(m => ({
          question: m.question,
          outcomePrices: m.outcomePrices,
          outcomes: m.outcomes
        })),
        url: e.slug ? `https://polymarket.com/event/${e.slug}` : 'https://polymarket.com'
      }));

    // Combine, sort by volume, return top 8
    const combined = [...filteredMarkets, ...filteredEvents]
      .sort((a, b) => b.volume24hr - a.volume24hr)
      .slice(0, 8);

    res.status(200).json(combined);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
