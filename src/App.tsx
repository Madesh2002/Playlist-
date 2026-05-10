import React, { useState, useEffect } from 'react';
import { Tv, Download, Link, Copy, Check } from 'lucide-react';

export default function App() {
  const [playlistUrl, setPlaylistUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const host = window.location.origin;
    setPlaylistUrl(`${host}/api/playlist.m3u`);
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(playlistUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <Tv className="text-indigo-500 w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Indian Channels Playlist</h1>
        </div>

        <p className="text-neutral-400 text-sm mb-6">
          Your custom M3U playlist link containing only the Indian channels is ready. Copy the link below and paste it into any custom IPTV Player (VLC, Tivimate, Smarters, etc). 
        </p>

        <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-neutral-300 mb-2">Playlist URL</label>
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
           </div>
        </div>
      </div>
    </div>
  );
}
