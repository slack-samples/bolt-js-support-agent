/**
 * Dependencies passed to the Casey agent as run context.
 */
export class CaseyDeps {
  /**
   * @param {import('@slack/web-api').WebClient} client
   * @param {string} userId
   * @param {string} channelId
   * @param {string} threadTs
   */
  constructor(client, userId, channelId, threadTs) {
    /** @type {import('@slack/web-api').WebClient} */
    this.client = client;
    /** @type {string} */
    this.userId = userId;
    /** @type {string} */
    this.channelId = channelId;
    /** @type {string} */
    this.threadTs = threadTs;
  }
}
