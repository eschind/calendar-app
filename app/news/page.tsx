'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

type NewsLabel = 'Results' | 'Transfers' | 'Other';

const ALL_LABELS: NewsLabel[] = ['Results', 'Transfers', 'Other'];

const LABEL_STYLES: Record<NewsLabel, { bg: string; text: string; activeBg: string; activeText: string }> = {
  Results: { bg: '#E8F5E9', text: '#2E7D32', activeBg: '#2E7D32', activeText: '#FFFFFF' },
  Transfers: { bg: '#F3E5F5', text: '#7B1FA2', activeBg: '#7B1FA2', activeText: '#FFFFFF' },
  Other: { bg: '#ECEFF1', text: '#546E7A', activeBg: '#546E7A', activeText: '#FFFFFF' },
};

interface NewsItem {
  title: string;
  source: string;
  description: string;
  link: string;
  pubDate: string;
  label: NewsLabel;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedLabels, setSelectedLabels] = useState<Set<NewsLabel>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const filteredArticles = useMemo(() => {
    if (selectedLabels.size === 0) return articles;
    return articles.filter((a: NewsItem) => selectedLabels.has(a.label));
  }, [articles, selectedLabels]);

  const toggleLabel = (label: NewsLabel) => {
    setSelectedLabels((prev: Set<NewsLabel>) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const fetchNews = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/news?page=${pageNum}&limit=10`);
      const data = await res.json();
      setArticles(prev => pageNum === 1 ? data.items : [...prev, ...data.items]);
      setHasMore(data.hasMore);
      setPage(pageNum + 1);
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchNews(1);
  }, [fetchNews]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          fetchNews(page);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, page, fetchNews]);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <h1 className="text-2xl font-bold mb-6 uppercase tracking-wide" style={{ color: '#1A1A1A' }}>
          Latest News
        </h1>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {ALL_LABELS.map(label => {
            const isSelected = selectedLabels.has(label);
            const s = LABEL_STYLES[label];
            return (
              <button
                key={label}
                onClick={() => toggleLabel(label)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: isSelected ? s.activeBg : s.bg,
                  color: isSelected ? s.activeText : s.text,
                  border: `1.5px solid ${isSelected ? s.activeBg : s.text}`,
                }}
              >
                {label}
                {isSelected && <span style={{ fontSize: '0.7rem', lineHeight: 1 }}>✕</span>}
              </button>
            );
          })}
          {selectedLabels.size > 0 && (
            <button
              onClick={() => setSelectedLabels(new Set())}
              className="text-xs font-medium px-2 py-1.5 underline underline-offset-2"
              style={{ color: '#999999' }}
            >
              Clear all
            </button>
          )}
        </div>

        {initialLoad ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-md border p-5 animate-pulse"
                style={{ borderColor: '#E5E5E5' }}
              >
                <div className="h-3 bg-gray-100 rounded w-1/4 mb-3" />
                <div className="h-5 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredArticles.map((article, index) => (
              <a
                key={`${article.link}-${index}`}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-md border p-5 transition-all hover:shadow-md"
                style={{ borderColor: '#E5E5E5' }}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {article.source && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{ backgroundColor: '#DA291C', color: '#FFFFFF' }}
                      >
                        {article.source}
                      </span>
                    )}
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: LABEL_STYLES[article.label].bg,
                        color: LABEL_STYLES[article.label].text,
                      }}
                    >
                      {article.label}
                    </span>
                    <span className="text-xs ml-auto" style={{ color: '#999999' }}>
                      {formatDate(article.pubDate)}
                    </span>
                  </div>
                  <h2 className="text-base font-bold leading-snug" style={{ color: '#1A1A1A' }}>
                    {article.title}
                  </h2>
                  {article.description && (
                    <p className="text-sm line-clamp-2" style={{ color: '#666666' }}>
                      {article.description}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-10" />

        {loading && !initialLoad && (
          <div className="flex justify-center py-8">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: '#DA291C', borderTopColor: 'transparent' }}
            />
          </div>
        )}

        {!hasMore && filteredArticles.length > 0 && (
          <p className="text-center py-8 text-xs uppercase tracking-wider" style={{ color: '#BBBBBB' }}>
            End of articles
          </p>
        )}

        {!initialLoad && filteredArticles.length === 0 && (
          <p className="text-center py-8 text-base" style={{ color: '#999999' }}>
            {selectedLabels.size > 0 ? 'No articles match the selected filters.' : 'No news articles found.'}
          </p>
        )}
      </div>
    </div>
  );
}
