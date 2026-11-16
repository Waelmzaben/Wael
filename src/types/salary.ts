export type MaritalStatus = 'married' | 'single';

export type WorkspaceTab = 'editor' | 'directory' | 'settings';

export type ValueInputMode = 'amount' | 'percent';

export interface SalaryScaleGrade {
  gradeNumber: number;      // 1..10
  gradeName: string;        // الأولى .. العاشرة
  step1Salary: number;      // الراتب الاسمي للمرحلة 1
  annualIncrement: number;  // العلاوة السنوية لكل مرحلة
}

export interface SalarySettings {
  currency: string;
  marriageAllowanceAmount: number;
  childAllowanceAmount: number;
  maxChildrenForAllowance: number; // 0 means unlimited
  defaultAllowance30Percent: number;
  defaultHazardPercent: number;
  defaultResearchPercent: number;
  defaultDeductionPercent: number;
  salaryScale: SalaryScaleGrade[];
}

export interface EmployeeDraft {
  id?: string;
  name: string;                    // اسم الموظف
  jobTitle: string;                // العنوان الوظيفي
  grade: string;                   // الدرجة
  step: string;                    // المرحلة
  baseSalary: number;              // الراتب الاسمي
  allowance30Percent: number;      // نسبة 30%
  hazardPercent: number;           // نسبة الخطورة 65%
  certificatePercent: number;      // نسبة الشهادة
  positionPercent: number;         // نسبة المنصب
  engineeringLegalPercent: number; // نسبة هندسية وقانونية
  researchPercent: number;         // نسبة البحثية 50%
  locationValue: number;           // مخصصات الموقع
  locationMode: ValueInputMode;    // مبلغ مقطوع أو نسبة %
  maritalStatus: MaritalStatus;    // متزوج / غير متزوج
  childrenCount: number;           // عدد الأطفال
  extraAllowance: number;          // مخصصات إضافية مقطوعة
  deductionPercent: number;        // التقاعد 10%
  housingRentDeduction: number;    // إيجار سكن
  taxDeduction: number;            // ضريبة
  socialCareDeduction: number;     // رعاية اجتماعية
  notes: string;                   // ملاحظات
}

export interface EmployeeRecord extends EmployeeDraft {
  id: string;
  updatedAt: string;
}

export interface SalaryBreakdown {
  baseSalary: number;
  allowance30Amount: number;
  hazardAmount: number;
  certificateAmount: number;
  positionAmount: number;
  engineeringLegalAmount: number;
  researchAmount: number;
  locationAmount: number;
  marriageAmount: number;
  eligibleChildrenCount: number;
  childrenAmount: number;
  extraAllowance: number;
  totalAllowances: number;
  grossSalary: number;
  retirementAmount: number;
  housingRentDeduction: number;
  taxDeduction: number;
  socialCareDeduction: number;
  totalDeductions: number;
  netSalary: number;
}
