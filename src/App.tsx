import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { UrlInput } from './components/UrlInput';
import { EpisodePreview } from './components/EpisodePreview';
import { QueueList } from './components/QueueList';
import { IntegrationInfo } from './components/IntegrationInfo';
import { LoginModal } from './components/LoginModal';
import { parseTappytoonUrl, ParsedTappytoonUrl } from './services/tappytoonUrl';
import { TappytoonAdapter, EpisodeMetadata } from './services/tappytoonAdapter';
import { TappytoonAuthService, AuthUser } from './services/tappytoonAuth';
import { QueueManager } from './services/queueManager';
import { QueueItemRecord } from './services/db';

export default function App() {
  const [url, setUrl] = useState<string>('');
  const [parsedUrl, setParsedUrl] = useState<ParsedTappytoonUrl>({ isValid: false, rawUrl: '' });
  const [metadata, setMetadata] = useState<EpisodeMetadata | undefined>(undefined);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [queueItems, setQueueItems] = useState<QueueItemRecord[]>([]);
  const [alertError, setAlertError] = useState<string | null>(null);

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => TappytoonAuthService.isLoggedIn());
  const [user, setUser] = useState<AuthUser | null>(() => TappytoonAuthService.getUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [pendingUrl, setPendingUrl] = useState<string | undefined>(undefined);

  const queueManager = QueueManager.getInstance();

  useEffect(() => {
    const unsubscribe = queueManager.subscribe((items) => {
      setQueueItems(items);
    });
    return () => unsubscribe();
  }, [queueManager]);

  const loadPreview = useCallback((inputUrl: string) => {
    if (!inputUrl.trim()) {
      setParsedUrl({ isValid: false, rawUrl: '' });
      setMetadata(undefined);
      setAlertError(null);
      return;
    }

    const parsed = parseTappytoonUrl(inputUrl);
    setParsedUrl(parsed);
    setAlertError(null);

    if (parsed.isValid && parsed.canonicalUrl) {
      setIsPreviewLoading(true);
      TappytoonAdapter.fetchMetadata(parsed)
        .then((data) => setMetadata(data))
        .catch(() => setMetadata(undefined))
        .finally(() => setIsPreviewLoading(false));
    } else {
      setMetadata(undefined);
    }
  }, []);

  useEffect(() => {
    loadPreview(url);
  }, [url, loadPreview]);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
        }
      }
    } catch {
      // Clipboard permissions ignored or unavailable
    }
  };

  const handleClear = () => {
    setUrl('');
    setParsedUrl({ isValid: false, rawUrl: '' });
    setMetadata(undefined);
    setAlertError(null);
  };

  const handleScrape = async () => {
    if (!url) return;

    if (metadata?.accessStatus === 'login_required' && !isLoggedIn) {
      setPendingUrl(url);
      setIsLoginModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setAlertError(null);
    try {
      await queueManager.addToQueue(url);
      handleClear();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Authentication required') || msg.includes('log in')) {
        setPendingUrl(url);
        setIsLoginModalOpen(true);
      } else {
        setAlertError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    TappytoonAuthService.logout();
    setIsLoggedIn(false);
    setUser(null);
    if (url) {
      loadPreview(url);
    }
  };

  const handleLoginSuccess = async () => {
    setIsLoggedIn(true);
    setUser(TappytoonAuthService.getUser());

    const targetUrl = pendingUrl || url;
    if (targetUrl) {
      setIsSubmitting(true);
      setAlertError(null);
      try {
        await queueManager.addToQueue(targetUrl);
        setPendingUrl(undefined);
        handleClear();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setAlertError(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {alertError && (
          <div className="bg-rose-900/60 border border-rose-700 text-rose-200 px-4 py-3 rounded-xl text-sm flex items-center justify-between shadow-lg">
            <span>{alertError}</span>
            <button
              onClick={() => setAlertError(null)}
              className="text-rose-300 hover:text-white font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        <UrlInput
          url={url}
          setUrl={setUrl}
          onPaste={handlePaste}
          onClear={handleClear}
          onScrape={handleScrape}
          isSubmitting={isSubmitting}
        />

        {url.trim().length > 0 && (
          <EpisodePreview
            parsedUrl={parsedUrl}
            metadata={metadata}
            isLoading={isPreviewLoading}
            onPromptLogin={() => {
              setPendingUrl(url);
              setIsLoginModalOpen(true);
            }}
          />
        )}

        <QueueList
          items={queueItems}
          onRetry={(id) => queueManager.retryItem(id)}
          onRemove={(id) => queueManager.removeItem(id)}
        />

        <IntegrationInfo />
      </main>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setPendingUrl(undefined);
        }}
        onSuccess={handleLoginSuccess}
        pendingUrl={pendingUrl}
      />

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        Tappytoon Scraper Web App • Responsive Android & Desktop Interface
      </footer>
    </div>
  );
}
