import { handleAppHomeOpened } from './app-home-opened.js';
import { handleAppMentioned } from './app-mentioned.js';
import { handleAssistantThreadStarted } from './assistant-thread-started.js';
import { handleMessage } from './message.js';

export function register(app) {
  app.event('app_home_opened', handleAppHomeOpened);
  app.event('app_mention', handleAppMentioned);
  app.event('assistant_thread_started', handleAssistantThreadStarted);
  app.event('message', handleMessage);
}
