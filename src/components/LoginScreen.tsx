import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Flame, 
  EyeOff, 
  CameraOff,
  Users
} from 'lucide-react';
import { AuthUser, PartnerUser } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser, partner: PartnerUser) => void;
  isBangla?: boolean;
  onToggleLanguage?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  isBangla = true,
  onToggleLanguage,
}) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (uidToUse?: string, pwdToUse?: string) => {
    setErrorMsg('');
    setIsLoading(true);

    const targetUid = uidToUse || userId;
    const targetPwd = pwdToUse || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUid, password: targetPwd }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || (isBangla ? 'লগইন ব্যর্থ হয়েছে।' : 'Login failed.'));
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data.user, data.partner);
    } catch {
      setErrorMsg(isBangla ? 'সার্ভারের সাথে যোগাযোগে সমস্যা হয়েছে।' : 'Server connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickFillUser = (uid: string, pwd: string) => {
    setUserId(uid);
    setPassword(pwd);
    handleLogin(uid, pwd);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0e17] flex flex-col items-center justify-center p-4 py-8 safe-top safe-bottom relative overflow-y-auto select-none">
      {/* Background glow ambiance */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-slow"></div>

      {/* Top Language & App Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
              <span>PeerCrypt</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-800 font-mono">
                2-User E2EE
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {isBangla ? 'হোয়াটসঅ্যাপ/টেলিগ্রাম স্টাইল সুরক্ষিত অ্যাপ' : 'WhatsApp / Telegram style secure app'}
            </p>
          </div>
        </div>

        {onToggleLanguage && (
          <button
            onClick={onToggleLanguage}
            className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            {isBangla ? 'EN' : 'বাং'}
          </button>
        )}
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Security badges */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-center text-slate-300">
          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800 flex flex-col items-center">
            <CameraOff className="w-4 h-4 text-rose-400 mb-1" />
            <span className="text-[10px] font-bold">{isBangla ? 'অ্যান্টি-স্ক্রিনশট' : 'Anti-Screenshot'}</span>
            <span className="text-[9px] text-slate-500">{isBangla ? 'অ্যালার্ট গার্ড' : 'Alert Trigger'}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800 flex flex-col items-center">
            <Flame className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] font-bold">{isBangla ? 'ডিজঅ্যাপিয়ারিং' : 'Disappearing'}</span>
            <span className="text-[9px] text-slate-500">{isBangla ? 'সেলফ-ডিস্ট্রাক্ট' : 'Auto Delete'}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800 flex flex-col items-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[10px] font-bold">{isBangla ? 'টোটাল E2EE' : '100% E2EE'}</span>
            <span className="text-[9px] text-slate-500">{isBangla ? '০ ডেটাবেস' : 'Zero Storage'}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs text-center animate-fade-in">
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4"
        >
          {/* User ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              {isBangla ? 'ইউজার আইডি (User ID):' : 'User ID:'}
            </label>
            <input
              type="text"
              required
              placeholder="user1 or user2"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition text-sm font-mono"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              {isBangla ? 'পাসওয়ার্ড (Password):' : 'Password:'}
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !userId.trim() || !password.trim()}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{isBangla ? 'লগইন করুন' : 'Log In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Firebase Google Auth Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={async () => {
              setIsLoading(true);
              setErrorMsg('');
              try {
                const { auth, googleProvider } = await import('../firebase');
                const { signInWithPopup } = await import('firebase/auth');
                const res = await signInWithPopup(auth, googleProvider);
                if (res.user) {
                  onLoginSuccess(
                    {
                      id: res.user.uid.slice(0, 8),
                      name: res.user.displayName || 'Google User',
                      avatarColor: 'from-indigo-500 to-purple-600',
                    },
                    {
                      id: 'partner',
                      name: isBangla ? 'বন্ধু (Partner)' : 'Partner User',
                      avatarColor: 'from-emerald-500 to-teal-600',
                      isOnline: true,
                    }
                  );
                }
              } catch (err: any) {
                console.warn('Firebase Google Auth error:', err);
                setErrorMsg(isBangla ? 'গুগল লগইন সম্পন্ন হয়নি।' : 'Google Sign-In canceled or failed.');
              } finally {
                setIsLoading(false);
              }
            }}
            className="w-full py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2.5 transition cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{isBangla ? 'Firebase Google দিয়ে লগইন' : 'Sign in with Google (Firebase)'}</span>
          </button>
        </div>

        {/* 1-Click Fast Login Buttons for Testing / Convenience */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 text-center mb-3">
            {isBangla ? '⚡ এক ক্লিকে সরাসরি টেস্ট লগইন:' : '⚡ 1-Click Quick Demo Login:'}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => quickFillUser('user1', 'password123')}
              className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800/90 border border-cyan-800/40 text-left transition group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                  {isBangla ? 'ইউজার ১' : 'User 1'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">ID: user1</div>
              <div className="text-[10px] font-mono text-slate-500">Pass: password123</div>
            </button>

            <button
              type="button"
              onClick={() => quickFillUser('user2', 'password456')}
              className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800/90 border border-emerald-800/40 text-left transition group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                  {isBangla ? 'ইউজার ২' : 'User 2'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">ID: user2</div>
              <div className="text-[10px] font-mono text-slate-500">Pass: password456</div>
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-500 mt-2">
            {isBangla 
              ? 'টিপস: ব্রাউজারের দুটি ভিন্ন উইন্ডো বা দুটি ভিন্ন ডিভাইসে যথাক্রমে ইউজার ১ এবং ইউজার ২ লগইন করুন।'
              : 'Tip: Open user1 on one window/device and user2 on another window/device.'}
          </p>
        </div>
      </div>
    </div>
  );
};
