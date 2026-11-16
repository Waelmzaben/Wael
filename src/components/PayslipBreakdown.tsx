import { Check, Copy, Printer } from 'lucide-react';
import { useState } from 'react';
import type { EmployeeDraft, SalaryBreakdown, SalarySettings } from '../types/salary';
import { buildPayslipText, formatCurrency } from '../utils/salaryMath';

interface PayslipBreakdownProps {
  draft: EmployeeDraft;
  breakdown: SalaryBreakdown;
  settings: SalarySettings;
}

export function PayslipBreakdown({
  draft,
  breakdown,
  settings,
}: PayslipBreakdownProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = buildPayslipText(draft, breakdown, settings);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is unavailable
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const maritalLabel = draft.maritalStatus === 'married' ? 'متزوج' : 'غير متزوج';
  const locationDetail =
    draft.locationMode === 'percent' ? `${draft.locationValue || 0}%` : 'مقطوع';

  const allowanceRows = [
    {
      label: 'الراتب الاسمي',
      detail: 'الأساس',
      amount: breakdown.baseSalary,
    },
    {
      label: 'نسبة 30%',
      detail: `${draft.allowance30Percent || 0}%`,
      amount: breakdown.allowance30Amount,
    },
    {
      label: 'نسبة الخطورة',
      detail: `${draft.hazardPercent || 0}%`,
      amount: breakdown.hazardAmount,
    },
    {
      label: 'نسبة الشهادة',
      detail: `${draft.certificatePercent || 0}%`,
      amount: breakdown.certificateAmount,
    },
    {
      label: 'نسبة المنصب',
      detail: `${draft.positionPercent || 0}%`,
      amount: breakdown.positionAmount,
    },
    {
      label: 'نسبة هندسية وقانونية',
      detail: `${draft.engineeringLegalPercent || 0}%`,
      amount: breakdown.engineeringLegalAmount,
    },
    {
      label: 'نسبة البحثية',
      detail: `${draft.researchPercent || 0}%`,
      amount: breakdown.researchAmount,
    },
    {
      label: 'مخصصات الموقع',
      detail: locationDetail,
      amount: breakdown.locationAmount,
    },
    {
      label: 'مخصصات الزوجية',
      detail: maritalLabel,
      amount: breakdown.marriageAmount,
    },
    {
      label: 'مخصصات الأطفال',
      detail: `${breakdown.eligibleChildrenCount} من أصل ${draft.childrenCount}`,
      amount: breakdown.childrenAmount,
    },
  ];

  if (breakdown.extraAllowance > 0) {
    allowanceRows.push({
      label: 'مخصصات إضافية',
      detail: 'مقطوعة',
      amount: breakdown.extraAllowance,
    });
  }

  const deductionRows = [
    {
      label: 'التقاعد',
      detail: `${draft.deductionPercent || 0}% من الاسمي`,
      amount: breakdown.retirementAmount,
    },
    {
      label: 'إيجار سكن',
      detail: 'مقطوع',
      amount: breakdown.housingRentDeduction,
    },
    {
      label: 'ضريبة',
      detail: 'مقطوع',
      amount: breakdown.taxDeduction,
    },
    {
      label: 'رعاية اجتماعية',
      detail: 'مقطوع',
      amount: breakdown.socialCareDeduction,
    },
  ];

  return (
    <aside
      aria-label="تفاصيل كشف الراتب"
      className="print-only-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between"
    >
      <div>
        {/* رأس الكشف */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {draft.name.trim() || 'معاينة كشف الراتب'}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{draft.jobTitle.trim() || 'العنوان الوظيفي'}</span>
              <span aria-hidden="true"> · </span>
              <span>الدرجة: {draft.grade.trim() || '—'}</span>
              <span aria-hidden="true"> · </span>
              <span>المرحلة: {draft.step.trim() || '—'}</span>
            </p>
          </div>

          <div className="no-print flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              title="نسخ تفاصيل الراتب"
              className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  تم النسخ
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  نسخ
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="طباعة كشف الراتب"
              className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة
            </button>
          </div>
        </div>

        {/* تفاصيل المستحقات والمخصصات */}
        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/80">
          {allowanceRows.map((row) => (
            <div
              key={row.label}
              className="py-2 flex items-center justify-between gap-4 text-sm"
            >
              <div className="min-w-0">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {row.label}
                </span>
                <span className="mr-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  ({row.detail})
                </span>
              </div>
              <span className="font-mono-tabular font-medium text-slate-900 dark:text-slate-100 shrink-0">
                {formatCurrency(row.amount, settings.currency)}
              </span>
            </div>
          ))}
        </div>

        {/* الإجمالي والاستقطاعات التفصيلية */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-sm pb-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              الراتب الإجمالي (قبل الاستقطاع)
            </span>
            <span className="font-mono-tabular font-semibold text-slate-900 dark:text-slate-100">
              {formatCurrency(breakdown.grossSalary, settings.currency)}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/80">
            {deductionRows.map((d) => (
              <div
                key={d.label}
                className="py-1.5 flex items-center justify-between gap-4 text-xs"
              >
                <span className="text-amber-800 dark:text-amber-300">
                  {d.label}{' '}
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    ({d.detail})
                  </span>
                </span>
                <span className="font-mono-tabular font-medium text-amber-700 dark:text-amber-400 shrink-0">
                  − {formatCurrency(d.amount, settings.currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
            <span className="font-semibold text-amber-800 dark:text-amber-300">
              مجموع الاستقطاعات
            </span>
            <span className="font-mono-tabular font-semibold text-amber-700 dark:text-amber-400">
              − {formatCurrency(breakdown.totalDeductions, settings.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* صافي الراتب النهائي */}
      <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            صافي الراتب المستحق
          </p>
          {draft.notes.trim() && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
              {draft.notes}
            </p>
          )}
        </div>
        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono-tabular">
          {formatCurrency(breakdown.netSalary, settings.currency)}
        </p>
      </div>
    </aside>
  );
}
