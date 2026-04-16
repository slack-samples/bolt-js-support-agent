import assert from 'node:assert';
import { describe, it } from 'node:test';

import { buildAppHomeView, CATEGORIES } from '../../../listeners/views/app-home-builder.js';

describe('buildAppHomeView', () => {
  it('returns a home view', () => {
    const view = buildAppHomeView();
    assert.strictEqual(view.type, 'home');
  });

  it('has a blocks array', () => {
    const view = buildAppHomeView();
    assert.ok(Array.isArray(view.blocks));
    assert.ok(view.blocks.length > 0);
  });

  it('contains an actions block with buttons matching CATEGORIES', () => {
    const view = buildAppHomeView();
    const actionsBlock = view.blocks.find((b) => b.type === 'actions');
    assert.ok(actionsBlock);
    assert.strictEqual(actionsBlock.elements.length, CATEGORIES.length);
  });

  it('each button has action_id and value', () => {
    const view = buildAppHomeView();
    const actionsBlock = view.blocks.find((b) => b.type === 'actions');
    for (const element of actionsBlock.elements) {
      assert.ok(typeof element.action_id === 'string');
      assert.ok(typeof element.value === 'string');
    }
  });

  it('does not show MCP status by default', () => {
    const view = buildAppHomeView();
    const mrkdwnTexts = view.blocks.filter((b) => b.type === 'section').map((b) => b.text.text);
    const hasMcp = mrkdwnTexts.some((t) => t.includes('MCP Server'));
    assert.strictEqual(hasMcp, false);
  });

  it('shows disconnected status when installUrl is provided', () => {
    const view = buildAppHomeView('https://example.com/slack/install');
    const mrkdwnTexts = view.blocks.filter((b) => b.type === 'section').map((b) => b.text.text);
    const hasDisconnected = mrkdwnTexts.some((t) => t.includes('disconnected'));
    assert.strictEqual(hasDisconnected, true);
  });

  it('shows connected status when isConnected is true', () => {
    const view = buildAppHomeView(null, true);
    const mrkdwnTexts = view.blocks.filter((b) => b.type === 'section').map((b) => b.text.text);
    const hasConnected = mrkdwnTexts.some((t) => t.includes('connected'));
    assert.strictEqual(hasConnected, true);
  });

  it('includes bot mention in context when botUserId is provided', () => {
    const view = buildAppHomeView(null, false, 'U0BOT');
    const contextBlock = view.blocks.find((b) => b.type === 'context');
    const mentionText = contextBlock.elements[0].text;
    assert.ok(mentionText.includes('<@U0BOT>'));
  });

  it('omits bot mention when botUserId is not provided', () => {
    const view = buildAppHomeView();
    const contextBlock = view.blocks.find((b) => b.type === 'context');
    const mentionText = contextBlock.elements[0].text;
    assert.ok(!mentionText.includes('<@'));
  });
});

describe('CATEGORIES', () => {
  it('each category has required fields', () => {
    for (const cat of CATEGORIES) {
      assert.ok(typeof cat.actionId === 'string');
      assert.ok(typeof cat.text === 'string');
      assert.ok(typeof cat.value === 'string');
    }
  });
});
