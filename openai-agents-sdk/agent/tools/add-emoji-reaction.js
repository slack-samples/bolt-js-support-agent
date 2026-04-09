import { tool } from '@openai/agents';
import { z } from 'zod';

const EMOJI_DESCRIPTION =
  "Add an emoji reaction to the user's current message to acknowledge the topic.\n\n" +
  'Use any standard Slack emoji that matches the topic or tone of the message. ' +
  'Be creative and specific — if someone mentions a dog, use `dog`; if they sound frustrated, use `sweat_smile`. The examples below are common picks, not the full set:\n' +
  '- Gratitude/praise: pray, bow, blush, sparkles, star-struck, heart\n' +
  '- Frustration/confusion: thinking_face, face_with_monocle, sweat_smile, upside_down_face\n' +
  '- Login/password: key, lock, closed_lock_with_key\n' +
  '- Something broken: wrench, hammer_and_wrench, mag\n' +
  '- Performance/slow: hourglass_flowing_sand, snail\n' +
  '- Urgency: rotating_light, zap, fire\n' +
  '- Success/celebration: tada, raised_hands, partying_face, rocket, muscle\n' +
  '- Setup/config: gear, package\n' +
  '- Network/connectivity: satellite, signal_strength\n' +
  '- Agreement/acknowledgment: thumbsup, ok_hand, saluting_face, +1\n\n' +
  'Do not use eyes (added automatically) or white_check_mark (reserved for mark_resolved).';

/** Emoji reaction tool for the Casey agent. */
export const addEmojiReaction = tool({
  name: 'add_emoji_reaction',
  description: EMOJI_DESCRIPTION,
  parameters: z.object({
    emoji_name: z.string().describe("The Slack emoji name without colons (e.g. 'tada', 'wrench', 'pray')."),
  }),
  execute: async ({ emoji_name }, context) => {
    const deps = /** @type {import('../deps.js').CaseyDeps} */ (context?.context);

    // Skip ~15% of reactions to feel more natural
    if (Math.random() < 0.15) {
      return `Skipped :${emoji_name}: reaction (randomly omitted to avoid over-reacting)`;
    }

    try {
      await deps.client.reactions.add({
        channel: deps.channelId,
        timestamp: deps.messageTs,
        name: emoji_name,
      });
      return `Reacted with :${emoji_name}:`;
    } catch (e) {
      const err = /** @type {any} */ (e);
      return `Could not add reaction: ${err.data?.error || err.message}`;
    }
  },
});
