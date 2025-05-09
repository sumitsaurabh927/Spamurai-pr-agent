import { EventConfig, StepHandler } from 'motia'
import { GithubService } from '../services/github.service'
import { z } from 'zod'

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
    subscribes: ['github.pr.analysed'],
    emits: [],
    input: inputSchema,
    flows: ['github-pr-agent'],
}

export const handler: StepHandler<typeof config> = async (input, { logger }) => {

    logger.info('received analysis-completed event', input)
    if (input.isSpam && input.recommendedAction === 'close') {
        const githubService = new GithubService()
        await githubService.closePullRequest(input.owner, input.repo, input.prNumber, input.installationId)
    }
}
