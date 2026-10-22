import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, 
  Video, 
  Flame, 
  CameraOff, 
  ShieldCheck, 
  Cpu, 
  ServerOff, 
  Paperclip, 
  Smile, 
  Send, 
  Mic, 
  Square, 
  Settings, 
  LogOut, 
  Check, 
  CheckCheck, 
  Lock, 
  EyeOff, 
  Image as ImageIcon, 
  FileText, 
  Download, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  MoreVertical,
  X
} from 'lucide-react';
import { AuthUser, PartnerUser, ChatMessage } from '../types';

interface WhatsAppChatProps {
  currentUser: AuthUser;
  partner: PartnerUser;
  isPeerConnected: boolean;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendFile: (file: File) => void;
  onSendAudioNote: (audioBlob: Blob, duration: number) => void;
  onStartCall: (type: 'video' | 'audio') => void;
  disappearingTimer: number; // 0 for off, else seconds
  onSetDisappearingTimer: (seconds: number) => void;
  isWindowBlurred: boolean;
  onOpenSettings: () => void;
  onOpenTechModal: () => void;
  onOpenAuditModal: () => void;
  onOpenSafetyModal: () => void;
  onLogout: () => void;
  isBangla?: boolean;
}

export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  currentUser,
  partner,
  isPeerConnected,
  messages,
  onSendMessage,
  onSendFile,
  onSendAudioNote,
  onStartCall,
  disappearingTimer,
  onSetDisappearingTimer,
  isWindowBlurred,
  onOpenSettings,
  onOpenTechModal,
  onOpenAuditModal,
  onOpenSafetyModal,
  onLogout,
  isBangla = true,
}) => {
  // Mobile responsive view switch: 'chat' or 'sidebar'
  const [mobileTab, setMobileTab] = useState<'chat' | 'sidebar'>('chat');
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Time-tick to update disappearing message countdowns every second
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recordStartRef = useRef<number>(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mobileTab]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert(isBangla ? 'সর্বোচ্চ ২০ মেগাবাইট ফাইল পাঠানো যাবে।' : 'Max file size is 20MB.');
        return;
      }
      onSendFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Voice note recording
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(isBangla ? 'আপনার ডিভাইসে অডিও রেকর্ডিং সাপোর্ট নেই।' : 'Audio recording not supported on this device.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const duration = Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000));
        onSendAudioNote(audioBlob, duration);
        stream.getTracks().forEach(t => t.stop());
      };

      recordStartRef.current = Date.now();
      setRecordSeconds(0);
      mediaRecorder.start();
      setIsRecording(true);

      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone access failed:', err);
      if (err.name === 'NotFoundError' || err.message?.includes('device not found')) {
        alert(isBangla ? 'কোনো মাইক্রোফোন ডিভাইস পাওয়া যায়নি। অনুগ্রহ করে একটি মাইক্রোফোন যুক্ত করুন।' : 'Microphone device not found. Please connect a microphone.');
      } else if (err.name === 'NotAllowedError') {
        alert(isBangla ? 'মাইক্রোফোনের অনুমতি দেওয়া হয়নি। অনুগ্রহ করে ব্রাউজারে অনুমতি দিন।' : 'Microphone permission denied.');
      } else {
        alert(isBangla ? 'ভয়েস নোটের জন্য মাইক্রোফোন পারমিশন প্রয়োজন।' : 'Microphone permission required.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const disappearingOptions = [
    { label: isBangla ? 'বন্ধ (Off)' : 'Off', value: 0 },
    { label: isBangla ? '৫ সেকেন্ড' : '5 seconds', value: 5 },
    { label: isBangla ? '১০ সেকেন্ড' : '10 seconds', value: 10 },
    { label: isBangla ? '৩০ সেকেন্ড' : '30 seconds', value: 30 },
    { label: isBangla ? '১ মিনিট' : '1 minute', value: 60 },
    { label: isBangla ? '৫ মিনিট' : '5 minutes', value: 300 },
    { label: isBangla ? '২৪ ঘণ্টা' : '24 hours', value: 86400 },
  ];

  const quickEmojis = ['🔒', '❤️', '👍', '🔥', '😊', '🛡️', '⚡', '🎉'];
  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex h-screen h-[100dvh] w-screen bg-[#0a0e17] text-slate-100 overflow-hidden font-sans select-none relative">
      
      {/* ======================================================== */}
      {/* 1. SIDEBAR (CHATS LIST) - Native mobile navigation */}
      {/* ======================================================== */}
      <div className={`
        ${mobileTab === 'sidebar' ? 'flex' : 'hidden md:flex'}
        w-full md:w-80 lg:w-96 border-r border-slate-800/80 bg-slate-950 flex-col shrink-0 select-none h-full z-10
      `}>
        
        {/* Sidebar Header */}
        <div className="p-4 safe-top bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${currentUser.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
              {currentUser.name.slice(0, 1)}
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                  {currentUser.id}
                </span>
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{isBangla ? 'অ্যাকাউন্ট সক্রিয়' : 'Account Active'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSettings}
              title={isBangla ? 'সেটিংস' : 'Settings'}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              title={isBangla ? 'লগআউট' : 'Log Out'}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 active:scale-95 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security Info Card */}
        <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <CameraOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{isBangla ? 'অ্যান্টি-স্ক্রিনশট গার্ড সক্রিয়' : 'Anti-Screenshot Active'}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 shrink-0">
            <Lock className="w-3 h-3" />
            <span>E2EE</span>
          </div>
        </div>

        {/* Contact Item */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1 tracking-wider">
            {isBangla ? 'কথোপকথন (Chats)' : 'Conversations'}
          </div>

          <div 
            onClick={() => setMobileTab('chat')}
            className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-cyan-600/30 active:scale-[0.98] transition cursor-pointer flex items-center gap-3 shadow-sm"
          >
            <div className="relative shrink-0">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${partner.avatarColor} flex items-center justify-center text-white font-bold text-base shadow-lg`}>
                {partner.name.slice(0, 1)}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                partner.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
              }`}></span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white truncate">{partner.name}</span>
                {lastMessage && (
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                    {new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-400 truncate pr-2">
                  {lastMessage 
                    ? (lastMessage.type === 'file' ? '📷 Photo / File' : (lastMessage.type === 'audio-note' ? '🎤 Voice Note' : lastMessage.content))
                    : (isBangla ? 'চ্যাট করতে ট্যাপ করুন' : 'Tap to start chat')}
                </p>
                {disappearingTimer > 0 && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-mono shrink-0">
                    <Flame className="w-3 h-3 fill-amber-500/30" />
                    <span>{disappearingTimer}s</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                  partner.isOnline ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${partner.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                  <span>{partner.isOnline ? (isBangla ? 'অনলাইন' : 'Online') : (isBangla ? 'অফলাইন' : 'Offline')}</span>
                </span>
                <span className="text-[10px] text-slate-600">•</span>
                <span className="text-[10px] text-cyan-400 font-mono">ID: {partner.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Mobile Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-around text-xs text-slate-400 safe-bottom">
          <button
            onClick={onOpenTechModal}
            className="flex items-center gap-1.5 p-2 hover:text-cyan-400 active:scale-95 transition"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isBangla ? 'আর্কিটেকচার' : 'Architecture'}</span>
          </button>
          <span className="text-slate-800">|</span>
          <button
            onClick={onOpenAuditModal}
            className="flex items-center gap-1.5 p-2 hover:text-emerald-400 active:scale-95 transition"
          >
            <ServerOff className="w-3.5 h-3.5" />
            <span>{isBangla ? 'জিরো স্টোরেজ' : '0-Storage'}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CHAT CONVERSATION AREA */}
      {/* ======================================================== */}
      <div className={`
        ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}
        flex-1 flex-col h-full bg-[#0d121f] relative overflow-hidden
      `}>
        
        {/* Anti-Screenshot Privacy Shield Overlay */}
        {isWindowBlurred && (
          <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 shadow-2xl">
              <CameraOff className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">
              {isBangla ? '🔒 প্রাইভেসি শিল্ড সক্রিয়' : '🔒 Privacy Shield Active'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {isBangla
                ? 'স্ক্রিনশট বা স্নাইপিং টুল ঠেকাতে চ্যাটের বিষয়বস্তু আড়াল করা হয়েছে। স্ক্রিনে ট্যাপ করে স্বাভাবিক অবস্থায় ফিরুন।'
                : 'Content is hidden to block screenshot tools and screen capture. Tap back to resume.'}
            </p>
            <button className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-xs shadow-lg active:scale-95 transition cursor-pointer">
              {isBangla ? 'চ্যাট আনব্লার করুন' : 'Unblur Chat'}
            </button>
          </div>
        )}

        {/* Chat Header (Responsive for all phones) */}
        <div className="h-16 px-3 sm:px-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between z-20 shrink-0 safe-top">
          
          {/* Back button on mobile + Partner info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileTab('sidebar')}
              title={isBangla ? 'তালিকায় ফিরুন' : 'Back to chats'}
              className="md:hidden p-2 -ml-1 text-slate-400 hover:text-white active:scale-95 transition cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="relative shrink-0">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr ${partner.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                {partner.name.slice(0, 1)}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                partner.isOnline ? 'bg-emerald-400' : 'bg-slate-600'
              }`}></span>
            </div>

            <div className="min-w-0">
              <div className="font-bold text-sm text-white flex items-center gap-1.5 truncate">
                <span className="truncate">{partner.name}</span>
              </div>
              <div className="text-[11px] flex items-center gap-1.5">
                <span className={`font-medium ${partner.isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {partner.isOnline ? (isBangla ? 'অনলাইন' : 'Online') : (isBangla ? 'অফলাইন' : 'Offline')}
                </span>
                {isPeerConnected && (
                  <span className="text-[9px] text-cyan-400 bg-cyan-950 px-1 py-0.2 rounded font-mono">
                    P2P
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Header Controls (Call & Disappearing) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Audio Call Button */}
            <button
              onClick={() => onStartCall('audio')}
              title={isBangla ? 'অডিও কল' : 'Audio Call'}
              className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 active:scale-95 transition cursor-pointer"
            >
              <Phone className="w-4 h-4" />
            </button>

            {/* Video Call Button */}
            <button
              onClick={() => onStartCall('video')}
              title={isBangla ? 'ভিডিও কল' : 'Video Call'}
              className="p-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 active:scale-95 transition cursor-pointer"
            >
              <Video className="w-4 h-4" />
            </button>

            {/* Disappearing Timer Button */}
            <div className="relative">
              <button
                onClick={() => setShowTimerMenu(!showTimerMenu)}
                title={isBangla ? 'ডিজঅ্যাপিয়ারিং মেসেজ' : 'Disappearing Messages'}
                className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition active:scale-95 cursor-pointer ${
                  disappearingTimer > 0
                    ? 'bg-amber-950/40 border-amber-600/60 text-amber-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Flame className={`w-4 h-4 ${disappearingTimer > 0 ? 'text-amber-400 fill-amber-400/40' : ''}`} />
                <span className="hidden sm:inline">
                  {disappearingTimer > 0 ? `${disappearingTimer}s` : (isBangla ? 'টাইমার' : 'Timer')}
                </span>
              </button>

              {/* Timer Dropdown Menu */}
              {showTimerMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-1.5 z-30 animate-fade-in text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    {isBangla ? 'মেসেজ মুছে যাওয়ার সময়:' : 'Disappearing Timer:'}
                  </div>
                  {disappearingOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onSetDisappearingTimer(opt.value);
                        setShowTimerMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 active:bg-slate-700 transition ${
                        disappearingTimer === opt.value ? 'text-amber-400 font-bold bg-amber-950/20' : 'text-slate-200'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {disappearingTimer === opt.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile More Options Button */}
            <div className="relative">
              <button
                onClick={() => setShowMobileMoreMenu(!showMobileMoreMenu)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Mobile Overflow Menu */}
              {showMobileMoreMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-30 animate-fade-in text-xs space-y-1">
                  <button
                    onClick={() => {
                      onOpenSafetyModal();
                      setShowMobileMoreMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                  >
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>{isBangla ? 'সেফটি নাম্বার ভেরিফাই' : 'Verify Safety Fingerprint'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenTechModal();
                      setShowMobileMoreMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                  >
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span>{isBangla ? 'WebRTC আর্কিটেকচার' : 'WebRTC Tech Architecture'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenAuditModal();
                      setShowMobileMoreMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                  >
                    <ServerOff className="w-4 h-4 text-emerald-400" />
                    <span>{isBangla ? 'জিরো স্টোরেজ অডিট' : '0-Storage Audit'}</span>
                  </button>

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    onClick={() => {
                      onOpenSettings();
                      setShowMobileMoreMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>{isBangla ? 'অ্যাকাউন্ট সেটিংস' : 'Settings'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onLogout();
                      setShowMobileMoreMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-rose-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isBangla ? 'লগআউট' : 'Log Out'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Feed (Scrollable, touch-optimized) */}
        <div 
          className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Welcome Banner */}
          <div className="max-w-md mx-auto my-2 p-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl text-center text-xs text-slate-400 flex flex-col items-center gap-1 shadow-sm">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isBangla ? 'এন্ড-টু-এন্ড এনক্রিপ্টেড ও সরাসরি ব্রাউজার মেমোরি' : '100% End-to-End Encrypted'}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isBangla
                ? 'আপনার মেসেজ ও কল কখনো সার্ভারে থাকে না। স্ক্রিনশট নেওয়ার চেষ্টা করলে অ্যালার্ট আসবে।'
                : 'No messages stored on servers. Screenshot attempts trigger real-time alerts.'}
            </p>
          </div>

          {/* Messages */}
          {messages.map((msg) => {
            const isSelf = msg.isSelf;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let remainingSec: number | null = null;
            if (msg.expiresAt) {
              const diff = Math.max(0, Math.ceil((msg.expiresAt - Date.now()) / 1000));
              remainingSec = diff;
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-md rounded-2xl p-3 sm:p-3.5 shadow-md relative group ${
                    isSelf
                      ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-800/95 text-slate-100 rounded-tl-none border border-slate-700/70'
                  }`}
                >
                  {/* Disappearing Flame Badge */}
                  {remainingSec !== null && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-200 bg-black/40 px-2 py-0.5 rounded-full mb-1 border border-amber-400/30">
                      <Flame className="w-3 h-3 text-amber-300 fill-amber-300/40 animate-bounce" />
                      <span>{remainingSec}s {isBangla ? 'বাকি' : 'left'}</span>
                    </div>
                  )}

                  {/* Text Message */}
                  {msg.type === 'text' && (
                    <div className="text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                      {msg.content}
                    </div>
                  )}

                  {/* Photo / File Attachment */}
                  {msg.type === 'file' && (
                    <div className="space-y-2">
                      {msg.fileMime?.startsWith('image/') && msg.fileDataUrl ? (
                        <div className="rounded-xl overflow-hidden max-h-64 sm:max-h-72 bg-black/50 border border-white/10">
                          <img
                            src={msg.fileDataUrl}
                            alt={msg.fileName || 'Photo'}
                            className="w-full h-full object-contain pointer-events-none"
                            onContextMenu={(e) => e.preventDefault()}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-2 bg-black/30 rounded-xl">
                          <FileText className="w-7 h-7 text-cyan-300 shrink-0" />
                          <div className="overflow-hidden">
                            <div className="font-semibold text-xs truncate">{msg.fileName}</div>
                            <div className="text-[10px] opacity-75">
                              {msg.fileSize ? `${Math.round(msg.fileSize / 1024)} KB` : 'P2P File'}
                            </div>
                          </div>
                        </div>
                      )}

                      {msg.fileDataUrl && (
                        <a
                          href={msg.fileDataUrl}
                          download={msg.fileName || 'download'}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg bg-black/30 hover:bg-black/50 active:scale-95 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isBangla ? 'ডাউনলোড' : 'Download'}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Audio Voice Note */}
                  {msg.type === 'audio-note' && msg.fileDataUrl && (
                    <div className="flex items-center gap-2 py-1">
                      <audio controls src={msg.fileDataUrl} className="h-8 max-w-[200px] sm:max-w-[240px]" />
                    </div>
                  )}

                  {/* Timestamp & Read Receipt */}
                  <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] opacity-80 font-mono">
                    <span>{timeStr}</span>
                    <Lock className="w-2.5 h-2.5" />
                    {isSelf && (
                      <span>
                        {msg.status === 'delivered' ? (
                          <CheckCheck className="w-3 h-3 text-cyan-200 inline" />
                        ) : (
                          <Check className="w-3 h-3 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar (Mobile touch-optimized with safe-bottom) */}
        <div className="p-2 sm:p-3 bg-slate-900 border-t border-slate-800 shrink-0 safe-bottom">
          
          {/* Quick Emojis */}
          {showEmojiPicker && (
            <div className="mb-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-1.5 overflow-x-auto">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputText(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-lg p-2 hover:bg-slate-800 active:scale-95 rounded-xl transition cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {isRecording ? (
            <div className="flex items-center justify-between p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl animate-pulse">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-semibold text-rose-300">
                  {isBangla ? 'ভয়েস রেকর্ড হচ্ছে...' : 'Recording...'}
                </span>
                <span className="font-mono text-xs font-bold text-white">
                  {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecording}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white active:scale-95 rounded-lg transition cursor-pointer"
                >
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={stopRecording}
                  className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold transition flex items-center gap-1 text-xs shadow-lg cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{isBangla ? 'পাঠান' : 'Send'}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title={isBangla ? 'ছবি বা ফাইল পাঠান' : 'Send Photo or File'}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 active:scale-95 transition cursor-pointer shrink-0"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 active:scale-95 transition hidden sm:block cursor-pointer shrink-0"
              >
                <Smile className="w-5 h-5" />
              </button>

              <input
                type="text"
                placeholder={
                  disappearingTimer > 0
                    ? (isBangla ? `মেসেজ (${disappearingTimer}s এ মুছবে)...` : `Message (${disappearingTimer}s self-destruct)...`)
                    : (isBangla ? 'এনক্রিপ্টেড মেসেজ...' : 'Type a message...')
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 sm:py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />

              <button
                type="button"
                onClick={startRecording}
                title={isBangla ? 'ভয়েস রেকর্ড' : 'Voice Note'}
                className="p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 active:scale-95 transition cursor-pointer shrink-0"
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-950/50 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
