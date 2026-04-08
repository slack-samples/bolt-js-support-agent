/**
 * Dependencies passed to the Casey agent as run context.
 */
export class CaseyDeps {
  /**
   * @param {import('@slack/web-api').WebClient} client
   * @param {string} userId
   * @param {string} channelId
   * @param {string} threadTs
   * @param {string} messageTs
   */
  constructor(client, userId, channelId, threadTs, messageTs) {
    /** @type {import('@slack/web-api').WebClient} */
    this.client = client;
    /** @type {string} */
    this.userId = userId;
    /** @type {string} */
    this.channelId = channelId;
    /** @type {string} */
    this.threadTs = threadTs;
    /** @type {string} */
    this.messageTs = messageTs;
  }
}
