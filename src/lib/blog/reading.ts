/**
 * Reading metrics — word count and reading-time estimates.
 *
 * 230 wpm is the median for adult readers of long-form web prose (Brysbaert
 * 2019). Bumped slightly for educational content where readers skim heavy
 * portions. Tweak the constant rather than per-call overrides — consistency
 * across blog posts matters more than precise per-post calibration.
 */

const WORDS_PER_MINUTE = 230;
const TAG_RE = /<[^>]+>/g;
const WHITESPACE_RE = /\s+/g;

export interface ReadingMetrics {
  wordCount: number;
  minutes: number;
}

export function readingMetrics(body: string): ReadingMetrics {
  const text = stripBody(body);
  if (!text) return { wordCount: 0, minutes: 0 };
  const wordCount = text.split(WHITESPACE_RE).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
  return { wordCount, minutes };
}

function stripBody(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks (MDX)
    .replace(TAG_RE, " ")
    .replace(WHITESPACE_RE, " ")
    .trim();
}
