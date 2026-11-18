import { del, get, list, put } from '@vercel/blob';

/**
 * @param {string} [enterpriseId]
 * @param {string} [teamId]
 * @param {boolean} [isEnterpriseInstall]
 * @returns {string}
 */
function installationDir(enterpriseId, teamId, isEnterpriseInstall) {
  const team = isEnterpriseInstall ? undefined : teamId;
  return `installations/${enterpriseId || 'none'}-${team || 'none'}`;
}

/**
 * OAuth installation store backed by a private Vercel Blob store, with a bot token fallback for before anyone
 * completes OAuth.
 */
export class BlobInstallationStore {
  /**
   * @param {object} [options]
   * @param {{ put: typeof put, get: typeof get, del: typeof del, list: typeof list }} [options.blob]
   * @param {string} [options.fallbackBotToken]
   */
  constructor({ blob = { put, get, del, list }, fallbackBotToken = process.env.SLACK_BOT_TOKEN } = {}) {
    /** @private */
    this._blob = blob;
    /** @private @type {string | undefined} */
    this._fallbackBotToken = fallbackBotToken;
  }

  /**
   * @param {import('@slack/bolt').Installation} installation
   * @returns {Promise<void>}
   */
  async storeInstallation(installation) {
    const dir = installationDir(installation.enterprise?.id, installation.team?.id, installation.isEnterpriseInstall);
    const body = JSON.stringify(installation);
    await this._write(`${dir}/app-latest.json`, body);
    if (installation.user?.id) {
      await this._write(`${dir}/user-${installation.user.id}-latest.json`, body);
    }
  }

  /**
   * @param {import('@slack/bolt').InstallationQuery<boolean>} query
   * @returns {Promise<import('@slack/bolt').Installation>}
   */
  async fetchInstallation(query) {
    try {
      const dir = installationDir(query.enterpriseId, query.teamId, query.isEnterpriseInstall);
      const installation = await this._read(`${dir}/app-latest.json`);
      if (!installation) {
        throw new Error(`No installation data found (enterprise_id: ${query.enterpriseId}, team_id: ${query.teamId})`);
      }
      if (query.userId && installation.user.id !== query.userId) {
        const userInstallation = await this._read(`${dir}/user-${query.userId}-latest.json`);
        installation.user = userInstallation?.user ?? { id: installation.user.id, token: undefined, scopes: undefined };
      }
      return installation;
    } catch {
      if (this._fallbackBotToken) {
        return /** @type {any} */ ({ bot: { token: this._fallbackBotToken } });
      }
      throw new Error('No installation found and no fallback bot token configured');
    }
  }

  /**
   * @param {import('@slack/bolt').InstallationQuery<boolean>} query
   * @returns {Promise<void>}
   */
  async deleteInstallation(query) {
    const dir = installationDir(query.enterpriseId, query.teamId, query.isEnterpriseInstall);
    const prefix = query.userId ? `${dir}/user-${query.userId}-` : `${dir}/`;
    const { blobs } = await this._blob.list({ prefix });
    if (blobs.length > 0) {
      await this._blob.del(blobs.map((b) => b.pathname));
    }
  }

  /**
   * @private
   * @param {string} pathname
   * @param {string} body
   * @returns {Promise<void>}
   */
  async _write(pathname, body) {
    await this._blob.put(pathname, body, {
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json',
    });
  }

  /**
   * @private
   * @param {string} pathname
   * @returns {Promise<import('@slack/bolt').Installation | null>}
   */
  async _read(pathname) {
    const result = await this._blob.get(pathname, { access: 'private', useCache: false });
    if (result?.statusCode !== 200) return null;
    return await new Response(result.stream).json();
  }
}
