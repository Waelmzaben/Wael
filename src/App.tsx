import { FileSpreadsheet, Moon, Plus, Sun } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EmployeeForm } from './components/EmployeeForm';
import { EmployeeTable } from './components/EmployeeTable';
import { ExcelImportModal } from './components/ExcelImportModal';
import { PayslipBreakdown } from './components/PayslipBreakdown';
import { SalarySummaryStrip } from './components/SalarySummaryStrip';
import { SettingsPanel } from './components/SettingsPanel';
import {
  createEmptyEmployeeDraft,
  DEFAULT_SALARY_SETTINGS,
  SAMPLE_EMPLOYEES,
} from './data/defaultEmployees';
import type {
  EmployeeDraft,
  EmployeeRecord,
  SalarySettings,
  WorkspaceTab,
} from './types/salary';
import {
  calculateSalaryBreakdown,
  normalizeEmployeeRecord,
} from './utils/salaryMath';
import {
  getScaleSalaryForGradeAndStep,
  normalizeSalaryScale,
} from './utils/salaryScale';

const EMPLOYEES_STORAGE_KEY = 'payroll_employees_v1';
const SETTINGS_STORAGE_KEY = 'payroll_settings_v1';
const THEME_STORAGE_KEY = 'payroll_theme_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('editor');

  const [settings, setSettings] = useState<SalarySettings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return DEFAULT_SALARY_SETTINGS;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SALARY_SETTINGS,
        ...parsed,
        salaryScale: normalizeSalaryScale(parsed?.salaryScale),
      };
    } catch {
      return DEFAULT_SALARY_SETTINGS;
    }
  });

  const [employees, setEmployees] = useState<EmployeeRecord[]>(() => {
    try {
      const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
      if (!raw) return SAMPLE_EMPLOYEES;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.map((item, idx) => normalizeEmployeeRecord(item, idx))
        : SAMPLE_EMPLOYEES;
    } catch {
      return SAMPLE_EMPLOYEES;
    }
  });

  const [draft, setDraft] = useState<EmployeeDraft>(() => {
    if (employees.length > 0) {
      return { ...employees[0] };
    }
    return createEmptyEmployeeDraft(settings);
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });

  const editorTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
    } catch {
      // Ignore storage errors
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const breakdown = useMemo(
    () => calculateSalaryBreakdown(draft, settings),
    [draft, settings]
  );

  const handleFieldChange = <K extends keyof EmployeeDraft>(
    field: K,
    value: EmployeeDraft[K]
  ) => {
    setValidationError(null);
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePatchDraft = (patch: Partial<EmployeeDraft>) => {
    setValidationError(null);
    setDraft((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  const handleSaveEmployee = () => {
    if (!draft.name.trim()) {
      setValidationError('يرجى إدخال اسم الموظف قبل الحفظ.');
      return;
    }
    if (!draft.jobTitle.trim()) {
      setValidationError('يرجى إدخال العنوان الوظيفي للموظف.');
      return;
    }
    if (!Number.isFinite(draft.baseSalary) || draft.baseSalary <= 0) {
      setValidationError('يرجى إدخال قيمة الراتب المقابل للدرجة (أكبر من صفر).');
      return;
    }

    const now = new Date().toISOString();

    if (draft.id) {
      const updatedRecord: EmployeeRecord = {
        ...draft,
        id: draft.id,
        name: draft.name.trim(),
        jobTitle: draft.jobTitle.trim(),
        grade: draft.grade.trim(),
        step: draft.step.trim(),
        notes: draft.notes.trim(),
        updatedAt: now,
      };
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === updatedRecord.id ? updatedRecord : emp))
      );
      setDraft(updatedRecord);
      showToast(`تم تحديث بيانات وراتب "${updatedRecord.name}" بنجاح`);
    } else {
      const newRecord: EmployeeRecord = {
        ...draft,
        id: `emp-${Date.now()}`,
        name: draft.name.trim(),
        jobTitle: draft.jobTitle.trim(),
        grade: draft.grade.trim(),
        step: draft.step.trim(),
        notes: draft.notes.trim(),
        updatedAt: now,
      };
      setEmployees((prev) => [newRecord, ...prev]);
      setDraft(newRecord);
      showToast(`تمت إضافة "${newRecord.name}" إلى سجل الرواتب`);
    }
  };

  const handleStartNewEmployee = () => {
    setValidationError(null);
    setDraft(createEmptyEmployeeDraft(settings));
    setActiveTab('editor');
    editorTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleResetFields = () => {
    setValidationError(null);
    setDraft((prev) => ({
      ...createEmptyEmployeeDraft(settings),
      id: prev.id,
    }));
  };

  const handleCancelEdit = () => {
    setValidationError(null);
    setDraft(createEmptyEmployeeDraft(settings));
  };

  const handleEditEmployee = (employee: EmployeeRecord) => {
    setValidationError(null);
    setDraft({ ...employee });
    setActiveTab('editor');
    window.setTimeout(() => {
      editorTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const handleDuplicateEmployee = (employee: EmployeeRecord) => {
    const copy: EmployeeRecord = {
      ...employee,
      id: `emp-${Date.now()}`,
      name: `${employee.name} (نسخة)`,
      updatedAt: new Date().toISOString(),
    };
    setEmployees((prev) => [copy, ...prev]);
    setDraft(copy);
    setActiveTab('editor');
    showToast(`تم نسخ سجل "${employee.name}" للتعديل`);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    if (draft.id === id) {
      setDraft(createEmptyEmployeeDraft(settings));
    }
    showToast('تم حذف سجل الموظف');
  };

  const handleResetSamples = () => {
    setEmployees(SAMPLE_EMPLOYEES);
    setDraft({ ...SAMPLE_EMPLOYEES[0] });
    showToast('تمت استعادة الأمثلة التجريبية');
  };

  const handleApplyScaleToEmployees = () => {
    let updatedCount = 0;
    const now = new Date().toISOString();
    const scale = normalizeSalaryScale(settings.salaryScale);

    const nextEmployees = employees.map((emp) => {
      const match = getScaleSalaryForGradeAndStep(scale, emp.grade, emp.step);
      if (!match) return emp;
      if (emp.baseSalary !== match.salary) {
        updatedCount += 1;
      }
      return {
        ...emp,
        baseSalary: match.salary,
        updatedAt: now,
      };
    });

    setEmployees(nextEmployees);

    const draftMatch = getScaleSalaryForGradeAndStep(
      scale,
      draft.grade,
      draft.step
    );
    if (draftMatch) {
      setDraft((prev) => ({
        ...prev,
        baseSalary: draftMatch.salary,
      }));
    }

    showToast(
      updatedCount > 0
        ? `تم تحديث الراتب الاسمي لـ ${updatedCount} موظف حسب سلم الرواتب`
        : 'جميع رواتب الموظفين مطابقة بالفعل لسلم الرواتب الحالي'
    );
  };

  const handleConfirmExcelImport = (
    importedRecords: EmployeeRecord[],
    mode: 'append' | 'replace'
  ) => {
    if (mode === 'replace') {
      setEmployees(importedRecords);
      setDraft({ ...importedRecords[0] });
      showToast(`تم استيراد واستبدال السجل بـ ${importedRecords.length} موظف من ملف الإكسل`);
    } else {
      setEmployees((prev) => [...importedRecords, ...prev]);
      setDraft({ ...importedRecords[0] });
      showToast(`تمت إضافة ${importedRecords.length} موظف من ملف الإكسل`);
    }
    setActiveTab('directory');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* الشريط العلوي (Three-Zone Contract) */}
      <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* المنطقة 1: اسم التطبيق */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('editor');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            منظومة الرواتب
          </a>

          {/* المنطقة 2: روابط التنقل */}
          <nav
            aria-label="التنقل الرئيسي"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'editor'
                  ? 'border-emerald-700 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              محرر الراتب
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'directory'
                  ? 'border-emerald-700 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              سجل الموظفين
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-emerald-700 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              إعدادات المخصصات والسلم
            </button>
          </nav>

          {/* المنطقة 3: إجراء رئيسي واحد */}
          <button
            type="button"
            onClick={handleStartNewEmployee}
            className="h-10 px-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            موظف جديد
          </button>
        </div>

        {/* تنقل الشاشات الصغيرة */}
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`py-1 whitespace-nowrap shrink-0 ${
              activeTab === 'editor'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            محرر الراتب
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`py-1 whitespace-nowrap shrink-0 ${
              activeTab === 'directory'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            سجل الموظفين ({employees.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-1 whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            إعدادات المخصصات والسلم
          </button>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main
        ref={editorTopRef}
        className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6"
      >
        {/* شريط أدوات مساحة العمل */}
        <div className="no-print flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white text-balance">
              {activeTab === 'editor' && 'حساب وتعديل راتب الموظف'}
              {activeTab === 'directory' && 'سجل رواتب الموظفين'}
              {activeTab === 'settings' && 'إعدادات المخصصات وسلم الرواتب'}
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <span>إدارة الدرجة والمرحلة والمخصصات النسبية والعائلية بدقة</span>
              <span aria-hidden="true"> · </span>
              <span className="tabular-nums">{employees.length} موظف مسجل</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'editor' && employees.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="quick-emp-select" className="sr-only">
                  اختيار موظف للتعديل
                </label>
                <select
                  id="quick-emp-select"
                  value={draft.id || ''}
                  onChange={(e) => {
                    const selected = employees.find((emp) => emp.id === e.target.value);
                    if (selected) {
                      handleEditEmployee(selected);
                    }
                  }}
                  className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-600"
                >
                  <option value="" disabled>
                    اختر موظفاً للتعديل...
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.jobTitle}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsExcelModalOpen(true)}
              className="h-10 px-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              إدراج ملف إكسل
            </button>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
              className="h-10 px-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4" />
                  نهاري
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  ليلي
                </>
              )}
            </button>
          </div>
        </div>

        {/* رسالة تأكيد العمليات */}
        {statusMessage && (
          <div
            role="status"
            className="no-print px-4 py-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-sm font-medium text-emerald-800 dark:text-emerald-300"
          >
            {statusMessage}
          </div>
        )}

        {activeTab === 'editor' && (
          <>
            <div className="no-print">
              <SalarySummaryStrip
                breakdown={breakdown}
                settings={settings}
                deductionPercent={draft.deductionPercent}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="no-print lg:col-span-7">
                <EmployeeForm
                  draft={draft}
                  breakdown={breakdown}
                  settings={settings}
                  isEditingExisting={Boolean(draft.id)}
                  validationError={validationError}
                  onChange={handleFieldChange}
                  onPatchDraft={handlePatchDraft}
                  onSubmit={handleSaveEmployee}
                  onReset={handleResetFields}
                  onCancelEdit={handleCancelEdit}
                  onOpenSettings={() => setActiveTab('settings')}
                />
              </div>

              <div className="lg:col-span-5 lg:sticky lg:top-22">
                <PayslipBreakdown
                  draft={draft}
                  breakdown={breakdown}
                  settings={settings}
                />
              </div>
            </div>

            <div className="no-print pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  سجل الموظفين القابل للتعديل
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  اضغط «تعديل» على أي موظف لفتح بياناته وتحديث راتبه
                </span>
              </div>
              <EmployeeTable
                employees={employees}
                settings={settings}
                activeEmployeeId={draft.id}
                onEditEmployee={handleEditEmployee}
                onDuplicateEmployee={handleDuplicateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onNewEmployee={handleStartNewEmployee}
                onOpenExcelImport={() => setIsExcelModalOpen(true)}
              />
            </div>
          </>
        )}

        {activeTab === 'directory' && (
          <EmployeeTable
            employees={employees}
            settings={settings}
            activeEmployeeId={draft.id}
            onEditEmployee={handleEditEmployee}
            onDuplicateEmployee={handleDuplicateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onNewEmployee={handleStartNewEmployee}
            onOpenExcelImport={() => setIsExcelModalOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            settings={settings}
            employeeCount={employees.length}
            onUpdateSettings={setSettings}
            onApplyScaleToEmployees={handleApplyScaleToEmployees}
            onResetSampleEmployees={handleResetSamples}
            onBackToEditor={() => setActiveTab('editor')}
          />
        )}
      </main>

      <ExcelImportModal
        isOpen={isExcelModalOpen}
        settings={settings}
        existingCount={employees.length}
        onClose={() => setIsExcelModalOpen(false)}
        onConfirmImport={handleConfirmExcelImport}
      />
    </div>
  );
}
