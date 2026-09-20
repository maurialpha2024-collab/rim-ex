import Image from "next/image";
import { cn } from "@/lib/cn";

// RIM-EX logo (public/logo.jpg, square). Never mirrored in RTL. Pass alt="" when it
// sits next to the brand name.
export default function Logo({
  size = 36,
  alt = "RIM-EX",
  className = "",
}: {
  size?: number;
  alt?: string;
  className?: string;
}) {
  return (
    <Image
      src="/logo.jpg"
      alt={alt}
      width={size}
      height={size}
      priority
      className={cn("shrink-0 rounded-xl object-cover", className)}
    />
  );
}
