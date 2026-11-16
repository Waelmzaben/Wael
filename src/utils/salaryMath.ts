import type { EmployeeDraft, EmployeeRecord, SalaryBreakdown, SalarySettings } from '../types/salary';

export function safeNumber(value: unknown, fallback = 0): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return fallback;
  }
  return num;
}

export function normalizeEmployeeRecord(
  raw: Partial<EmployeeRecord>,
  fallbackIndex = 0
): EmployeeRecord {
  return {
    id: raw.id || `emp-migrated-${fallbackIndex}-${Date.now()}`,
    name: typeof raw.name === 'string' ? raw.name : '',
    jobTitle: typeof raw.jobTitle === 'string' ? raw.jobTitle : '',
    grade: typeof raw.grade === 'string' ? raw.grade : '',
    step: typeof raw.step === 'string' ? raw.step : '',
    baseSalary: safeNumber(raw.baseSalary, 0),
    allowance30Percent: safeNumber(raw.allowance30Percent, 30),
    hazardPercent: safeNumber(raw.hazardPercent, 65),
    certificatePercent: safeNumber(raw.certificatePercent, 0),
    positionPercent: safeNumber(raw.positionPercent, 0),
    engineeringLegalPercent: safeNumber(raw.engineeringLegalPercent, 0),
    researchPercent: safeNumber(raw.researchPercent, 0),
    locationValue: safeNumber(raw.locationValue, 0),
    locationMode: raw.locationMode === 'percent' ? 'percent' : 'amount',
    maritalStatus: raw.maritalStatus === 'married' ? 'married' : 'single',
    childrenCount: Math.floor(safeNumber(raw.childrenCount, 0)),
    extraAllowance: safeNumber(raw.extraAllowance, 0),
    deductionPercent: safeNumber(raw.deductionPercent, 10),
    housingRentDeduction: safeNumber(raw.housingRentDeduction, 0),
    taxDeduction: safeNumber(raw.taxDeduction, 0),
    socialCareDeduction: safeNumber(raw.socialCareDeduction, 0),
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

export function calculateSalaryBreakdown(
  employee: EmployeeDraft,
  settings: SalarySettings
): SalaryBreakdown {
  const baseSalary = safeNumber(employee.baseSalary);
  const allowance30Percent = safeNumber(employee.allowance30Percent);
  const hazardPercent = safeNumber(employee.hazardPercent);
  const certificatePercent = safeNumber(employee.certificatePercent);
  const positionPercent = safeNumber(employee.positionPercent);
  const engineeringLegalPercent = safeNumber(employee.engineeringLegalPercent);
  const researchPercent = safeNumber(employee.researchPercent);
  const locationValue = safeNumber(employee.locationValue);
  const childrenCount = Math.floor(safeNumber(employee.childrenCount));
  const extraAllowance = safeNumber(employee.extraAllowance);

  const deductionPercent = safeNumber(employee.deductionPercent);
  const housingRentDeduction = Math.round(safeNumber(employee.housingRentDeduction));
  const taxDeduction = Math.round(safeNumber(employee.taxDeduction));
  const socialCareDeduction = Math.round(safeNumber(employee.socialCareDeduction));

  const allowance30Amount = Math.round(baseSalary * (allowance30Percent / 100));
  const hazardAmount = Math.round(baseSalary * (hazardPercent / 100));
  const certificateAmount = Math.round(baseSalary * (certificatePercent / 100));
  const positionAmount = Math.round(baseSalary * (positionPercent / 100));
  const engineeringLegalAmount = Math.round(baseSalary * (engineeringLegalPercent / 100));
  const researchAmount = Math.round(baseSalary * (researchPercent / 100));
  const locationAmount =
    employee.locationMode === 'percent'
      ? Math.round(baseSalary * (locationValue / 100))
      : Math.round(locationValue);

  const marriageAmount =
    employee.maritalStatus === 'married'
      ? Math.round(safeNumber(settings.marriageAllowanceAmount))
      : 0;

  const maxChildren = Math.floor(safeNumber(settings.maxChildrenForAllowance));
  const eligibleChildrenCount =
    maxChildren > 0 ? Math.min(childrenCount, maxChildren) : childrenCount;

  const childrenAmount = Math.round(
    eligibleChildrenCount * safeNumber(settings.childAllowanceAmount)
  );

  const totalAllowances =
    allowance30Amount +
    hazardAmount +
    certificateAmount +
    positionAmount +
    engineeringLegalAmount +
    researchAmount +
    locationAmount +
    marriageAmount +
    childrenAmount +
    Math.round(extraAllowance);

  const grossSalary = baseSalary + totalAllowances;

  const retirementAmount = Math.round(baseSalary * (deductionPercent / 100));
  const totalDeductions =
    retirementAmount + housingRentDeduction + taxDeduction + socialCareDeduction;

  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    baseSalary,
    allowance30Amount,
    hazardAmount,
    certificateAmount,
    positionAmount,
    engineeringLegalAmount,
    researchAmount,
    locationAmount,
    marriageAmount,
    eligibleChildrenCount,
    childrenAmount,
    extraAllowance: Math.round(extraAllowance),
    totalAllowances,
    grossSalary,
    retirementAmount,
    housingRentDeduction,
    taxDeduction,
    socialCareDeduction,
    totalDeductions,
    netSalary,
  };
}

export function formatCurrency(amount: number, currency: string): string {
  const rounded = Math.round(Number.isFinite(amount) ? amount : 0);
  const formatted = new Intl.NumberFormat('en-US').format(rounded);
  return `${formatted} ${currency}`;
}

export function buildPayslipText(
  employee: EmployeeDraft,
  breakdown: SalaryBreakdown,
  settings: SalarySettings
): string {
  const maritalLabel = employee.maritalStatus === 'married' ? 'متزوج' : 'غير متزوج';
  const locationDetail =
    employee.locationMode === 'percent' ? `${employee.locationValue}%` : 'مقطوع';

  const lines = [
    'كشف تفاصيل راتب الموظف',
    '──────────────────────────',
    `اسم الموظف: ${employee.name || 'غير محدد'}`,
    `العنوان الوظيفي: ${employee.jobTitle || 'غير محدد'}`,
    `الدرجة: ${employee.grade || '-'} | المرحلة: ${employee.step || '-'}`,
    `الحالة الاجتماعية: ${maritalLabel} | عدد الأطفال: ${employee.childrenCount}`,
    '──────────────────────────',
    `الراتب الاسمي: ${formatCurrency(breakdown.baseSalary, settings.currency)}`,
    `نسبة (${employee.allowance30Percent}%): ${formatCurrency(breakdown.allowance30Amount, settings.currency)}`,
    `نسبة الخطورة (${employee.hazardPercent}%): ${formatCurrency(breakdown.hazardAmount, settings.currency)}`,
    `نسبة الشهادة (${employee.certificatePercent}%): ${formatCurrency(breakdown.certificateAmount, settings.currency)}`,
    `نسبة المنصب (${employee.positionPercent}%): ${formatCurrency(breakdown.positionAmount, settings.currency)}`,
    `نسبة هندسية وقانونية (${employee.engineeringLegalPercent}%): ${formatCurrency(breakdown.engineeringLegalAmount, settings.currency)}`,
    `نسبة البحثية (${employee.researchPercent}%): ${formatCurrency(breakdown.researchAmount, settings.currency)}`,
    `مخصصات الموقع (${locationDetail}): ${formatCurrency(breakdown.locationAmount, settings.currency)}`,
    `مخصصات الزوجية: ${formatCurrency(breakdown.marriageAmount, settings.currency)}`,
    `مخصصات الأطفال (${breakdown.eligibleChildrenCount}): ${formatCurrency(breakdown.childrenAmount, settings.currency)}`,
  ];

  if (breakdown.extraAllowance > 0) {
    lines.push(
      `مخصصات إضافية: ${formatCurrency(breakdown.extraAllowance, settings.currency)}`
    );
  }

  lines.push(
    '──────────────────────────',
    `الراتب الإجمالي: ${formatCurrency(breakdown.grossSalary, settings.currency)}`,
    `التقاعد (${employee.deductionPercent}% من الاسمي): ${formatCurrency(breakdown.retirementAmount, settings.currency)}`,
    `إيجار سكن: ${formatCurrency(breakdown.housingRentDeduction, settings.currency)}`,
    `ضريبة: ${formatCurrency(breakdown.taxDeduction, settings.currency)}`,
    `رعاية اجتماعية: ${formatCurrency(breakdown.socialCareDeduction, settings.currency)}`,
    `مجموع الاستقطاعات: ${formatCurrency(breakdown.totalDeductions, settings.currency)}`,
    '──────────────────────────',
    `صافي الراتب المستحق: ${formatCurrency(breakdown.netSalary, settings.currency)}`
  );

  return lines.join('\n');
}

export function exportEmployeesToCsv(
  employees: EmployeeRecord[],
  settings: SalarySettings
): void {
  const headers = [
    'اسم الموظف',
    'العنوان الوظيفي',
    'الدرجة',
    'المرحلة',
    `الراتب الاسمي (${settings.currency})`,
    'نسبة 30% (%)',
    'نسبة الخطورة (%)',
    'نسبة الشهادة (%)',
    'نسبة المنصب (%)',
    'نسبة هندسية وقانونية (%)',
    'نسبة البحثية (%)',
    `مخصصات الموقع (${settings.currency})`,
    'الحالة الاجتماعية',
    'عدد الأطفال',
    'مجموع المخصصات',
    'الراتب الإجمالي',
    'التقاعد (%)',
    'مبلغ التقاعد',
    'إيجار سكن',
    'ضريبة',
    'رعاية اجتماعية',
    'مجموع الاستقطاعات',
    `صافي الراتب (${settings.currency})`,
    'ملاحظات',
  ];

  const escapeCell = (value: string | number) => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = employees.map((emp) => {
    const b = calculateSalaryBreakdown(emp, settings);
    return [
      emp.name,
      emp.jobTitle,
      emp.grade,
      emp.step,
      b.baseSalary,
      emp.allowance30Percent,
      emp.hazardPercent,
      emp.certificatePercent,
      emp.positionPercent,
      emp.engineeringLegalPercent,
      emp.researchPercent,
      b.locationAmount,
      emp.maritalStatus === 'married' ? 'متزوج' : 'غير متزوج',
      emp.childrenCount,
      b.totalAllowances,
      b.grossSalary,
      emp.deductionPercent,
      b.retirementAmount,
      b.housingRentDeduction,
      b.taxDeduction,
      b.socialCareDeduction,
      b.totalDeductions,
      b.netSalary,
      emp.notes,
    ]
      .map(escapeCell)
      .join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `سجل-رواتب-الموظفين-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
