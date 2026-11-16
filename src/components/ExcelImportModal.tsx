import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { EmployeeRecord, SalarySettings } from '../types/salary';
import {
  downloadExcelTemplate,
  parseEmployeesExcelFile,
  type ParsedExcelResult,
} from '../utils/excelImportExport';
import { calculateSalaryBreakdown, formatCurrency } from '../utils/salaryMath';

interface ExcelImportModalProps {
  isOpen: boolean;
  settings: SalarySettings;
  existingCount: number;
  onClose: () => void;
  onConfirmImport: (records: EmployeeRecord[], mode: 'append' | 'replace') => void;
}

export function ExcelImportModal({
  isOpen,
  settings,
  existingCount,
  onClose,
  onConfirmImport,
}: ExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedExcelResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  if (!isOpen) return null;

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setParsed(null);
    setFileName(file.name);
    setIsReading(true);

    try {
      const result = await parseEmployeesExcelFile(file, settings);
      setParsed(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء قراءة ملف الإكسل. تأكد من سلامة الملف.'
      );
    } finally {
      setIsReading(false);
    }
  };

  const handleResetAndClose = () => {
    setFileName('');
    setParsed(null);
    setError(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!parsed || parsed.records.length === 0) return;
    onConfirmImport(parsed.records, importMode);
    handleResetAndClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="excel-import-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* الرأس */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <h2
              id="excel-import-title"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              إدراج ملف إكسل لإضافة الموظفين
            </h2>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="إغلاق نافذة استيراد إكسل"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* المحتوى */}
        <div className="p-5 sm:p-6 overflow-y-auto thin-scrollbar space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                يدعم ملفات Excel (.xlsx, .xls) و CSV بجميع الأعمدة المطلوبة
              </p>
              <p>
                الاسم · العنوان الوظيفي · الدرجة · المرحلة · الراتب الاسمي · 30% · الخطورة · الشهادة · المنصب · الهندسية والقانونية · البحثية · الموقع · الزوجية · الأطفال · التقاعد · إيجار السكن · الضريبة · الرعاية الاجتماعية
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadExcelTemplate(settings)}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              تحميل نموذج إكسل جاهز
            </button>
          </div>

          {/* منطقة اختيار الملف */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                handleFileSelected(e.target.files?.[0]);
                e.target.value = '';
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-7 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-600 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {isReading
                  ? 'جاري قراءة الملف...'
                  : fileName
                  ? `الملف المختار: ${fileName} (اضغط لاختيار ملف آخر)`
                  : 'اضغط هنا لاختيار ملف إكسل (.xlsx / .xls / .csv)'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                تتم المعالجة محلياً داخل متصفحك بشكل فوري وآمن
              </span>
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {parsed && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    تمت قراءة {parsed.records.length} موظف بنجاح
                    {parsed.skippedRows > 0
                      ? ` (تم تجاهل ${parsed.skippedRows} صف فارغ)`
                      : ''}
                  </span>
                </div>
                <span className="text-emerald-700 dark:text-emerald-400">
                  تمت مطابقة {parsed.matchedColumns.length} عمود
                </span>
              </div>

              {/* خيار الإضافة أو الاستبدال */}
              {existingCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    طريقة الإدراج في السجل الحالي ({existingCount} موظف):
                  </span>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setImportMode('append')}
                      className={`h-8 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        importMode === 'append'
                          ? 'bg-emerald-700 text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      إضافة إلى القائمة الحالية
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`h-8 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        importMode === 'replace'
                          ? 'bg-emerald-700 text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      استبدال القائمة الحالية
                    </button>
                  </div>
                </div>
              )}

              {/* معاينة أول 5 صفوف */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  معاينة البيانات المستوردة ({Math.min(5, parsed.records.length)} من{' '}
                  {parsed.records.length})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="py-2 px-3">الاسم</th>
                        <th className="py-2 px-3">الدرجة / المرحلة</th>
                        <th className="py-2 px-3 text-left">الراتب الاسمي</th>
                        <th className="py-2 px-3">البحثية · الخطورة</th>
                        <th className="py-2 px-3 text-left">صافي الراتب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsed.records.slice(0, 5).map((rec) => {
                        const b = calculateSalaryBreakdown(rec, settings);
                        return (
                          <tr key={rec.id}>
                            <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">
                              {rec.name}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                              {rec.grade || '—'} / {rec.step || '—'}
                            </td>
                            <td
                              dir="ltr"
                              className="py-2 px-3 text-left font-mono-tabular"
                            >
                              {formatCurrency(b.baseSalary, settings.currency)}
                            </td>
                            <td className="py-2 px-3 font-mono-tabular text-slate-600 dark:text-slate-300">
                              {rec.researchPercent}% · {rec.hazardPercent}%
                            </td>
                            <td
                              dir="ltr"
                              className="py-2 px-3 text-left font-mono-tabular font-semibold text-emerald-700 dark:text-emerald-400"
                            >
                              {formatCurrency(b.netSalary, settings.currency)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* التذييل */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={!parsed || parsed.records.length === 0}
            onClick={handleConfirm}
            className="h-10 px-5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            اعتماد وإضافة ({parsed?.records.length ?? 0}) موظف
          </button>
        </div>
      </div>
    </div>
  );
}
