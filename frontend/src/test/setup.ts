import "@testing-library/jest-dom/vitest";

// jsdom implements neither `matchMedia` nor the observers the landing relies on.
// The theme provider reads `prefers-color-scheme` on mount, so without this every
// test that renders a themed component fails before it reaches an assertion.
if (typeof window.matchMedia !== "function") {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }),
    });
}
