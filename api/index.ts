import express from 'express';

const INDIAN_KEYWORDS = [
  'india', 'hindi', 'tamil', 'telugu', 'malayalam', 'kannada', 
  'bengali', 'bangla', 'marathi', 'gujarati', 'punjabi', 'bhojpuri', 
  'oriya', 'odia', 'assamese', 'ind '
];

const checkIsIndianCategory = (name: string) => {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  
  // Exclude 24/7 categories
  if (lowerName.includes('24/7')) {
    return false;
  }

  return INDIAN_KEYWORDS.some(k => lowerName.includes(k));
};

const app = express();
app.use(express.json());

app.post('/api/xtream', async (req, res) => {
  try {
    const { url, username, password, action, category_id } = req.body;
    let targetUrl = `${url}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    
    if (action) targetUrl += `&action=${encodeURIComponent(action)}`;
    if (category_id) targetUrl += `&category_id=${encodeURIComponent(category_id)}`;

    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream error: ${response.statusText}` });
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      try {
        res.json(JSON.parse(text));
      } catch (e) {
        res.status(500).json({ error: 'Invalid response from IPTV provider.', snippet: text.substring(0, 100) });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Proxy failed' });
  }
});

app.get('/api/playlist.m3u', async (req, res) => {
  const url = req.query.url as string || 'http://premimum.online';
  const username = req.query.username as string || 'johannes';
  const password = req.query.password as string || 'johannes123';

  if (!url || !username || !password) return res.status(400).send("Missing credentials");

  try {
    // 1. Fetch Categories
    const catRes = await fetch(`${url}/player_api.php?username=${encodeURIComponent(username as string)}&password=${encodeURIComponent(password as string)}&action=get_live_categories`);
    const cats = await catRes.json();

    const indianCategories = Array.isArray(cats) ? cats.filter(c => checkIsIndianCategory(c.category_name)) : [];
    const catIds = indianCategories.map(c => c.category_id);

    // 2. Fetch Streams
    const streamsRes = await fetch(`${url}/player_api.php?username=${encodeURIComponent(username as string)}&password=${encodeURIComponent(password as string)}&action=get_live_streams`);
    const allStreams = await streamsRes.json();

    let indianStreams = Array.isArray(allStreams) ? allStreams.filter(s => catIds.includes(s.category_id)) : [];

    let m3u = "#EXTM3U\n";
    for (const stream of indianStreams) {
      const streamId = stream.stream_id;
      const name = stream.name;
      const logo = stream.stream_icon || '';
      
      const cat = indianCategories.find(c => c.category_id === stream.category_id);
      const group = cat ? cat.category_name : 'Indian';

      const xtreamUrl = `${url}/live/${username}/${password}/${streamId}.ts`;

      m3u += `#EXTINF:-1 tvg-id="${stream.epg_channel_id || ''}" tvg-logo="${logo}" group-title="${group}",${name}\n`;
      m3u += `${xtreamUrl}\n`;
    }

    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', 'attachment; filename="indian_channels.m3u"');
    res.send(m3u);

  } catch (error) {
    console.error("Playlist generation error:", error);
    res.status(500).send("Error generating playlist");
  }
});

export default app;
