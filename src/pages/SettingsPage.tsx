import { useRef, useState } from 'react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiDownload,
  FiLoader,
  FiUpload
} from 'react-icons/fi';
import { exportUserData, importUserData, type BackupPayload, type ImportResult } from '../services/backup';

const SettingsPage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportMessage(null);
    setExportError(null);
    try {
      const payload = await exportUserData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `splitwisely-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setExportMessage('Backup downloaded successfully. Keep it somewhere safe.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export data right now.';
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const payload = JSON.parse(text) as BackupPayload;
      const result = await importUserData(payload);
      setImportResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The selected file could not be imported.';
      setImportError(message);
    } finally {
      setIsImporting(false);
      // allow selecting the same file again if desired
      event.target.value = '';
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Configure preferences and keep your SplitWisely data backed up.
        </p>
      </header>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div>
          <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">Theme</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Use the sidebar toggle to switch between light and dark mode. Your preference now persists across visits.
          </p>
        </div>
        <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
          <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">Data management</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Export a snapshot of the groups you own or import a previous backup to restore them.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <article className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Export backup</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Download a JSON backup with groups, expenses, splits, and settlements you own.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400 md:w-fit"
          >
            {isExporting ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiDownload className="h-4 w-4" />}
            {isExporting ? 'Preparing backup…' : 'Download backup'}
          </button>
          {exportMessage ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/40 dark:text-emerald-200">
              <FiCheckCircle className="mt-0.5 h-4 w-4" /> {exportMessage}
            </div>
          ) : null}
          {exportError ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200">
              <FiAlertTriangle className="mt-0.5 h-4 w-4" /> {exportError}
            </div>
          ) : null}
        </article>

        <article className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Import backup</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Restore groups you own from a previous SplitWisely export. Existing data will be merged by ID.
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={handleSelectFile}
            disabled={isImporting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300 disabled:cursor-not-allowed md:w-fit"
          >
            {isImporting ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiUpload className="h-4 w-4" />}
            {isImporting ? 'Importing…' : 'Choose JSON file'}
          </button>
          {importResult ? (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                <FiCheckCircle className="h-4 w-4 text-emerald-500" /> Imported {importResult.imported} group
                {importResult.imported === 1 ? '' : 's'}
              </div>
              {importResult.skipped.length ? (
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Skipped</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {importResult.skipped.map((entry) => (
                      <li key={entry.groupId}>
                        {entry.name}: {entry.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {importResult.errors.length ? (
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Issues detected</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-rose-600 dark:text-rose-300">
                    {importResult.errors.map((message, index) => (
                      <li key={index}>{message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
          {importError ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200">
              <FiAlertTriangle className="mt-0.5 h-4 w-4" /> {importError}
            </div>
          ) : null}
        </article>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300">
        <p className="font-semibold text-slate-800 dark:text-slate-100">Heads up</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Only groups you own are included in exports and can be restored.</li>
          <li>Imported data merges by matching IDs; existing records remain unchanged if not present in the backup.</li>
          <li>Ensure collaborators still exist in Supabase before importing shared groups to avoid membership errors.</li>
        </ul>
      </div>
    </section>
  );
};

export default SettingsPage;
