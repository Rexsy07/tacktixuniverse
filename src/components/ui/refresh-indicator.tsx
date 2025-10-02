import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function RefreshIndicator({ 
  isRefreshing, 
  className,
  size = "sm" 
}: RefreshIndicatorProps) {
  if (!isRefreshing) return null;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-2 text-sm text-muted-foreground transition-opacity duration-300",
      className
    )}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      <span className="text-xs">Updating...</span>
    </div>
  );
}

interface RefreshOverlayProps {
  isRefreshing: boolean;
  children: React.ReactNode;
}

export function RefreshOverlay({ isRefreshing, children }: RefreshOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isRefreshing && (
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] flex items-center justify-center rounded-lg transition-all duration-200">
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-full border border-border/50">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs font-medium">Refreshing...</span>
          </div>
        </div>
      )}
    </div>
  );
}