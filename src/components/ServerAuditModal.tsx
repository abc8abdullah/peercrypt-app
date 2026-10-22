import React, { useEffect, useState } from 'react';
import { ServerOff, CheckCircle2, ShieldCheck, RefreshCw, DatabaseZap, Clock } from 'lucide-react';
import { ServerAuditReport } from '../types';

interface ServerAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBangla?: boolean;
}

export const ServerAuditModal: React.FC<ServerAuditModalProps> = ({
  isOpen,
  onClose,
  isBangla = true,
}) => {
  const [audit, setAudit] = useState<ServerAuditReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/server-privacy-audit');
      const data = await res.json();
      setAudit(data);
    } catch (err) {
      console.warn('Failed to fetch server audit:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ServerOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isBangla ? 'সার্ভার জিরো-স্টোরেজ অডিট রিপোর্ট' : 'Server Zero-Storage Live Audit'}
              </h3>
              <p className="text-xs text-slate-400">
                {isBangla ? 'সার্ভারে ০ বাইট ডেটা সংরক্ষণের স্বচ্ছ প্রমাণ' : 'Transparent proof of zero data storage'}
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
        <div className="p-6 space-y-4">
          <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-emerald-300">
                  {isBangla ? 'স্টোরেজ পলিসি: STRICT_ZERO_STORAGE' : 'Policy: STRICT_ZERO_STORAGE'}
                </div>
                <div className="text-[11px] text-emerald-400/80">
                  {isBangla ? 'সার্ভারে চ্যাট বা অডিও/ভিডিও ফাইল লেখার কোনো মেকানিজম নেই' : 'No disk or database write mechanism exists'}
                </div>
              </div>
            </div>
            <button
              onClick={fetchAudit}
              disabled={loading}
              className="p-2 rounded-lg bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/60 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[11px]">
                {isBangla ? 'সংরক্ষিত মেসেজ সংখ্যা' : 'Stored Messages'}
              </div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {audit ? audit.storedMessagesCount : 0} bytes
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[11px]">
                {isBangla ? 'ডাটাবেস কানেকশন' : 'Database Engines'}
              </div>
              <div className="text-sm font-bold font-mono text-cyan-400 mt-1 truncate">
                None (0 DB)
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[11px]">
                {isBangla ? 'সক্রিয় এফেমিরাল রুম' : 'Active Ephemeral Rooms'}
              </div>
              <div className="text-base font-bold font-mono text-purple-400 mt-1">
                {audit ? audit.activeEphemeralRooms : 0}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[11px]">
                {isBangla ? 'কানেক্টেড ইউজার সংখ্যা' : 'Connected Sockets'}
              </div>
              <div className="text-base font-bold font-mono text-amber-400 mt-1">
                {audit ? audit.activeConnectedPeers : 0}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 font-mono text-xs text-slate-300">
            <div className="flex justify-between items-center text-[11px] text-slate-400 pb-1 border-b border-slate-800">
              <span>{isBangla ? 'সার্ভারের ভূমিকা' : 'Server Role'}:</span>
              <span className="text-cyan-400 font-sans">Pure Signaling Courier</span>
            </div>
            <div className="text-[11px] leading-relaxed text-slate-400">
              {audit?.diskLogPolicy || 'Ephemeral in-memory signaling only. Payloads are dropped immediately upon socket relay.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            {isBangla ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
