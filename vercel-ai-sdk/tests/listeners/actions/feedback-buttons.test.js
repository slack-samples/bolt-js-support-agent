import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

import { handleFeedbackButton } from '../../../listeners/actions/feedback-buttons.js';

describe('handleFeedbackButton', () => {
  let fakeAck;
  let fakeBody;
  let fakeContext;
  let fakeClient;
  let fakeLogger;

  beforeEach(() => {
    fakeAck = mock.fn(async () => {});
    fakeBody = {
      actions: [{ value: 'good-feedback' }],
      channel: { id: 'C123' },
      message: { ts: '1234.5678' },
    };
    fakeContext = { userId: 'U123' };
    fakeClient = { chat: { postEphemeral: mock.fn(async () => ({ ok: true })) } };
    fakeLogger = { error: mock.fn(), debug: mock.fn() };
  });

  it('acknowledges the action', async () => {
    await handleFeedbackButton({
      ack: fakeAck,
      body: fakeBody,
      client: fakeClient,
      context: fakeContext,
      logger: fakeLogger,
    });
    assert.strictEqual(fakeAck.mock.callCount(), 1);
  });

  it('posts positive ephemeral message for good feedback', async () => {
    await handleFeedbackButton({
      ack: fakeAck,
      body: fakeBody,
      client: fakeClient,
      context: fakeContext,
      logger: fakeLogger,
    });
    assert.strictEqual(fakeClient.chat.postEphemeral.mock.callCount(), 1);
    const callArgs = fakeClient.chat.postEphemeral.mock.calls[0].arguments[0];
    assert.ok(callArgs.text.includes('Glad that was helpful'));
  });

  it('posts negative ephemeral message for bad feedback', async () => {
    fakeBody.actions[0].value = 'bad-feedback';
    await handleFeedbackButton({
      ack: fakeAck,
      body: fakeBody,
      client: fakeClient,
      context: fakeContext,
      logger: fakeLogger,
    });
    const callArgs = fakeClient.chat.postEphemeral.mock.calls[0].arguments[0];
    assert.ok(callArgs.text.includes("Sorry that wasn't helpful"));
  });

  it('logs error when postEphemeral fails', async () => {
    fakeClient.chat.postEphemeral = mock.fn(async () => {
      throw new Error('API error');
    });
    await handleFeedbackButton({
      ack: fakeAck,
      body: fakeBody,
      client: fakeClient,
      context: fakeContext,
      logger: fakeLogger,
    });
    assert.strictEqual(fakeLogger.error.mock.callCount(), 1);
  });
});
