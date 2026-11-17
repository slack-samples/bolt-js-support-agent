import assert from 'node:assert';
import { afterEach, describe, it, mock } from 'node:test';

import { handleAppMentioned } from '../../../listeners/events/app-mentioned.js';
import { sessionStore } from '../../../thread-context/index.js';

describe('handleAppMentioned', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('looks up a separate session for a second person who mentions the agent in a thread', async () => {
    sessionStore.setSession('C123', '1.0', 'U123', 'session-1');
    const lookup = mock.method(sessionStore, 'getSession', () => {
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
    assert.strictEqual(sessionStore.getSession('C123', '1.0', 'U123'), 'session-1');
  });
});
