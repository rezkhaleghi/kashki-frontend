import Image from "next/image";

function avatarUrl(src: string) {
  if (/^https?:\/\//i.test(src)) return src;
  const path = src.replace(/^\/+/, "");
  return `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/files/${path}`;
}

export function UserAvatar({
  src,
  name,
  size = "md",
}: {
  src: string | null | undefined;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "size-9 text-xs",
    md: "size-12 text-sm",
    lg: "size-20 text-xl",
  }[size];

  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 font-semibold text-violet-700 ${sizeClass}`}>
      {src ? (
        <Image src={avatarUrl(src)} alt={name} fill sizes="80px" className="object-cover" unoptimized />
      ) : (
        name.trim().charAt(0).toUpperCase() || "?"
      )}
    </div>
  );
}
