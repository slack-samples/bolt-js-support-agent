import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

const SYSTEM_STATUSES = {
  email: {
    name: 'Email (Exchange Online)',
    status: 'operational',
    details: 'All email services running normally. Last incident resolved 3 days ago.',
  },
  vpn: {
    name: 'Corporate VPN',
    status: 'degraded',
    details:
      'Intermittent connectivity issues reported on the US-East gateway. Engineering is investigating. ETA for resolution: 2 hours.',
  },
  jira: {
    name: 'Jira',
    status: 'operational',
    details: 'All project management services running normally.',
  },
  confluence: {
    name: 'Confluence',
    status: 'operational',
    details: 'Wiki and documentation services running normally.',
  },
  slack: {
    name: 'Slack',
    status: 'operational',
    details: 'All messaging services running normally.',
  },
  github: {
    name: 'GitHub Enterprise',
    status: 'operational',
    details: 'All code repository and CI/CD services running normally.',
  },
  sso: {
    name: 'Single Sign-On (SSO)',
    status: 'operational',
    details: 'Authentication services running normally.',
  },
  network: {
    name: 'Corporate Network',
    status: 'operational',
    details: 'All office networks operating at full capacity.',
  },
  erp: {
    name: 'ERP System',
    status: 'maintenance',
    details: 'Scheduled maintenance window active. Service will be restored by 6:00 AM UTC tomorrow.',
  },
};

const STATUS_EMOJI = {
  operational: ':large_green_circle:',
  degraded: ':large_yellow_circle:',
  outage: ':red_circle:',
  maintenance: ':wrench:',
};

export const checkSystemStatusTool = tool(
  'check_system_status',
  'Check the current operational status of a company system or service. ' +
    'Use this tool when a user asks about outages, system availability, or ' +
    'whether a specific service is currently working.',
  {
    system_name: z
      .string()
      .describe("The name of the system to check (e.g., 'vpn', 'email', 'jira', 'github', 'sso')."),
  },
  async ({ system_name }) => {
    const systemLower = system_name.toLowerCase();

    for (const [key, info] of Object.entries(SYSTEM_STATUSES)) {
      if (systemLower.includes(key) || info.name.toLowerCase().includes(systemLower)) {
        const emoji = STATUS_EMOJI[info.status] || ':white_circle:';
        const text = `**${info.name}** ${emoji} \`${info.status.toUpperCase()}\`\n${info.details}`;
        return { content: [{ type: 'text', text }] };
      }
    }

    const available = Object.keys(SYSTEM_STATUSES).sort().join(', ');
    const text =
      `System '${system_name}' not found in monitoring. ` +
      `Available systems: ${available}. ` +
      'If you need status for a different system, try a more specific name.';

    return { content: [{ type: 'text', text }] };
  },
);
