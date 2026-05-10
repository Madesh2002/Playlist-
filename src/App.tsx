import React, { useState } from 'react';
import { LogIn, Tv, Download, AlertCircle, RefreshCcw, Link, Copy, Check, LogOut } from 'lucide-react';

export default function App() {
  const [credentials, setCredentials] = useState({
    url: 'http://premimum.online',
    username: 'johannes',
    password: 'johannes123'
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [playlistUrl, setPlaylistUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const fetchApi = async (action: string, extraParams: any = {}) => {
    try {
      const res = await fetch('/api/xtream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          action,
          ...extraParams
        })
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(data.error || 'Server error');
      return data;
    } catch (e: any) {
      throw e;
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Fetch live categories to verify auth
      const cats = await fetchApi('get_live_categories');
      if (!Array.isArray(cats)) {
         if (cats.user_info && cats.user_info.auth === 0) {
           throw new Error('Invalid authentication (Wrong username/password or expired account).');
         }
         throw new Error('Unexpected response format from provider.');
      }
      
      setIsConnected(true);
      
      // Generate standard playlist URL
      const host = window.location.origin;
      let urlStr = `${host}/api/playlist.m3u`;
      if (credentials.username !== 'johannes' || credentials.password !== 'johannes123' || credentials.url !== 'http://premimum.online') {
        urlStr += `?url=${encodeURIComponent(credentials.url)}&username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}`;
      }
      setPlaylistUrl(urlStr);

    } catch (err: any) {
      setError(err.message || 'Failed to connect. Check URL/Credentials.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(playlistUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Tv className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Xtream Playlist Generator</h1>
          </div>
          
          <p className="text-neutral-400 text-sm mb-6">
            Enter your Xtream Codes credentials to generate a custom M3U playlist link containing only the Indian channels. Copy the link below and paste it into any custom IPTV Player (VLC, Tivimate, Smarters, etc).
          </p>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Server URL</label>
              <input 
                type="url" 
                value={credentials.url}
                onChange={e => setCredentials({...credentials, url: e.target.value})}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Username</label>
              <input 
                type="text" 
                value={credentials.username}
                onChange={e => setCredentials({...credentials, username: e.target.value})}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
              <input 
                type="password" 
                value={credentials.password}
                onChange={e => setCredentials({...credentials, password: e.target.value})}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-md transition-colors flex justify-center items-center gap-2 mt-4"
            >
              {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {loading ? 'Authenticating...' : 'Generate Playlist URL'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <Check className="text-green-500 w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Playlist Generated</h1>
        </div>

        <p className="text-neutral-400 text-sm mb-6">
          Your credentials have been verified. Copy the M3U Link below and paste it into any custom IPTV Player (VLC, Tivimate, Smarters, etc). 
        </p>

        <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-neutral-300 mb-2">Your Indian Channels Playlist URL</label>
             <div className="flex gap-2">
               <div className="relative flex-1">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Link className="h-4 w-4 text-neutral-500" />
                 </div>
                 <input
                   type="text"
                   readOnly
                   value={playlistUrl}
                   className="w-full bg-neutral-950 border border-neutral-800 rounded-md py-2.5 pl-9 pr-3 text-white text-sm focus:outline-none"
                 />
               </div>
               <button
                 onClick={copyToClipboard}
                 className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium"
               >
                 {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                 {copied ? 'Copied!' : 'Copy'}
               </button>
             </div>
           </div>

           <div className="pt-6 mt-6 border-t border-neutral-800 flex flex-col gap-3">
             <a 
               href={playlistUrl}
               download="indian_channels.m3u"
               className="w-full bg-neutral-800 hover:bg-neutral-700 text-white rounded-md py-2.5 px-4 text-sm font-medium flex justify-center items-center gap-2 transition"
             >
               <Download className="w-4 h-4" />
               Download .m3u File
             </a>
             
             <button
               onClick={() => setIsConnected(false)}
               className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-md py-2.5 px-4 text-sm font-medium flex justify-center items-center gap-2 transition"
             >
               <LogOut className="w-4 h-4" />
               Log Out
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
