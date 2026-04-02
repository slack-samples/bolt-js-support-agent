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
