import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldAlert, 
  Download, 
  FileText,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SAMPLE_CSV = `transaction_id,user_id,timestamp,amount,currency,merchant,category,location,payment_method,device_id
TXN-CSV-001,usr_user_001,2026-09-29T14:30:00Z,1850,INR,Amazon India,Shopping,Mumbai,credit_card,DEV-IPHONE-15-KALP
TXN-CSV-002,usr_user_001,2026-09-29T15:15:00Z,450,INR,Swiggy Food,Food,Mumbai,upi,DEV-IPHONE-15-KALP
TXN-CSV-003,usr_user_001,2026-09-29T02:47:00Z,92000,INR,Apex Crypto OTC,Crypto Exchange,Dubai (AE),wire_transfer,DEV-UNKNOWN-TOR-99
TXN-CSV-004,usr_user_001,2026-09-29T02:50:00Z,74000,INR,RoyalBet Offshore,Online Gambling,Lagos (NG),credit_card,DEV-UNKNOWN-TOR-99
TXN-CSV-005,usr_user_001,2026-09-29T18:00:00Z,899,INR,Netflix India,Entertainment,Mumbai,credit_card,DEV-IPHONE-15-KALP`;

export const CSVUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [useRawText, setUseRawText] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    importedRows: number;
    suspiciousDetected: number;
    fraudDetected: number;
    errors: { row: number; error: string }[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      let res;
      if (useRawText || !file) {
        res = await api.transactions.uploadCSV(null, csvText);
      } else {
        res = await api.transactions.uploadCSV(file);
      }

      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to process CSV file.');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const element = document.createElement('a');
    const fileBlob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = 'finshield_sample_transactions.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold uppercase tracking-wider mb-2">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Batch Ingestion Service
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Transaction CSV Import & Automated Fraud Engine Scan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Upload bulk transaction manifests. The FinShield pipeline validates data types, flags anomalies, triggers real-time fraud scores, and updates compliance queues.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ingestion Box */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Upload Transaction Manifest
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseRawText(prev => !prev)}
                  className="text-xs text-zinc-700 dark:text-zinc-300 font-medium hover:underline"
                >
                  {useRawText ? 'Switch to File Picker' : 'Switch to Text Editor'}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!useRawText ? (
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-zinc-800 dark:hover:border-zinc-400 transition-colors">
                <UploadCloud className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
                <p className="text-xs font-semibold text-slate-900 dark:text-white mb-1">
                  Drag and drop your transaction CSV here, or browse
                </p>
                <p className="text-[11px] text-slate-400 mb-4">
                  Accepts .csv format with required headers (up to 5MB)
                </p>

                <input
                  type="file"
                  id="csvFile"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <label
                  htmlFor="csvFile"
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors inline-block"
                >
                  Browse Local File
                </label>

                {file && (
                  <p className="mt-3 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Direct CSV Data (Auto-filled with sample attack vectors):
                </label>
                <textarea
                  rows={8}
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-700 dark:focus:ring-zinc-400"
                />
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </button>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Batch & Fraud Engine...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Validate & Execute Scan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Summary Box (Section 18 requirement) */}
          {result && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Batch Execution Results Summary
                </h3>
                <button
                  onClick={() => navigate('/transactions')}
                  className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>View in Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Rows</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{result.totalRows}</span>
                </div>

                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase block">Valid Rows</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{result.validRows}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Invalid</span>
                  <span className="text-lg font-bold text-slate-500">{result.invalidRows}</span>
                </div>

                <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
                  <span className="text-[10px] text-zinc-700 dark:text-zinc-300 font-semibold uppercase block">Imported</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{result.importedRows}</span>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase block">Suspicious</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{result.suspiciousDetected}</span>
                </div>

                <div className="p-3 bg-rose-500/10 rounded-xl">
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold uppercase block">Fraud Flags</span>
                  <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{result.fraudDetected}</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-700 dark:text-amber-300 block">Row-level Validation Warnings:</span>
                  {result.errors.map((e, idx) => (
                    <p key={idx} className="text-slate-600 dark:text-slate-400">
                      Line {e.row}: {e.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Schema Guide */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Accepted CSV Schema
          </h3>

          <div className="space-y-2 text-xs">
            {[
              { col: 'transaction_id', desc: 'Unique alphanumeric identifier', req: false },
              { col: 'user_id', desc: 'Cardholder user ID', req: false },
              { col: 'timestamp', desc: 'ISO 8601 Date/Time', req: false },
              { col: 'amount', desc: 'Numeric positive transaction amount', req: true },
              { col: 'currency', desc: 'Standard currency (e.g. INR)', req: false },
              { col: 'merchant', desc: 'Merchant name or business legal name', req: true },
              { col: 'category', desc: 'Shopping, Food, Travel, Crypto...', req: true },
              { col: 'location', desc: 'City of origination (e.g. Mumbai)', req: false },
              { col: 'payment_method', desc: 'credit_card, upi, wire_transfer...', req: false },
              { col: 'device_id', desc: 'Hardware footprint or client ID', req: false },
            ].map(col => (
              <div key={col.col} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <code className="text-[11px] font-bold text-zinc-900 dark:text-zinc-200">{col.col}</code>
                  {col.req ? (
                    <span className="text-[10px] text-rose-500 font-bold uppercase">Required</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Optional</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{col.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
