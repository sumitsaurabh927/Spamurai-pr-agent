// Enum for GitHub Pull Request Actions
export enum PRAction {
    OPENED = 'opened',
    EDITED = 'edited',
    CLOSED = 'closed',
    REOPENED = 'reopened',
}

// Enum for the possible PR States
export enum PRState {
    OPEN = 'open',
    CLOSED = 'closed',
    MERGED = 'merged',
}

// Enum for the webhook event topics (which are emitted to trigger actions in your app)
export enum GithubEventTopic {
    PR_OPENED = 'github.pr.opened',
    PR_EDITED = 'github.pr.edited',
    PR_SPAM_DETECTED = 'github.pr.spam.detected', // New event for spam detection
    PR_CLEANED = 'github.pr.cleaned', // New event for clean PRs after review
}
