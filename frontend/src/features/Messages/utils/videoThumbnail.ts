const thumbnailCache = new Map<string, Promise<string | null>>();

function frameFromVideo(video: HTMLVideoElement): string | null {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.7);
}

function loadAndCapture(src: string, crossOrigin: string | null): Promise<string | null> {
    return new Promise((resolve) => {
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
        if (crossOrigin) video.crossOrigin = crossOrigin;
        video.src = src;

        video.onloadeddata = () => {
            let frame: string | null = null;
            try {
                frame = frameFromVideo(video);
            } catch {
                frame = null;
            }
            video.src = "";
            resolve(frame);
        };
        video.onerror = () => {
            video.src = "";
            resolve(null);
        };
    });
}

async function capture(src: string): Promise<string | null> {
    const isLocal = src.startsWith("blob:") || src.startsWith("data:");

    if (!isLocal) {
        const frame = await loadAndCapture(src, "anonymous");
        if (frame) return frame;
    }

    return loadAndCapture(src, null);
}

export function getVideoThumbnail(src: string): Promise<string | null> {
    const cached = thumbnailCache.get(src);
    if (cached) return cached;

    const promise = capture(src);
    thumbnailCache.set(src, promise);
    return promise;
}
