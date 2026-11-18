import assert from 'node:assert';
import { afterEach, describe, it, mock } from 'node:test';

import { handleAppMentioned } from '../../../listeners/events/app-mentioned.js';
import { conversationStore } from '../../../thread-context/index.js';

describe('handleAppMentioned', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('looks up a separate session for a second person who mentions the agent in a thread', async () => {
    conversationStore.setHistory('C123', '1.0', 'U123', [{ role: 'user', content: 'first' }]);
    const lookup = mock.method(conversationStore, 'getHistory', () => {
      throw new Error('stop before running the agent');
    });
    await handleAppMentioned({
      client: { reactions: { add: mock.fn(async () => {}) } },
      context: { botUserId: 'UBOT', userId: 'U456' },
      event: { channel: 'C123', text: '<@UBOT> what did you find?', thread_ts: '1.0', ts: '3.0', user: 'U456' },
      logger: { error: mock.fn() },
      say: mock.fn(async () => {}),
      sayStream: mock.fn(),
      setStatus: mock.fn(async () => {}),
    });
    assert.deepStrictEqual(lookup.mock.calls[0].arguments, ['C123', '1.0', 'U456']);
    mock.restoreAll();
    assert.deepStrictEqual(conversationStore.getHistory('C123', '1.0', 'U123'), [{ role: 'user', content: 'first' }]);
  });
});
