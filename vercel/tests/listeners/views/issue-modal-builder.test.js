import assert from 'node:assert';
import { describe, it } from 'node:test';

import { CATEGORIES } from '../../../listeners/views/app-home-builder.js';
import { buildIssueModal } from '../../../listeners/views/issue-modal-builder.js';

describe('buildIssueModal', () => {
  it('returns a modal view', () => {
    const modal = buildIssueModal();
    assert.strictEqual(modal.type, 'modal');
  });

  it('has callback_id of issue_submission', () => {
    const modal = buildIssueModal();
    assert.strictEqual(modal.callback_id, 'issue_submission');
  });

  it('has submit and close buttons', () => {
    const modal = buildIssueModal();
    assert.ok(modal.submit);
    assert.ok(modal.close);
  });

  it('pre-selects the given category', () => {
    const modal = buildIssueModal('Access Request');
    const categoryBlock = modal.blocks.find((b) => b.block_id === 'category_block');
    assert.strictEqual(categoryBlock.element.initial_option.value, 'Access Request');
  });

  it('defaults to first category when unknown category is given', () => {
    const modal = buildIssueModal('Nonexistent');
    const categoryBlock = modal.blocks.find((b) => b.block_id === 'category_block');
    assert.strictEqual(categoryBlock.element.initial_option.value, CATEGORIES[0].value);
  });

  it('defaults to first category when no category is given', () => {
    const modal = buildIssueModal(undefined);
    const categoryBlock = modal.blocks.find((b) => b.block_id === 'category_block');
    assert.strictEqual(categoryBlock.element.initial_option.value, CATEGORIES[0].value);
  });

  it('has category and description input blocks', () => {
    const modal = buildIssueModal();
    assert.strictEqual(modal.blocks.length, 2);
    assert.strictEqual(modal.blocks[0].block_id, 'category_block');
    assert.strictEqual(modal.blocks[1].block_id, 'description_block');
  });

  it('category options match CATEGORIES count', () => {
    const modal = buildIssueModal();
    const categoryBlock = modal.blocks.find((b) => b.block_id === 'category_block');
    assert.strictEqual(categoryBlock.element.options.length, CATEGORIES.length);
  });
});
