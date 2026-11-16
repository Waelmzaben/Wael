import { RotateCcw, Save, SlidersHorizontal, UserCheck } from 'lucide-react';
import { CERTIFICATE_PRESETS } from '../data/defaultEmployees';
import type { EmployeeDraft, SalaryBreakdown, SalarySettings } from '../types/salary';
import { formatCurrency } from '../utils/salaryMath';
import {
  formatCanonicalGrade,
  formatCanonicalStep,
  getScaleSalaryForGradeAndStep,
  getStepSalary,
  normalizeSalaryScale,
  parseGradeNumber,
  parseStepNumber,
  SALARY_SCALE_STEPS_COUNT,
} from '../utils/salaryScale';

interface EmployeeFormProps {
  draft: EmployeeDraft;
  breakdown: SalaryBreakdown;
  settings: SalarySettings;
  isEditingExisting: boolean;
  validationError: string | null;
  onChange: <K extends keyof EmployeeDraft>(field: K, value: EmployeeDraft[K]) => void;
  onPatchDraft: (patch: Partial<EmployeeDraft>) => void;
  onSubmit: () => void;
  onReset: () => void;
  onCancelEdit: () => void;
  onOpenSettings: () => void;
}

const inputBaseClass =
  'w-full h-11 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/25 focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors';

const numberInputClass = `${inputBaseClass} font-mono-tabular text-left`;

type NumericField =
  | 'baseSalary'
  | 'allowance30Percent'
  | 'hazardPercent'
  | 'certificatePercent'
  | 'positionPercent'
  | 'engineeringLegalPercent'
  | 'researchPercent'
  | 'locationValue'
  | 'childrenCount'
  | 'extraAllowance'
  | 'deductionPercent'
  | 'housingRentDeduction'
  | 'taxDeduction'
  | 'socialCareDeduction';

