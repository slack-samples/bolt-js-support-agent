import assert from 'node:assert';
import { afterEach, describe, it, mock } from 'node:test';

import { CaseyDeps } from '../../../agent/deps.js';
import { addEmojiReaction } from '../../../agent/tools/add-emoji-reaction.js';

describe('addEmojiReaction', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("reacts with the emoji on the user's message", async () => {
    mock.method(Math, 'random', () => 0.5);
    const client = { reactions: { add: mock.fn(async () => ({ ok: true })) } };
    const deps = new CaseyDeps(client, 'U1', 'C1', '1.0', '2.0');
    const result = await addEmojiReaction.execute(
      { emoji_name: 'tada' },
      { toolCallId: 'call_1', messages: [], context: { deps } },
    );
    assert.deepStrictEqual(client.reactions.add.mock.calls[0].arguments, [
      { channel: 'C1', timestamp: '2.0', name: 'tada' },
    ]);
    assert.strictEqual(result, 'Reacted with :tada:');
  });

  it('skips about 15% of reactions', async () => {
    mock.method(Math, 'random', () => 0.1);
    const client = { reactions: { add: mock.fn(async () => ({ ok: true })) } };
    const deps = new CaseyDeps(client, 'U1', 'C1', '1.0', '2.0');
    const result = await addEmojiReaction.execute(
      { emoji_name: 'tada' },
      { toolCallId: 'call_1', messages: [], context: { deps } },
    );
    assert.strictEqual(client.reactions.add.mock.callCount(), 0);
    assert.ok(result.startsWith('Skipped :tada:'));
  });

  it('reports a reaction error', async () => {
    mock.method(Math, 'random', () => 0.5);
    const client = {
      reactions: {
        add: mock.fn(async () => {
          throw { data: { error: 'already_reacted' } };
        }),
      },
    };
    const deps = new CaseyDeps(client, 'U1', 'C1', '1.0', '2.0');
    const result = await addEmojiReaction.execute(
      { emoji_name: 'tada' },
      { toolCallId: 'call_1', messages: [], context: { deps } },
    );
    assert.strictEqual(result, 'Could not add reaction: already_reacted');
  });
});
