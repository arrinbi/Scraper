import React from 'react';
import { Clipboard, Download, Trash2, Link as LinkIcon } from 'lucide-react';

interface UrlInputProps {
  url: string;
  setUrl: (value: string) => void;
  onPaste: () => void;
  onClear: () => void;
  onScrape: () => void;
  isSubmitting?: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({
  url,
  setUrl,
  onPaste,
  onClear,
  onScrape,
  isSubmitting = false,
}) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-md space-y-3">
      <label htmlFor="episode-url-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
        Tappytoon Episode Link
      </label>
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none">
          <LinkIcon className="w-5 h-5" />
        </div>
        <input
          id="episode-url-input"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste Tappytoon episode URL (e.g. https://www.tappytoon.com/en/comics/solo-leveling/1)"
          className="w-full bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg pl-10 pr-20 py-2.5 text-sm focus:outline-none focus:border-rose-500 transition-colors"
        />
        {url && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 text-slate-400 hover:text-slate-200 p-1"
            title="Clear URL"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onPaste}
          className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-slate-600"
        >
          <Clipboard className="w-4 h-4" />
          <span>Paste</span>
        </button>

        <button
          type="button"
          onClick={onClear}
          disabled={!url}
          className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 text-slate-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-slate-700"
        >
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={onScrape}
          disabled={!url || isSubmitting}
          className="w-full sm:w-auto sm:ml-auto flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg shadow transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{isSubmitting ? 'Adding...' : 'Scrape Episode'}</span>
        </button>
      </div>
    </div>
  );
};
