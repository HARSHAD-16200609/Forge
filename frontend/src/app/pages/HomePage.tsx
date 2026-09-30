import { CapabilityStrip } from "@/features/landing/CapabilityStrip";
import { FeatureBento } from "@/features/landing/FeatureBento";
import { FinalCta } from "@/features/landing/FinalCta";
import { HowItWorks } from "@/features/landing/HowItWorks";
import { LandingFooter } from "@/features/landing/LandingFooter";
import { LandingHero } from "@/features/landing/LandingHero";
import { LandingNav } from "@/features/landing/LandingNav";
import { ProductSection } from "@/features/landing/ProductSection";

export function HomePage() {
    return (
        // `landing-surface` re-points the design tokens for this subtree only, so
        // the warm bone canvas below stops at this element and the workspace app
        // keeps the cool white it was designed with.
        //
        // `bg-background` has to be here rather than left to `body`. The body
        // resolves its colour once, against the global cool tokens, and a child
        // cannot retroactively change an inherited value. Without this class the
        // landing would paint on the app's white and only the text inside it
        // would be warm.
        <div className="landing-surface overflow-x-clip bg-background">
            {/* One very low opacity layer so the page is not a flat sheet. */}
            <div className="landing-ambient" aria-hidden="true" />

            <LandingNav />
            <main>
                <LandingHero />
                <CapabilityStrip />
                <ProductSection />
                <FeatureBento />
                <HowItWorks />
                <FinalCta />
            </main>
            <LandingFooter />
        </div>
    );
}
