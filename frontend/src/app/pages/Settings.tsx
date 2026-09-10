import { useState } from "react";
import { Bell, Briefcase, Command, ShieldCheck, User, Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { cn } from "@/lib/utils";

const sections = [
    { id: "profile", label: "Profile", icon: User, description: "Your name, avatar and timezone." },
    { id: "workspace", label: "Workspace", icon: Briefcase, description: "Details, visibility and settings for your workspace." },
    { id: "members", label: "Members", icon: ShieldCheck, description: "Who can join and what they can do." },
    { id: "notifications", label: "Notifications", icon: Bell, description: "When and how you hear about things." },
    { id: "preferences", label: "Preferences", icon: Wrench, description: "Appearance and editing shortcuts." },
] as const;

export default function Settings() {
    const [active, setActive] = useState<(typeof sections)[number]["id"]>("profile");
    const activeSection = sections.find((s) => s.id === active)!;

    return (
        <div className="h-full overflow-y-auto p-6">
            <PageHeader
                title="Settings"
                description="A few of these are waiting on the backend. The rest are on their way."
            />

            <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                <nav aria-label="Settings sections" className="h-fit lg:sticky lg:top-0">
                    <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
                        {sections.map(({ id, label, icon: Icon }) => (
                            <li key={id}>
                                <button
                                    type="button"
                                    onClick={() => setActive(id)}
                                    className={cn(
                                        "inline-flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                                        active === id
                                            ? "bg-brand/10 text-brand"
                                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                                    )}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    {label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <section className="rounded-2xl border border-border/60 bg-card p-6">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                            <activeSection.icon className="size-5" />
                        </span>
                        <div>
                            <h2 className="text-base font-semibold">{activeSection.label}</h2>
                            <p className="text-sm text-muted-foreground">
                                {activeSection.description}
                            </p>
                        </div>
                    </div>

                    <div className="my-6 h-px bg-border/70" />

                    <PageEmptyState
                        icon={<Command className="size-5" />}
                        title="On the way"
                        description="This section is waiting on the backend. The moment settings APIs land, the form here gets built for real."
                    />
                </section>
            </div>
        </div>
    );
}