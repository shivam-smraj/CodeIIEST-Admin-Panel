import { Loader2 } from "lucide-react";
import { CodeiiestLogo } from "@/components/ui/codeiiest-logo";

/**
 * Shown automatically by Next.js while portal pages are loading.
 */
export default function PortalLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <CodeiiestLogo size={40} className="opacity-60" />
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading…
      </div>
    </div>
  );
}
