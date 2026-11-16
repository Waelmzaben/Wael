import type { SalaryBreakdown, SalarySettings } from '../types/salary';
import { formatCurrency } from '../utils/salaryMath';

interface SalarySummaryStripProps {
  breakdown: SalaryBreakdown;
  settings: SalarySettings;
  deductionPercent: number;
}

export function SalarySummaryStrip({
  breakdown,
  settings,
  deductionPercent,
}: SalarySummaryStripProps) {
  return (
    <section
      aria-label="ملخص الراتب"
      className="grid grid-cols-2 lg:grid-cols-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200 dark:divide-slate-800"
    >
      <div className="p-4 sm:p-5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          الراتب الاسمي
        </p>
        <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono-tabular">
          {formatCurrency(breakdown.baseSalary, settings.currency)}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          الراتب الأساسي المضاف
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          مجموع المخصصات
        </p>
        <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono-tabular">
          {formatCurrency(breakdown.totalAllowances, settings.currency)}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          النسب · الموقع · الزوجية · الأطفال
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          مجموع الاستقطاعات
        </p>
        <p className="mt-2 text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono-tabular">
          {formatCurrency(breakdown.totalDeductions, settings.currency)}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          تقاعد {deductionPercent}% · سكن · ضريبة · رعاية
        </p>
      </div>

      <div className="p-4 sm:p-5 bg-emerald-50/60 dark:bg-emerald-950/25 rounded-b-xl lg:rounded-b-none lg:rounded-l-xl">
        <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          صافي الراتب المستحق
        </p>
        <p className="mt-2 text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono-tabular">
          {formatCurrency(breakdown.netSalary, settings.currency)}
        </p>
        <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
          الإجمالي مطروحاً منه الاستقطاعات
        </p>
      </div>
    </section>
  );
}
