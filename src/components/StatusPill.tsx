import {
  Ban,
  BadgeCheck,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Clock,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";

// Status is always icon + label, never colour alone.
const STATUS: Record<string, { tone: BadgeTone; Icon: LucideIcon }> = {
  open: { tone: "info", Icon: CircleDot },
  locked: { tone: "warning", Icon: Clock },
  completed: { tone: "positive", Icon: CheckCircle2 },
  cancelled: { tone: "neutral", Icon: XCircle },
  verified: { tone: "positive", Icon: BadgeCheck },
  pending: { tone: "warning", Icon: Clock },
  unverified: { tone: "neutral", Icon: CircleDashed },
  rejected: { tone: "negative", Icon: XCircle },
  active: { tone: "positive", Icon: CheckCircle2 },
  inactive: { tone: "neutral", Icon: CircleDashed },
  suspended: { tone: "negative", Icon: Ban },
};

export function StatusPill({ status, label, className }: { status: string; label: string; className?: string }) {
  const { tone, Icon } = STATUS[status] ?? STATUS.unverified;
  return (
    <Badge tone={tone} className={className}>
      <Icon size={12} aria-hidden="true" />
      {label}
    </Badge>
  );
}

// users.verification_status uses "pending_verification"; the pill calls it "pending".
export function verificationKey(status: string) {
  return status === "pending_verification" ? "pending" : status;
}
