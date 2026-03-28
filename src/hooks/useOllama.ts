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

const PROXY = '/ollama';

export function useOllama(_userUrl: string, selectedModel: string): OllamaState {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [connected, setConnected] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Refs so generate() always reads fresh values — no stale closures
  const connectedRef = useRef(false);
  const modelRef = useRef('');
  connectedRef.current = connected;
  modelRef.current = selectedModel;

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

  // generate is stable (empty deps) — reads everything from refs
  const generate = useCallback(
    async (
      maxCharsPerLine: number,
      maxLines: number,
      userPrompt?: string,
    ): Promise<string | null> => {
      const model = modelRef.current;
      const isConnected = connectedRef.current;

      if (!isConnected || !model) {
        setError(!isConnected ? 'Not connected to Ollama' : 'No model selected');
        return null;
      }

      // Abort any in-flight request
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

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

        const res = await fetch(`${PROXY}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            stream: false,
            options: { temperature: 0.9, num_predict: totalChars + 30 },
          }),
          signal: ac.signal,
        });

        if (res.status === 429) {
          // Wait and retry once
          await new Promise((r) => setTimeout(r, 3000));
          if (ac.signal.aborted) return null;
          const retry = await fetch(`${PROXY}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              prompt,
              stream: false,
              options: { temperature: 0.9, num_predict: totalChars + 30 },
            }),
            signal: ac.signal,
          });
          if (!retry.ok) throw new Error(`Ollama returned ${retry.status}`);
          const d = await retry.json();
          return (d.response || '').trim().replace(/^["']|["']$/g, '') || null;
        }

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`Ollama ${res.status}: ${body.slice(0, 100)}`);
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
        setGenerating(false);
      }
    },
    [], // Stable! Reads from refs.
  );

  return { models, connected, generating, error, generate, refresh: fetchModels };
}
