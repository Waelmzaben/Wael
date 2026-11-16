import { RefreshCw, RotateCcw, Save } from 'lucide-react';
import { CURRENCY_OPTIONS, DEFAULT_SALARY_SETTINGS } from '../data/defaultEmployees';
import type { SalaryScaleGrade, SalarySettings } from '../types/salary';
import {
  DEFAULT_SALARY_SCALE,
  getStepSalary,
  normalizeSalaryScale,
  SALARY_SCALE_STEPS_COUNT,
} from '../utils/salaryScale';

interface SettingsPanelProps {
  settings: SalarySettings;
  employeeCount: number;
  onUpdateSettings: (next: SalarySettings) => void;
  onApplyScaleToEmployees: () => void;
  onResetSampleEmployees: () => void;
  onBackToEditor: () => void;
}

const inputBaseClass =
  'w-full h-11 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/25 focus:border-emerald-600 transition-colors';

type NumericSettingKey =
  | 'marriageAllowanceAmount'
  | 'childAllowanceAmount'
  | 'maxChildrenForAllowance'
  | 'defaultAllowance30Percent'
  | 'defaultHazardPercent'
  | 'defaultResearchPercent'
  | 'defaultDeductionPercent';

export function SettingsPanel({
  settings,
  employeeCount,
  onUpdateSettings,
  onApplyScaleToEmployees,
  onResetSampleEmployees,
  onBackToEditor,
}: SettingsPanelProps) {
  const salaryScale = normalizeSalaryScale(settings.salaryScale);

  const handleNumber = (key: NumericSettingKey, raw: string) => {
    const val = raw.trim() === '' ? 0 : Number(raw);
    if (!Number.isFinite(val) || val < 0) return;
    onUpdateSettings({
      ...settings,
      [key]: key === 'maxChildrenForAllowance' ? Math.floor(val) : val,
    });
  };

  const handleScaleFieldChange = (
    gradeNumber: number,
    field: 'step1Salary' | 'annualIncrement',
    raw: string
  ) => {
    const val = raw.trim() === '' ? 0 : Number(raw);
    if (!Number.isFinite(val) || val < 0) return;
    const rounded = Math.round(val);
    const nextScale: SalaryScaleGrade[] = salaryScale.map((row) =>
      row.gradeNumber === gradeNumber ? { ...row, [field]: rounded } : row
    );
    onUpdateSettings({
      ...settings,
      salaryScale: nextScale,
    });
  };

  const handleResetScale = () => {
    onUpdateSettings({
      ...settings,
      salaryScale: DEFAULT_SALARY_SCALE.map((row) => ({ ...row })),
    });
  };

  return (
    <div className="space-y-6">
      <section className="max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-6">
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              إعدادات المخصصات والنسب الافتراضية والعملة
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              أي تعديل في مبالغ الزوجية والأطفال يُطبّق فوراً على حساب رواتب جميع الموظفين
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToEditor}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            العودة إلى محرر الراتب
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="set-currency"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              العملة المستخدمة
            </label>
            <select
              id="set-currency"
              value={settings.currency}
              onChange={(e) =>
                onUpdateSettings({ ...settings, currency: e.target.value })
              }
              className={inputBaseClass}
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="set-marriage"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              مبلغ مخصصات الزوجية ({settings.currency})
            </label>
            <input
              id="set-marriage"
              type="number"
              min="0"
              step="5000"
              dir="ltr"
              value={settings.marriageAllowanceAmount}
              onChange={(e) => handleNumber('marriageAllowanceAmount', e.target.value)}
              className={`${inputBaseClass} font-mono-tabular text-left`}
            />
          </div>

          <div>
            <label
              htmlFor="set-child"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              مبلغ مخصصات الطفل الواحد ({settings.currency})
            </label>
            <input
              id="set-child"
              type="number"
              min="0"
              step="1000"
              dir="ltr"
              value={settings.childAllowanceAmount}
              onChange={(e) => handleNumber('childAllowanceAmount', e.target.value)}
              className={`${inputBaseClass} font-mono-tabular text-left`}
            />
          </div>

          <div>
            <label
              htmlFor="set-max-children"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              الحد الأقصى لعدد الأطفال (0 = بدون حد)
            </label>
            <input
              id="set-max-children"
              type="number"
              min="0"
              step="1"
              dir="ltr"
              value={settings.maxChildrenForAllowance}
              onChange={(e) => handleNumber('maxChildrenForAllowance', e.target.value)}
              className={`${inputBaseClass} font-mono-tabular text-left`}
            />
          </div>

          <div>
            <label
              htmlFor="set-default-30"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              نسبة 30% الافتراضية للموظف الجديد (%)
            </label>
            <input
              id="set-default-30"
              type="number"
              min="0"
              max="200"
              step="0.5"
              dir="ltr"
              value={settings.defaultAllowance30Percent}
              onChange={(e) => handleNumber('defaultAllowance30Percent', e.target.value)}
              className={`${inputBaseClass} font-mono-tabular text-left`}
            />
          </div>

          <div>
            <label
              htmlFor="set-default-hazard"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              نسبة الخطورة الافتراضية للموظف الجديد (%)
            </label>
            <input
              id="set-default-hazard"
              type="number"
              min="0"
              max="200"
              step="0.5"
              dir="ltr"
              value={settings.defaultHazardPercent}
              onChange={(e) => handleNumber('defaultHazardPercent', e.target.value)}
              className={`${inputBaseClass} font-mono-tabular text-left`}
            />
          </div>

          <div>
            <label
              htmlFor="set-default-research"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              نسبة البحثية الافتراضية للموظف الجديد (%) — الافتراضي 0 لتُدخل يدوياً
            </label>
            <input
              id="set-default-research"
              type="number"
              min="0"
              max="200"
              step="0.5"
              dir="ltr"
              value={settings.defaultResearchPercent}
              onChange={(e) => handleNumber('defaultResearchPercent', e.target.value)}
              className={`${inputBaseClass} font-mono-tabular text-left`}
            />
          </div>

          <div>
            <label
              htmlFor="set-deduction"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              نسبة التقاعد الافتراضية للموظف الجديد (%)
            </label>
            <input
              id="set-deduction"
              type="number"
              min="0"
              max="100"
              step="0.5"
              dir="ltr"
              value={settings.defaultDeductionPercent}
              onChange={(e) => handleNumber('defaultDeductionPercent', e.target.value)}
              className={`${inputBaseClass} font-mono-tabular text-left`}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onUpdateSettings(DEFAULT_SALARY_SETTINGS)}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            استعادة الإعدادات الافتراضية
          </button>

          <button
            type="button"
            onClick={onResetSampleEmployees}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            استعادة الأمثلة التجريبية للموظفين
          </button>
        </div>
      </section>

      {/* جدول سلم الرواتب الاسمي القابل للتعديل */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              سلم الرواتب الاسمي حسب الدرجة والمرحلة
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              يُملأ الراتب الاسمي تلقائياً عند اختيار الدرجة والمرحلة في محرر الراتب. يمكنك تعديل راتب المرحلة الأولى أو العلاوة السنوية لأي درجة.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {employeeCount > 0 && (
              <button
                type="button"
                onClick={onApplyScaleToEmployees}
                className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                تحديث رواتب الموظفين المسجلين ({employeeCount})
              </button>
            )}
            <button
              type="button"
              onClick={handleResetScale}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              استعادة السلم الرسمي
            </button>
          </div>
        </div>

        <div className="overflow-x-auto thin-scrollbar border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-right border-collapse min-w-[1120px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-2.5 px-3 whitespace-nowrap sticky right-0 bg-slate-50 dark:bg-slate-950/90 z-10">
                  الدرجة
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  المرحلة 1 ({settings.currency})
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  العلاوة السنوية
                </th>
                {Array.from({ length: SALARY_SCALE_STEPS_COUNT - 1 }, (_, i) => (
                  <th
                    key={i + 2}
                    className="py-2.5 px-2.5 whitespace-nowrap text-left font-mono-tabular"
                  >
                    م{i + 2}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {salaryScale.map((row) => (
                <tr
                  key={row.gradeNumber}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 z-10">
                    الدرجة {row.gradeName}
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      dir="ltr"
                      aria-label={`راتب المرحلة 1 للدرجة ${row.gradeName}`}
                      value={row.step1Salary}
                      onChange={(e) =>
                        handleScaleFieldChange(
                          row.gradeNumber,
                          'step1Salary',
                          e.target.value
                        )
                      }
                      className="w-28 h-8 px-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-tabular text-left focus:outline-none focus:border-emerald-600"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      dir="ltr"
                      aria-label={`العلاوة السنوية للدرجة ${row.gradeName}`}
                      value={row.annualIncrement}
                      onChange={(e) =>
                        handleScaleFieldChange(
                          row.gradeNumber,
                          'annualIncrement',
                          e.target.value
                        )
                      }
                      className="w-24 h-8 px-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-tabular text-left focus:outline-none focus:border-emerald-600"
                    />
                  </td>
                  {Array.from({ length: SALARY_SCALE_STEPS_COUNT - 1 }, (_, i) => {
                    const stepNum = i + 2;
                    const val = getStepSalary(row, stepNum);
                    return (
                      <td
                        key={stepNum}
                        dir="ltr"
                        className="py-2.5 px-2.5 text-left font-mono-tabular text-slate-700 dark:text-slate-300 whitespace-nowrap"
                      >
                        {new Intl.NumberFormat('en-US').format(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
