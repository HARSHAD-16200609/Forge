import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "@/app/pages/HomePage";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useReveal, useRevealGroup } from "@/features/landing/useReveal";

class MockObserver {
    static instances: MockObserver[] = [];
    callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        MockObserver.instances.push(this);
    }

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();

    emit(isIntersecting: boolean, target: Element) {
        this.callback(
            [
                {
                    isIntersecting,
                    intersectionRatio: isIntersecting ? 1 : 0,
                    target,
                } as IntersectionObserverEntry,
            ],
            this as unknown as IntersectionObserver,
        );
    }
}

beforeEach(() => {
    MockObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockObserver);
});

function Probe() {
    const ref = useReveal<HTMLDivElement>();
    return (
        <div ref={ref} data-reveal>
            content
        </div>
    );
}

/** The shape that actually broke: children marked, container only observed. */
function GroupProbe() {
    const ref = useRevealGroup<HTMLDivElement>();
    return (
        <div ref={ref}>
            <p data-reveal style={{ "--reveal-index": 0 } as React.CSSProperties}>
                one
            </p>
            <p data-reveal style={{ "--reveal-index": 1 } as React.CSSProperties}>
                two
            </p>
        </div>
    );
}

describe("useRevealGroup", () => {
    it("reveals every child, not just the observed container", () => {
        const { container } = render(<GroupProbe />);
        const children = [...container.querySelectorAll("[data-reveal]")];

        expect(children).toHaveLength(2);
        for (const child of children) {
            expect(child).not.toHaveAttribute("data-revealed");
        }

        MockObserver.instances.at(-1)!.emit(true, container.firstElementChild!);

        // Regression: the plain hook left these at opacity 0 forever, which
        // rendered a whole section of the page invisible.
        for (const child of children) {
            expect(child).toHaveAttribute("data-revealed");
        }
    });

    it("observes the container, not each child", () => {
        const { container } = render(<GroupProbe />);
        const observer = MockObserver.instances.at(-1)!;
        expect(observer.observe).toHaveBeenCalledTimes(1);
        expect(observer.observe).toHaveBeenCalledWith(container.firstElementChild);
    });

    it("reveals everything when IntersectionObserver is unavailable", () => {
        vi.stubGlobal("IntersectionObserver", undefined);
        const { container } = render(<GroupProbe />);
        for (const child of container.querySelectorAll("[data-reveal]")) {
            expect(child).toHaveAttribute("data-revealed");
        }
    });
});

describe("useReveal", () => {
    it("starts hidden and reveals once the element intersects", () => {
        const { container } = render(<Probe />);
        const element = container.firstElementChild!;

        expect(element).toHaveAttribute("data-reveal");
        expect(element).not.toHaveAttribute("data-revealed");

        MockObserver.instances.at(-1)!.emit(true, element);
        expect(element).toHaveAttribute("data-revealed");
    });

    it("unobserves after the first reveal so it cannot animate back out", () => {
        const { container } = render(<Probe />);
        const element = container.firstElementChild!;
        const observer = MockObserver.instances.at(-1)!;

        observer.emit(true, element);
        expect(observer.unobserve).toHaveBeenCalledWith(element);

        // A reader who scrolls back up must not see the content disappear.
        observer.emit(false, element);
        expect(element).toHaveAttribute("data-revealed");
        expect(observer.unobserve).toHaveBeenCalledTimes(1);
    });

    it("shows the content when IntersectionObserver is unavailable", () => {
        vi.stubGlobal("IntersectionObserver", undefined);
        const { container } = render(<Probe />);
        // Never better to leave copy permanently invisible.
        expect(container.firstElementChild).toHaveAttribute("data-revealed");
    });
});

describe("HomePage", () => {
    const renderPage = () =>
        render(
            <MemoryRouter>
                <ThemeProvider>
                    <HomePage />
                </ThemeProvider>
            </MemoryRouter>,
        );

    it("has exactly one h1", () => {
        const { container } = renderPage();
        expect(container.querySelectorAll("h1")).toHaveLength(1);
    });

    it("keeps the hero free of media so the first paint is text", () => {
        const { container } = renderPage();
        const hero = container.querySelector("h1")!.closest("section")!;
        // A video in the hero would become the LCP element.
        expect(hero.querySelector("video")).toBeNull();
        expect(hero.querySelector("img")).toBeNull();
    });

    it("exposes the anchors the nav links to", () => {
        const { container } = renderPage();
        for (const id of ["product", "features", "how-it-works"]) {
            expect(container.querySelector(`#${id}`)).not.toBeNull();
        }
    });

    it("numbers the setup steps in a real list", () => {
        const { container } = renderPage();
        const list = container.querySelector("#how-it-works ol")!;
        expect(list).not.toBeNull();
        expect(list.querySelectorAll(":scope > li")).toHaveLength(4);
    });

    it("offers both account routes", () => {
        renderPage();
        expect(screen.getAllByRole("link", { name: /sign in/i }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole("link", { name: /create a workspace/i }).length).toBeGreaterThan(
            0,
        );
    });

    it("exposes the numbered steps as list items to assistive technology", () => {
        const { container } = renderPage();
        const section = container.querySelector("#how-it-works")!;
        expect(section.querySelectorAll('ol > li[style*="--reveal-index"]')).toHaveLength(4);
    });
});
