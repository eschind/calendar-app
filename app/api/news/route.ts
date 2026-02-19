import { NextRequest, NextResponse } from 'next/server';

const RSS_URL = 'https://news.google.com/rss/search?q=Manchester+United&hl=en-US&gl=US&ceid=US:en';

type NewsLabel = 'Results' | 'Transfers' | 'Other';

interface NewsItem {
  title: string;
  source: string;
  description: string;
  link: string;
  pubDate: string;
  label: NewsLabel;
}

let cache: { items: NewsItem[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function extractTag(xml: string, tag: string): string {
  // Try CDATA first, then plain content
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`);
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  const plainRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const plainMatch = plainRegex.exec(xml);
  return plainMatch ? plainMatch[1].trim() : '';
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(html: string): string {
  return decodeEntities(html)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const RESULTS_PATTERNS = /\b(score|scores|scored|goal|goals|win|wins|won|defeat|defeated|loss|lose|lost|draw|drew|match report|highlights|man of the match|clean sheet|penalty|red card|yellow card|var |offside|\d+-\d+|matchday|full.?time|half.?time|premier league.*result|result.*premier league|comeback|equaliser|equalizer|stoppage.?time|injury.?time|hat.?trick|assists?|lineup|line.?up|starting xi|team sheet|bench|substitut)/i;
const TRANSFERS_PATTERNS = /\b(transfer|transfers|sign|signs|signed|signing|deal|deals|loan|loaned|bid|bids|offer|offers|target|targets|swap|fee|contract|extension|renew|renewal|release clause|free agent|deadline day|window|hijack|agree|agreed|agreement|personal terms|medical|announce|announcement|confirm|confirmed|depart|departure|exit|leave|leaving|sold|sell|buy|buying|purchase|enquiry|inquiry|approach|negotiat|wage|salary|clause|buyout|option|permanent|recall|scout|scouting|shortlist|wishlist|interested|interest|chase|chasing|linked|link|move|moves|moving|join|joining|joined|swap|replace|replacement|summer|january|winter)\b/i;

function categorize(title: string, description: string): NewsLabel {
  const text = `${title} ${description}`;
  if (RESULTS_PATTERNS.test(text)) return 'Results';
  if (TRANSFERS_PATTERNS.test(text)) return 'Transfers';
  return 'Other';
}

async function fetchAndParseRSS(): Promise<NewsItem[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.items;
  }

  const response = await fetch(RSS_URL);
  const xml = await response.text();

  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = stripHtml(extractTag(itemXml, 'title'));
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    const description = stripHtml(extractTag(itemXml, 'description'));
    const source = stripHtml(extractTag(itemXml, 'source'));

    const label = categorize(title, description);
    items.push({ title, source, description, link, pubDate, label });
  }

  cache = { items, fetchedAt: Date.now() };
  return items;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const allItems = await fetchAndParseRSS();
    const start = (page - 1) * limit;
    const paginatedItems = allItems.slice(start, start + limit);

    return NextResponse.json({
      items: paginatedItems,
      hasMore: start + limit < allItems.length,
      total: allItems.length,
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
