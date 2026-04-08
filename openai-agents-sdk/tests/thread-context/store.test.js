import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

import { ConversationStore } from '../../thread-context/store.js';

describe('ConversationStore', () => {
  let store;

  beforeEach(() => {
    store = new ConversationStore();
  });

  it('stores and retrieves history', () => {
    const messages = [{ role: 'user', content: 'hi' }];
    store.setHistory('C1', 'T1', messages);
    assert.deepStrictEqual(store.getHistory('C1', 'T1'), messages);
  });

  it('returns null for missing key', () => {
    assert.strictEqual(store.getHistory('C1', 'T99'), null);
  });

  it('keeps different threads independent', () => {
    const msgs1 = [{ role: 'user', content: 'hello' }];
    const msgs2 = [{ role: 'user', content: 'world' }];
    store.setHistory('C1', 'T1', msgs1);
    store.setHistory('C1', 'T2', msgs2);
    assert.deepStrictEqual(store.getHistory('C1', 'T1'), msgs1);
    assert.deepStrictEqual(store.getHistory('C1', 'T2'), msgs2);
  });

  it('expires entries after TTL', async () => {
    const shortStore = new ConversationStore(0);
    shortStore.setHistory('C1', 'T1', [{ role: 'user', content: 'hi' }]);
    // Need a tiny delay to ensure Date.now() advances past the stored timestamp
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.strictEqual(shortStore.getHistory('C1', 'T1'), null);
  });

  it('evicts oldest entries when max is exceeded', () => {
    const smallStore = new ConversationStore(86400, 2);
    smallStore.setHistory('C1', 'T1', [{ role: 'user', content: '1' }]);
    smallStore.setHistory('C1', 'T2', [{ role: 'user', content: '2' }]);
    smallStore.setHistory('C1', 'T3', [{ role: 'user', content: '3' }]);
    assert.strictEqual(smallStore.getHistory('C1', 'T1'), null);
    assert.deepStrictEqual(smallStore.getHistory('C1', 'T2'), [{ role: 'user', content: '2' }]);
    assert.deepStrictEqual(smallStore.getHistory('C1', 'T3'), [{ role: 'user', content: '3' }]);
  });

  it('overwrites existing key', () => {
    store.setHistory('C1', 'T1', [{ role: 'user', content: 'old' }]);
    store.setHistory('C1', 'T1', [{ role: 'user', content: 'new' }]);
    assert.deepStrictEqual(store.getHistory('C1', 'T1'), [{ role: 'user', content: 'new' }]);
  });
});
