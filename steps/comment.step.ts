import { EventConfig, StepHandler } from 'motia'
import { GithubService } from '../services/github.service'
import { z } from 'zod'
import { GithubEventTopic } from '../types/github-events'

type Input = typeof inputSchema

const inputSchema = z.object({
    body: z.string(),
    prNumber: z.number(),
    owner: z.string(),
    repo: z.string(),
    isSpam: z.boolean(),
    installationId: z.number(),
    recommendedAction: z.string()
})

export const config: EventConfig<Input> = {
    type: 'event',
    name: 'Comment',
    description: 'Post a contextual comment',
    subscribes: [GithubEventTopic.PR_ANALYSED],
    emits: [{
        topic: GithubEventTopic.PR_COMMENTED,
        label: 'Comment Posted',
    },],
    input: inputSchema,
    flows: ['github-pr-agent'],
}

export const handler: StepHandler<typeof config> = async (input, { logger, emit }) => {
    logger.info(`received ${GithubEventTopic.PR_ANALYSED} event`, input)
    const githubService = new GithubService()
    await githubService.createComment(input.owner, input.repo, input.prNumber, input.body, input.installationId)
    await emit({
        topic: GithubEventTopic.PR_COMMENTED,
        data: { prNumber: input.prNumber, owner: input.owner, repo: input.repo, isSpam: input.isSpam, installationId: input.installationId, recommendedAction: input.recommendedAction },
    })
    logger.info('Completed the comment step')
}