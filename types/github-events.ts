export enum PRAction {
    OPENED = 'opened',
    EDITED = 'edited',
    CLOSED = 'closed',
    REOPENED = 'reopened',
}

export enum PRState {
    OPEN = 'open',
    CLOSED = 'closed',
    MERGED = 'merged',
}

export enum GithubEventTopic {
    PR_OPENED = 'github.pr.opened',
    PR_EDITED = 'github.pr.edited',
    PR_SPAM_DETECTED = 'github.pr.spam.detected',
    PR_CLEANED = 'github.pr.cleaned',
}