import { Octokit } from '@octokit/rest'
import axios from 'axios'

export class GithubService {
    private github: Octokit
    private token: string

    constructor() {
        this.token = process.env.GITHUB_WEBHOOK_SECRET || ''
        this.github = new Octokit({
            auth: this.token,
        })
    }

    async createComment(owner: string, repo: string, issueNumber: number, body: string) {
        const { data } = await this.github.issues.createComment({
            owner,
            repo,
            issue_number: issueNumber,
            body,
        })
        return data
    }

    async getPullRequest(owner: string, repo: string, pullNumber: number) {
        const { data } = await this.github.pulls.get({
            owner,
            repo,
            pull_number: pullNumber,
        })
        return data
    }

    async getPullRequestBody(owner: string, repo: string, pullNumber: number) {
        const pr = await this.getPullRequest(owner, repo, pullNumber)
        return {
            title: pr.title,
            body: pr.body || '',
        }
    }

    async getPullRequestDiff(owner: string, repo: string, pullNumber: number): Promise<string> {
        const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}.diff`
        const response = await axios.get(url, {
            headers: {
                Authorization: `token ${this.token}`,
                Accept: 'application/vnd.github.v3.diff',
            },
        })
        return response.data
    }

    async getCombinedPRContent(owner: string, repo: string, pullNumber: number): Promise<string> {
        const { title, body } = await this.getPullRequestBody(owner, repo, pullNumber)
        const diff = await this.getPullRequestDiff(owner, repo, pullNumber)

        return `### PR Title:\n${title}\n\n### PR Body:\n${body}\n\n### PR Diff:\n${diff}`
    }

    async addLabels(owner: string, repo: string, issueNumber: number, labels: string[]) {
        const { data } = await this.github.issues.addLabels({
            owner,
            repo,
            issue_number: issueNumber,
            labels,
        })
        return data
    }

    async closePullRequest(owner: string, repo: string, pullNumber: number) {
        const { data } = await this.github.pulls.update({
            owner,
            repo,
            pull_number: pullNumber,
            state: 'closed',
        })
        return data
    }

    async requestReviewers(owner: string, repo: string, pullNumber: number, reviewers: string[]) {
        const { data } = await this.github.pulls.requestReviewers({
            owner,
            repo,
            pull_number: pullNumber,
            reviewers,
        })
        return data
    }
}
