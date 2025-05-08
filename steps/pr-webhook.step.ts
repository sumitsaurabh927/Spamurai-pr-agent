import { z } from 'zod'
import type { ApiRouteConfig, StepHandler } from 'motia'
import axios from 'axios'
import { GithubService } from '../services/github.service'
import { OpenAIService } from '../services/open-ai.service'


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
    },
  ],
  bodySchema: webhookSchema,
  flows: ['github-pr-agent'],
}

export const handler: StepHandler<typeof config> = async (req, { emit, logger }) => {
  const { action, pull_request: pr, repository } = req.body
  console.log('running....')
  // console.log(req.body)
  if (!pr) {
    console.log('no pr')
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
    title: pr.title,
    body: pr.body || '',
    diff,
    state: pr.state,
    labels: pr.labels ? pr.labels.map((l: { name: string }) => l.name) : [],
    author: pr.user.login,
    owner,
    repo,
    baseBranch: pr.base.ref,
    headBranch: pr.head.ref,
    commitSha: pr.head.sha,
    url: pr.html_url,
  }


  if (action === 'opened' || action === 'edited') {
    await emit({
      topic: `github.pr.${action}`,
      data: baseEventData,
    })


    const isSpammy = await checkIfPRIsSpam({ prDiff: diff, prTitle: pr.title, prDescription: pr.body })

    if (isSpammy) {
      const comment = `⚠️ This PR looks suspicious or may be spammy. Please make sure it follows the community guidelines.`
      const githubService = new GithubService()
      await githubService.createComment(owner, repo, pr.number, comment)
    }
  } else {
    logger.warn('[PR Webhook] Unsupported action', { action })
  }

  return {
    status: 200,
    body: { message: 'Webhook processed successfully' },
  }
}


async function checkIfPRIsSpam({ prTitle, prDescription, prDiff }: { prTitle: string, prDescription: string, prDiff: string }): Promise<boolean> {
  console.log('checking for spam--diff')
  console.log(prDiff)
  const openAIService = new OpenAIService()
  const resp = await openAIService.analyzePRForSpam({ prTitle, prDescription, prDiff })
  console.log(resp)
  return false
}
