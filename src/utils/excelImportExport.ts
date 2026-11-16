import * as XLSX from 'xlsx';
import type { EmployeeRecord, MaritalStatus, SalarySettings, ValueInputMode } from '../types/salary';
import { calculateSalaryBreakdown, safeNumber } from './salaryMath';
import { getScaleSalaryForGradeAndStep } from './salaryScale';

const ARABIC_DIGITS: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

function toWesternDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (d) => ARABIC_DIGITS[d] ?? d);
}

function normalizeHeader(header: string): string {
  return toWesternDigits(String(header ?? ''))
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[%()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumericCell(raw: unknown, fallback = 0): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
  }
  const str = toWesternDigits(String(raw ?? ''))
    .replace(/,/g, '')
    .replace(/%/g, '')
    .trim();
  if (!str) return fallback;
  const match = str.match(/-?\d+(\.\d+)?/);
  if (!match) return fallback;
  const num = Number(match[0]);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
}

function parseMaritalCell(raw: unknown): MaritalStatus {
  const norm = normalizeHeader(String(raw ?? ''));
  if (!norm) return 'single';
  if (
    norm.includes('غير متزوج') ||
    norm.includes('اعزب') ||
    norm.includes('عزباء') ||
    norm === 'single' ||
    norm === 'no' ||
    norm === '0'
  ) {
    return 'single';
  }
  if (
    norm.includes('متزوج') ||
    norm === 'married' ||
    norm === 'yes' ||
    norm === 'نعم' ||
    norm === '1'
  ) {
    return 'married';
  }
  return 'single';
}

function parseLocationCell(
  rawValue: unknown,
  rawMode: unknown
): { value: number; mode: ValueInputMode } {
  const modeStr = normalizeHeader(String(rawMode ?? ''));
  const valStr = toWesternDigits(String(rawValue ?? '')).trim();
  const hasPercentSign = valStr.includes('%');
  const isPercentMode =
    hasPercentSign ||
    modeStr.includes('نسبه') ||
    modeStr.includes('percent') ||
    modeStr === '%';

  return {
    value: parseNumericCell(rawValue, 0),
    mode: isPercentMode ? 'percent' : 'amount',
  };
}

type FieldKey =
  | 'name'
  | 'jobTitle'
  | 'grade'
  | 'step'
  | 'baseSalary'
  | 'allowance30Percent'
  | 'hazardPercent'
  | 'certificatePercent'
  | 'positionPercent'
  | 'engineeringLegalPercent'
  | 'researchPercent'
  | 'locationValue'
  | 'locationMode'
  | 'maritalStatus'
  | 'childrenCount'
  | 'extraAllowance'
  | 'deductionPercent'
  | 'housingRentDeduction'
  | 'taxDeduction'
  | 'socialCareDeduction'
  | 'notes';

const HEADER_MATCHERS: Array<{ key: FieldKey; patterns: string[] }> = [
  {
    key: 'name',
    patterns: ['اسم الموظف', 'اسم الموضف', 'الاسم', 'الموظف', 'name', 'employee name'],
  },
  {
    key: 'jobTitle',
    patterns: ['العنوان الوظيفي', 'المسمى الوظيفي', 'الوظيفه', 'job title', 'title'],
  },
  {
    key: 'grade',
    patterns: ['درجه الموظف', 'الدرجه الوظيفيه', 'الدرجه', 'grade'],
  },
  {
    key: 'step',
    patterns: ['مرحله الموظف', 'المرحله', 'step', 'stage'],
  },
  {
    key: 'baseSalary',
    patterns: ['الراتب الاسمي', 'الراتب المقابل', 'الراتب', 'base salary', 'salary'],
  },
  {
    key: 'allowance30Percent',
    patterns: ['نسبه 30', 'مخصصات 30', '30', 'allowance 30'],
  },
  {
    key: 'hazardPercent',
    patterns: ['نسبه الخطورة', 'نسبه الخطوره', 'نسبه الخطور', 'الخطوره', 'hazard'],
  },
  {
    key: 'certificatePercent',
    patterns: ['نسبه الشهاده', 'الشهاده', 'certificate'],
  },
  {
    key: 'positionPercent',
    patterns: ['نسبه المنصب', 'المنصب', 'position'],
  },
  {
    key: 'engineeringLegalPercent',
    patterns: [
      'نسبه هندسيه وقانونيه',
      'هندسيه وقانونيه',
      'نسبه هندسيه',
      'نسبه قانونيه',
      'engineering',
    ],
  },
  {
    key: 'researchPercent',
    patterns: ['نسبه البحثيه', 'النسبه البحثيه', 'البحثيه', 'research'],
  },
  {
    key: 'locationMode',
    patterns: ['نوع مخصص الموقع', 'نوع الموقع', 'location mode', 'location type'],
  },
  {
    key: 'locationValue',
    patterns: ['مخصصات الموقع', 'مخصص الموقع', 'الموقع', 'موقع', 'location'],
  },
  {
    key: 'maritalStatus',
    patterns: ['الحاله الاجتماعيه', 'متزوج غير متزوج', 'الزوجيه', 'marital'],
  },
  {
    key: 'childrenCount',
    patterns: ['عدد الاطفال', 'عدد اطفال', 'الاطفال', 'children'],
  },
  {
    key: 'extraAllowance',
    patterns: ['مخصصات اضافيه', 'اضافيه', 'extra allowance'],
  },
  {
    key: 'deductionPercent',
    patterns: ['التقاعد', 'نسبه التقاعد', 'الاستقطاع', 'نسبه الاستقطاع', 'retirement'],
  },
  {
    key: 'housingRentDeduction',
    patterns: ['ايجار سكن', 'ايجار', 'السكن', 'housing rent', 'rent'],
  },
  {
    key: 'taxDeduction',
    patterns: ['ضريبه', 'الضريبه', 'tax'],
  },
  {
    key: 'socialCareDeduction',
    patterns: ['رعايه اجتماعيه', 'الرعايه الاجتماعيه', 'حمايه اجتماعيه', 'social care'],
  },
  {
    key: 'notes',
    patterns: ['ملاحظات', 'القسم', 'الدائره', 'notes'],
  },
];

