export type RecordingType = "audio" | "video";

export class MediaService {
    mimeFor(type: RecordingType): string {
        const candidates =
            type === "video"
                ? [
                      "video/webm;codecs=vp9,opus",
                      "video/webm;codecs=vp8,opus",
                      "video/webm",
                      "video/mp4",
                  ]
                : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

        if (typeof MediaRecorder === "undefined") {
            return type === "video" ? "video/webm" : "audio/webm";
        }

        return candidates.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? candidates[0];
    }

    isSupported(): boolean {
        return (
            typeof navigator !== "undefined" &&
            !!navigator.mediaDevices?.getUserMedia &&
            typeof MediaRecorder !== "undefined"
        );
    }

    async start(type: RecordingType): Promise<{
        stream: MediaStream;
        recorder: MediaRecorder;
        mimeType: string;
    }> {
        if (!this.isSupported()) {
            throw new Error("Recording is not supported in this browser");
        }

        const stream = await navigator.mediaDevices.getUserMedia(
            type === "video" ? { video: true, audio: true } : { audio: true },
        );

        const mimeType = this.mimeFor(type);
        const recorder = new MediaRecorder(stream, { mimeType });

        return { stream, recorder, mimeType };
    }

    stop(recorder: MediaRecorder): Promise<{ blob: Blob; url: string; file: File }> {
        return new Promise((resolve, reject) => {
            if (recorder.state === "inactive") {
                reject(new Error("Recorder is already inactive"));
                return;
            }

            const chunks: BlobPart[] = [];
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunks.push(event.data);
            };
            recorder.onerror = () => reject(new Error("Recording failed"));
            recorder.onstop = () => {
                const raw = recorder.mimeType || "video/webm";
                const mimeType = raw.split(";")[0].trim().toLowerCase();
                const blob = new Blob(chunks, { type: mimeType });
                const url = URL.createObjectURL(blob);
                const isAudio = mimeType.startsWith("audio/");
                const ext = mimeType.includes("mp4") ? "mp4" : "webm";
                const filename = isAudio ? `voice-note.${ext}` : `video-recording.${ext}`;
                const file = new File([blob], filename, { type: mimeType });
                resolve({ blob, url, file });
            };

            recorder.stop();
        });
    }

    disposeStream(stream: MediaStream): void {
        stream.getTracks().forEach((track) => track.stop());
    }
}

export const mediaService = new MediaService();
