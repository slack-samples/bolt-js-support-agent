import assert from 'node:assert';
import { describe, it, mock } from 'node:test';

import { CaseyDeps } from '../../../agent/deps.js';
import { markResolved } from '../../../agent/tools/mark-resolved.js';

describe('markResolved', () => {
  it('adds a check mark to the parent thread message', async () => {
    const client = { reactions: { add: mock.fn(async () => ({ ok: true })) } };
    const deps = new CaseyDeps(client, 'U1', 'C1', '1.0', '2.0');
    const result = await markResolved.execute({}, { toolCallId: 'call_1', messages: [], context: { deps } });
    assert.deepStrictEqual(client.reactions.add.mock.calls[0].arguments, [
      { channel: 'C1', timestamp: '1.0', name: 'white_check_mark' },
    ]);
    assert.strictEqual(result, 'Thread marked as resolved.');
  });

  it('reports a reaction error', async () => {
    const client = {
      reactions: {
        add: mock.fn(async () => {
          throw { data: { error: 'already_reacted' } };
        }),
      },
    };
    const deps = new CaseyDeps(client, 'U1', 'C1', '1.0', '2.0');
    const result = await markResolved.execute({}, { toolCallId: 'call_1', messages: [], context: { deps } });
    assert.strictEqual(result, 'Could not mark resolved: already_reacted');
  });
});
