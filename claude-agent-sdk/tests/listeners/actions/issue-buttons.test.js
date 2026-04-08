import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

import { handleIssueButton } from '../../../listeners/actions/issue-buttons.js';

describe('handleIssueButton', () => {
  let fakeAck;
  let fakeBody;
  let fakeClient;
  let fakeLogger;

  beforeEach(() => {
    fakeAck = mock.fn(async () => {});
    fakeBody = { actions: [{ value: 'Password Reset' }], trigger_id: 'T123' };
    fakeClient = { views: { open: mock.fn(async () => ({ ok: true })) } };
    fakeLogger = { error: mock.fn() };
  });

  it('acknowledges the action', async () => {
    await handleIssueButton({ ack: fakeAck, body: fakeBody, client: fakeClient, logger: fakeLogger });
    assert.strictEqual(fakeAck.mock.callCount(), 1);
  });

  it('opens a modal with the trigger_id', async () => {
    await handleIssueButton({ ack: fakeAck, body: fakeBody, client: fakeClient, logger: fakeLogger });
    assert.strictEqual(fakeClient.views.open.mock.callCount(), 1);
    const callArgs = fakeClient.views.open.mock.calls[0].arguments[0];
    assert.strictEqual(callArgs.trigger_id, 'T123');
    assert.strictEqual(callArgs.view.type, 'modal');
  });

  it('passes the category to the modal', async () => {
    await handleIssueButton({ ack: fakeAck, body: fakeBody, client: fakeClient, logger: fakeLogger });
    const callArgs = fakeClient.views.open.mock.calls[0].arguments[0];
    const categoryBlock = callArgs.view.blocks.find((b) => b.block_id === 'category_block');
    assert.strictEqual(categoryBlock.element.initial_option.value, 'Password Reset');
  });

  it('logs error when views.open fails', async () => {
    fakeClient.views.open = mock.fn(async () => {
      throw new Error('API error');
    });
    await handleIssueButton({ ack: fakeAck, body: fakeBody, client: fakeClient, logger: fakeLogger });
    assert.strictEqual(fakeLogger.error.mock.callCount(), 1);
  });
});
