import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Square, 
  Image as ImageIcon, 
  FileText, 
  Download, 
  Lock, 
  Smile, 
  CheckCheck, 
  Check, 
  Trash2,
  Play,
  Pause,
  AlertTriangle,
  Info,
  Copy
} from 'lucide-react';
import { ChatMessage, Peer } from '../types';

interface ChatAreaProps {
  roomId: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendFile: (file: File) => void;
  onSendAudioNote: (audioBlob: Blob, duration: number) => void;
  onClearChat: () => void;
  remotePeer: Peer | null;
  isPeerConnected: boolean;
  isBangla?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  roomId,
  messages,
  onSendMessage,
  onSendFile,
  onSendAudioNote,
  onClearChat,
  remotePeer,
  isPeerConnected,
  isBangla = true,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recordStartTimeRef = useRef<number>(0);

  const getInviteLink = () => `${window.location.origin}?room=${roomId}`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(getInviteLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareInvite = () => {
    const inviteUrl = getInviteLink();
    if (navigator.share) {
      navigator.share({
        title: 'PeerCrypt E2EE Secure Chat',
        text: `আমার সাথে এন্ড-টু-এন্ড এনক্রিপ্টেড WebRTC চ্যাটে যুক্ত হন। রুম কোড: ${roomId}`,
        url: inviteUrl,
      }).catch(() => {});
    } else {
      handleCopyInvite();
    }
  };

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isPeerConnected) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert(isBangla ? 'ফাইলের আকার সর্বোচ্চ ১৫ মেগাবাইট হতে পারে।' : 'Maximum file size is 15MB for direct P2P transfer.');
        return;
      }
      onSendFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const duration = Math.max(1, Math.round((Date.now() - recordStartTimeRef.current) / 1000));
        onSendAudioNote(audioBlob, duration);
        stream.getTracks().forEach(t => t.stop());
      };

      recordStartTimeRef.current = Date.now();
      setRecordingSeconds(0);
      mediaRecorder.start();
      setIsRecording(true);

      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission denied:', err);
      alert(isBangla ? 'ভয়েস রেকর্ড করার জন্য মাইক্রোফোনের অনুমতি প্রয়োজন।' : 'Microphone permission required for voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
  };

  const quickEmojis = ['🔒', '👍', '❤️', '😊', '🔥', '🛡️', '⚡', '🎉'];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      
      {/* Waiting or Connected Banner */}
      {!isPeerConnected ? (
        <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-2.5 text-xs text-amber-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>
              {isBangla
                ? '২য় ইউজারের জন্য অপেক্ষা করা হচ্ছে (ভিন্ন শহর বা নেটওয়ার্ক)...'
                : 'Waiting for Peer 2 (Any city or network)...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyInvite}
              className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 border border-amber-700/60 text-xs font-semibold flex items-center gap-1 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? (isBangla ? 'লিংক কপি হয়েছে!' : 'Copied!') : (isBangla ? 'ইনভাইট লিংক কপি' : 'Copy Invite')}</span>
            </button>
            <button
              onClick={handleShareInvite}
              className="px-2.5 py-1 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold flex items-center gap-1 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isBangla ? 'শেয়ার' : 'Share'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border-b border-slate-800/60 px-4 py-2 text-xs text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              {isBangla 
                ? `সরাসরি P2P কানেক্টেড: ${remotePeer?.name || 'Peer'}`
                : `Direct P2P Connected: ${remotePeer?.name || 'Peer'}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>AES-256-GCM</span>
            </span>
            <button
              onClick={onClearChat}
              title={isBangla ? 'চ্যাট হিস্ট্রি মুছুন' : 'Clear Chat'}
              className="text-slate-400 hover:text-rose-400 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400">
              <Lock className="w-8 h-8 mx-auto" />
            </div>
            
            <div className="max-w-md space-y-1">
              <div className="font-bold text-slate-200 text-base">
                {isBangla ? 'জিরো সার্ভার স্টোরেজ এন্ড-টু-এন্ড এনক্রিপ্টেড চ্যাট' : 'Zero-Storage End-to-End Encrypted Chat'}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isBangla
                  ? 'উভয় ব্রাউজারের মধ্যে সরাসরি WebRTC ডেটা টানেল স্থাপিত হয়। কোনো সার্ভার ডেটাবেস নেই।'
                  : 'Direct socket mesh between both devices. All media and chat stay 100% in local memory.'}
              </p>
            </div>

            {/* Quick 3-Step Cross-City Visual Card */}
            {!isPeerConnected && (
              <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>{isBangla ? 'দুই শহরের দুইজন ব্যবহারকারী যেভাবে যুক্ত হবেন:' : 'How 2 peers in different cities connect:'}</span>
                </div>
                <div className="text-xs text-slate-300 space-y-2 pl-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center text-[10px] shrink-0 font-bold">১</span>
                    <span>{isBangla ? 'আপনি এই রুমে প্রবেশ করেছেন (রুম কোড: ' : 'You joined room: '}<strong className="font-mono text-cyan-300">{roomId}</strong>)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center text-[10px] shrink-0 font-bold">২</span>
                    <span>{isBangla ? 'উপরের "ইনভাইট লিংক কপি" বাটনে চাপ দিয়ে লিংকটি অন্য শহরের বন্ধুকে পাঠান (WhatsApp, SMS, Email)।' : 'Copy and send the invite link or Room ID to your friend in the other city.'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center text-[10px] shrink-0 font-bold">৩</span>
                    <span>{isBangla ? 'বন্ধু লিংকে ক্লিক করলেই উভয় ডিভাইসে সরাসরি অডিও, ভিডিও ও চ্যাট চালু হয়ে যাবে!' : 'Once they open the link, direct P2P mesh activates automatically!'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.isSelf;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="text-[11px] text-slate-400 px-1 font-medium">
                  {isSelf ? (isBangla ? 'আপনি' : 'You') : msg.senderName}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-md rounded-2xl p-3 shadow-md relative group ${
                    isSelf
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60'
                  }`}
                >
                  {/* Text Message */}
                  {msg.type === 'text' && (
                    <div className="text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                      {msg.content}
                    </div>
                  )}

                  {/* File / Image Attachment */}
                  {msg.type === 'file' && (
                    <div className="space-y-2">
                      {msg.fileMime?.startsWith('image/') && msg.fileDataUrl ? (
                        <div className="rounded-xl overflow-hidden max-h-72 bg-black/40">
                          <img
                            src={msg.fileDataUrl}
                            alt={msg.fileName || 'Shared Image'}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-2.5 bg-black/20 rounded-xl">
                          <FileText className="w-8 h-8 text-cyan-300 shrink-0" />
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
                          className="inline-flex items-center gap-1.5 text-xs font-semibold py-1 px-2.5 rounded-lg bg-black/30 hover:bg-black/50 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isBangla ? 'ডাউনলোড' : 'Download'}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Audio Note Message */}
                  {msg.type === 'audio-note' && msg.fileDataUrl && (
                    <div className="flex items-center gap-3 py-1 px-2">
                      <audio controls src={msg.fileDataUrl} className="h-8 max-w-[200px] sm:max-w-[240px]" />
                    </div>
                  )}

                  {/* Timestamp & Encryption Checkmark */}
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
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800">
        
        {/* Emoji Quick Bar */}
        {showEmojiPicker && (
          <div className="mb-2 p-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 overflow-x-auto">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setInputText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-lg p-1.5 hover:bg-slate-800 rounded-lg transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {isRecording ? (
          // Recording in Progress bar
          <div className="flex items-center justify-between p-3 bg-rose-950/40 border border-rose-800/60 rounded-2xl animate-pulse">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-xs font-semibold text-rose-300">
                {isBangla ? 'ভয়েস রেকর্ড হচ্ছে...' : 'Recording Voice Note...'}
              </span>
              <span className="font-mono text-xs font-bold text-white">
                {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={cancelRecording}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white rounded-lg transition"
              >
                {isBangla ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={stopRecording}
                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center gap-1.5 text-xs shadow-lg"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{isBangla ? 'পাঠান' : 'Send'}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            
            {/* File Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={!isPeerConnected}
              onClick={() => fileInputRef.current?.click()}
              title={isBangla ? 'ফাইল পাঠান (P2P)' : 'Send File (Direct P2P)'}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition disabled:opacity-40"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Emoji Toggle */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition hidden sm:block"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Input Text Box */}
            <input
              type="text"
              placeholder={
                isPeerConnected
                  ? (isBangla ? 'এনক্রিপ্টেড মেসেজ লিখুন...' : 'Type an encrypted message...')
                  : (isBangla ? 'অপর ইউজার যুক্ত হলে মেসেজ পাঠানো যাবে...' : 'Waiting for peer to connect...')
              }
              value={inputText}
              disabled={!isPeerConnected}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition disabled:opacity-50"
            />

            {/* Voice Record Button */}
            <button
              type="button"
              disabled={!isPeerConnected}
              onClick={startRecording}
              title={isBangla ? 'ভয়েস রেকর্ড' : 'Voice Note'}
              className="p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition disabled:opacity-40"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || !isPeerConnected}
              className="p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-950/50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
