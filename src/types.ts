export interface SettlementRecord {
  id: string;
  date: Date;
  status: string;
  amount: number;
  description?: string;
  loanId?: string;
  borrower?: string;
  lender?: string;
  category?: string;
}

export interface MonthlyTarget {
  month: number; // 0-11
  year: number;
  value: number; // Overall target
  stageTargets?: Record<string, number>;
}
