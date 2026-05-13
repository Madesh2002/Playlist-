import React, { useState, useEffect } from 'react';
import { Tv, Download, Link as LinkIcon, Copy, Check, Send, Youtube } from 'lucide-react';
import { motion } from 'motion/react';

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
    <div className="relative min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* Background Animated Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            x: [0, 150, -50, 0], 
            y: [0, -100, 50, 0],
            scale: [1, 1.2, 0.8, 1] 
          }}
          transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
          className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] opacity-70"
        />
        <motion.div 
          animate={{ 
            x: [0, -150, 100, 0], 
            y: [0, 150, -50, 0],
            scale: [1, 0.9, 1.1, 1] 
          }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[100px] opacity-70"
        />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-md w-full bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl z-10"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Tv className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">T-PLAY</h1>
        </div>

        <p className="text-neutral-300 text-sm mb-6 leading-relaxed">
          Your custom Indian M3U playlist is ready. Copy the link below and paste it into any IPTV Player like VLC or Tivimate. 
        </p>

        <div className="space-y-5">
           <div>
             <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-2">Playlist URL</label>
             <div className="flex gap-2">
               <div className="relative flex-1">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <LinkIcon className="h-4 w-4 text-neutral-500" />
                 </div>
                 <input
                   type="text"
                   readOnly
                   value={playlistUrl}
                   className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                 />
               </div>
               <button
                 onClick={copyToClipboard}
                 className="shrink-0 bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold"
               >
                 {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                 {copied ? 'Copied' : 'Copy'}
               </button>
             </div>
           </div>

           <div className="pt-2">
             <a 
               href={playlistUrl}
               download="indian_channels.m3u"
               className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-white rounded-xl py-3 px-4 text-sm font-medium flex justify-center items-center gap-2 transition"
             >
               <Download className="w-4 h-4" />
               Download .m3u
             </a>
           </div>

           <div className="pt-6 mt-6 border-t border-white/10 flex flex-col gap-3">
             <a
               href="https://t.me/+4Cv_8nvY9hhhMzM9"
               target="_blank"
               rel="noopener noreferrer"
               className="group w-full relative overflow-hidden rounded-xl p-[1px] transition-all hover:scale-[1.02] active:scale-[0.98]"
             >
               <span className="absolute inset-0 bg-gradient-to-r from-[#0088cc] to-[#00aaff] opacity-70 group-hover:opacity-100 transition-opacity" />
               <div className="relative flex items-center justify-center gap-2 bg-neutral-900 px-4 py-3 rounded-[11px] text-sm font-medium text-white transition-colors group-hover:bg-neutral-900/50">
                 <Send className="w-4 h-4 text-[#00aaff] group-hover:text-white transition-colors" />
                 Join Telegram Group
               </div>
             </a>

             <a
               href="https://youtube.com/@servertvhub?si=tN69DoLJgjKIoJri"
               target="_blank"
               rel="noopener noreferrer"
               className="group w-full relative overflow-hidden rounded-xl p-[1px] transition-all hover:scale-[1.02] active:scale-[0.98]"
             >
               <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 opacity-70 group-hover:opacity-100 transition-opacity" />
               <div className="relative flex items-center justify-center gap-2 bg-neutral-900 px-4 py-3 rounded-[11px] text-sm font-medium text-white transition-colors group-hover:bg-neutral-900/50">
                 <Youtube className="w-4 h-4 text-red-500 group-hover:text-white transition-colors" />
                 Subscribe on YouTube
               </div>
             </a>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
