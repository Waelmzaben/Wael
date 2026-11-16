import {
  CopyPlus,
  Download,
  FileSpreadsheet,
  Pencil,
  Search,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { EmployeeRecord, MaritalStatus, SalarySettings } from '../types/salary';
import { exportEmployeesToExcel } from '../utils/excelImportExport';
import {
  calculateSalaryBreakdown,
  exportEmployeesToCsv,
  formatCurrency,
} from '../utils/salaryMath';

interface EmployeeTableProps {
  employees: EmployeeRecord[];
  settings: SalarySettings;
  activeEmployeeId?: string;
  onEditEmployee: (employee: EmployeeRecord) => void;
  onDuplicateEmployee: (employee: EmployeeRecord) => void;
  onDeleteEmployee: (id: string) => void;
  onNewEmployee: () => void;
  onOpenExcelImport: () => void;
}

export function EmployeeTable({
  employees,
  settings,
  activeEmployeeId,
  onEditEmployee,
  onDuplicateEmployee,
  onDeleteEmployee,
  onNewEmployee,
  onOpenExcelImport,
}: EmployeeTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [maritalFilter, setMaritalFilter] = useState<'all' | MaritalStatus>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return employees.filter((emp) => {
      if (maritalFilter !== 'all' && emp.maritalStatus !== maritalFilter) {
        return false;
      }
      if (!q) return true;
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.jobTitle.toLowerCase().includes(q) ||
        emp.grade.toLowerCase().includes(q) ||
        emp.step.toLowerCase().includes(q) ||
        emp.notes.toLowerCase().includes(q)
      );
    });
  }, [employees, searchQuery, maritalFilter]);

  const totals = useMemo(() => {
    return filteredEmployees.reduce(
      (acc, emp) => {
        const b = calculateSalaryBreakdown(emp, settings);
        acc.base += b.baseSalary;
        acc.allowances += b.totalAllowances;
        acc.deductions += b.totalDeductions;
        acc.net += b.netSalary;
        return acc;
      },
      { base: 0, allowances: 0, deductions: 0, net: 0 }
    );
  }, [filteredEmployees, settings]);

  return (
    <section className="space-y-4">
      {/* شريط البحث والفلترة والتصدير */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الموظف، العنوان الوظيفي، الدرجة..."
              className="w-full h-10 pr-9 pl-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/25 focus:border-emerald-600"
            />
          </div>

          <div
            role="group"
            aria-label="تصفية حسب الحالة الاجتماعية"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <button
              type="button"
              onClick={() => setMaritalFilter('all')}
              className={`h-8 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                maritalFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              الكل ({employees.length})
            </button>
            <button
              type="button"
              onClick={() => setMaritalFilter('married')}
              className={`h-8 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                maritalFilter === 'married'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              متزوج
            </button>
            <button
              type="button"
              onClick={() => setMaritalFilter('single')}
              className={`h-8 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                maritalFilter === 'single'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              غير متزوج
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenExcelImport}
            className="h-10 px-3.5 inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            إدراج ملف إكسل
          </button>
          {employees.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => exportEmployeesToExcel(filteredEmployees, settings)}
                className="h-10 px-3.5 inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                تصدير إكسل
              </button>
              <button
                type="button"
                onClick={() => exportEmployeesToCsv(filteredEmployees, settings)}
                className="h-10 px-3.5 inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                تصدير CSV
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onNewEmployee}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            إضافة موظف
          </button>
        </div>
      </div>

      {/* حالة القائمة الفارغة */}
      {employees.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            لا يوجد موظفون محفوظون بعد
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            أضف أول موظف عبر محرر الراتب أو استورد قائمة الموظفين مباشرة من ملف إكسل.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onNewEmployee}
              className="h-10 px-5 inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              إضافة أول موظف
            </button>
            <button
              type="button"
              onClick={onOpenExcelImport}
              className="h-10 px-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              إدراج ملف إكسل
            </button>
          </div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            لا توجد نتائج مطابقة لبحثك
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setMaritalFilter('all');
            }}
            className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            مسح الفلتر وإظهار جميع الموظفين
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto thin-scrollbar">
            <table className="w-full text-right border-collapse min-w-[1060px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4 whitespace-nowrap">الموظف والعنوان الوظيفي</th>
                  <th className="py-3 px-3 whitespace-nowrap">الدرجة / المرحلة</th>
                  <th className="py-3 px-3 whitespace-nowrap text-left">الراتب الاسمي</th>
                  <th className="py-3 px-3 whitespace-nowrap">النسب (30% · خطورة · شهادة · منصب · هندسية · بحثية)</th>
                  <th className="py-3 px-3 whitespace-nowrap">العائلة والأطفال</th>
                  <th className="py-3 px-3 whitespace-nowrap text-left">المخصصات</th>
                  <th className="py-3 px-3 whitespace-nowrap text-left">الاستقطاعات</th>
                  <th className="py-3 px-3 whitespace-nowrap text-left">صافي الراتب</th>
                  <th className="py-3 px-4 whitespace-nowrap text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredEmployees.map((emp) => {
                  const b = calculateSalaryBreakdown(emp, settings);
                  const isActive = emp.id === activeEmployeeId;
                  return (
                    <tr
                      key={emp.id}
                      className={`transition-colors ${
                        isActive
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {emp.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {emp.jobTitle}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <div>الدرجة: {emp.grade || '—'}</div>
                        <div className="text-slate-500 dark:text-slate-400">
                          المرحلة: {emp.step || '—'}
                        </div>
                      </td>

                      <td
                        dir="ltr"
                        className="py-3 px-3 text-left font-mono-tabular text-slate-800 dark:text-slate-200 whitespace-nowrap"
                      >
                        {formatCurrency(b.baseSalary, settings.currency)}
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-300 font-mono-tabular whitespace-nowrap">
                        {emp.allowance30Percent}% · {emp.hazardPercent}% · {emp.certificatePercent}% · {emp.positionPercent}% · {emp.engineeringLegalPercent}% · {emp.researchPercent}%
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <span>{emp.maritalStatus === 'married' ? 'متزوج' : 'غير متزوج'}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="tabular-nums">{emp.childrenCount} أطفال</span>
                      </td>

                      <td
                        dir="ltr"
                        className="py-3 px-3 text-left font-mono-tabular text-slate-700 dark:text-slate-300 whitespace-nowrap"
                      >
                        {formatCurrency(b.totalAllowances, settings.currency)}
                      </td>

                      <td
                        dir="ltr"
                        className="py-3 px-3 text-left font-mono-tabular text-amber-700 dark:text-amber-400 whitespace-nowrap"
                      >
                        {formatCurrency(b.totalDeductions, settings.currency)}
                      </td>

                      <td
                        dir="ltr"
                        className="py-3 px-3 text-left font-mono-tabular font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap"
                      >
                        {formatCurrency(b.netSalary, settings.currency)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditEmployee(emp)}
                            title="تعديل بيانات وراتب الموظف"
                            className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            تعديل
                          </button>

                          <button
                            type="button"
                            onClick={() => onDuplicateEmployee(emp)}
                            title="نسخ الموظف كسجل جديد"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <CopyPlus className="w-3.5 h-3.5" />
                          </button>

                          {confirmDeleteId === emp.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteEmployee(emp.id);
                                setConfirmDeleteId(null);
                              }}
                              className="h-8 px-2.5 inline-flex items-center rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                            >
                              تأكيد الحذف
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(emp.id)}
                              title="حذف الموظف"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <td className="py-3 px-4" colSpan={2}>
                    الإجمالي ({filteredEmployees.length} موظف)
                  </td>
                  <td dir="ltr" className="py-3 px-3 text-left font-mono-tabular whitespace-nowrap">
                    {formatCurrency(totals.base, settings.currency)}
                  </td>
                  <td className="py-3 px-3" colSpan={2} />
                  <td dir="ltr" className="py-3 px-3 text-left font-mono-tabular whitespace-nowrap">
                    {formatCurrency(totals.allowances, settings.currency)}
                  </td>
                  <td
                    dir="ltr"
                    className="py-3 px-3 text-left font-mono-tabular text-amber-700 dark:text-amber-400 whitespace-nowrap"
                  >
                    {formatCurrency(totals.deductions, settings.currency)}
                  </td>
                  <td
                    dir="ltr"
                    className="py-3 px-3 text-left font-mono-tabular text-emerald-700 dark:text-emerald-400 whitespace-nowrap"
                  >
                    {formatCurrency(totals.net, settings.currency)}
                  </td>
                  <td className="py-3 px-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
