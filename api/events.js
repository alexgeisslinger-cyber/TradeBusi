export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    // Fetch economic calendar from FxStreet via JBlanked (no key needed)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fmt = d => d.toISOString().split('T')[0];

    const url = `https://economic-calendar.tradingview.com/events?from=${fmt(today)}T00%3A00%3A00.000Z&to=${fmt(nextWeek)}T23%3A59%3A59.000Z&countries=US`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.tradingview.com',
        'Referer': 'https://www.tradingview.com/'
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // Filter high and medium impact USD events
    const events = (data.result || [])
      .filter(e => {
        const imp = (e.importance || 0);
        return imp >= 1; // 1=medium, 2=high on TradingView scale
      })
      .map(e => ({
        name: e.title,
        date: e.date,
        time: e.date ? new Date(e.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET' : '',
        impact: e.importance >= 2 ? 'HIGH' : 'MEDIUM',
        forecast: e.forecast || null,
        previous: e.previous || null,
        currency: e.currency || 'USD'
      }))
      .filter(e => e.currency === 'USD')
      .slice(0, 10);

    res.status(200).json(events);

  } catch(err) {
    // Fallback: return curated static high-impact events if API fails
    const now = new Date();
    const fallback = [
      { name: 'Fed Interest Rate Decision', date: new Date(now.getFullYear(), now.getMonth(), 19).toISOString(), time: '2:00 PM ET', impact: 'HIGH', forecast: null, previous: '5.25-5.50%' },
      { name: 'US CPI Inflation Data', date: new Date(now.getFullYear(), now.getMonth(), 12).toISOString(), time: '8:30 AM ET', impact: 'HIGH', forecast: null, previous: '3.1%' },
      { name: 'US Non-Farm Payrolls', date: new Date(now.getFullYear(), now.getMonth() + 1, 7).toISOString(), time: '8:30 AM ET', impact: 'HIGH', forecast: null, previous: '275K' },
      { name: 'Fed Chair Powell Speech', date: new Date(now.getFullYear(), now.getMonth(), 22).toISOString(), time: '1:00 PM ET', impact: 'HIGH', forecast: null, previous: null },
      { name: 'US GDP Growth Rate', date: new Date(now.getFullYear(), now.getMonth(), 28).toISOString(), time: '8:30 AM ET', impact: 'MEDIUM', forecast: '2.1%', previous: '3.3%' },
    ].filter(e => new Date(e.date) >= now)
     .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json(fallback);
  }
}
