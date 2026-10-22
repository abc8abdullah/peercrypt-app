import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  ServerOff, 
  Sparkles, 
  Cpu, 
  Copy, 
  Check, 
  KeyRound, 
  Info,
  Users
} from 'lucide-react';

interface RoomJoinProps {
  onJoin: (roomId: string, userName: string, roomSecret: string) => void;
  onOpenTechModal: () => void;
  onOpenAuditModal: () => void;
  isBangla?: boolean;
}

export const RoomJoin: React.FC<RoomJoinProps> = ({
  onJoin,
  onOpenTechModal,
  onOpenAuditModal,
  isBangla = true,
}) => {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomSecret, setRoomSecret] = useState('');
  const [useCustomSecret, setUseCustomSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check URL query param ?room=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam.toUpperCase().trim());
    }
  }, []);

  const generateRandomRoomId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomId(code);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    let targetRoom = roomId.trim().toUpperCase();
    if (!targetRoom) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      for (let i = 0; i < 6; i++) {
        targetRoom += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setRoomId(targetRoom);
    }

    const effectiveSecret = useCustomSecret && roomSecret.trim() ? roomSecret.trim() : `SECURE_SALT_${targetRoom}`;
    onJoin(targetRoom, userName.trim(), effectiveSecret);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-white">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-slow"></div>

      <div className="w-full max-w-xl space-y-6">
        
        {/* Top Branding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>WebRTC P2P • Zero Server Storage</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span>PeerCrypt</span>
            <span className="text-cyan-400">E2EE</span>
          </h1>

          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {isBangla
              ? 'শুধুমাত্র দুইজন ইউজারের জন্য ১০০% সার্ভারলেস ও সরাসরি ব্রাউজার-টু-ব্রাউজার মেসেজিং, অডিও ও ভিডিও কলিং।'
              : 'End-to-End encrypted 2-peer messaging, audio & video calling powered by WebRTC with zero server storage.'}
          </p>
        </div>

        {/* Zero Storage & P2P Trust Banner */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur">
            <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <div className="font-bold text-white text-[12px]">{isBangla ? 'সর্বোচ্চ ২ জন' : 'Max 2 Peers'}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{isBangla ? '৩য় ইউজার ব্লকড' : 'Strict 1:1 Room'}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur">
            <ServerOff className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="font-bold text-white text-[12px]">{isBangla ? '০ বাইট স্টোরেজ' : 'Zero Storage'}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{isBangla ? 'কোনো ডাটাবেস নেই' : '0 DB & 0 Disk Log'}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur">
            <Lock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <div className="font-bold text-white text-[12px]">{isBangla ? 'DTLS & AES-256' : 'Double E2EE'}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{isBangla ? 'নিখুঁত গোপনীয়তা' : 'Hardware crypto'}</div>
          </div>
        </div>

        {/* Join / Create Form Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleStart} className="space-y-5">
            {/* User Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                {isBangla ? 'আপনার নাম / ছদ্মনাম লিখুন:' : 'Your Display Name:'}
              </label>
              <input
                type="text"
                required
                placeholder={isBangla ? 'যেমন: রাফাত বা নির্ঝর' : 'e.g. Alice'}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition text-sm"
              />
            </div>

            {/* Room ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  {isBangla ? 'রুম কোড (Room ID):' : 'Room ID:'}
                </label>
                <button
                  type="button"
                  onClick={generateRandomRoomId}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  {isBangla ? 'নতুন কোড তৈরি করুন' : 'Generate Random'}
                </button>
              </div>
              <input
                type="text"
                placeholder={isBangla ? 'যেমন: SECURE7 (খালি রাখলে অটো হবে)' : 'e.g. X9K2LM (leave blank to auto-create)'}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white uppercase tracking-wider font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition text-sm font-semibold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {isBangla
                  ? 'উভয় ইউজার একই রুম কোড দিলে সরাসরি WebRTC কানেকশন তৈরি হবে।'
                  : 'Both users enter this exact code to establish direct peer connection.'}
              </p>
            </div>

            {/* Custom Secret Key Accordion */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setUseCustomSecret(!useCustomSecret)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {isBangla 
                    ? (useCustomSecret ? 'কাস্টম পাসফ্রেজ বন্ধ করুন' : '+ অতিরিক্ত সিক্রেট পাসফ্রেজ যুক্ত করুন (ঐচ্ছিক)')
                    : (useCustomSecret ? 'Disable custom passphrase' : '+ Add custom encryption passphrase (optional)')}
                </span>
              </button>

              {useCustomSecret && (
                <div className="mt-2.5 p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-[11px] text-slate-400">
                    {isBangla ? 'উভয় ইউজার একই পাসফ্রেজ ব্যবহার করবেন (PBKDF2 SHA-256):' : 'Shared secret passphrase:'}
                  </label>
                  <input
                    type="password"
                    placeholder="Shared secret password..."
                    value={roomSecret}
                    onChange={(e) => setRoomSecret(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!userName.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              <span>{isBangla ? 'এনক্রিপ্টেড রুমে প্রবেশ করুন' : 'Enter Encrypted Room'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </form>
        </div>

        {/* Footer Technical Exploration Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <button
            onClick={onOpenTechModal}
            className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-400 border border-slate-800 flex items-center gap-2 transition"
          >
            <Cpu className="w-4 h-4" />
            <span>{isBangla ? 'WebRTC প্রযুক্তিগত ডায়াগ্রাম ও ব্যাখ্যা' : 'WebRTC Technical Architecture'}</span>
          </button>

          <button
            onClick={onOpenAuditModal}
            className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-emerald-400 border border-slate-800 flex items-center gap-2 transition"
          >
            <ServerOff className="w-4 h-4" />
            <span>{isBangla ? 'সার্ভার জিরো-স্টোরেজ অডিট' : 'Server Zero-Storage Audit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
