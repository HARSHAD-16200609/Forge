import { Link } from "react-router-dom";

const columns = [
    {
        heading: "Product",
        links: [
            { label: "Recording", href: "#product" },
            { label: "Features", href: "#features" },
            { label: "How it works", href: "#how-it-works" },
        ],
    },
    {
        heading: "Account",
        links: [
            { label: "Create a workspace", href: "/auth/register" },
            { label: "Sign in", href: "/auth/login" },
        ],
    },
];

export function LandingFooter() {
    return (
        <footer className="mx-auto max-w-5xl px-6 py-14">
            <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
                <div className="max-w-xs">
                    <p className="landing-serif text-[1.0625rem] tracking-[-0.01em]">Forge</p>
                    <p className="mt-3 text-sm leading-[1.6] text-muted-foreground">
                        Channels and threads for a team that would rather talk than email.
                    </p>
                </div>

                <div className="flex gap-14">
                    {columns.map((column) => (
                        <div key={column.heading}>
                            <p className="landing-mono mb-4">{column.heading}</p>
                            <ul className="flex flex-col gap-2.5">
                                {column.links.map((link) => (
                                    <li key={link.href}>
                                        {link.href.startsWith("#") ? (
                                            <a
                                                href={link.href}
                                                className="inline-block py-1 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link
                                                to={link.href}
                                                className="inline-block py-1 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                                            >
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="landing-mono">React, Fastify, Postgres</p>
                <p className="landing-mono">Built as a study in realtime</p>
            </div>
        </footer>
    );
}
