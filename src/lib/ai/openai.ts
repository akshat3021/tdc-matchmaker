import { env } from '@/lib/env';

export class AiUnavailableError extends Error {}

/**
 * Minimal OpenAI chat-completions client (JSON mode). Uses fetch directly to
 * keep the dependency surface small and to enforce a hard timeout.
 * The key is read server-side only and never reaches the browser.
 */
export async function chatJson(system: string, user: string, timeoutMs = 20000): Promise<unknown> {
  if (!env.openAiKey) throw new AiUnavailableError('OPENAI_API_KEY not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.openAiKey}` },
      body: JSON.stringify({
        model: env.openAiModel,
        temperature: 0.7,
        max_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new AiUnavailableError(`OpenAI responded ${res.status}`);
    const body = await res.json();
    const text: string | undefined = body?.choices?.[0]?.message?.content;
    if (!text) throw new AiUnavailableError('Empty completion');
    return JSON.parse(text);
  } catch (err) {
    if (err instanceof AiUnavailableError) throw err;
    throw new AiUnavailableError(err instanceof Error ? err.message : 'AI request failed');
  } finally {
    clearTimeout(timer);
  }
}
