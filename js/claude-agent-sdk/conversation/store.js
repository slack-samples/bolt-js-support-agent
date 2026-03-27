export class SessionStore {
  constructor(ttlSeconds = 86400, maxEntries = 1000) {
    this._store = new Map();
    this._ttlSeconds = ttlSeconds;
    this._maxEntries = maxEntries;
  }

  getSession(channelId, threadTs) {
    const key = `${channelId}:${threadTs}`;
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this._ttlSeconds * 1000) {
      this._store.delete(key);
      return null;
    }
    return entry.sessionId;
  }

  setSession(channelId, threadTs, sessionId) {
    const key = `${channelId}:${threadTs}`;
    this._store.set(key, {
      sessionId,
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
    if (this._store.size > this._maxEntries) {
      const sorted = [...this._store.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = sorted.slice(0, this._store.size - this._maxEntries);
      for (const [key] of toRemove) {
        this._store.delete(key);
      }
    }
  }
}
