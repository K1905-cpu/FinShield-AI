import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ReportItem } from '../types/shared';
import { 
  FileText, 
  Download, 
  Printer, 
  RefreshCw, 
  Calendar, 
  ShieldAlert, 
  PlusCircle, 
  Eye, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // New report form
  const [reportType, setReportType] = useState<'fraud' | 'suspicious' | 'user_risk' | 'transactions'>('fraud');
  const [reportName, setReportName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Active preview data
  const [previewReport, setPreviewReport] = useState<{ report: ReportItem; data: any[] } | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.reports.getAll();
      setReports(res.reports);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.reports.generate({
        type: reportType,
        name: reportName || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setPreviewReport({ report: res.report, data: res.data });
      fetchReports();
    } catch (err: any) {
      alert(`Report generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = (report: ReportItem, data: any[]) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = [
      headers,
      ...data.map(item => headers.map(h => `"${item[h] ?? ''}"`))
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${report.id}_${report.type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
            Compliance & Risk Intelligence Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate formal audit dossiers, threat assessments, and transaction journals
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Generator Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
          Generate New Audit Report
        </h3>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Report Subject & Type
            </label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            >
              <option value="fraud">Fraud Threat Report (Critical)</option>
              <option value="suspicious">Suspicious Activity Report (SAR)</option>
              <option value="user_risk">User Exposure & Account Risk Report</option>
              <option value="transactions">Comprehensive Transaction Journal</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Custom Report Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Q3 Card Threat Assessment"
              value={reportName}
              onChange={e => setReportName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Date Filter Window
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span>Compile & Preview</span>
            </button>
          </div>
        </form>
      </div>

      {/* Interactive Report Preview Modal / Container if generated */}
      {previewReport && (
        <div className="bg-white dark:bg-slate-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 uppercase">
                {previewReport.report.id} • {previewReport.report.type}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {previewReport.report.name}
              </h3>
              <p className="text-xs text-slate-500">{previewReport.report.summary}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportCSV(previewReport.report, previewReport.data)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Dossier</span>
              </button>

              <button
                onClick={() => setPreviewReport(null)}
                className="px-3 py-1.5 text-slate-400 hover:text-slate-600 text-xs font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-semibold sticky top-0">
                <tr>
                  {previewReport.data.length > 0 && Object.keys(previewReport.data[0]).slice(0, 6).map(h => (
                    <th key={h} className="px-4 py-2 capitalize font-mono text-[11px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {previewReport.data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {Object.keys(previewReport.data[0]).slice(0, 6).map(h => (
                      <td key={h} className="px-4 py-2 truncate max-w-xs font-mono text-slate-700 dark:text-slate-300">
                        {String(row[h])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Directory List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Archived Compliance Reports
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Report ID</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Records</th>
                <th className="px-5 py-3">Generated At</th>
                <th className="px-5 py-3">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-mono font-bold text-zinc-900 dark:text-zinc-100">{r.id}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">{r.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      {r.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-300">{r.recordCount}</td>
                  <td className="px-5 py-3.5 text-slate-500">{new Date(r.generatedAt).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-slate-500">{r.generatedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
