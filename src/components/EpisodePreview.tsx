import React from 'react';
import { ParsedTappytoonUrl, formatSeriesTitle } from '../services/tappytoonUrl';
import { EpisodeMetadata } from '../services/tappytoonAdapter';
import { CheckCircle2, AlertTriangle, Lock, Globe, Image as ImageIcon, LogIn } from 'lucide-react';

interface EpisodePreviewProps {
  parsedUrl: ParsedTappytoonUrl;
  metadata?: EpisodeMetadata;
  isLoading?: boolean;
  onPromptLogin?: () => void;
}

export const EpisodePreview: React.FC<EpisodePreviewProps> = ({
  parsedUrl,
  metadata,
  isLoading = false,
  onPromptLogin,
}) => {
  if (!parsedUrl.isValid) {
    if (parsedUrl.error) {
      return (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-4 text-rose-300 text-sm flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Invalid Tappytoon URL</p>
            <p className="mt-0.5 text-xs text-rose-300/80">{parsedUrl.error}</p>
          </div>
        </div>
      );
    }
    return null;
  }

  const seriesTitle = metadata?.seriesTitle || formatSeriesTitle(parsedUrl.seriesSlug);
  const episodeTitle = metadata?.episodeTitle || (parsedUrl.episodeId ? `Episode ${parsedUrl.episodeId}` : 'Episode');

  return (
    <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-3 shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
          Episode Preview
        </span>
        <span className="text-xs text-slate-400 font-mono">
          Lang: {parsedUrl.language?.toUpperCase() || 'EN'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="w-20 h-24 bg-slate-900 rounded-lg flex-shrink-0 flex items-center justify-center border border-slate-700 overflow-hidden">
          {metadata?.thumbnailUrl ? (
            <img src={metadata.thumbnailUrl} alt={seriesTitle} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-slate-600" />
          )}
        </div>

        <div className="flex-1 space-y-1">
          <h3 className="text-base font-bold text-slate-100">{seriesTitle}</h3>
          <p className="text-sm font-medium text-slate-300">{episodeTitle}</p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            {isLoading ? (
              <span className="text-slate-400 animate-pulse">Detecting episode metadata...</span>
            ) : metadata ? (
              <>
                <StatusBadge status={metadata.accessStatus} />
                {metadata.estimatedImageCount !== undefined ? (
                  <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full border border-slate-600">
                    {metadata.estimatedImageCount} images detected
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Image count pending download</span>
                )}
              </>
            ) : null}
          </div>

          {metadata?.accessMessage && (
            <p className="text-xs text-slate-400 pt-1 leading-relaxed">{metadata.accessMessage}</p>
          )}

          {metadata?.accessStatus === 'login_required' && onPromptLogin && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onPromptLogin}
                className="inline-flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors shadow"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In to Access Episode</span>
              </button>
            </div>
          )}

          {metadata?.extractionNote && (
            <p className="text-xs text-amber-400/90 pt-0.5 italic">{metadata.extractionNote}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: EpisodeMetadata['accessStatus'] }> = ({ status }) => {
  switch (status) {
    case 'public':
      return (
        <span className="inline-flex items-center text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Publicly Accessible
        </span>
      );
    case 'login_required':
      return (
        <span className="inline-flex items-center text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full">
          <Lock className="w-3 h-3 mr-1" /> Login Required
        </span>
      );
    case 'purchase_required':
      return (
        <span className="inline-flex items-center text-rose-400 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded-full">
          <Lock className="w-3 h-3 mr-1" /> Purchase Required
        </span>
      );
    case 'restricted_cors':
      return (
        <span className="inline-flex items-center text-sky-400 bg-sky-950/80 border border-sky-800 px-2 py-0.5 rounded-full">
          <Globe className="w-3 h-3 mr-1" /> Browser Session Protected
        </span>
      );
  }
};
