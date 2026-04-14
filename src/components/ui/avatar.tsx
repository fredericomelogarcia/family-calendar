"use client";

import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string | null | undefined;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold bg-secondary text-white",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name || "User"}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

interface AvatarGroupProps {
  users: Array<{ name: string | null | undefined; src?: string | null }>;
  max?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarGroup({ users, max = 3, size = "sm" }: AvatarGroupProps) {
  const displayed = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {displayed.map((user, i) => (
        <Avatar
          key={i}
          name={user.name}
          src={user.src}
          size={size}
          className="ring-2 ring-surface"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-medium bg-surface-alt text-text-secondary ring-2 ring-surface",
            size === "sm" && "w-8 h-8 text-xs",
            size === "md" && "w-10 h-10 text-sm",
            size === "lg" && "w-12 h-12 text-base"
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}