import React, { useEffect, useRef, useState } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  Phone, 
  ShieldCheck, 
  Maximize2,
  Minimize2,
  Volume2
} from 'lucide-react';
import { CallState } from '../types';

interface CallOverlayProps {
  callState: CallState;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  remotePeerName?: string;
  onAcceptCall: (type: 'video' | 'audio') => void;
  onRejectCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  isBangla?: boolean;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
  callState,
  remoteStream,
  localStream,
  remotePeerName = 'Peer',
  onAcceptCall,
  onRejectCall,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  isBangla = true,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [callDuration, setCallDuration] = useState('00:00');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync streams with video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState.isActive]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState.isActive]);

  // Duration timer
  useEffect(() => {
    if (!callState.isActive || !callState.startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (callState.startTime || Date.now())) / 1000);
      const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const secs = (elapsed % 60).toString().padStart(2, '0');
      setCallDuration(`${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState.isActive, callState.startTime]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 1. Incoming Call Screen
  if (callState.isIncoming && !callState.isActive) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
          {/* Pulsing ring indicator */}
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping opacity-75"></div>
            <div className="absolute inset-2 rounded-full bg-cyan-500/30 animate-pulse"></div>
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-lg">
              {callState.type === 'video' ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-1">{remotePeerName}</h3>
          <p className="text-xs text-cyan-400 font-medium mb-6">
            {callState.type === 'video' 
              ? (isBangla ? 'ইনকামিং ভিডিও কল...' : 'Incoming Video Call...')
              : (isBangla ? 'ইনকামিং অডিও কল...' : 'Incoming Audio Call...')}
          </p>

          <div className="flex items-center justify-center gap-2 mb-8 text-[11px] text-slate-400 bg-slate-950/60 py-2 px-3 rounded-full border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isBangla ? 'পিয়ার-টু-পিয়ার সরাসরি এনক্রিপ্টেড' : 'P2P Direct SRTP Encrypted'}</span>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={onRejectCall}
              className="flex flex-col items-center gap-2 text-xs font-semibold text-rose-300 hover:text-rose-200 transition group"
            >
              <div className="w-14 h-14 rounded-full bg-rose-600 group-hover:bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-900/40">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span>{isBangla ? 'বাতিল' : 'Decline'}</span>
            </button>

            <button
              onClick={() => onAcceptCall(callState.type)}
              className="flex flex-col items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition group"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-600 group-hover:bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 animate-bounce">
                <Phone className="w-6 h-6" />
              </div>
              <span>{isBangla ? 'উত্তর দিন' : 'Accept'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Outgoing Ringing Screen
  if (callState.isOutgoing && !callState.isActive) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping"></div>
            <div className="relative w-16 h-16 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg">
              {callState.type === 'video' ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-1">{remotePeerName}</h3>
          <p className="text-xs text-cyan-400 font-medium mb-6">
            {isBangla ? 'রিং হচ্ছে... অপরজন যুক্ত হওয়ার অপেক্ষায়' : 'Calling... Waiting for answer'}
          </p>

          <button
            onClick={onEndCall}
            className="w-14 h-14 mx-auto rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-lg transition"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Active Call Screen
  if (callState.isActive) {
    const isVideoCall = callState.type === 'video';

    return (
      <div 
        ref={containerRef}
        className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden"
      >
        {/* Top Info Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 pointer-events-auto">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <div className="text-sm font-bold text-white leading-none">{remotePeerName}</div>
              <div className="text-[11px] font-mono text-cyan-400 mt-1">{callDuration}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>P2P Direct SRTP</span>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/10 transition text-slate-300"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center bg-slate-950">
          {isVideoCall ? (
            <>
              {/* Remote Video (Full Screen, object-cover on mobile for native phone look) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover sm:object-contain bg-black"
              />

              {/* Local Video (Floating PIP positioned for mobile and desktop) */}
              <div className="absolute bottom-24 right-4 sm:right-6 w-28 h-40 sm:w-44 sm:h-60 rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-900 z-10 transition">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${callState.isVideoOff ? 'hidden' : ''}`}
                />
                {callState.isVideoOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs gap-1">
                    <VideoOff className="w-6 h-6 text-slate-500" />
                    <span className="text-[10px]">{isBangla ? 'ক্যামেরা বন্ধ' : 'Camera Off'}</span>
                  </div>
                )}
                <div className="absolute bottom-1.5 left-2 text-[9px] bg-black/60 px-1.5 py-0.5 rounded text-slate-300">
                  {isBangla ? 'আপনি' : 'You'}
                </div>
              </div>
            </>
          ) : (
            // Audio-Only Call Visualizer
            <div className="flex flex-col items-center justify-center space-y-6 p-4">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-radar"></div>
                <div className="absolute inset-3 rounded-full bg-cyan-500/30 animate-pulse"></div>
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl">
                  <Volume2 className="w-9 h-9" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold">{remotePeerName}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isBangla ? 'অডিও কল চলছে • Opus কোডেক P2P' : 'Voice Call in progress • Opus P2P'}
                </p>
              </div>
              {/* Invisible audio element for playback */}
              <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
              <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
            </div>
          )}
        </div>

        {/* Bottom Control Bar with Safe Bottom */}
        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-3 px-4 safe-bottom">
          <div className="bg-slate-900/95 backdrop-blur-lg border border-slate-700/80 p-2.5 sm:p-3 rounded-3xl shadow-2xl flex items-center gap-2.5 sm:gap-3">
            {/* Mic Toggle */}
            <button
              onClick={onToggleMute}
              className={`p-3 sm:p-3.5 rounded-2xl active:scale-95 transition cursor-pointer ${
                callState.isMuted
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:bg-rose-600/40'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
              title={callState.isMuted ? 'Unmute' : 'Mute'}
            >
              {callState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Video Toggle */}
            {isVideoCall && (
              <button
                onClick={onToggleVideo}
                className={`p-3.5 rounded-2xl transition ${
                  callState.isVideoOff
                    ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:bg-rose-600/40'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
                title={callState.isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
              >
                {callState.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            )}

            {/* Screen Share Toggle */}
            {isVideoCall && (
              <button
                onClick={onToggleScreenShare}
                className={`p-3.5 rounded-2xl transition ${
                  callState.isScreenSharing
                    ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title={isBangla ? 'স্ক্রিন শেয়ার' : 'Screen Share'}
              >
                <Monitor className="w-5 h-5" />
              </button>
            )}

            {/* End Call Button */}
            <button
              onClick={onEndCall}
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center gap-2 shadow-lg shadow-rose-950/60"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="text-xs">{isBangla ? 'কল শেষ করুন' : 'End Call'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
