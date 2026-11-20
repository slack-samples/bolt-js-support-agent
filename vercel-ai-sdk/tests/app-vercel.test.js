import assert from 'node:assert';
import { createHmac } from 'node:crypto';
import { afterEach, before, describe, it, mock } from 'node:test';

import { WebClient } from '@slack/web-api';

describe('app-vercel', () => {
  let handler;
  let receiver;

  before(async () => {
    process.env.SLACK_SIGNING_SECRET = 'test-secret';
    process.env.SLACK_CLIENT_ID = '123.456';
    process.env.SLACK_CLIENT_SECRET = 'test-client-secret';
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    process.env.SLACK_STATE_SECRET = 'test-state-secret';
    ({ handler, receiver } = await import('../app-vercel.js'));
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('answers url_verification with the challenge', async () => {
    const body = JSON.stringify({ type: 'url_verification', challenge: 'abc' });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = `v0=${createHmac('sha256', 'test-secret').update(`v0:${timestamp}:${body}`).digest('hex')}`;
    const response = await handler(
      new Request('https://x.vercel.app/slack/events', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-slack-request-timestamp': `${timestamp}`,
          'x-slack-signature': signature,
        },
        body,
      }),
    );
    assert.strictEqual(response.status, 200);
    assert.ok((await response.text()).includes('abc'));
  });

  it('acks the issue modal submission, then posts the issue to a DM', async () => {
    const { promise: posted, resolve } = Promise.withResolvers();
    mock.method(WebClient.prototype, 'apiCall', async (method, args) => {
      if (method === 'chat.postMessage') resolve(args);
      return { ok: true, channel: { id: 'D123' } };
    });
    const payload = {
      type: 'view_submission',
      team: { id: 'T123' },
      user: { id: 'U123', team_id: 'T123' },
      api_app_id: 'A123',
      trigger_id: '1.2.3',
      is_enterprise_install: false,
      view: {
        id: 'V123',
        type: 'modal',
        callback_id: 'issue_submission',
        team_id: 'T123',
        state: {
          values: {
            category_block: { category_select: { selected_option: { value: 'Network Issues' } } },
            description_block: { description_input: { value: 'WiFi keeps dropping' } },
          },
        },
      },
    };
    const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = `v0=${createHmac('sha256', 'test-secret').update(`v0:${timestamp}:${body}`).digest('hex')}`;
    const response = await handler(
      new Request('https://x.vercel.app/slack/events', {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'x-slack-request-timestamp': `${timestamp}`,
          'x-slack-signature': signature,
        },
        body,
      }),
    );
    assert.strictEqual(response.status, 200);
    assert.strictEqual(await response.text(), '');
    const args = await posted;
    assert.strictEqual(args.channel, 'D123');
    assert.strictEqual(args.metadata.event_type, 'issue_submission');
    assert.deepStrictEqual(args.metadata.event_payload, { user_id: 'U123' });
  });

  it('rejects a request with a bad signature', async () => {
    const body = JSON.stringify({ type: 'url_verification', challenge: 'abc' });
    const timestamp = Math.floor(Date.now() / 1000);
    const response = await handler(
      new Request('https://x.vercel.app/slack/events', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-slack-request-timestamp': `${timestamp}`,
          'x-slack-signature': 'v0=bad',
        },
        body,
      }),
    );
    assert.strictEqual(response.status, 401);
  });

  it('serves the install page', async () => {
    const response = await receiver.handleInstall(new Request('https://x.vercel.app/slack/install'));
    assert.ok([200, 302].includes(response.status));
  });
});
