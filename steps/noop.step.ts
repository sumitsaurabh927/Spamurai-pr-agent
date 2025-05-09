import type { NoopConfig } from 'motia'

export const config: NoopConfig = {
  type: 'noop',
  name: 'Test Spamurai PR',
  description: 'Simulates GitHub PR webhook events to test Spamurai flow',
  virtualEmits: [
    {
      topic: "/webhooks/github",
      label: 'Simulate a fake PR event'
    }
  ],
  virtualSubscribes: [],
  flows: ['github-pr-agent'],
}