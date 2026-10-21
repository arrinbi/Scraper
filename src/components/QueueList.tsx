import React, { useState } from 'react';
import { QueueItemRecord } from '../services/db';
import { generateQueueItemZip, triggerBlobDownload, sanitizeFilename } from '../services/zipGenerator';
import { Download, RotateCcw, Trash2, Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface QueueListProps {
  items: QueueItemRecord[];
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

export const QueueList: React.FC<QueueListProps> = ({ items, onRetry, onRemove }) => {
  if (items.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 space-y-2">
        <p className="text-sm font-medium">Queue is empty</p>
        <p className="text-xs text-slate-500">Paste a Tappytoon episode URL above and click "Scrape Episode".</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Download Queue ({items.length})
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <QueueItemCard key={item.id} item={item} onRetry={onRetry} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
};

const QueueItemCard: React.FC<{
  item: QueueItemRecord;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ item, onRetry, onRemove }) => {
  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zipBlob = await generateQueueItemZip(item.id);
      const zipName = `${sanitizeFilename(item.seriesTitle)}_${sanitizeFilename(item.episodeTitle)}.zip`;
      triggerBlobDownload(zipBlob, zipName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Failed to generate ZIP: ${msg}`);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-100">{item.seriesTitle}</h3>
          <p className="text-xs text-slate-300 font-medium">{item.episodeTitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status={item.status} />
        </div>
      </div>

      {item.status === 'Processing' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Progress</span>
            <span>{item.progress}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-rose-500 h-2 transition-all duration-300 ease-out"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      )}

      {item.errorMessage && (
        <div className="bg-rose-950/40 border border-rose-900/60 rounded-lg p-2.5 text-xs text-rose-300 leading-relaxed">
          {item.errorMessage}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60 text-xs text-slate-400">
        <div>
          {item.imageCount !== undefined ? `${item.imageCount} images` : 'Image count unknown'}
        </div>

        <div className="flex items-center space-x-2">
          {item.status === 'Completed' && (
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors shadow"
            >
              {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{isZipping ? 'Zipping...' : 'Download ZIP'}</span>
            </button>
          )}

          {item.status === 'Failed' && (
            <button
              type="button"
              onClick={() => onRetry(item.id)}
              className="flex items-center space-x-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-2.5 py-1.5 rounded-lg transition-colors border border-slate-600"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-medium px-2.5 py-1.5 rounded-lg transition-colors border border-slate-700"
            title="Remove from queue"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: QueueItemRecord['status'] }> = ({ status }) => {
  switch (status) {
    case 'Waiting':
      return (
        <span className="inline-flex items-center text-xs font-medium text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
          <Clock className="w-3 h-3 mr-1" /> Waiting
        </span>
      );
    case 'Processing':
      return (
        <span className="inline-flex items-center text-xs font-medium text-sky-400 bg-sky-950/60 border border-sky-800/80 px-2.5 py-0.5 rounded-full">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing
        </span>
      );
    case 'Completed':
      return (
        <span className="inline-flex items-center text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
        </span>
      );
    case 'Failed':
      return (
        <span className="inline-flex items-center text-xs font-medium text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2.5 py-0.5 rounded-full">
          <AlertCircle className="w-3 h-3 mr-1" /> Failed
        </span>
      );
  }
};
