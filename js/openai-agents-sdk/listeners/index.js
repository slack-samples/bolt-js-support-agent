import * as actions from './actions/index.js';
import * as events from './events/index.js';
import * as views from './views/index.js';

export function registerListeners(app) {
  actions.register(app);
  events.register(app);
  views.register(app);
}
