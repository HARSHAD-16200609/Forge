let activeMedia: HTMLMediaElement | null = null;

/** Ensure only one media element plays at a time across the whole app. */
export function requestMediaPlayback(element: HTMLMediaElement): void {
    if (activeMedia && activeMedia !== element && !activeMedia.paused) {
        activeMedia.pause();
    }
    activeMedia = element;
}

export function releaseMediaPlayback(element: HTMLMediaElement): void {
    if (activeMedia === element) {
        activeMedia = null;
    }
}
