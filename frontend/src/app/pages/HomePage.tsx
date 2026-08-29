import { HeroSection } from "@/components/ui/hero-section";
import { Outlet } from "react-router-dom";

export function HomePage() {
    return (
        <div>
          <HeroSection />
            <Outlet />
        </div>
    );
}
