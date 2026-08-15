export interface PayrollCalculationInput {
  baseSalary: number;
  allowances?: { name: string; amount: number }[];
  deductions?: { name: string; amount: number }[];
}

export interface PayrollCalculationOutput {
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  breakdown: {
    baseSalary: number;
    allowances: { name: string; amount: number }[];
    deductions: { name: string; amount: number }[];
  };
}

export function calculatePayrollItem(input: PayrollCalculationInput): PayrollCalculationOutput {
  const base = Math.max(0, input.baseSalary || 0);
  const allowancesTotal = (input.allowances || []).reduce((acc, curr) => acc + Math.max(0, curr.amount || 0), 0);
  const deductionsTotal = (input.deductions || []).reduce((acc, curr) => acc + Math.max(0, curr.amount || 0), 0);

  const grossEarnings = base + allowancesTotal;
  const netPay = Math.max(0, grossEarnings - deductionsTotal);

  return {
    grossEarnings,
    totalDeductions: deductionsTotal,
    netPay,
    breakdown: {
      baseSalary: base,
      allowances: input.allowances || [],
      deductions: input.deductions || [],
    },
  };
}
