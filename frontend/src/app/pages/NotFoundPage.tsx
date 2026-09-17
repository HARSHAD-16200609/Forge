import { Button } from "@/components/ui/button";
import {
    KineticArrow,
    NotFoundContent,
} from "@/components/access/AccessDeniedScreens";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
    return <NotFoundContent standalone />;
}

export function AppNotFound() {
    const navigate = useNavigate();

    return (
        <NotFoundContent
            className="h-full"
            actions={
                <Button className="group" onClick={() => navigate("/app/home")}>
                    Back to workspace
                    <KineticArrow />
                </Button>
            }
        />
    );
}