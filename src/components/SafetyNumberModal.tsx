import React, { useState } from 'react';
import { ShieldCheck, Check, Copy, AlertCircle, QrCode } from 'lucide-react';

interface SafetyNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  safetyData: {
    safetyNumber: string;
    groups: string[];
    fullHash: string;
  } | null;
  remotePeerName?: string;
  isVerified: boolean;
  onVerifyToggle: () => void;
  isBangla?: boolean;
}

export const SafetyNumberModal: React.FC<SafetyNumberModalProps> = ({
  isOpen,
  onClose,
  safetyData,
  remotePeerName,
  isVerified,
  onVerifyToggle,
  isBangla = true,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !safetyData) return null;

  const copyNumber = () => {
    navigator.clipboard.writeText(safetyData.safetyNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isVerified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isBangla ? 'সেফটি নাম্বার ও ভেরিফিকেশন' : 'Safety Number Verification'}
              </h3>
              <p className="text-xs text-slate-400">
                {remotePeerName ? `${remotePeerName} এর সাথে সুরক্ষা যাচাই` : 'Verify E2EE Keys'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="text-xs text-slate-300 bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/70 flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              {isBangla
                ? 'উভয় ইউজারের স্ক্রিনে যদি এই ৩০-সংখ্যার সিকিউরিটি কোড হুবহু মিলে যায়, তবে প্রমাণিত হয় যে কোনো ম্যান-ইন-দ্য-মিডল (MITM) বা থার্ড-পার্টি আপনাদের সেশন ইন্টারসেপ্ট করছে না।'
                : 'If this 30-digit security code matches exactly on both devices, your connection is guaranteed to be direct and untampered.'}
            </p>
          </div>

          {/* Safety Numbers Display */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {isBangla ? 'অনন্য এনক্রিপশন ফিঙ্গারপ্রিন্ট' : 'Cryptographic Fingerprint'}
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-base font-bold text-cyan-400">
              {safetyData.groups.map((group, idx) => (
                <div key={idx} className="bg-slate-900/80 py-2 px-1 rounded-lg border border-slate-800 tracking-wider">
                  {group}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={copyNumber}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? (isBangla ? 'কপি হয়েছে' : 'Copied') : (isBangla ? 'কোড কপি করুন' : 'Copy Code')}
              </button>
            </div>
          </div>

          {/* SHA-256 Digest Preview */}
          <div className="text-[11px] font-mono text-slate-500 truncate bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800/80">
            SHA-256: {safetyData.fullHash}
          </div>

          {/* Verification Status Button */}
          <button
            onClick={onVerifyToggle}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 ${
              isVerified
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-600/40'
                : 'bg-cyan-600 text-white hover:bg-cyan-500'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isVerified
              ? (isBangla ? 'যাচাই সম্পন্ন হয়েছে (Verified ✓)' : 'Identity Verified ✓')
              : (isBangla ? 'যাচাইকৃত হিসেবে মার্ক করুন' : 'Mark as Verified')}
          </button>
        </div>
      </div>
    </div>
  );
};
