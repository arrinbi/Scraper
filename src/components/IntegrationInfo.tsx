import React from 'react';
import { Info, Lock, Smartphone, ExternalLink } from 'lucide-react';

export const IntegrationInfo: React.FC = () => {
  return (
    <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 text-xs text-slate-300 space-y-3">
      <div className="flex items-center space-x-2 text-slate-200 font-semibold border-b border-slate-700 pb-2">
        <Info className="w-4 h-4 text-rose-400" />
        <span>Tappytoon Integration & Architecture Notes</span>
      </div>

      <div className="space-y-2 leading-relaxed">
        <div className="flex items-start space-x-2">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-100">Access Control & DRM:</strong> Tappytoon enforces session authentication, CORS origin checks, and digital rights management (DRM) for paid chapter images. This web app respects Tappytoon's official authentication flows and access boundaries.
          </p>
        </div>

        <div className="flex items-start space-x-2">
          <Smartphone className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-100">Android & Desktop Support:</strong> All queue states and downloaded image payloads are persisted locally in browser <code className="bg-slate-900 px-1 py-0.5 rounded text-rose-300">IndexedDB</code>, preventing data loss on page refresh. This interface is fully responsive and APK-ready for WebView wrappers on Android.
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-slate-400">
        <span>Official Website</span>
        <a
          href="https://www.tappytoon.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-rose-400 hover:text-rose-300 transition-colors"
        >
          <span>tappytoon.com</span>
          <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>
    </div>
  );
};
