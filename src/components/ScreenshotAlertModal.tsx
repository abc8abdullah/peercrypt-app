import React from 'react';
import { CameraOff, AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface ScreenshotAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSelfAttempt: boolean;
  culpritName?: string;
  isBangla?: boolean;
}

export const ScreenshotAlertModal: React.FC<ScreenshotAlertModalProps> = ({
  isOpen,
  onClose,
  isSelfAttempt,
  culpritName = 'Partner',
  isBangla = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-rose-600/80 rounded-3xl p-6 sm:p-7 shadow-2xl text-center text-slate-100 overflow-hidden">
        
        {/* Pulsing red security beacon */}
        <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-600/20 animate-ping"></div>
          <div className="relative w-16 h-16 rounded-full bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-400 shadow-xl">
            <CameraOff className="w-8 h-8" />
          </div>
        </div>

        <h3 className="text-lg font-black text-white mb-2 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <span>{isBangla ? 'স্ক্রিনশট অ্যালার্ট!' : 'Screenshot Alert!'}</span>
        </h3>

        <div className="bg-rose-950/50 border border-rose-900/80 p-3.5 rounded-2xl text-xs text-rose-200 mb-6 leading-relaxed">
          {isSelfAttempt ? (
            <span>
              {isBangla
                ? '⚠️ এই অ্যাপে স্ক্রিনশট নেওয়া সম্পূর্ণ নিষিদ্ধ! আপনার অপর প্রান্তে থাকা বন্ধুকে এ বিষয়ে সতর্কবার্তা পাঠানো হয়েছে।'
                : '⚠️ Screenshots are strictly blocked! An alert notification has been dispatched to your partner.'}
            </span>
          ) : (
            <span>
              {isBangla
                ? `🚨 ${culpritName} এইমাত্র চ্যাটের স্ক্রিনশট নেওয়ার চেষ্টা করেছেন! অ্যান্টি-স্ক্রিনশট গার্ড স্বয়ংক্রিয়ভাবে বিষয়বস্তু আড়াল করেছে।`
                : `🚨 ${culpritName} just attempted to take a screenshot! The privacy shield automatically scrambled content.`}
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/60 transition cursor-pointer"
        >
          {isBangla ? 'বুঝেছি / সতর্কবার্তা বন্ধ করুন' : 'Understood / Dismiss'}
        </button>
      </div>
    </div>
  );
};
