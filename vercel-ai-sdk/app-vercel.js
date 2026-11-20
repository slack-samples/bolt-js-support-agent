import { readFileSync } from 'node:fs';

import { App, LogLevel } from '@slack/bolt';
import { createHandler, VercelReceiver } from '@vercel/slack-bolt';

import { registerListeners } from './listeners/index.js';
import { BlobInstallationStore } from './oauth/installation-store.js';

const manifest = JSON.parse(readFileSync(new URL('./manifest.json', import.meta.url), 'utf-8'));
const botScopes = manifest.oauth_config.scopes.bot;
const userScopes = manifest.oauth_config.scopes.user;

export const receiver = new VercelReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: botScopes,
  redirectUri: process.env.SLACK_REDIRECT_URI,
  installationStore: new BlobInstallationStore(),
  installerOptions: {
    stateVerification: true,
    userScopes,
  },
});

export const app = new App({
  receiver,
  deferInitialization: true,
  logLevel: LogLevel.DEBUG,
  ignoreSelf: false,
});

registerListeners(app);

export const handler = createHandler(app, receiver);
