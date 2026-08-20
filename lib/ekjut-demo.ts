export interface ClusterCase {
  id: string;
  title: string;
  opposingParty: string;
  category: string;
  affectedCount: number;
  description: string;
}

export const ACTIVE_CLUSTER_CASES: ClusterCase[] = [
  {
    id: "case_001",
    title: "Supertech Eco-Village Possession Delay",
    opposingParty: "Supertech Builders",
    category: "Consumer Rights (Real Estate)",
    affectedCount: 342,
    description: "Homebuyers awaiting possession for over 5 years. Joint complaint for NCDRC."
  },
  {
    id: "case_002",
    title: "Toxic Discharge in Ganga River",
    opposingParty: "XYZ Pharma Chemicals",
    category: "Public Interest (Environment)",
    affectedCount: 1540,
    description: "Factory releasing untreated toxic waste affecting village water supply."
  },
  {
    id: "case_003",
    title: "Byju's Refund Issue",
    opposingParty: "Byju's Education",
    category: "Consumer Rights (Education)",
    affectedCount: 85,
    description: "Parents seeking refund for cancelled courses and tablet packages."
  }
];

export function detectClusterMatch(message: string): ClusterCase | null {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes("supertech") || (lowerMsg.includes("builder") && lowerMsg.includes("delay")) || (lowerMsg.includes("possession") && lowerMsg.includes("flat"))) {
    return ACTIVE_CLUSTER_CASES[0];
  }
  
  if (lowerMsg.includes("factory") && (lowerMsg.includes("waste") || lowerMsg.includes("river") || lowerMsg.includes("water") || lowerMsg.includes("toxic"))) {
    return ACTIVE_CLUSTER_CASES[1];
  }
  
  return null;
}

export interface DlsaEligibility {
  category: string;
  reason: string;
  suggestedFirSection: string;
  suggestedFirTitle: string;
}

export function detectDlsaEligibility(message: string): DlsaEligibility | null {
  const lowerMsg = message.toLowerCase();
  
  const isPoor = lowerMsg.includes("poor") || lowerMsg.includes("no money") || lowerMsg.includes("daily wage") || lowerMsg.includes("low income") || lowerMsg.includes("mazdoor");
  const isWoman = lowerMsg.includes("woman") || lowerMsg.includes("female") || lowerMsg.includes("mahila") || lowerMsg.includes("aurat");
  const isAssault = lowerMsg.includes("beat") || lowerMsg.includes("assault") || lowerMsg.includes("hit me") || lowerMsg.includes("mara");
  const isWorkplace = lowerMsg.includes("employer") || lowerMsg.includes("salary") || lowerMsg.includes("boss") || lowerMsg.includes("work");
  
  if (isPoor && (isAssault || isWorkplace)) {
    return {
      category: "Low Income / Unorganized Worker",
      reason: "Sec. 12(h) - Income less than prescribed limit / Sec. 12(f) - Industrial Workman",
      suggestedFirSection: "BNSS Sec. 115",
      suggestedFirTitle: "Voluntarily causing hurt"
    };
  }
  
  if (isWoman && isPoor) {
    return {
      category: "Woman & Low Income",
      reason: "Sec. 12(c) - Women and Children",
      suggestedFirSection: "BNSS Sec. 74",
      suggestedFirTitle: "Assault or criminal force to woman with intent to outrage her modesty"
    };
  }
  
  return null;
}
