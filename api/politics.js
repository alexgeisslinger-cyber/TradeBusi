export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const feeds = [
    'https://cointelegraph.com/rss',
    'https://coindesk.com/arc/outboundfeeds/rss/',
    'https://decrypt.co/feed',
  ];

  const politicsKeywords = [
    'regulation', 'sec', 'fed ', 'federal', 'congress', 'senate', 'government',
    'ban', 'law', 'policy', 'white house', 'treasury', 'central bank',
    'etf', 'approval', 'ruling', 'court', 'tax', 'legislation',
    'trump', 'eu ', 'europe', 'china', 'sanctions', 'cbdc', 'crypto bill',
    'fomc', 'interest rate', 'inflation', 'tariff'
  ];

  async function fetchRSS(url) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml, text/xml, */*' },
        signal: AbortSignal.timeout(5000)
      });
      if (!r.ok) return [];
      const xml = await r.text();
      const items = [];
      const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const m of matches) {
        const b = m[1];
        const title = (b.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || b.match(/<title>(.*?)<\/title>/) || [])[1]?.trim() || '';
        const link  = (b.match(/<link>(.*?)<\/link>/)   || [])[1]?.trim() || '';
        const date  = (b.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1]?.trim() || '';
        const desc  = (b.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || b.match(/<description>(.*?)<\/description>/) || [])[1]?.trim() || '';
        if (title) items.push({ title, link, pubDate: date, description: desc });
      }
      return items;
    } catch { return []; }
  }

  try {
    // Fetch all feeds in parallel
    const results = await Promise.all(feeds.map(fetchRSS));
    const allItems = results.flat();

    // Filter by politics keywords
    const filtered = allItems.filter(a => {
      const text = (a.title + ' ' + a.description).toLowerCase();
      return politicsKeywords.some(k => text.includes(k));
    });

    // Deduplicate by title similarity
    const seen = new Set();
    const unique = filtered.filter(a => {
      const key = a.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by date (newest first)
    unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    res.status(200).json({ items: unique.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
