import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";
import HouseholdSelector from "./HouseholdSelector";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="flex justify-end px-4 sm:px-6 lg:px-8 pt-3">
          <HouseholdSelector />
        </div>
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
