import { CapabilityMarquee } from "@/features/landing/CapabilityMarquee";
import { FeatureBento } from "@/features/landing/FeatureBento";
import { FinalCta } from "@/features/landing/FinalCta";
import { LandingFooter } from "@/features/landing/LandingFooter";
import { LandingHero } from "@/features/landing/LandingHero";
import { LandingNav } from "@/features/landing/LandingNav";
import { ProductShowcase } from "@/features/landing/ProductShowcase";

export function HomePage() {
    return (
        <div className="overflow-x-clip">
            <LandingNav />
            <main>
                <LandingHero />
                <CapabilityMarquee />
                <FeatureBento />
                <ProductShowcase />
                <FinalCta />
            </main>
            <LandingFooter />
        </div>
    );
}