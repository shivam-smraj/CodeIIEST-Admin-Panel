import { Loader2 } from "lucide-react";

/** Root-level loading (login, register, forgot-password pages) */
export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
    </div>
  );
}
