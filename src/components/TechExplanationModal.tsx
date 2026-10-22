import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ServerOff, 
  Cpu, 
  Wifi, 
  Lock, 
  Radio, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  Terminal,
  Activity,
  Key,
  DatabaseZap
} from 'lucide-react';
import { WebRTCConnectionStats } from '../types';

interface TechExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: WebRTCConnectionStats | null;
  roomId?: string;
  isBangla?: boolean;
}

export const TechExplanationModal: React.FC<TechExplanationModalProps> = ({
  isOpen,
  onClose,
  stats,
  roomId,
  isBangla = true,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'phases' | 'security' | 'inspector'>('architecture');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {isBangla ? 'WebRTC পিয়ার-টু-পিয়ার প্রযুক্তিগত স্থাপত্য' : 'WebRTC Peer-to-Peer Technical Architecture'}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  {isBangla ? 'জিরো সার্ভার স্টোরেজ' : 'Zero Server Storage'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isBangla 
                  ? 'ব্রাউজার টু ব্রাউজার ডিরেক্ট এন্ড-টু-এন্ড এনক্রিপ্টেড কমিউনিকেশনের পুঙ্খানুপুঙ্খ বিবরণ'
                  : 'In-depth breakdown of direct browser-to-browser E2EE communication protocols'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            {isBangla ? '১. ওভারভিউ ও আর্কিটেকচার' : '1. Overview & Architecture'}
          </button>
          <button
            onClick={() => setActiveTab('phases')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
              activeTab === 'phases'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-4 h-4" />
            {isBangla ? '২. কানেকশনের ৫টি পর্যায়' : '2. 5 Connection Phases'}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isBangla ? '৩. এনক্রিপশন ও সিকিউরিটি' : '3. Encryption & Zero-Storage'}
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
              activeTab === 'inspector'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            {isBangla ? '৪. লাইভ WebRTC ইন্সপেক্টর' : '4. Live WebRTC Inspector'}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-200">
                <h3 className="text-base font-bold text-cyan-300 mb-1 flex items-center gap-2">
                  <ServerOff className="w-5 h-5" />
                  {isBangla ? 'কেন কোনো সার্ভার ডেটা স্টোরেজ নেই?' : 'Why Zero Server Data Storage?'}
                </h3>
                <p>
                  {isBangla
                    ? 'সাধারণ অ্যাপে (যেমন মেসেঞ্জার বা টেলিগ্রাম) আপনার মেসেজ ও কল সার্ভারের ডাটাবেসে যায় এবং সেখানে জমা থাকে। কিন্তু এই অ্যাপে WebRTC (Web Real-Time Communication) ব্যবহারের ফলে দুটি ব্রাউজার সরাসরি ক্রিপ্টোগ্রাফিক সকেটের মাধ্যমে কানেক্ট হয়। কোনো টেক্সট, অডিও বা ভিডিও প্যাকেট কখনো কোনো সার্ভারে পৌঁছায় না।'
                    : 'Unlike traditional chat apps where every message is routed and logged in a central database, WebRTC establishes a direct, socket-to-socket mesh between User A and User B. Raw media and message packets travel strictly between the two devices.'}
                </p>
              </div>

              {/* Protocol Stack Visualizer */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <h4 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  {isBangla ? 'প্রোটোকল স্ট্যাক স্তরবিন্যাস (OSI Layer Mapping)' : 'Protocol Stack Architecture'}
                </h4>
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-2.5 rounded bg-purple-950/40 border border-purple-800/50 flex justify-between items-center text-purple-300">
                    <span>[অ্যাপ্লিকেশন লেয়ার] SubtleCrypto AES-256-GCM + UI</span>
                    <span className="text-[10px] bg-purple-900/80 px-2 py-0.5 rounded">Defense-in-depth E2EE</span>
                  </div>
                  <div className="p-2.5 rounded bg-blue-950/40 border border-blue-800/50 flex justify-between items-center text-blue-300">
                    <span>[ডেটা/মিডিয়া লেয়ার] RTCDataChannel (SCTP) & MediaStreams</span>
                    <span className="text-[10px] bg-blue-900/80 px-2 py-0.5 rounded">Opus Audio / VP8-VP9 Video</span>
                  </div>
                  <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/50 flex justify-between items-center text-emerald-300">
                    <span>[সিকিউরিটি লেয়ার] DTLS (Datagram TLS) & SRTP</span>
                    <span className="text-[10px] bg-emerald-900/80 px-2 py-0.5 rounded">Mandatory Ephemeral ECDSA</span>
                  </div>
                  <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/50 flex justify-between items-center text-amber-300">
                    <span>[ট্রান্সপোর্ট লেয়ার] ICE (STUN) + UDP</span>
                    <span className="text-[10px] bg-amber-900/80 px-2 py-0.5 rounded">Direct P2P Hole Punching</span>
                  </div>
                </div>
              </div>

              {/* 2-User Room Topology */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {isBangla ? '১:১ মেশ টপোলজি (Mesh Topology)' : '1:1 Direct Mesh Topology'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isBangla
                      ? 'যেহেতু এই অ্যাপটি কঠোরভাবে শুধুমাত্র ২ জন ইউজারের জন্য সীমাবদ্ধ, তাই এতে কোনো জটিল রিলে সার্ভার (SFU/MCU) প্রয়োজন হয় না। উভয় ইউজার নিজেদের মধ্যে ১টি একক ডেটা পাইপলাইন পরিচালনা করে, যা শতভাগ প্রাইভেসি এবং আল্ট্রা-লো লেটেন্সি নিশ্চিত করে।'
                      : 'Because this app is strictly bounded to 2 users, no intermediary Selective Forwarding Unit (SFU) is required. Peers transmit media directly in a 1:1 mesh with zero hops.'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2 text-sm">
                    <DatabaseZap className="w-4 h-4 text-cyan-400" />
                    {isBangla ? 'র‍্যাম-অনলি এফেমিরাল মেমোরি' : 'RAM-Only Ephemeral Signaling'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isBangla
                      ? 'সার্ভারের একমাত্র কাজ হলো হ্যান্ডশেক করার সময় দুই ব্রাউজারের মধ্যে নেটওয়ার্ক মেটাডেটা (SDP ও ICE) ট্রান্সফার করা। হ্যান্ডশেক সম্পন্ন হওয়ামাত্র সার্ভারের কোনো অংশগ্রহণ থাকে না। কোনো মেসেজ মেমোরি বা ডিস্কে লেখা হয় না।'
                      : 'The server functions strictly as an ephemeral signal courier during handshake. Once the WebRTC peer connection is established, all communication bypasses the server entirely.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'phases' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">
                {isBangla ? 'WebRTC কানেকশন তৈরির ৫টি মৌলিক পর্যায়:' : 'The 5 Core Phases of WebRTC Connection:'}
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="flex items-center gap-2 font-bold text-cyan-400 text-sm mb-1">
                    <span className="w-6 h-6 rounded-full bg-cyan-900/60 text-cyan-300 flex items-center justify-center text-xs">১</span>
                    {isBangla ? 'সিগন্যালিং ফেজ (Signaling via WebSocket)' : 'Signaling via WebSocket'}
                  </div>
                  <p className="text-xs text-slate-300">
                    {isBangla
                      ? 'ইউজার ১ (Initiator) একটি SDP Offer (Session Description Protocol) তৈরি করে যাতে অডিও/ভিডিও কোডেক, মিডিয়া ক্যাপাবিলিটি থাকে। এটি সিগন্যালিং রিলে দিয়ে ইউজার ২-এর কাছে পৌঁছায়। ইউজার ২ একটি SDP Answer দিয়ে প্রত্যুত্তর দেয়।'
                      : 'Peer 1 generates an SDP Offer describing supported codecs and capabilities. Peer 2 receives it and responds with an SDP Answer.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm mb-1">
                    <span className="w-6 h-6 rounded-full bg-emerald-900/60 text-emerald-300 flex items-center justify-center text-xs">২</span>
                    {isBangla ? 'ICE ও STUN (NAT ট্রাভার্সাল ও পাবলিক আইপি নির্ণয়)' : 'ICE & STUN (NAT Traversal)'}
                  </div>
                  <p className="text-xs text-slate-300">
                    {isBangla
                      ? 'বেশিরভাগ ডিভাইস রাউটারের পেছনে (Private IP) থাকে। ব্রাউজার Google STUN সার্ভারে একটি হালকা পিং পাঠিয়ে নিজের পাবলিক আইপি ও পোর্ট (srflx candidate) বের করে। এরপর উভয় ব্রাউজার নিজেদের মধ্যে সরাসরি পথ খুঁজে নেয় (Hole Punching)।'
                      : 'Devices behind home routers cannot be reached on local 192.168.x.x IPs. STUN helps each peer discover its public reflex IP/port, allowing direct hole punching.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="flex items-center gap-2 font-bold text-purple-400 text-sm mb-1">
                    <span className="w-6 h-6 rounded-full bg-purple-900/60 text-purple-300 flex items-center justify-center text-xs">৩</span>
                    {isBangla ? 'DTLS হ্যান্ডশেক (ক্রিপ্টোগ্রাফিক কি এক্সচেঞ্জ)' : 'DTLS Handshake (Zero Server Access)'}
                  </div>
                  <p className="text-xs text-slate-300">
                    {isBangla
                      ? 'সরাসরি পথ খুঁজে পাওয়ার পর উভয় ব্রাউজার DTLS (Datagram Transport Layer Security) প্রোটোকলের মাধ্যমে সাময়িক এসিম্যাট্রিক কী তৈরি করে সেশন কি এক্সচেঞ্জ সম্পন্ন করে। কোনো তৃতীয় পক্ষ বা সার্ভার এই কি ডিক্রিপ্ট করতে পারে না।'
                      : 'Peers perform an ephemeral Diffie-Hellman key exchange directly over UDP. Even if an attacker intercepted all signaling, they cannot decrypt the DTLS stream.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="flex items-center gap-2 font-bold text-amber-400 text-sm mb-1">
                    <span className="w-6 h-6 rounded-full bg-amber-900/60 text-amber-300 flex items-center justify-center text-xs">৪</span>
                    {isBangla ? 'RTCDataChannel ওপেনিং (ডিরেক্ট মেসেজিং ও ফাইল)' : 'RTCDataChannel (Direct P2P Data)'}
                  </div>
                  <p className="text-xs text-slate-300">
                    {isBangla
                      ? 'কানেকশন তৈরি হলে একটি বাই-ডিরেকশনাল ডেটা চ্যানেল তৈরি হয়। আপনি যখন মেসেজ পাঠান বা ফাইল শেয়ার করেন, তা সরাসরি পিয়ারের ব্রাউজার মেমোরিতে পাঠানো হয়। কোনো ফাইল সার্ভারে আপলোড হয় না।'
                      : 'An SCTP data pipe opens directly between browsers. Text chat and file binary chunks stream straight from device to device.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="flex items-center gap-2 font-bold text-pink-400 text-sm mb-1">
                    <span className="w-6 h-6 rounded-full bg-pink-900/60 text-pink-300 flex items-center justify-center text-xs">৫</span>
                    {isBangla ? 'SRTP মিডিয়া স্ট্রিম (অডিও ও ভিডিও কলিং)' : 'SRTP Media Streams (Audio & Video)'}
                  </div>
                  <p className="text-xs text-slate-300">
                    {isBangla
                      ? 'অডিও (Opus কোডেক) এবং ভিডিও (VP8/VP9/H.264 কোডেক) ফ্রেমগুলো হার্ডওয়্যার এক্সিলারেশন দিয়ে সরাসরি এনকোড হয় এবং SRTP (Secure Real-time Transport Protocol) দিয়ে প্রেরিত হয়।'
                      : 'Hardware-accelerated Opus and VP8/VP9 video packets stream through SRTP directly without latency or server buffering.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
                <h4 className="font-bold text-emerald-300 flex items-center gap-2 mb-2 text-base">
                  <Lock className="w-5 h-5" />
                  {isBangla ? 'দ্বিস্তর বিশিষ্ট এন্ড-টু-এন্ড এনক্রিপশন (Dual-Layer E2EE)' : 'Dual-Layer End-to-End Encryption'}
                </h4>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  {isBangla
                    ? '১. ট্রান্সপোর্ট লেয়ারে WebRTC-এর নিজস্ব DTLS 1.2/1.3 এনক্রিপশন। ২. অ্যাপ্লিকেশন লেয়ারে W3C Web Cryptography API (SubtleCrypto) দিয়ে AES-256-GCM অ্যালগরিদমে অতিরিক্ত এনক্রিপশন ও সাইনিং। এর ফলে কোনো প্যাকেট স্নুপিং হলেও ডেটা সম্পূর্ণ অপাঠ্য থাকে।'
                    : 'Layer 1: Mandatory WebRTC DTLS 1.2/1.3 protocol encryption on the wire. Layer 2: Web Cryptography API (SubtleCrypto) AES-256-GCM application payload encryption with PBKDF2 derived keys.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <h5 className="font-bold text-white text-xs mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4 text-cyan-400" />
                    {isBangla ? 'সেফটি নাম্বার (Safety Numbers / MITM Protection)' : 'Safety Numbers & Fingerprint'}
                  </h5>
                  <p className="text-xs text-slate-300">
                    {isBangla
                      ? 'উভয় ইউজার একটি ৬০-সংখ্যার অনন্য সেফটি নাম্বার দেখতে পাবেন। এটি মিলিয়ে দেখে নিশ্চিত হওয়া যায় যে মাঝখানে কোনো ম্যান-ইন-দ্য-মিডল (MITM) আক্রমণকারী নেই।'
                      : 'A deterministic 6-group safety code derived via SHA-256 lets both peers verify identity out-of-band to prevent MITM attacks.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <h5 className="font-bold text-white text-xs mb-2 flex items-center gap-2">
                    <ServerOff className="w-4 h-4 text-rose-400" />
                    {isBangla ? 'সার্ভার জিরো-নলেজ পলিসি' : 'Zero-Knowledge Server Policy'}
                  </h5>
                  <p className="text-xs text-slate-300">
                    {isBangla
                      ? 'সার্ভারে কোনো ডাটাবেস নেই (No SQL/NoSQL)। ব্রাউজার উইন্ডো বন্ধ করলে বা রিফ্রেশ করলে চ্যাট হিস্ট্রি চিরতরে মুছে যায়।'
                      : 'The signaling server maintains zero databases. When the browser closes, state vanishes completely.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inspector' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  {isBangla ? 'লাইভ সেশন মেট্রিক্স ও প্রোটোকল স্ট্যাটাস' : 'Live Session Metrics & Protocol Status'}
                </h4>
                <span className="text-xs font-mono text-slate-400">
                  Room: {roomId || 'Disconnected'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Connection State</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 uppercase mt-0.5">
                    {stats?.connectionState || 'new'}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">DataChannel State</div>
                  <div className="text-sm font-bold font-mono text-cyan-400 uppercase mt-0.5">
                    {stats?.dataChannelState || 'closed'}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">ICE State</div>
                  <div className="text-sm font-bold font-mono text-amber-400 uppercase mt-0.5">
                    {stats?.iceConnectionState || 'new'}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Round Trip Time (RTT)</div>
                  <div className="text-sm font-bold font-mono text-purple-400 mt-0.5">
                    {stats?.rttMs ? `${stats.rttMs} ms` : 'Measuring...'}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Candidate Type</div>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                    {stats?.localCandidateType ? `${stats.localCandidateType} (P2P)` : 'STUN Host/Srflx'}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Data Transferred</div>
                  <div className="text-sm font-bold font-mono text-emerald-300 mt-0.5">
                    {stats ? `${Math.round((stats.bytesReceived + stats.bytesSent) / 1024)} KB` : '0 KB'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                <div className="text-[11px] text-slate-400 mb-1">Active Cipher Suite</div>
                <div className="text-cyan-300">
                  {stats?.cipherSuite || 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256 (DTLS/SRTP)'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition"
          >
            {isBangla ? 'বুঝেছি / বন্ধ করুন' : 'Got it / Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
