export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const url = 'https://gamma-api.polymarket.com/markets?' + new URLSearchParams({
      active: 'true',
      closed: 'false',
      limit: '30',
      order: 'volume24hr',
      ascending: 'false'
    });

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) throw new Error(`Polymarket HTTP ${response.status}`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
