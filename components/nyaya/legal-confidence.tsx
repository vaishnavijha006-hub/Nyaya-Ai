import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";

export function LegalConfidence({ score, label }: { score: number, label?: string }) {
  // score from 0 to 100
  let Icon = Shield;
  let color = "text-yellow-500";
  let bg = "bg-yellow-500/10";
  
  if (score >= 80) {
    Icon = ShieldCheck;
    color = "text-green-500";
    bg = "bg-green-500/10";
  } else if (score < 50) {
    Icon = ShieldAlert;
    color = "text-red-500";
    bg = "bg-red-500/10";
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${color} ${bg}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{label || `Confidence: ${score}%`}</span>
    </div>
  );
}
