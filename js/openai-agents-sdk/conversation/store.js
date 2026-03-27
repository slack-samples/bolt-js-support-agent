export class ConversationStore {
  constructor(ttlSeconds = 86400, maxConversations = 1000) {
    this._store = new Map();
    this._ttlSeconds = ttlSeconds;
    this._maxConversations = maxConversations;
  }

  getHistory(channelId, threadTs) {
    const key = `${channelId}:${threadTs}`;
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this._ttlSeconds * 1000) {
      this._store.delete(key);
      return null;
    }
    return entry.messages;
  }

  setHistory(channelId, threadTs, messages) {
    const key = `${channelId}:${threadTs}`;
    this._store.set(key, {
      messages,
      timestamp: Date.now(),
    });
    this._cleanup();
  }

  _cleanup() {
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
