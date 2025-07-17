import { cn } from "@/lib/utils";

export function Loader({ className }: { className?: string }) {
  return (
    <div className="flex justify-center items-center">
      <div
        className={cn(
          "animate-spin rounded-full h-8 w-8 border-b-2 border-primary",
          className
        )}
      ></div>
    </div>
  );
}
