import { Suspense } from "react";
import DashboardContent from "./DashboardContent";
import Loading from "./loading";
;
export default function DashboardPage() {
    return (
        <Suspense fallback={<Loading />}>
            <DashboardContent />
        </Suspense>
    );
}