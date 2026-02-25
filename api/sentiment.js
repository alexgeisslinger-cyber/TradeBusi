export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const url = 'https://cryptopanic.com/api/v1/posts/?' + new URLSearchParams({
      auth_token: '6dea179badc3a052d4875653be9eec388648af74',
      currencies: 'BTC',
      filter: 'hot',
      public: 'true'
    });

    const response = await fetch(url);
    if (!response.ok) throw new Error(`CryptoPanic HTTP ${response.status}`);

    const data = await response.json();
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
