import { EventConfig, StepHandler } from 'motia'
import { z } from 'zod'
import { OpenAIService } from '../services/open-ai.service'
import { GithubEventTopic } from '../types/github-events'

type Input = typeof inputSchema

const inputSchema = z.object({
    prDiff: z.string(),
    prTitle: z.string(),
    prDescription: z.string(),
    prNumber: z.number(),
    owner: z.string(),
    repo: z.string(),
    installationId: z.number()
})

export const config: EventConfig<Input> = {
    type: 'event',
    name: 'Spam detection',
    description: 'Checks the PR for spamminess',
    subscribes: [GithubEventTopic.PR_OPENED, GithubEventTopic.PR_EDITED],
    emits: [{
        topic: GithubEventTopic.PR_ANALYSED,
        label: 'PR analysis completed',
    },],
    input: inputSchema,
    flows: ['github-pr-agent'],
}

export const handler: StepHandler<typeof config> = async (input, { logger, emit }) => {
    logger.info('received analysis-completed event', input)

    const isSpammy = await checkIfPRIsSpam({ prDiff: input.prDiff, prTitle: input.prTitle, prDescription: input.prDescription })
    await emit({
        topic: GithubEventTopic.PR_ANALYSED,
        data: { body: isSpammy.feedback, prNumber: input.prNumber, owner: input.owner, repo: input.repo, isSpam: isSpammy.isSpam, installationId: input.installationId, recommendedAction: isSpammy.recommendedAction },
    })
    logger.info('Completed the spam detection step')
}

async function checkIfPRIsSpam({ prTitle, prDescription, prDiff }: { prTitle: string, prDescription: string, prDiff: string }): Promise<{ isSpam: boolean, spamConfidence: number, PRConfidence: number, quality: number, reasons: string[], feedback: string, recommendedAction: "close" | "request_changes" | "approve" | "none" }> {
    const openAIService = new OpenAIService()
    const resp = await openAIService.analyzePRForSpam({ prTitle, prDescription, prDiff })
    return resp
}