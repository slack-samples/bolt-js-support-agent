import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

import { handleAssistantThreadStarted } from '../../../listeners/events/assistant-thread-started.js';

describe('handleAssistantThreadStarted', () => {
  let fakeClient;
  let fakeEvent;
  let fakeLogger;

  beforeEach(() => {
    fakeClient = {
      assistant: { threads: { setSuggestedPrompts: mock.fn(async () => ({ ok: true })) } },
    };
    fakeEvent = { assistant_thread: { channel_id: 'C123', thread_ts: '1234.5678' } };
    fakeLogger = { error: mock.fn() };
  });

  it('sets suggested prompts with correct channel and thread', async () => {
    await handleAssistantThreadStarted({ client: fakeClient, event: fakeEvent, logger: fakeLogger });
    assert.strictEqual(fakeClient.assistant.threads.setSuggestedPrompts.mock.callCount(), 1);
    const callArgs = fakeClient.assistant.threads.setSuggestedPrompts.mock.calls[0].arguments[0];
    assert.strictEqual(callArgs.channel_id, 'C123');
    assert.strictEqual(callArgs.thread_ts, '1234.5678');
  });

  it('includes prompts array with expected entries', async () => {
    await handleAssistantThreadStarted({ client: fakeClient, event: fakeEvent, logger: fakeLogger });
    const callArgs = fakeClient.assistant.threads.setSuggestedPrompts.mock.calls[0].arguments[0];
    assert.strictEqual(callArgs.prompts.length, 3);
    assert.ok(callArgs.title);
  });

  it('logs error when setSuggestedPrompts fails', async () => {
    fakeClient.assistant.threads.setSuggestedPrompts = mock.fn(async () => {
      throw new Error('API error');
    });
    await handleAssistantThreadStarted({ client: fakeClient, event: fakeEvent, logger: fakeLogger });
    assert.strictEqual(fakeLogger.error.mock.callCount(), 1);
  });
});
