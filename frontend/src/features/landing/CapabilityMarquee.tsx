import { FileText, Hash, Layers, MessageSquare, Radio, Smile } from "lucide-react";

const capabilities = [
    { icon: Hash, label: "Channels" },
    { icon: MessageSquare, label: "Threads" },
    { icon: Smile, label: "Reactions" },
    { icon: FileText, label: "Rich messages" },
    { icon: Radio, label: "Live presence" },
    { icon: Layers, label: "Workspaces" },
];

function CapabilityRow() {
    return (
        <div className="flex shrink-0 items-center">
            {capabilities.map(({ icon: Icon, label }) => (
                <div
                    key={label}
                    className="flex items-center gap-3 px-8 text-muted-foreground"
                >
                    <Icon className="size-4 text-brand" aria-hidden="true" />
                    <span className="text-sm font-medium">{label}</span>
                </div>
            ))}
        </div>
    );
}

export function CapabilityMarquee() {
    return (
        <section
            aria-label="Forge capabilities"
            className="border-y py-10"
        >
            <div
                className="marquee-track flex w-max animate-[marquee_36s_linear_infinite]"
                style={{
                    maskImage:
                        "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
                    WebkitMaskImage:
                        "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
                }}
            >
                <CapabilityRow />
                <CapabilityRow />
            </div>
        </section>
    );
}