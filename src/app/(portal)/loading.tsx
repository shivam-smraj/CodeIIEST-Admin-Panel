import { Loader2 } from "lucide-react";

/**
 * Shown automatically by Next.js while portal pages are loading.
 */
export default function PortalLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground opacity-60" />
    </div>
  );
}
