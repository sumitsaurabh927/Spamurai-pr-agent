import { Octokit } from '@octokit/rest'
import { createAppAuth } from '@octokit/auth-app'
import axios from 'axios'

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

    async getPullRequest(owner: string, repo: string, pullNumber: number, installationId: number) {
        try {
            const token = await this.getInstallationAccessToken(installationId)
            const installationOctokit = new Octokit({ auth: token })

            const { data } = await installationOctokit.pulls.get({
                owner,
                repo,
                pull_number: pullNumber,
            })

            return data
        } catch (error) {
            console.error('Error getting pull request:', error)
            throw error
        }
    }

    async getPullRequestBody(owner: string, repo: string, pullNumber: number, installationId: number) {
        const pr = await this.getPullRequest(owner, repo, pullNumber, installationId)
        return {
            title: pr.title,
            body: pr.body || '',
        }
    }

    async getPullRequestDiff(owner: string, repo: string, pullNumber: number, installationId: number): Promise<string> {
        try {
            const token = await this.getInstallationAccessToken(installationId)

            const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}.diff`
            const response = await axios.get(url, {
                headers: {
                    Authorization: `token ${token}`,
                    Accept: 'application/vnd.github.v3.diff',
                }
            })

            return response.data
        } catch (error) {
            console.error('Error getting pull request diff:', error)
            throw error
        }
    }

    async getCombinedPRContent(owner: string, repo: string, pullNumber: number, installationId: number): Promise<string> {
        const { title, body } = await this.getPullRequestBody(owner, repo, pullNumber, installationId)
        const diff = await this.getPullRequestDiff(owner, repo, pullNumber, installationId)

        return `### PR Title:\n${title}\n\n### PR Body:\n${body}\n\n### PR Diff:\n${diff}`
    }

    async addLabels(owner: string, repo: string, issueNumber: number, labels: string[], installationId: number) {
        try {
            const token = await this.getInstallationAccessToken(installationId)
            const installationOctokit = new Octokit({ auth: token })

            const { data } = await installationOctokit.issues.addLabels({
                owner,
                repo,
                issue_number: issueNumber,
                labels,
            })

            return data
        } catch (error) {
            console.error('Error adding labels:', error)
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

    async requestReviewers(owner: string, repo: string, pullNumber: number, reviewers: string[], installationId: number) {
        try {
            const token = await this.getInstallationAccessToken(installationId)
            const installationOctokit = new Octokit({ auth: token })

            const { data } = await installationOctokit.pulls.requestReviewers({
                owner,
                repo,
                pull_number: pullNumber,
                reviewers,
            })

            return data
        } catch (error) {
            console.error('Error requesting reviewers:', error)
            throw error
        }
    }
}