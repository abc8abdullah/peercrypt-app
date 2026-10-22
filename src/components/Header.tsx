import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Phone, 
  Video, 
  Cpu, 
  ServerOff, 
  Copy, 
  Check, 
  LogOut, 
  Lock, 
  Globe,
  Radio,
  Users
} from 'lucide-react';
import { Peer, WebRTCConnectionStats } from '../types';

interface HeaderProps {
  roomId: string;
  userName: string;
  remotePeer: Peer | null;
  isPeerConnected: boolean;
  stats: WebRTCConnectionStats | null;
  isVerified: boolean;
  onStartCall: (type: 'video' | 'audio') => void;
  onLeaveRoom: () => void;
  onOpenSafetyModal: () => void;
  onOpenTechModal: () => void;
  onOpenAuditModal: () => void;
  isBangla: boolean;
  onToggleLanguage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  userName,
  remotePeer,
  isPeerConnected,
  stats,
  isVerified,
  onStartCall,
  onLeaveRoom,
  onOpenSafetyModal,
  onOpenTechModal,
  onOpenAuditModal,
  isBangla,
  onToggleLanguage,
}) => {
  const [copied, setCopied] = useState(false);

  const copyRoomInvite = () => {
    const inviteUrl = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-30 select-none">
      
      {/* Left: Branding & Room Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Lock className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-white text-sm">PeerCrypt</span>
            <span className="text-cyan-400 font-bold text-xs ml-1">E2EE</span>
          </div>
        </div>

        {/* Room Code Badge */}
        <button
          onClick={copyRoomInvite}
          title={isBangla ? 'রুমের ইনভাইট লিংক কপি করুন' : 'Copy Invite Link'}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 hover:border-cyan-500/50 transition"
        >
          <span className="text-[10px] text-slate-500 uppercase">{isBangla ? 'রুম' : 'Room'}:</span>
          <span className="font-bold tracking-wider">{roomId}</span>
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
        </button>

        {/* Peer Presence & Latency */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
          <span className={`w-2 h-2 rounded-full ${isPeerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span>{isPeerConnected ? (remotePeer?.name || 'Peer 2') : (isBangla ? 'অপেক্ষমাণ (১/২)' : 'Waiting (1/2)')}</span>
          {isPeerConnected && stats?.rttMs !== null && (
            <span className="text-[10px] font-mono text-cyan-400 ml-1">({stats?.rttMs}ms)</span>
          )}
        </div>
      </div>

      {/* Right: Actions, Calls, Security, & Language */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        
        {/* Call Buttons (Only when connected to peer) */}
        {isPeerConnected && (
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onStartCall('audio')}
              title={isBangla ? 'অডিও কল' : 'Audio Call'}
              className="p-2 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 hover:text-emerald-200 transition"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => onStartCall('video')}
              title={isBangla ? 'ভিডিও কল' : 'Video Call'}
              className="p-2 rounded-lg bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 hover:text-cyan-200 transition"
            >
              <Video className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Safety Number Modal Button */}
        <button
          onClick={onOpenSafetyModal}
          title={isBangla ? 'সেফটি নাম্বার যাচাই' : 'Verify Safety Number'}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
            isVerified
              ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${isVerified ? 'text-emerald-400' : 'text-cyan-400'}`} />
          <span className="hidden lg:inline">{isVerified ? (isBangla ? 'যাচাইকৃত' : 'Verified') : (isBangla ? 'ভেরিফাই' : 'Verify')}</span>
        </button>

        {/* Tech Architecture Modal Button */}
        <button
          onClick={onOpenTechModal}
          title={isBangla ? 'WebRTC স্থাপত্য ও বিবরণ' : 'WebRTC Technical Architecture'}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition"
        >
          <Cpu className="w-4 h-4" />
        </button>

        {/* Server Zero-Storage Audit Modal */}
        <button
          onClick={onOpenAuditModal}
          title={isBangla ? 'জিরো স্টোরেজ অডিট' : 'Zero Storage Audit'}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition hidden sm:block"
        >
          <ServerOff className="w-4 h-4" />
        </button>

        {/* Language Toggle */}
        <button
          onClick={onToggleLanguage}
          title="Toggle Language / ভাষা পরিবর্তন"
          className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition"
        >
          {isBangla ? 'EN' : 'বাং'}
        </button>

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          title={isBangla ? 'রুম থেকে প্রস্থান' : 'Leave Room'}
          className="p-2 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
