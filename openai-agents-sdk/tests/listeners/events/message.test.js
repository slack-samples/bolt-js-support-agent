import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

import { handleMessage } from '../../../listeners/events/message.js';
import { conversationStore } from '../../../thread-context/index.js';

describe('handleMessage', () => {
  let args;

  beforeEach(() => {
    conversationStore.setHistory('C123', '1.0', []);
    args = {
      client: {},
      context: { botUserId: 'UBOT', userId: 'U123' },
      logger: { error: mock.fn() },
      say: mock.fn(async () => {}),
      sayStream: mock.fn(),
      setStatus: mock.fn(async () => {
        throw new Error('stop before running the agent');
      }),
    };
  });

  it('handles a thread reply in a thread the agent is part of', async () => {
    const event = {
      channel: 'C123',
      channel_type: 'channel',
      text: 'and then?',
      thread_ts: '1.0',
      ts: '2.0',
      user: 'U123',
    };
    await handleMessage({ ...args, event });
    assert.strictEqual(args.setStatus.mock.callCount(), 1);
  });

  it('skips a thread reply that mentions the agent, which app_mention answers', async () => {
    const event = {
      channel: 'C123',
      channel_type: 'channel',
      text: '<@UBOT> and then?',
      thread_ts: '1.0',
      ts: '2.0',
      user: 'U123',
    };
    await handleMessage({ ...args, event });
    assert.strictEqual(args.setStatus.mock.callCount(), 0);
  });

  it('handles a DM that mentions the agent, since app_mention skips DMs', async () => {
    const event = {
      channel: 'D123',
      channel_type: 'im',
      text: '<@UBOT> help',
      ts: '3.0',
      user: 'U123',
    };
    await handleMessage({ ...args, client: { reactions: { add: mock.fn(async () => {}) } }, event });
    assert.strictEqual(args.setStatus.mock.callCount(), 1);
  });
});
