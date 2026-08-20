import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TrustLevel = "verified" | "pending" | "outdated";

interface LegalSourceTrustProps {
  level: TrustLevel;
  className?: string;
}

export function LegalSourceTrust({ level, className }: LegalSourceTrustProps) {
  const config = {
    verified: {
      icon: ShieldCheck,
      text: "Verified Source",
      classes: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
      iconClasses: "text-green-600"
    },
    pending: {
      icon: Shield,
      text: "Pending Review",
      classes: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
      iconClasses: "text-yellow-600"
    },
    outdated: {
      icon: ShieldAlert,
      text: "Outdated / Repealed",
      classes: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
      iconClasses: "text-red-600"
    }
  };

  const { icon: Icon, text, classes, iconClasses } = config[level] || config.pending;

  return (
    <Badge variant="outline" className={cn("flex items-center gap-1.5 px-2.5 py-0.5 font-medium transition-colors", classes, className)}>
      <Icon className={cn("h-3.5 w-3.5", iconClasses)} />
      {text}
    </Badge>
  );
}
