import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import MediaPlayer from "@/components/media-player";

describe("MediaPlayer", () => {
    it("renders a frame container for video kind", () => {
        const { container } = render(<MediaPlayer kind="video" src="https://example.com/v.mp4" />);
        expect(container.querySelector("video")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Play video" })).not.toBeInTheDocument();
    });

    it("renders the compact bar with play controls for audio kind", () => {
        render(<MediaPlayer kind="audio" src="https://example.com/a.webm" />);
        expect(screen.getByRole("button", { name: "Play audio" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Mute" })).toBeInTheDocument();
    });

    it("shows an open-audio fallback when the source errors and cannot be recovered", () => {
        const { container } = render(<MediaPlayer kind="audio" src="blob:unrecoverable" />);
        fireEvent.error(container.querySelector("video")!);
        const fallback = screen.getByText("Open audio");
        expect(fallback).toBeInTheDocument();
        expect(fallback).toHaveAttribute("href", "blob:unrecoverable");
    });

    it("shows an open-video fallback when the source errors and cannot be recovered", () => {
        const { container } = render(<MediaPlayer kind="video" src="blob:unrecoverable" />);
        fireEvent.error(container.querySelector("video")!);
        const fallback = screen.getByText("Open video");
        expect(fallback).toBeInTheDocument();
        expect(fallback).toHaveAttribute("href", "blob:unrecoverable");
    });
});
