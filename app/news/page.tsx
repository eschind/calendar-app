'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type NewsLabel = 'Results' | 'Transfers' | 'Other';

const LABEL_STYLES: Record<NewsLabel, { bg: string; text: string }> = {
  Results: { bg: '#E8F5E9', text: '#2E7D32' },
  Transfers: { bg: '#F3E5F5', text: '#7B1FA2' },
  Other: { bg: '#ECEFF1', text: '#546E7A' },
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
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

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
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-8 uppercase tracking-wide" style={{ color: '#1A1A1A' }}>
          Latest News
        </h1>

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
            {articles.map((article, index) => (
              <a
                key={`${article.link}-${index}`}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-md border p-5 transition-all hover:shadow-md"
                style={{ borderColor: '#E5E5E5' }}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
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
                    </div>
                    <span className="text-xs" style={{ color: '#999999' }}>
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

        {!hasMore && articles.length > 0 && (
          <p className="text-center py-8 text-xs uppercase tracking-wider" style={{ color: '#BBBBBB' }}>
            End of articles
          </p>
        )}

        {!initialLoad && articles.length === 0 && (
          <p className="text-center py-8 text-base" style={{ color: '#999999' }}>
            No news articles found.
          </p>
        )}
      </div>
    </div>
  );
}
