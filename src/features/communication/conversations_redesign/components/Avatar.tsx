export default function Avatar({
  avatarUrl,
  name,
  online,
  size = "md",
}: {
  avatarUrl?: string;
  name?: string;
  online?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-11 w-11 text-sm",
  };

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-100 to-primary-300 font-bold text-primary-900 ${sizes[size]}`}
      style={
        avatarUrl
          ? {
              backgroundImage: `url("${avatarUrl}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : undefined
      }
      aria-hidden="true"
    >
      {!avatarUrl ? initials(name) : null}
      {online ? (
        <span className="absolute bottom-0 end-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      ) : null}
    </div>
  );
}


function initials(name?: string | null) {
  const source = name?.trim() || "?";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
