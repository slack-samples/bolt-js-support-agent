import type { AgentInputItem } from '@openai/agents';

interface StoreEntry {
  messages: AgentInputItem[];
  timestamp: number;
}

export class ConversationStore {
  private _store: Map<string, StoreEntry>;
  private _ttlSeconds: number;
  private _maxConversations: number;

  constructor(ttlSeconds = 86400, maxConversations = 1000) {
    this._store = new Map();
    this._ttlSeconds = ttlSeconds;
    this._maxConversations = maxConversations;
  }

  getHistory(channelId: string, threadTs: string): AgentInputItem[] | null {
    const key = `${channelId}:${threadTs}`;
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this._ttlSeconds * 1000) {
      this._store.delete(key);
      return null;
    }
    return entry.messages;
  }

  setHistory(channelId: string, threadTs: string, messages: AgentInputItem[]): void {
    const key = `${channelId}:${threadTs}`;
    this._store.set(key, {
      messages,
      timestamp: Date.now(),
    });
    this._cleanup();
  }

  private _cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this._store) {
      if (now - entry.timestamp > this._ttlSeconds * 1000) {
        this._store.delete(key);
      }
    }
    if (this._store.size > this._maxConversations) {
      const sorted = [...this._store.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = sorted.slice(0, this._store.size - this._maxConversations);
      for (const [key] of toRemove) {
        this._store.delete(key);
      }
    }
  }
}
