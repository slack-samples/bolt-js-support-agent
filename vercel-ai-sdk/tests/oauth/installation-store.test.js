import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

import { BlobInstallationStore } from '../../oauth/installation-store.js';

describe('BlobInstallationStore', () => {
  let blobs;
  let blob;

  beforeEach(() => {
    blobs = new Map();
    blob = {
      put: mock.fn(async (pathname, body) => {
        blobs.set(pathname, body);
        return { pathname };
      }),
      get: mock.fn(async (pathname) => {
        if (!blobs.has(pathname)) return null;
        return { statusCode: 200, stream: new Response(blobs.get(pathname)).body };
      }),
      del: mock.fn(async (pathnames) => {
        for (const pathname of [pathnames].flat()) blobs.delete(pathname);
      }),
      list: mock.fn(async ({ prefix }) => ({
        blobs: [...blobs.keys()].filter((pathname) => pathname.startsWith(prefix)).map((pathname) => ({ pathname })),
        hasMore: false,
      })),
    };
  });

  it('stores and fetches the bot installation for a team', async () => {
    const store = new BlobInstallationStore({ blob });
    const installation = {
      team: { id: 'T1' },
      enterprise: undefined,
      user: { id: 'U1', token: 'xoxp-1' },
      bot: { token: 'xoxb-1', userId: 'UBOT', id: 'B1' },
      isEnterpriseInstall: false,
    };
    await store.storeInstallation(installation);
    assert.deepStrictEqual(
      [...blobs.keys()],
      ['installations/none-T1/app-latest.json', 'installations/none-T1/user-U1-latest.json'],
    );
    assert.deepStrictEqual(blob.put.mock.calls[0].arguments[2], {
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    const fetched = await store.fetchInstallation({ teamId: 'T1', isEnterpriseInstall: false });
    assert.strictEqual(fetched.bot.token, 'xoxb-1');
    assert.deepStrictEqual(blob.get.mock.calls[0].arguments, [
      'installations/none-T1/app-latest.json',
      { access: 'private', useCache: false },
    ]);
  });

  it('fetches the user installation when a user ID is given', async () => {
    const store = new BlobInstallationStore({ blob });
    await store.storeInstallation({
      team: { id: 'T1' },
      user: { id: 'U1', token: 'xoxp-1' },
      bot: { token: 'xoxb-1', userId: 'UBOT', id: 'B1' },
      isEnterpriseInstall: false,
    });
    await store.storeInstallation({
      team: { id: 'T1' },
      user: { id: 'U2', token: 'xoxp-2' },
      bot: { token: 'xoxb-2', userId: 'UBOT', id: 'B1' },
      isEnterpriseInstall: false,
    });
    const fetched = await store.fetchInstallation({ teamId: 'T1', userId: 'U1', isEnterpriseInstall: false });
    assert.strictEqual(fetched.bot.token, 'xoxb-2');
    assert.deepStrictEqual(fetched.user, { id: 'U1', token: 'xoxp-1' });
  });

  it('keys enterprise installs by enterprise', async () => {
    const store = new BlobInstallationStore({ blob });
    await store.storeInstallation({
      team: undefined,
      enterprise: { id: 'E1' },
      user: { id: 'U1', token: 'xoxp-1' },
      bot: { token: 'xoxb-1', userId: 'UBOT', id: 'B1' },
      isEnterpriseInstall: true,
    });
    assert.deepStrictEqual(
      [...blobs.keys()],
      ['installations/E1-none/app-latest.json', 'installations/E1-none/user-U1-latest.json'],
    );
    const fetched = await store.fetchInstallation({ enterpriseId: 'E1', teamId: 'T9', isEnterpriseInstall: true });
    assert.strictEqual(fetched.bot.token, 'xoxb-1');
  });

  it('falls back to the bot token when nothing is stored', async () => {
    const store = new BlobInstallationStore({ blob, fallbackBotToken: 'xoxb-fallback' });
    const fetched = await store.fetchInstallation({ teamId: 'T1', isEnterpriseInstall: false });
    assert.deepStrictEqual(fetched, { bot: { token: 'xoxb-fallback' } });
  });

  it("throws when nothing is stored and there's no fallback", async () => {
    const store = new BlobInstallationStore({ blob, fallbackBotToken: undefined });
    await assert.rejects(store.fetchInstallation({ teamId: 'T1', isEnterpriseInstall: false }), {
      message: 'No installation found and no fallback bot token configured',
    });
  });

  it("deletes a team's installation", async () => {
    const store = new BlobInstallationStore({ blob, fallbackBotToken: undefined });
    await store.storeInstallation({
      team: { id: 'T1' },
      user: { id: 'U1', token: 'xoxp-1' },
      bot: { token: 'xoxb-1', userId: 'UBOT', id: 'B1' },
      isEnterpriseInstall: false,
    });
    await store.storeInstallation({
      team: { id: 'T2' },
      user: { id: 'U2', token: 'xoxp-2' },
      bot: { token: 'xoxb-2', userId: 'UBOT', id: 'B2' },
      isEnterpriseInstall: false,
    });
    await store.deleteInstallation({ teamId: 'T1', isEnterpriseInstall: false });
    assert.deepStrictEqual(
      [...blobs.keys()],
      ['installations/none-T2/app-latest.json', 'installations/none-T2/user-U2-latest.json'],
    );
    await assert.rejects(store.fetchInstallation({ teamId: 'T1', isEnterpriseInstall: false }));
  });
});
