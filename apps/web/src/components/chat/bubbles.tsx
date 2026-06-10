import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] break-all rounded-2xl rounded-br-sm bg-indigo-500/90 px-4 py-2.5 text-sm text-white">
        {text}
      </div>
    </div>
  );
}

export function AssistantBubble({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "error";
}) {
  const isText = typeof children === "string";
  if (isText || tone === "error") {
    return (
      <div className="flex justify-start">
        <div
          className={cn(
            "max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm",
            tone === "error"
              ? "border border-rose-500/30 bg-rose-500/10 text-rose-200"
              : "bg-slate-800 text-slate-200",
          )}
        >
          {children}
        </div>
      </div>
    );
  }
  return <div className="w-full">{children}</div>;
}
