
import { GithubService } from '../github.service';


// github.service.getPullRequestBody.spec.ts


// github.service.getPullRequestBody.spec.ts
// Mock for axios (though not used in getPullRequestBody, included for completeness)
jest.mock("axios");

// MockOctokit class to simulate Octokit and its nested pulls.get method
class MockPulls {
    public get = jest.fn();
}

class MockOctokit {
    public pulls: MockPulls = new MockPulls();
    constructor(_: any) { }
}

describe('GithubService.getPullRequestBody() getPullRequestBody method', () => {
    let githubService: GithubService;
    let mockOctokit: MockOctokit;

    beforeEach(() => {
        // Set up environment variable for token
        process.env.GITHUB_WEBHOOK_SECRET = 'test-token';

        // Create a new MockOctokit and inject it into the GithubService instance
        mockOctokit = new MockOctokit({ auth: 'test-token' }) as any;
        githubService = new GithubService();

        // Replace the private github property with our mock
        (githubService as any).github = mockOctokit as any;
    });

    //
    // Happy Path Tests
    //

    it('should return the title and body when both are present in the pull request', async () => {
        // This test ensures that the method returns both title and body as expected.
        const mockPR = {
            title: 'Add new feature',
            body: 'This PR adds a new feature.',
        };
        jest.mocked(mockOctokit.pulls.get).mockResolvedValue({ data: mockPR } as any as never);

        const result = await githubService.getPullRequestBody('owner', 'repo', 42);

        expect(mockOctokit.pulls.get).toHaveBeenCalledWith({
            owner: 'owner',
            repo: 'repo',
            pull_number: 42,
        });
        expect(result).toEqual({
            title: 'Add new feature',
            body: 'This PR adds a new feature.',
        });
    });

    it('should return an empty string for body if the pull request body is missing', async () => {
        // This test ensures that if the PR body is undefined, the method returns an empty string for body.
        const mockPR = {
            title: 'Fix bug',
            body: undefined,
        };
        jest.mocked(mockOctokit.pulls.get).mockResolvedValue({ data: mockPR } as any as never);

        const result = await githubService.getPullRequestBody('owner', 'repo', 101);

        expect(result).toEqual({
            title: 'Fix bug',
            body: '',
        });
    });

    it('should return an empty string for body if the pull request body is an empty string', async () => {
        // This test ensures that if the PR body is already an empty string, it is returned as is.
        const mockPR = {
            title: 'Refactor code',
            body: '',
        };
        jest.mocked(mockOctokit.pulls.get).mockResolvedValue({ data: mockPR } as any as never);

        const result = await githubService.getPullRequestBody('owner', 'repo', 7);

        expect(result).toEqual({
            title: 'Refactor code',
            body: '',
        });
    });

    it('should handle pull request body with special characters and multiline text', async () => {
        // This test ensures that the method correctly returns bodies with special characters and newlines.
        const mockPR = {
            title: 'Improve docs',
            body: 'Line 1\nLine 2\n- Bullet 1\n- Bullet 2\n',
        };
        jest.mocked(mockOctokit.pulls.get).mockResolvedValue({ data: mockPR } as any as never);

        const result = await githubService.getPullRequestBody('owner', 'repo', 88);

        expect(result).toEqual({
            title: 'Improve docs',
            body: 'Line 1\nLine 2\n- Bullet 1\n- Bullet 2\n',
        });
    });

    //
    // Edge Case Tests
    //

    it('should throw an error if getPullRequest throws an error (e.g., PR not found)', async () => {
        // This test ensures that errors from getPullRequest are propagated.
        jest.mocked(mockOctokit.pulls.get).mockRejectedValue(new Error('Not Found') as never);

        await expect(
            githubService.getPullRequestBody('owner', 'repo', 999)
        ).rejects.toThrow('Not Found');
    });

    it('should handle pull request with empty title and body', async () => {
        // This test ensures that the method can handle PRs with empty title and body.
        const mockPR = {
            title: '',
            body: '',
        };
        jest.mocked(mockOctokit.pulls.get).mockResolvedValue({ data: mockPR } as any as never);

        const result = await githubService.getPullRequestBody('owner', 'repo', 123);

        expect(result).toEqual({
            title: '',
            body: '',
        });
    });

    it('should handle pull request with only title and no body property', async () => {
        // This test ensures that if the PR object lacks a body property, the method returns an empty string for body.
        const mockPR = {
            title: 'Only title',
            // body is omitted
        };
        jest.mocked(mockOctokit.pulls.get).mockResolvedValue({ data: mockPR } as any as never);

        const result = await githubService.getPullRequestBody('owner', 'repo', 321);

        expect(result).toEqual({
            title: 'Only title',
            body: '',
        });
    });

    it('should handle pull request with body as null', async () => {
        // This test ensures that if the PR body is null, the method returns an empty string for body.
        const mockPR = {
            title: 'Null body',
            body: null,
        };
        jest.mocked(mockOctokit.pulls.get).mockResolvedValue({ data: mockPR } as any as never);

        const result = await githubService.getPullRequestBody('owner', 'repo', 555);

        expect(result).toEqual({
            title: 'Null body',
            body: '',
        });
    });
});