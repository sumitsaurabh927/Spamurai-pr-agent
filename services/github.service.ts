import { Octokit } from '@octokit/rest'
import { createAppAuth } from '@octokit/auth-app'

export class GithubService {
    private appId: number
    private privateKey: string
    private octokit: Octokit

    constructor() {
        this.appId = Number(process.env.GITHUB_APP_ID)
        this.privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''

        this.octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: this.appId,
                privateKey: this.privateKey,
            }
        })
    }

    async getInstallationAccessToken(installationId: number): Promise<string> {
        try {
            const auth = createAppAuth({
                appId: this.appId,
                privateKey: this.privateKey,
            })

            const installationAuth = await auth({ type: 'installation', installationId })
            return installationAuth.token
        } catch (error) {
            console.error('Error getting installation access token:', error)
            throw error
        }
    }

    async createComment(owner: string, repo: string, prNumber: number, body: string, installationId: number) {
        try {
            const token = await this.getInstallationAccessToken(installationId)

            const installationOctokit = new Octokit({ auth: token })

            const { data } = await installationOctokit.issues.createComment({
                owner,
                repo,
                issue_number: prNumber,
                body
            })

            return data
        } catch (error) {
            console.error('Error creating comment:', error)
            throw error
        }
    }

    async closePullRequest(owner: string, repo: string, pullNumber: number, installationId: number) {
        try {
            const token = await this.getInstallationAccessToken(installationId)
            const installationOctokit = new Octokit({ auth: token })

            const { data } = await installationOctokit.pulls.update({
                owner,
                repo,
                pull_number: pullNumber,
                state: 'closed',
            })

            return data
        } catch (error) {
            console.error('Error closing pull request:', error)
            throw error
        }
    }
}