function matchHeaderToField(header: string): FieldKey | null {
  const norm = normalizeHeader(header);
  if (!norm) return null;

  // Skip calculated total/amount columns if importing from an exported sheet
  if (
    norm.includes('مجموع') ||
    norm.includes('اجمالي') ||
    norm.includes('صافي') ||
    norm.includes('مبلغ التقاعد')
  ) {
    return null;
  }

  for (const matcher of HEADER_MATCHERS) {
    if (matcher.patterns.some((p) => norm === p || norm.includes(p))) {
      return matcher.key;
    }
  }
  return null;
}

export interface ParsedExcelResult {
  records: EmployeeRecord[];
  matchedColumns: string[];
  skippedRows: number;
}

export async function parseEmployeesExcelFile(
  file: File,
  settings: SalarySettings
): Promise<ParsedExcelResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('ملف الإكسل فارغ ولا يحتوي على أوراق عمل.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  });

  if (rawRows.length === 0) {
    throw new Error('لم يتم العثور على صفوف بيانات في ورقة العمل الأولى.');
  }

  const headers = Object.keys(rawRows[0]);
  const columnMap = new Map<string, FieldKey>();
  const matchedColumns: string[] = [];

  for (const h of headers) {
    const field = matchHeaderToField(h);
    if (field) {
      columnMap.set(h, field);
      matchedColumns.push(h);
    }
  }

  if (columnMap.size === 0) {
    throw new Error(
      'تعذر مطابقة أعمدة الملف. يرجى استخدام نموذج الإكسل المعتمد أو التأكد من أسماء الأعمدة.'
    );
  }

  const records: EmployeeRecord[] = [];
  let skippedRows = 0;
  const now = Date.now();

  rawRows.forEach((row, index) => {
    const extracted: Partial<Record<FieldKey, unknown>> = {};
    columnMap.forEach((field, colName) => {
      extracted[field] = row[colName];
    });

    const name = String(extracted.name ?? '').trim();
    const jobTitle = String(extracted.jobTitle ?? '').trim();
    const gradeStr = String(extracted.grade ?? '').trim();
    const stepStr = String(extracted.step ?? '').trim();
    let baseSalary = parseNumericCell(extracted.baseSalary, 0);

    if (baseSalary === 0 && gradeStr) {
      const scaleMatch = getScaleSalaryForGradeAndStep(
        settings.salaryScale,
        gradeStr,
        stepStr
      );
      if (scaleMatch) {
        baseSalary = scaleMatch.salary;
      }
    }

    // Skip completely empty trailing rows
    if (!name && !jobTitle && baseSalary === 0) {
      skippedRows += 1;
      return;
    }

    const locationParsed = parseLocationCell(
      extracted.locationValue,
      extracted.locationMode
    );

    const record: EmployeeRecord = {
      id: `emp-xlsx-${now}-${index}`,
      name: name || `موظف ${index + 1}`,
      jobTitle: jobTitle || 'موظف',
      grade: gradeStr,
      step: stepStr,
      baseSalary,
      allowance30Percent:
        extracted.allowance30Percent !== undefined && extracted.allowance30Percent !== ''
          ? parseNumericCell(extracted.allowance30Percent, settings.defaultAllowance30Percent)
          : settings.defaultAllowance30Percent,
      hazardPercent:
        extracted.hazardPercent !== undefined && extracted.hazardPercent !== ''
          ? parseNumericCell(extracted.hazardPercent, settings.defaultHazardPercent)
          : settings.defaultHazardPercent,
      certificatePercent: parseNumericCell(extracted.certificatePercent, 0),
      positionPercent: parseNumericCell(extracted.positionPercent, 0),
      engineeringLegalPercent: parseNumericCell(extracted.engineeringLegalPercent, 0),
      researchPercent:
        extracted.researchPercent !== undefined && extracted.researchPercent !== ''
          ? parseNumericCell(extracted.researchPercent, settings.defaultResearchPercent)
          : settings.defaultResearchPercent,
      locationValue: locationParsed.value,
      locationMode: locationParsed.mode,
      maritalStatus: parseMaritalCell(extracted.maritalStatus),
      childrenCount: Math.floor(parseNumericCell(extracted.childrenCount, 0)),
      extraAllowance: parseNumericCell(extracted.extraAllowance, 0),
      deductionPercent:
        extracted.deductionPercent !== undefined && extracted.deductionPercent !== ''
          ? parseNumericCell(extracted.deductionPercent, settings.defaultDeductionPercent)
          : settings.defaultDeductionPercent,
      housingRentDeduction: parseNumericCell(extracted.housingRentDeduction, 0),
      taxDeduction: parseNumericCell(extracted.taxDeduction, 0),
      socialCareDeduction: parseNumericCell(extracted.socialCareDeduction, 0),
      notes: String(extracted.notes ?? '').trim(),
      updatedAt: new Date().toISOString(),
    };

    records.push(record);
  });

  if (records.length === 0) {
    throw new Error('لم يتم العثور على بيانات موظفين صالحة داخل الملف.');
  }

  return {
    records,
    matchedColumns,
    skippedRows,
  };
}