export function EmployeeForm({
  draft,
  breakdown,
  settings,
  isEditingExisting,
  validationError,
  onChange,
  onPatchDraft,
  onSubmit,
  onReset,
  onCancelEdit,
  onOpenSettings,
}: EmployeeFormProps) {
  const salaryScale = normalizeSalaryScale(settings.salaryScale);
  const selectedGradeNumber = parseGradeNumber(draft.grade);
  const selectedStepNumber = parseStepNumber(draft.step);
  const selectedGradeEntry = selectedGradeNumber
    ? salaryScale.find((g) => g.gradeNumber === selectedGradeNumber) ?? null
    : null;
  const scaleMatch = getScaleSalaryForGradeAndStep(
    salaryScale,
    draft.grade,
    draft.step
  );

  const handleGradeSelectChange = (rawGrade: string) => {
    if (!rawGrade) {
      onPatchDraft({ grade: '' });
      return;
    }
    const gradeNumber = Number(rawGrade);
    const gradeEntry = salaryScale.find((g) => g.gradeNumber === gradeNumber);
    if (!gradeEntry) {
      onPatchDraft({ grade: rawGrade });
      return;
    }

    const stepNumber = selectedStepNumber ?? 1;
    const nextSalary = getStepSalary(gradeEntry, stepNumber);
    onPatchDraft({
      grade: formatCanonicalGrade(gradeNumber),
      step: formatCanonicalStep(stepNumber),
      baseSalary: nextSalary,
    });
  };

  const handleStepSelectChange = (rawStep: string) => {
    if (!rawStep) {
      onPatchDraft({ step: '' });
      return;
    }
    const stepNumber = Number(rawStep);
    if (!Number.isFinite(stepNumber) || stepNumber < 1) {
      onPatchDraft({ step: rawStep });
      return;
    }

    const canonicalStep = formatCanonicalStep(stepNumber);
    if (selectedGradeEntry) {
      const nextSalary = getStepSalary(selectedGradeEntry, stepNumber);
      onPatchDraft({
        step: canonicalStep,
        baseSalary: nextSalary,
      });
    } else {
      onPatchDraft({ step: canonicalStep });
    }
  };

  const handleNumericChange = (field: NumericField, raw: string) => {
    if (raw.trim() === '') {
      onChange(field, 0);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    onChange(field, field === 'childrenCount' ? Math.floor(parsed) : parsed);
  };

  const handleMaritalStatusChange = (status: 'married' | 'single') => {
    onChange('maritalStatus', status);
    if (status === 'single' && draft.childrenCount > 0) {
      onChange('childrenCount', 0);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isEditingExisting ? 'تعديل بيانات وراتب الموظف' : 'بيانات وحساب راتب الموظف'}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            جميع النسب والمبالغ والاستقطاعات قابلة للإضافة والتعديل مباشرة
          </p>
        </div>
        {isEditingExisting && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            إلغاء التعديل
          </button>
        )}
      </div>

      {validationError && (
        <div
          role="alert"
          className="px-4 py-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300"
        >
          {validationError}
        </div>
      )}

      {/* القسم 1: الاسم والعنوان والدرجة والمرحلة والراتب الاسمي */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          البيانات الأساسية والدرجة والراتب الاسمي
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="emp-name"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              اسم الموظف <span className="text-red-600">*</span>
            </label>
            <input
              id="emp-name"
              type="text"
              value={draft.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="مثال: أحمد كريم محمد"
              className={inputBaseClass}
            />
          </div>

          <div>
            <label
              htmlFor="emp-title"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              العنوان الوظيفي <span className="text-red-600">*</span>
            </label>
            <input
              id="emp-title"
              type="text"
              value={draft.jobTitle}
              onChange={(e) => onChange('jobTitle', e.target.value)}
              placeholder="مثال: مهندس / باحث علمي"
              className={inputBaseClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="emp-grade"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              الدرجة الوظيفية
            </label>
            <select
              id="emp-grade"
              value={
                selectedGradeNumber !== null
                  ? String(selectedGradeNumber)
                  : draft.grade.trim()
                  ? `custom:${draft.grade}`
                  : ''
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith('custom:')) return;
                handleGradeSelectChange(val);
              }}
              className={inputBaseClass}
            >
              <option value="">اختر الدرجة...</option>
              {salaryScale.map((g) => (
                <option key={g.gradeNumber} value={String(g.gradeNumber)}>
                  الدرجة {g.gradeName} ({new Intl.NumberFormat('en-US').format(g.step1Salary)})
                </option>
              ))}
              {selectedGradeNumber === null && draft.grade.trim() && (
                <option value={`custom:${draft.grade}`}>
                  {draft.grade} (مخصص)
                </option>
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="emp-step"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              المرحلة (العلاوة السنوية)
            </label>
            <select
              id="emp-step"
              value={
                selectedStepNumber !== null
                  ? String(selectedStepNumber)
                  : draft.step.trim()
                  ? `custom:${draft.step}`
                  : ''
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith('custom:')) return;
                handleStepSelectChange(val);
              }}
              className={inputBaseClass}
            >
              <option value="">اختر المرحلة...</option>
              {Array.from({ length: SALARY_SCALE_STEPS_COUNT }, (_, idx) => {
                const stepNum = idx + 1;
                const stepSalary = selectedGradeEntry
                  ? getStepSalary(selectedGradeEntry, stepNum)
                  : null;
                return (
                  <option key={stepNum} value={String(stepNum)}>
                    {stepSalary !== null
                      ? `المرحلة ${stepNum} — ${new Intl.NumberFormat('en-US').format(stepSalary)} ${settings.currency}`
                      : `المرحلة ${stepNum}`}
                  </option>
                );
              })}
              {selectedStepNumber === null && draft.step.trim() && (
                <option value={`custom:${draft.step}`}>
                  {draft.step} (مخصص)
                </option>
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="emp-base-salary"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              الراتب الاسمي ({settings.currency}) <span className="text-red-600">*</span>
            </label>
            <input
              id="emp-base-salary"
              type="number"
              min="0"
              step="1000"
              dir="ltr"
              value={draft.baseSalary === 0 ? '' : draft.baseSalary}
              onChange={(e) => handleNumericChange('baseSalary', e.target.value)}
              placeholder="0"
              className={numberInputClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
          {scaleMatch ? (
            <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
              <span>
                سلم الرواتب: الدرجة {scaleMatch.gradeEntry.gradeName} · المرحلة{' '}
                {scaleMatch.stepNumber}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                العلاوة السنوية:{' '}
                {formatCurrency(scaleMatch.gradeEntry.annualIncrement, settings.currency)}
              </span>
              {draft.baseSalary !== scaleMatch.salary && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => onChange('baseSalary', scaleMatch.salary)}
                    className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    تطبيق راتب السلم ({formatCurrency(scaleMatch.salary, settings.currency)})
                  </button>
                </>
              )}
            </div>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">
              اختر الدرجة والمرحلة لتعبئة الراتب الاسمي تلقائياً حسب السلم، أو أدخل المبلغ يدوياً
            </span>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            عرض وتعديل سلم الرواتب
          </button>
        </div>
      </div>

      {/* القسم 2: المخصصات النسبية والموقع */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          المخصصات النسبية ومخصص الموقع
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* نسبة 30% */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="emp-30"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                نسبة 30%
              </label>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono-tabular">
                {formatCurrency(breakdown.allowance30Amount, settings.currency)}
              </span>
            </div>
            <div className="relative">
              <input
                id="emp-30"
                type="number"
                min="0"
                step="0.5"
                dir="ltr"
                value={draft.allowance30Percent === 0 ? '' : draft.allowance30Percent}
                onChange={(e) => handleNumericChange('allowance30Percent', e.target.value)}
                placeholder="30"
                className={`${numberInputClass} pl-8`}
              />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 font-mono-tabular">
                %
              </span>
            </div>
          </div>

          {/* نسبة الخطورة 65% */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="emp-hazard"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                نسبة الخطورة (%)
              </label>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono-tabular">
                {formatCurrency(breakdown.hazardAmount, settings.currency)}
              </span>
            </div>
            <div className="relative">
              <input
                id="emp-hazard"
                type="number"
                min="0"
                step="0.5"
                dir="ltr"
                value={draft.hazardPercent === 0 ? '' : draft.hazardPercent}
                onChange={(e) => handleNumericChange('hazardPercent', e.target.value)}
                placeholder="65"
                className={`${numberInputClass} pl-8`}
              />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 font-mono-tabular">
                %
              </span>
            </div>
          </div>

          {/* نسبة البحثية 50% */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="emp-research"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                نسبة البحثية (%)
              </label>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono-tabular">
                {formatCurrency(breakdown.researchAmount, settings.currency)}
              </span>
            </div>
            <div className="relative">
              <input
                id="emp-research"
                type="number"
                min="0"
                step="0.5"
                dir="ltr"
                value={draft.researchPercent === 0 ? '' : draft.researchPercent}
                onChange={(e) => handleNumericChange('researchPercent', e.target.value)}
                placeholder="0"
                className={`${numberInputClass} pl-8`}
              />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 font-mono-tabular">
                %
              </span>
            </div>
          </div>

          {/* نسبة الشهادة */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="emp-cert"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                نسبة الشهادة (%)
              </label>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono-tabular">
                {formatCurrency(breakdown.certificateAmount, settings.currency)}
              </span>
            </div>
            <div className="relative">
              <input
                id="emp-cert"
                type="number"
                min="0"
                step="0.5"
                dir="ltr"
                value={draft.certificatePercent === 0 ? '' : draft.certificatePercent}
                onChange={(e) => handleNumericChange('certificatePercent', e.target.value)}
                placeholder="0"
                className={`${numberInputClass} pl-8`}
              />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 font-mono-tabular">
                %
              </span>
            </div>
            <div className="mt-1.5">
              <label htmlFor="cert-preset" className="sr-only">
                اختيار سريع لنسبة الشهادة
              </label>
              <select
                id="cert-preset"
                value={
                  CERTIFICATE_PRESETS.some((p) => p.value === draft.certificatePercent)
                    ? String(draft.certificatePercent)
                    : ''
                }
                onChange={(e) => {
                  if (e.target.value !== '') {
                    onChange('certificatePercent', Number(e.target.value));
                  }
                }}
                className="w-full h-8 px-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 focus:outline-none focus:border-emerald-600"
              >
                <option value="">اختيار سريع للشهادة...</option>
                {CERTIFICATE_PRESETS.map((preset) => (
                  <option key={preset.label} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* نسبة المنصب */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="emp-position"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                نسبة المنصب (%)
              </label>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono-tabular">
                {formatCurrency(breakdown.positionAmount, settings.currency)}
              </span>
            </div>
            <div className="relative">
              <input
                id="emp-position"
                type="number"
                min="0"
                step="0.5"
                dir="ltr"
                value={draft.positionPercent === 0 ? '' : draft.positionPercent}
                onChange={(e) => handleNumericChange('positionPercent', e.target.value)}
                placeholder="0"
                className={`${numberInputClass} pl-8`}
              />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 font-mono-tabular">
                %
              </span>
            </div>
          </div>

          {/* نسبة هندسية وقانونية */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="emp-eng-legal"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                نسبة هندسية وقانونية (%)
              </label>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono-tabular">
                {formatCurrency(breakdown.engineeringLegalAmount, settings.currency)}
              </span>
            </div>
            <div className="relative">
              <input
                id="emp-eng-legal"
                type="number"
                min="0"
                step="0.5"
                dir="ltr"
                value={
                  draft.engineeringLegalPercent === 0
                    ? ''
                    : draft.engineeringLegalPercent
                }
                onChange={(e) =>
                  handleNumericChange('engineeringLegalPercent', e.target.value)
                }
                placeholder="0"
                className={`${numberInputClass} pl-8`}
              />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 font-mono-tabular">
                %
              </span>
            </div>
          </div>
        </div>

        {/* موقع + مخصصات إضافية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="emp-location"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                مخصصات الموقع
              </label>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono-tabular">
                {formatCurrency(breakdown.locationAmount, settings.currency)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="emp-location"
                type="number"
                min="0"
                step={draft.locationMode === 'percent' ? '0.5' : '1000'}
                dir="ltr"
                value={draft.locationValue === 0 ? '' : draft.locationValue}
                onChange={(e) => handleNumericChange('locationValue', e.target.value)}
                placeholder="0"
                className={numberInputClass}
              />
              <div
                role="group"
                aria-label="نوع مخصص الموقع"
                className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => onChange('locationMode', 'amount')}
                  className={`h-9 px-2.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    draft.locationMode === 'amount'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  مبلغ
                </button>
                <button
                  type="button"
                  onClick={() => onChange('locationMode', 'percent')}
                  className={`h-9 px-2.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    draft.locationMode === 'percent'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  %
                </button>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="emp-extra"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              مخصصات إضافية مقطوعة ({settings.currency})
            </label>
            <input
              id="emp-extra"
              type="number"
              min="0"
              step="1000"
              dir="ltr"
              value={draft.extraAllowance === 0 ? '' : draft.extraAllowance}
              onChange={(e) => handleNumericChange('extraAllowance', e.target.value)}
              placeholder="0"
              className={numberInputClass}
            />
          </div>
        </div>
      </div>

      {/* القسم 3: الحالة الاجتماعية وعدد الأطفال */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            الحالة الاجتماعية والعائلية
          </h3>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            تعديل مبالغ الزوجية والأطفال
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              الحالة الاجتماعية
            </span>
            <div
              role="group"
              aria-label="الحالة الاجتماعية"
              className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <button
                type="button"
                onClick={() => handleMaritalStatusChange('married')}
                className={`h-9 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  draft.maritalStatus === 'married'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                متزوج
              </button>
              <button
                type="button"
                onClick={() => handleMaritalStatusChange('single')}
                className={`h-9 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  draft.maritalStatus === 'single'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                غير متزوج
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              مخصص الزوجية:{' '}
              {formatCurrency(breakdown.marriageAmount, settings.currency)}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="emp-children"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                عدد الأطفال
              </label>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono-tabular">
                {formatCurrency(breakdown.childrenAmount, settings.currency)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange('childrenCount', Math.max(0, draft.childrenCount - 1))
                }
                aria-label="إنقاص عدد الأطفال"
                className="h-11 w-11 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-lg transition-colors shrink-0 cursor-pointer"
              >
                −
              </button>
              <input
                id="emp-children"
                type="number"
                min="0"
                step="1"
                dir="ltr"
                value={draft.childrenCount}
                onChange={(e) => handleNumericChange('childrenCount', e.target.value)}
                className={`${numberInputClass} text-center`}
              />
              <button
                type="button"
                onClick={() => onChange('childrenCount', draft.childrenCount + 1)}
                aria-label="زيادة عدد الأطفال"
                className="h-11 w-11 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-lg transition-colors shrink-0 cursor-pointer"
              >
                +
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              مخصص الطفل: {formatCurrency(settings.childAllowanceAmount, settings.currency)}
              {settings.maxChildrenForAllowance > 0
                ? ` · الحد الأقصى ${settings.maxChildrenForAllowance} أطفال`
                : ' · بدون حد أقصى'}
            </p>
          </div>
        </div>
      </div>

      {/* القسم 4: الاستقطاعات (التقاعد 10%، إيجار سكن، ضريبة، رعاية اجتماعية) */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          الاستقطاعات
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="emp-deduction"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                التقاعد (%)
              </label>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-mono-tabular">
                {formatCurrency(breakdown.retirementAmount, settings.currency)}
              </span>
            </div>
            <div className="relative">
              <input
                id="emp-deduction"
                type="number"
                min="0"
                max="100"
                step="0.5"
                dir="ltr"
                value={draft.deductionPercent === 0 ? '' : draft.deductionPercent}
                onChange={(e) => handleNumericChange('deductionPercent', e.target.value)}
                placeholder="10"
                className={`${numberInputClass} pl-8`}
              />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 font-mono-tabular">
                %
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="emp-housing-rent"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              إيجار سكن ({settings.currency})
            </label>
            <input
              id="emp-housing-rent"
              type="number"
              min="0"
              step="1000"
              dir="ltr"
              value={draft.housingRentDeduction === 0 ? '' : draft.housingRentDeduction}
              onChange={(e) => handleNumericChange('housingRentDeduction', e.target.value)}
              placeholder="0"
              className={numberInputClass}
            />
          </div>

          <div>
            <label
              htmlFor="emp-tax"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              ضريبة ({settings.currency})
            </label>
            <input
              id="emp-tax"
              type="number"
              min="0"
              step="1000"
              dir="ltr"
              value={draft.taxDeduction === 0 ? '' : draft.taxDeduction}
              onChange={(e) => handleNumericChange('taxDeduction', e.target.value)}
              placeholder="0"
              className={numberInputClass}
            />
          </div>

          <div>
            <label
              htmlFor="emp-social-care"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              رعاية اجتماعية ({settings.currency})
            </label>
            <input
              id="emp-social-care"
              type="number"
              min="0"
              step="1000"
              dir="ltr"
              value={draft.socialCareDeduction === 0 ? '' : draft.socialCareDeduction}
              onChange={(e) => handleNumericChange('socialCareDeduction', e.target.value)}
              placeholder="0"
              className={numberInputClass}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="emp-notes"
            className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
          >
            ملاحظات / القسم أو الدائرة
          </label>
          <input
            id="emp-notes"
            type="text"
            value={draft.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="القسم أو الدائرة أو ملاحظات إضافية"
            className={inputBaseClass}
          />
        </div>
      </div>

      {/* أزرار الحفظ وإعادة التعيين */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="h-11 px-5 inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isEditingExisting ? (
              <>
                <UserCheck className="w-4 h-4" />
                حفظ التعديلات
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ في سجل الموظفين
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="h-11 px-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            تفريغ الحقول
          </button>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          يتم حفظ جميع السجلات تلقائياً في المتصفح
        </span>
      </div>
    </form>
  );
}
