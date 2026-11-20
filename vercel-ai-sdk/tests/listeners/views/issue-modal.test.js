import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

import { handleIssueSubmission } from '../../../listeners/views/issue-modal.js';

describe('handleIssueSubmission', () => {
  let fakeAck;
  let fakeBody;
  let fakeContext;
  let fakeClient;
  let fakeLogger;

  beforeEach(() => {
    fakeAck = mock.fn(async () => {});
    fakeBody = {
      view: {
        state: {
          values: {
            category_block: { category_select: { selected_option: { value: 'Network Issues' } } },
            description_block: { description_input: { value: 'WiFi keeps dropping' } },
          },
        },
      },
    };
    fakeContext = { userId: 'U123' };
    fakeClient = {
      conversations: { open: mock.fn(async () => ({ channel: { id: 'D123' } })) },
      chat: { postMessage: mock.fn(async () => ({ ok: true })) },
    };
    fakeLogger = { error: mock.fn() };
  });

  it('acknowledges the submission', async () => {
    await handleIssueSubmission({
      ack: fakeAck,
      body: fakeBody,
      client: fakeClient,
      context: fakeContext,
      logger: fakeLogger,
    });
    assert.strictEqual(fakeAck.mock.callCount(), 1);
  });

  it('opens a DM conversation with the user', async () => {
    await handleIssueSubmission({
      ack: fakeAck,
      body: fakeBody,
      client: fakeClient,
      context: fakeContext,
      logger: fakeLogger,
    });
    assert.strictEqual(fakeClient.conversations.open.mock.callCount(), 1);
    const callArgs = fakeClient.conversations.open.mock.calls[0].arguments[0];
    assert.strictEqual(callArgs.users, 'U123');
  });

  it('posts message with category, description, and metadata', async () => {
    await handleIssueSubmission({
      ack: fakeAck,
      body: fakeBody,
      client: fakeClient,
      context: fakeContext,
      logger: fakeLogger,
    });
    assert.strictEqual(fakeClient.chat.postMessage.mock.callCount(), 1);
    const callArgs = fakeClient.chat.postMessage.mock.calls[0].arguments[0];
    assert.strictEqual(callArgs.channel, 'D123');
    assert.ok(callArgs.text.includes('Network Issues'));
    assert.ok(callArgs.text.includes('WiFi keeps dropping'));
    assert.strictEqual(callArgs.metadata.event_type, 'issue_submission');
  });

  it('logs error when conversations.open fails', async () => {
    fakeClient.conversations.open = mock.fn(async () => {
      throw new Error('API error');
    });
    await handleIssueSubmission({
      ack: fakeAck,
      body: fakeBody,
      client: fakeClient,
      context: fakeContext,
      logger: fakeLogger,
    });
    assert.strictEqual(fakeLogger.error.mock.callCount(), 1);
  });
});
