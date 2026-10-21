import React, { useState } from 'react';
import { TappytoonAuthService } from '../services/tappytoonAuth';
import { LogIn, X, Lock, AlertCircle, Loader2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pendingUrl?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pendingUrl,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await TappytoonAuthService.login(email, password);
      setPassword('');
      setError(null);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 rounded-lg transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Log In to Tappytoon</h2>
            <p className="text-xs text-slate-400">Access your purchased comic episodes</p>
          </div>
        </div>

        {pendingUrl && (
          <div className="bg-sky-950/40 border border-sky-800/60 rounded-xl p-3 text-xs text-sky-300">
            Log in to automatically resume downloading your requested episode URL.
          </div>
        )}

        {error && (
          <div className="bg-rose-950/50 border border-rose-800 rounded-xl p-3 text-xs text-rose-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Tappytoon Account Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log In & Resume</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          Your credentials are authenticated directly against official Tappytoon servers via HTTPS. Passwords are never stored locally or remotely.
        </p>
      </div>
    </div>
  );
};
