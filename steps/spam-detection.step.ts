import { EventConfig, StepHandler } from 'motia'
import { z } from 'zod'
import { OpenAIService } from '../services/open-ai.service'

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
    subscribes: ['github.pr.opened', 'github.pr.edited'],
    emits: [{
        topic: 'github.pr.analysed',
        label: 'PR analysis completed',
    },],
    input: inputSchema,
    flows: ['github-pr-agent'],
}

export const handler: StepHandler<typeof config> = async (input, { logger, emit }) => {
    logger.info('received analysis-completed event', input)

    const isSpammy = await checkIfPRIsSpam({ prDiff: input.prDiff, prTitle: input.prTitle, prDescription: input.prDescription })
    console.log('spam detected steppppppp')
    console.log(input)
    await emit({
        topic: `github.pr.analysed`,
        data: { body: isSpammy.feedback, prNumber: input.prNumber, owner: input.owner, repo: input.repo, isSpam: isSpammy.isSpam, installationId: input.installationId, recommendedAction: isSpammy.recommendedAction },
    })
}

async function checkIfPRIsSpam({ prTitle, prDescription, prDiff }: { prTitle: string, prDescription: string, prDiff: string }): Promise<{ isSpam: boolean, spamConfidence: number, PRConfidence: number, quality: number, reasons: string[], feedback: string, recommendedAction: "close" | "request_changes" | "approve" | "none" }> {
    console.log('checking for spam--diff')
    console.log(prDiff)
    const openAIService = new OpenAIService()
    const resp = await openAIService.analyzePRForSpam({ prTitle, prDescription, prDiff })
    console.log(resp)
    return resp
}