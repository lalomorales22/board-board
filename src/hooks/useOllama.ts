import { useState, useEffect, useCallback, useRef } from 'react';
import type { OllamaModel } from '../types';

export interface OllamaState {
  models: OllamaModel[];
  connected: boolean;
  generating: boolean;
  error: string | null;
  generate: (maxCharsPerLine: number, maxLines: number, userPrompt?: string) => Promise<string | null>;
  refresh: () => Promise<void>;
}

// Use the Vite proxy to avoid CORS — all requests go through /ollama/*
const PROXY = '/ollama';

const MAX_RETRIES = 2;
const RETRY_BASE_MS = 2000;

async function fetchRetry(url: string, init: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init);
    if (res.status === 429 && attempt < retries) {
      const wait = RETRY_BASE_MS * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    return res;
  }
  throw new Error('Rate limited — try again in a moment');
}

export function useOllama(_userUrl: string, selectedModel: string): OllamaState {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [connected, setConnected] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch(`${PROXY}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setModels(data.models || []);
      setConnected(true);
      setError(null);
    } catch (e: unknown) {
      setConnected(false);
      setModels([]);
      if (e instanceof Error && e.name !== 'AbortError') {
        setError('Cannot reach Ollama. Is it running?');
      }
    }
  }, []);

  useEffect(() => {
    fetchModels();
    const iv = setInterval(fetchModels, 30000);
    return () => clearInterval(iv);
  }, [fetchModels]);

  const generate = useCallback(
    async (maxCharsPerLine: number, maxLines: number, userPrompt?: string): Promise<string | null> => {
      if (!connected || !selectedModel) return null;
      if (busyRef.current) return null;

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      busyRef.current = true;
      setGenerating(true);
      setError(null);

      try {
        const totalChars = maxCharsPerLine * maxLines;
        const sizeConstraint =
          maxLines > 1
            ? `Maximum ${maxCharsPerLine} characters per line, up to ${maxLines} lines. Use newline characters to separate lines.`
            : `Maximum ${totalChars} characters total.`;

        let prompt: string;
        if (userPrompt) {
          prompt =
            `You are a split-flap display board. Respond with a short, punchy phrase that fits on the board. ` +
            `${sizeConstraint} ` +
            `Keep it witty, clever, and concise. Only output the display text, nothing else. No quotes, no explanation.\n\n` +
            `User: ${userPrompt}`;
        } else {
          prompt =
            `Generate one short motivational or witty phrase for a split-flap display board. ` +
            `${sizeConstraint} ` +
            `Be creative and inspiring — not cheesy. Just the phrase, nothing else. No quotes.`;
        }

        const res = await fetchRetry(
          `${PROXY}/api/generate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: selectedModel,
              prompt,
              stream: false,
              options: { temperature: 0.9, num_predict: totalChars + 30 },
            }),
            signal: ac.signal,
          },
        );

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`Ollama returned ${res.status}: ${body.slice(0, 120)}`);
        }

        const data = await res.json();
        const raw = (data.response || '').trim().replace(/^["']|["']$/g, '');
        return raw || null;
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError(e.message);
        }
        return null;
      } finally {
        busyRef.current = false;
        setGenerating(false);
      }
    },
    [connected, selectedModel],
  );

  return { models, connected, generating, error, generate, refresh: fetchModels };
}
