import React, { useState } from 'react';
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search,
  Sparkles,
  ChevronDown,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, DeliveryNote, CrossAuditRecord, SystemConfig } from '../types';

interface CrossAuditViewProps {
  orders: Order[];
  deliveryNotes: DeliveryNote[];
  auditRecords: CrossAuditRecord[];
  config: SystemConfig;
  isAuthenticated: boolean;
  onReconcileOrderWithNote: (order: Order, note: DeliveryNote) => void;
  onSyncAuditToSheet: (note: DeliveryNote) => void;
}

export const CrossAuditView: React.FC<CrossAuditViewProps> = ({
  orders,
  deliveryNotes,
  auditRecords,
  config,
  isAuthenticated,
  onReconcileOrderWithNote,
  onSyncAuditToSheet
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrderToPair, setSelectedOrderToPair] = useState<string | null>(null);

  const handleRunReconcile = (order: Order, note: DeliveryNote) => {
    onReconcileOrderWithNote(order, note);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const filteredAudit = auditRecords.filter((rec) => {
    const matchesSearch =
      rec.orderNumber.includes(searchTerm) ||
      rec.docNumber.includes(searchTerm) ||
      rec.customerInfo.includes(searchTerm);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'VERIFIED' && rec.auditStatus.includes('מאומתת')) ||
      (statusFilter === 'PENDING' && rec.auditStatus.includes('ממתין'));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-emerald-600" />
              <span>הצלבה ובקרה (Cross-Audit Engine)</span>
              <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded-full border border-emerald-200">
                סגירת מעגל הזמנה מול תעודת משלוח
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              השוואת פריטי הזמנה מקומקס מול תעודות חתומות בשטח, חישוב פקדונות בלות ומשטחים חוזרים, ועדכון אוטומטי בגיליון
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="חיפוש לפי מספר הזמנה, מספר תעודה או שם לקוח..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-right"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium text-right"
            >
              <option value="ALL">כל סטטוסי ההצלבה</option>
              <option value="VERIFIED">✅ אספקה מאומתת מלאה</option>
              <option value="PENDING">⏳ ממתין להצלבה</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cross Audit Cards Table */}
      <div className="space-y-4">
        {filteredAudit.map((record, index) => {
          const isVerified = record.auditStatus.includes('מאומתת');
          const matchingOrder = orders.find((o) => o.orderNumber === record.orderNumber);
          const matchingNote = deliveryNotes.find((n) => n.orderNumber === record.orderNumber);

          return (
            <div
              key={`${record.orderNumber}-${index}`}
              className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
                isVerified
                  ? 'border-emerald-200 hover:border-emerald-300'
                  : 'border-amber-200 hover:border-amber-300 bg-amber-50/20'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isVerified ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 text-base">
                        הזמנה #{record.orderNumber}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
                      <span className="font-mono font-bold text-slate-700 text-sm">
                        {record.docNumber}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {record.customerInfo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-black ${
                      isVerified
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-50 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {record.auditStatus}
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-full font-mono">
                    {record.matchScore}
                  </span>
                </div>
              </div>

              {/* Comparison Section (Ordered vs Delivered) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                {/* Ordered Column */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                  <span className="text-xs font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>מה הוזמן בקומקס:</span>
                  </span>
                  <p className="text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed">
                    {record.orderedItemsSummary}
                  </p>
                </div>

                {/* Delivered Column */}
                <div
                  className={`rounded-xl p-3.5 border ${
                    isVerified
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-500 italic'
                  }`}
                >
                  <span className="text-xs font-bold block mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className={`w-3.5 h-3.5 ${isVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>מה סופק בפועל (סריקת ת.מ):</span>
                  </span>
                  <p className="text-xs font-mono whitespace-pre-line leading-relaxed">
                    {record.deliveredItemsSummary}
                  </p>
                </div>
              </div>

              {/* Deposits & Audit Notes */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">אימות פקדונות והחזרות:</span>
                  <span className="text-slate-800 font-semibold">{record.depositsSummary}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">הערות בקרה, פריקה וחתימה:</span>
                  <span className="text-slate-800 font-semibold">{record.auditNotes}</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <a
                  href={record.folderUrl || `https://drive.google.com/drive/folders/${config.deliveryDocsFolderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>תיק לקוח בדרייב</span>
                </a>

                <div className="flex items-center gap-2">
                  {!isVerified && matchingOrder && matchingNote && (
                    <button
                      onClick={() => handleRunReconcile(matchingOrder, matchingNote)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-emerald-200 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>בצע הצלבה וסגור מעגל</span>
                    </button>
                  )}

                  {isAuthenticated && matchingNote && (
                    <button
                      onClick={() => onSyncAuditToSheet(matchingNote)}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
                      title="עדכן שורת הצלבה ב-Google Sheets"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>עדכן ב-Sheets</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
