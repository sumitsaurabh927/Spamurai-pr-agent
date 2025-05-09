import { ApiRouteConfig, StepHandler } from 'motia'
import { z } from 'zod'

const inputSchema = z.object({})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'default flow api trigger',
  description: 'default template api trigger',
  path: '/default',
  virtualSubscribes: ['/default'],
  method: 'POST',
  emits: ['test-state'],
  bodySchema: inputSchema,
  flows: ['default'],
}

export const handler: StepHandler<typeof config> = async (req, { logger, emit }) => {
  logger.info('processing default flow api step', req)

  await emit({
    topic: 'test-state',
    data: {},
  })

  return {
    status: 200,
    body: { message: 'test-state topic emitted' },
  }
}