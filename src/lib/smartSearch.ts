import { LogisticsDictionaryItem } from '../types';

export interface RankedProduct extends LogisticsDictionaryItem { score: number; matchReason: string; }

const normalize = (value: string) => value.toLocaleLowerCase('he').replace(/["'׳״.,/\\-]/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = (value: string) => normalize(value).split(' ').filter(Boolean);

export function rankProducts(query: string, dictionary: LogisticsDictionaryItem[], customerHistory: string[] = []): RankedProduct[] {
  const q = normalize(query);
  if (q.length < 3) return [];
  const qTokens = tokens(q);
  const history = customerHistory.map(normalize);
  return dictionary.map((item) => {
    const name = normalize(item.productName);
    const keywords = normalize(item.keywords || '');
    const searchable = `${name} ${keywords}`;
    const exact = searchable.includes(q) ? 62 : 0;
    const tokenScore = qTokens.reduce((sum, token) => sum + (searchable.includes(token) ? 18 : 0), 0);
    const prefix = name.startsWith(q) ? 18 : 0;
    const historyBoost = history.some((entry) => entry.includes(normalize(item.sku)) || entry.includes(name)) ? 22 : 0;
    const score = exact + tokenScore + prefix + historyBoost;
    return { ...item, score, matchReason: historyBoost ? 'נרכש בעבר אצל הלקוח' : keywords && keywords.includes(q) ? 'התאמת מילת סלנג' : 'התאמת שם מוצר' };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 6);
}

export function contextualFallback(query: string, dictionary: LogisticsDictionaryItem[]): RankedProduct | null {
  const q = normalize(query);
  if (!q || !/(קרמיק|דבק|glue|ceramic)/i.test(q)) return null;
  const item = dictionary.find((entry) => /109|כרמית/.test(`${entry.sku} ${entry.productName}`)) || dictionary.find((entry) => /דבק/.test(entry.productName));
  return item ? { ...item, score: 70, matchReason: 'הצעה כללית — נדרשת בדיקת אנוש' } : null;
}

export function extractLearningTerm(rawText: string, productName: string) {
  const cleaned = rawText.replace(new RegExp(productName, 'ig'), '').replace(/[^א-תA-Za-z0-9 ]/g, ' ').trim();
  return cleaned.split(/\s+/).filter((word) => word.length >= 3).slice(0, 3).join(' ');
}

export const normalizeSearchText = normalize;
