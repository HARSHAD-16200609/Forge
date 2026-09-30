import { Link } from "react-router-dom";
import { Close, Menu, Moon, Sun } from "@carbon/icons-react";
import { useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

const menuItems = [
    { name: "Product", href: "#product" },
    { name: "Features", href: "#features" },
    { name: "How it works", href: "#how-it-works" },
];

/**
 * The bar is sticky with a permanent hairline rather than a floating pill that
 * changes width on scroll. The old version watched scroll position to swap
 * between `max-w-3xl` and `max-w-5xl`, which reflowed the whole header on the
 * first pixel of scroll and needed a scroll listener to do it.
 */
export function LandingNav() {
    const [isOpen, setIsOpen] = useState(false);
    const closeMenu = () => setIsOpen(false);

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
            <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-6">
                <Link
                    to="/"
                    className="flex shrink-0 items-center gap-2.5 py-1"
                    aria-label="Forge home"
                >
                    {/* Wordmark only. The mark that used to sit here is a
                        1024px opaque raster whose corners are #fcfcfc, so at
                        28px it rendered as a pale square on the bone canvas
                        and put 485 kB on the critical path to do it. */}
                    <span className="landing-serif text-[1.375rem] leading-none tracking-[-0.02em]">
                        Forge
                    </span>
                </Link>

                <div className="hidden items-center gap-7 lg:flex">
                    {menuItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="landing-mono py-2 transition-colors duration-150 hover:text-foreground"
                        >
                            {item.name}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to="/auth/login"
                        className="landing-mono hidden px-2 py-2 transition-colors duration-150 hover:text-foreground sm:block"
                    >
                        Log in
                    </Link>
                    <Link to="/auth/register" className="landing-cta h-9 px-4 text-[0.8125rem]">
                        Sign up
                    </Link>
                    <ThemeToggle />
                    <button
                        type="button"
                        onClick={() => setIsOpen((open) => !open)}
                        aria-label={isOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isOpen}
                        className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground lg:hidden"
                    >
                        {isOpen ? <Close size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </nav>

            {isOpen && (
                <div className="border-t border-border lg:hidden">
                    <div className="mx-auto flex max-w-5xl flex-col px-6 py-2">
                        {menuItems.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={closeMenu}
                                className="border-b border-border/60 py-3 text-sm text-foreground last:border-b-0"
                            >
                                {item.name}
                            </a>
                        ))}
                        <Link
                            to="/auth/login"
                            onClick={closeMenu}
                            className="border-t border-border/60 py-3 text-sm text-foreground sm:hidden"
                        >
                            Log in
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={label}
            title={label}
            className={cn(
                "flex size-9 items-center justify-center rounded-md text-muted-foreground",
                "transition-colors duration-150 hover:bg-muted hover:text-foreground",
            )}
        >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}
