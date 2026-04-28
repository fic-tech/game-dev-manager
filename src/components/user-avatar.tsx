import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { avatarColor, initials } from "@/lib/format";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

export function UserAvatar({
  user,
  size = "sm",
  className,
}: {
  user: User | null | undefined;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  if (!user) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-dashed border-border bg-muted/50 text-[10px] text-muted-foreground",
          size === "xs" && "size-5",
          size === "sm" && "size-7",
          size === "md" && "size-9",
          size === "lg" && "size-12",
          className
        )}
        title="未割当"
      >
        ?
      </span>
    );
  }
  const sizeCls =
    size === "xs"
      ? "size-5 text-[9px]"
      : size === "sm"
        ? "size-7 text-[11px]"
        : size === "md"
          ? "size-9 text-xs"
          : "size-12 text-sm";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className={cn(sizeCls, className)}>
          <AvatarFallback
            style={{ background: avatarColor(user.avatarHue), color: "#fff" }}
            className="font-semibold"
          >
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>{user.name}</TooltipContent>
    </Tooltip>
  );
}

export function UserStack({
  users,
  max = 4,
  size = "sm",
}: {
  users: User[];
  max?: number;
  size?: "xs" | "sm" | "md";
}) {
  const visible = users.slice(0, max);
  const rest = users.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((u) => (
        <UserAvatar
          key={u.id}
          user={u}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background",
            size === "xs"
              ? "size-5 text-[9px]"
              : size === "sm"
                ? "size-7 text-[10px]"
                : "size-9 text-xs"
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
