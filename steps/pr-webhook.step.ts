import { z } from 'zod'
import type { ApiRouteConfig, StepHandler } from 'motia'
import axios from 'axios'


const webhookSchema = z.object({
  action: z.string(),
  pull_request: z.object({
    number: z.number(),
    title: z.string(),
    body: z.string().optional(),
    state: z.string(),
    labels: z.array(z.object({ name: z.string() })),
    user: z.object({ login: z.string() }),
    base: z.object({
      ref: z.string(),
      repo: z.object({
        name: z.string(),
        owner: z.object({ login: z.string() }),
      }),
    }),
    head: z.object({
      ref: z.string(),
      sha: z.string(),
    }),
    html_url: z.string(),
  }),
  repository: z.object({
    name: z.string(),
    owner: z.object({
      login: z.string(),
    }),
  }),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'PR Spamurai Webhook Handler',
  description: 'Handles incoming PR webhook events from GitHub to detect and respond to spammy PRs',
  path: "/webhooks/github",
  virtualSubscribes: ["/webhooks/github"],
  method: 'POST',
  emits: [
    {
      topic: 'github.pr.opened',
      label: 'New PR created',
    },
    {
      topic: 'github.pr.edited',
      label: 'PR content updated',
    }
  ],
  bodySchema: webhookSchema,
  flows: ['github-pr-agent'],
}

export const handler: StepHandler<typeof config> = async (req, { emit, logger }) => {
  const { action, pull_request: pr, repository } = req.body
  if (!pr) {
    return {
      status: 404,
      body: { message: 'no pr found' },
    }
  }
  logger.info('[PR Webhook] Received webhook', { action, prNumber: pr.number })

  const owner = pr.base.repo?.owner?.login || repository.owner.login
  const repo = pr.base.repo?.name || repository.name

  let diff = ''
  try {

    const diffUrl = pr.diff_url
    const response = await axios.get(diffUrl, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3.diff',
      },
    })
    diff = response.data
  } catch (err) {
    logger.error('Failed to fetch PR diff', { error: err })
  }

  const baseEventData = {
    prNumber: pr.number,
    prTitle: pr.title,
    prDescription: pr.body || '',
    prDiff: diff,
    owner,
    repo,
    installationId: req.body.installation.id
  }

  if (action === 'opened' || action === 'edited') {
    await emit({
      topic: `github.pr.${action}`,
      data: baseEventData,
    })
  } else {
    logger.warn('[PR Webhook] Unsupported action', { action })
  }

  return {
    status: 200,
    body: { message: 'Webhook processed successfully' },
  }
}