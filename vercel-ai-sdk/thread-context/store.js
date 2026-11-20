import { getCache } from '@vercel/functions';

/**
 * Conversation history store backed by Vercel Runtime Cache, with an in-memory fallback outside Vercel.
 */
export class ConversationStore {
  /**
   * @param {import('@vercel/functions').RuntimeCache} [cache]
   * @param {number} [ttlSeconds=86400]
   */
  constructor(cache = getCache({ namespace: 'thread-context' }), ttlSeconds = 86400) {
    /** @private @type {import('@vercel/functions').RuntimeCache} */
    this._cache = cache;
    /** @private @type {number} */
    this._ttlSeconds = ttlSeconds;
  }

  /**
   * @param {string} channelId
   * @param {string} threadTs
   * @param {string} userId
   * @returns {Promise<import('ai').ModelMessage[] | null>}
   */
  async getHistory(channelId, threadTs, userId) {
    const key = `${channelId}:${threadTs}:${userId}`;
    const messages = await this._cache.get(key);
    if (!messages) return null;
    return /** @type {import('ai').ModelMessage[]} */ (messages);
  }

  /**
   * @param {string} channelId
   * @param {string} threadTs
   * @param {string} userId
   * @param {import('ai').ModelMessage[]} messages
   * @returns {Promise<void>}
   */
  async setHistory(channelId, threadTs, userId, messages) {
    const key = `${channelId}:${threadTs}:${userId}`;
    await this._cache.set(key, messages, { ttl: this._ttlSeconds });
  }
}
