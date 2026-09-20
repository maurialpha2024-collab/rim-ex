import { BadgeCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Gold check for admin-verified traders, quiet "New" pill for everyone else.
export function TrustBadge({
  verified,
  verifiedLabel,
  newLabel,
}: {
  verified: boolean;
  verifiedLabel: string;
  newLabel: string;
}) {
  return verified ? (
    <Badge tone="gold">
      <BadgeCheck size={12} aria-hidden="true" />
      {verifiedLabel}
    </Badge>
  ) : (
    <Badge tone="neutral">
      <Sparkles size={12} aria-hidden="true" />
      {newLabel}
    </Badge>
  );
}