export function downloadExcelTemplate(settings: SalarySettings): void {
  const sampleRows = [
    {
      'اسم الموظف': 'أحمد كريم محمد',
      'العنوان الوظيفي': 'مهندس مدني',
      'الدرجة': 'السادسة',
      'المرحلة': 'المرحلة 2',
      'الراتب الاسمي': 368000,
      'نسبة 30%': 30,
      'نسبة الخطورة %': 65,
      'نسبة الشهادة %': 45,
      'نسبة المنصب %': 20,
      'نسبة هندسية وقانونية %': 35,
      'نسبة البحثية %': 50,
      'مخصصات الموقع': 50000,
      'نوع مخصص الموقع': 'مبلغ',
      'الحالة الاجتماعية': 'متزوج',
      'عدد الأطفال': 2,
      'مخصصات إضافية': 0,
      'التقاعد %': 10,
      'إيجار سكن': 0,
      'ضريبة': 15000,
      'رعاية اجتماعية': 5000,
      'ملاحظات': `العملة: ${settings.currency}`,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 11 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 14 },
    { wch: 15 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  if (!workbook.Workbook) workbook.Workbook = {};
  workbook.Workbook.Views = [{ RTL: true }];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج الموظفين');
  XLSX.writeFile(workbook, 'نموذج-استيراد-رواتب-الموظفين.xlsx');
}

export function exportEmployeesToExcel(
  employees: EmployeeRecord[],
  settings: SalarySettings
): void {
  const rows = employees.map((emp) => {
    const b = calculateSalaryBreakdown(emp, settings);
    return {
      'اسم الموظف': emp.name,
      'العنوان الوظيفي': emp.jobTitle,
      'الدرجة': emp.grade,
      'المرحلة': emp.step,
      [`الراتب الاسمي (${settings.currency})`]: safeNumber(b.baseSalary),
      'نسبة 30%': emp.allowance30Percent,
      'نسبة الخطورة %': emp.hazardPercent,
      'نسبة الشهادة %': emp.certificatePercent,
      'نسبة المنصب %': emp.positionPercent,
      'نسبة هندسية وقانونية %': emp.engineeringLegalPercent,
      'نسبة البحثية %': emp.researchPercent,
      'مخصصات الموقع': emp.locationValue,
      'نوع مخصص الموقع': emp.locationMode === 'percent' ? 'نسبة' : 'مبلغ',
      'الحالة الاجتماعية': emp.maritalStatus === 'married' ? 'متزوج' : 'غير متزوج',
      'عدد الأطفال': emp.childrenCount,
      'مخصصات إضافية': emp.extraAllowance,
      'مجموع المخصصات': b.totalAllowances,
      'الراتب الإجمالي': b.grossSalary,
      'التقاعد %': emp.deductionPercent,
      'مبلغ التقاعد': b.retirementAmount,
      'إيجار سكن': b.housingRentDeduction,
      'ضريبة': b.taxDeduction,
      'رعاية اجتماعية': b.socialCareDeduction,
      'مجموع الاستقطاعات': b.totalDeductions,
      [`صافي الراتب (${settings.currency})`]: b.netSalary,
      'ملاحظات': emp.notes,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  if (!workbook.Workbook) workbook.Workbook = {};
  workbook.Workbook.Views = [{ RTL: true }];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل الرواتب');
  XLSX.writeFile(
    workbook,
    `سجل-رواتب-الموظفين-${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}
