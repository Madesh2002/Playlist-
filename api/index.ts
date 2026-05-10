import express from 'express';
import fs from 'fs';
import path from 'path';

let config = {
  url: 'http://premimum.online',
  username: 'johannes',
  password: 'johannes123'
};

try {
  const configPath = path.resolve(process.cwd(), 'api', 'config.json');
  if (fs.existsSync(configPath)) {
    const fileConf = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...fileConf };
  }
} catch (e) {
  console.error("Config load error:", e);
}

const INDIAN_KEYWORDS = [
  'india', 'hindi', 'tamil', 'telugu', 'malayalam', 'kannada', 
  'bengali', 'bangla', 'marathi', 'gujarati', 'punjabi', 'bhojpuri', 
  'oriya', 'odia', 'assamese', 'ind '
];

const checkIsIndianCategory = (name: string) => {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  
  // Exclude 24/7 and 24x7 categories
  if (lowerName.includes('24/7') || lowerName.includes('24x7')) {
    return false;
  }

  // Include exactly KIDS
  if (lowerName.trim() === 'kids') return true;

  return INDIAN_KEYWORDS.some(k => lowerName.includes(k));
};

const normalizeLogoName = (name: string) => {
  if (!name) return '';
  let s = name.toLowerCase();
  // Replace & with 'and' (e.g. &TV -> andtv, &pictures -> andpictures)
  s = s.replace(/&/g, 'and');
  // Remove bracketed qualities or extra info
  s = s.replace(/\[.*?\]|\(.*?\)/g, ' ');
  // Remove common suffixes/prefixes
  s = s.replace(/\b(hd|fhd|sd|4k|2k|8k|1080p|720p|hevc|hq|uhd|vip|premium|uk|us|usa|in|ind|india|pb|airtel)\b/gi, ' ');
  // Remove non-alphanumeric
  s = s.replace(/[^a-z0-9]/g, '');
  return s;
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
  const url = req.query.url as string || config.url;
  const username = req.query.username as string || config.username;
  const password = req.query.password as string || config.password;

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

    let indianStreams = Array.isArray(allStreams) ? allStreams.filter(s => {
      if (!catIds.includes(s.category_id)) return false;
      const lowerName = (s.name || '').toLowerCase();
      if (lowerName.includes('24/7') || lowerName.includes('24x7')) return false;
      return true;
    }) : [];

    // Fetch high quality logos from YGX API
    let externalLogos: Record<string, string> = {};
    try {
      const logoRes = await fetch("https://api.ygxworld.workers.dev/fetcher.json");
      if (logoRes.ok) {
        const logoData = await logoRes.json();
        if (logoData?.data?.channels) {
          logoData.data.channels.forEach((ch: any) => {
            if (ch.name && ch.logo_url) {
              const normName = normalizeLogoName(ch.name);
              if (normName) {
                externalLogos[normName] = ch.logo_url;
              }
            }
          });
        }
      }
    } catch (err) {
      console.error("Warning: Could not fetch external logos", err);
    }

    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const baseUrl = `${protocol}://${host}`;

  let m3u = "#EXTM3U\n";
  for (const stream of indianStreams) {
    const streamId = stream.stream_id;
    const name = stream.name;
    
    const normStreamName = normalizeLogoName(name);
    
    // Exact match
    let logo = externalLogos[normStreamName] || '';
    
    if (!logo && normStreamName.length > 2) {
      // Substring match
       for (const [key, logoUrl] of Object.entries(externalLogos)) {
          if (key.length > 2 && (normStreamName.includes(key) || key.includes(normStreamName))) {
             logo = logoUrl;
             break;
          }
       }
    }
    
    // Only use logo from external fetcher to avoid generic placeholder logos
    logo = logo || '';
    
    const cat = indianCategories.find(c => c.category_id === stream.category_id);
    const originalGroup = cat ? (cat.category_name || '') : 'Indian';
    
    let group = 'T-Play Channels';
    const lowerGroup = originalGroup.toLowerCase();
    
    if (lowerGroup.includes('movie')) group = 'T-Play Movies';
    else if (lowerGroup.includes('entrtnmnt') || lowerGroup.includes('entertainment')) group = 'T-Play Entertainment';
    else if (lowerGroup.includes('music') || lowerGroup.includes('song')) group = 'T-Play Music';
    else if (lowerGroup.includes('news')) group = 'T-Play News';
    else if (lowerGroup.includes('sport')) group = 'T-Play Sports';
    else if (lowerGroup.includes('kids') || lowerGroup.includes('cartoon')) group = 'T-Play Kids';
    else if (lowerGroup.includes('documentary') || lowerGroup.includes('knowledge') || lowerGroup.includes('infotainment')) group = 'T-Play Infotainment';
    else if (lowerGroup.includes('devotional') || lowerGroup.includes('spiritual') || lowerGroup.includes('darshan')) group = 'T-Play Devotional';
    else if (lowerGroup.includes('hindi')) group = 'T-Play Hindi';
    else if (lowerGroup.includes('tamil')) group = 'T-Play Tamil';
    else if (lowerGroup.includes('telugu')) group = 'T-Play Telugu';
    else if (lowerGroup.includes('malayalam')) group = 'T-Play Malayalam';
    else if (lowerGroup.includes('kannada')) group = 'T-Play Kannada';
    else if (lowerGroup.includes('bengali') || lowerGroup.includes('bangla')) group = 'T-Play Bengali';
    else if (lowerGroup.includes('marathi')) group = 'T-Play Marathi';
    else if (lowerGroup.includes('punjabi')) group = 'T-Play Punjabi';
    else if (lowerGroup.includes('gujarati')) group = 'T-Play Gujarati';
    else if (lowerGroup.includes('bhojpuri')) group = 'T-Play Bhojpuri';
    else if (lowerGroup.includes('oriya') || lowerGroup.includes('odia')) group = 'T-Play Odia';
    else if (lowerGroup.includes('assamese')) group = 'T-Play Assamese';
    else group = 'T-Play Mix';

    let finalUrl = `${baseUrl}/api/play?id=${streamId}`;
      if (username !== config.username || password !== config.password || url !== config.url) {
        finalUrl += `&url=${encodeURIComponent(url as string)}&u=${encodeURIComponent(username as string)}&p=${encodeURIComponent(password as string)}`;
      }

      m3u += `#EXTINF:-1 tvg-id="${stream.epg_channel_id || ''}" tvg-logo="${logo}" group-title="${group}",${name}\n`;
      m3u += `${finalUrl}\n`;
    }

    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', 'attachment; filename="indian_channels.m3u"');
    res.send(m3u);

  } catch (error) {
    console.error("Playlist generation error:", error);
    res.status(500).send("Error generating playlist");
  }
});

app.get('/api/play', (req, res) => {
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  
  // Simple check for standard browsers
  const isBrowser = userAgent.includes('mozilla') && 
                    (userAgent.includes('chrome') || userAgent.includes('safari') || userAgent.includes('firefox') || userAgent.includes('edge'));
                    
  // Allow known players that might use a webview
  const isPlayer = userAgent.includes('vlc') || userAgent.includes('tivimate') || userAgent.includes('smarters') || userAgent.includes('exoplayer');

  if (isBrowser && !isPlayer) {
    return res.status(404).send("404 Not Found");
  }

  const id = req.query.id as string;
  const url = req.query.url as string || config.url;
  const username = req.query.u as string || config.username;
  const password = req.query.p as string || config.password;

  if (!id) {
    return res.status(400).send("Missing stream ID");
  }

  const targetUrl = `${url}/live/${username}/${password}/${id}.ts`;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.redirect(302, targetUrl);
});

export default app;
