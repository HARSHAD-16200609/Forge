import { Link } from "react-router-dom";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import logo from "@/assets/forge.png";

const menuItems = [
    { name: "Features", href: "#features" },
    { name: "Product", href: "#product" },
];

export function LandingNav() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 24);
    });

    const closeMenu = () => setIsOpen(false);

    return (
        <header className="fixed inset-x-0 top-0 z-40 px-3 sm:px-4">
            <nav
                className={cn(
                    "mx-auto flex items-center justify-between gap-6 px-4 py-2.5 transition-all duration-300",
                    isScrolled
                        ? "mt-2 max-w-3xl rounded-2xl border bg-background/70 shadow-sm shadow-zinc-950/5 backdrop-blur-xl lg:max-w-5xl lg:px-6"
                        : "mt-0 max-w-7xl border border-transparent",
                )}
            >
                <Link
                    to="/"
                    className="flex shrink-0 items-center gap-2 font-medium"
                    aria-label="Forge home"
                >
                    <img src={logo} alt="" className="h-11 w-auto object-contain" />
                </Link>

                <div className="hidden items-center gap-8 text-sm lg:flex">
                    {menuItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
                        >
                            {item.name}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="hidden transition-transform duration-200 hover:scale-105 active:scale-95 motion-reduce:transform-none sm:inline-flex"
                    >
                        <Link to="/auth/login">
                            <span>Log in</span>
                        </Link>
                    </Button>
                    <Button
                        asChild
                        size="sm"
                        className="bg-brand text-brand-foreground transition-transform duration-200 hover:scale-105 hover:bg-brand/90 active:scale-95 motion-reduce:transform-none"
                    >
                        <Link to="/auth/register">
                            <span>Sign up</span>
                        </Link>
                    </Button>
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setIsOpen((open) => !open)}
                        aria-label={isOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isOpen}
                    >
                        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </Button>
                </div>
            </nav>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="mx-auto mt-2 max-w-3xl rounded-2xl border bg-background/95 p-4 shadow-lg shadow-zinc-950/5 backdrop-blur-xl lg:hidden"
                    >
                        <div className="flex flex-col gap-1">
                            {menuItems.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeMenu}
                                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                                >
                                    {item.name}
                                </a>
                            ))}
                            <Link
                                to="/auth/login"
                                onClick={closeMenu}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground sm:hidden"
                            >
                                Log in
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="transition-transform duration-200 hover:scale-105 active:scale-95 motion-reduce:transform-none"
        >
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
    );
}