import type { WebClient } from '@slack/web-api';

export class CaseyDeps {
  client: WebClient;
  userId: string;
  channelId: string;
  threadTs: string;

  constructor(client: WebClient, userId: string, channelId: string, threadTs: string) {
    this.client = client;
    this.userId = userId;
    this.channelId = channelId;
    this.threadTs = threadTs;
  }
}
