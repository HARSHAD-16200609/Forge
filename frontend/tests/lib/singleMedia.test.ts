import { describe, expect, it, vi } from "vitest";
import { releaseMediaPlayback, requestMediaPlayback } from "@/lib/single-media";

function fakeMedia(paused: boolean) {
    return {
        paused,
        pause: vi.fn(),
    } as unknown as HTMLMediaElement;
}

describe("requestMediaPlayback", () => {
    it("pauses the previously playing media and keeps the newest as active", () => {
        const first = fakeMedia(false);
        const second = fakeMedia(false);

        requestMediaPlayback(first);
        requestMediaPlayback(second);

        expect(first.pause).toHaveBeenCalledTimes(1);
        expect(second.pause).not.toHaveBeenCalled();
    });

    it("does not pause a paused media element", () => {
        const paused = fakeMedia(true);
        const playing = fakeMedia(false);

        requestMediaPlayback(paused);
        requestMediaPlayback(playing);

        expect(paused.pause).not.toHaveBeenCalled();
    });

    it("does not pause the same element when it requests playback again", () => {
        const media = fakeMedia(false);

        requestMediaPlayback(media);
        requestMediaPlayback(media);

        expect(media.pause).not.toHaveBeenCalled();
    });

    it("allows a new play once the active media stops", () => {
        const first = fakeMedia(false);
        const second = fakeMedia(false);

        requestMediaPlayback(first);
        releaseMediaPlayback(first);
        requestMediaPlayback(second);

        expect(first.pause).not.toHaveBeenCalled();
        expect(second.pause).not.toHaveBeenCalled();
    });
});
