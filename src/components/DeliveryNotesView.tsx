import React, { useState } from 'react';
import {
  FileCheck2,
  ScanLine,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  Building,
  Truck,
  ExternalLink,
  Search,
  Sparkles,
  Layers,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { DeliveryNote, SystemConfig } from '../types';

interface DeliveryNotesViewProps {
  deliveryNotes: DeliveryNote[];
  config: SystemConfig;
  isAuthenticated: boolean;
  onProcessGalyaBatch: () => void;
  onUploadCustomNote: (note: DeliveryNote) => void;
  onSyncNoteToSheet: (note: DeliveryNote) => void;
  onNavigateToAudit: (orderNumber: string) => void;
}

export const DeliveryNotesView: React.FC<DeliveryNotesViewProps> = ({
  deliveryNotes,
  config,
  isAuthenticated,
  onProcessGalyaBatch,
  onUploadCustomNote,
  onSyncNoteToSheet,
  onNavigateToAudit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [selectedNote, setSelectedNote] = useState<DeliveryNote | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const [manualNote, setManualNote] = useState<Partial<DeliveryNote>>({
    docNumber: '6714612',
    orderNumber: '6214928',
    customerNumber: '605070',
    customerName: 'השוקדים-כללי',
    warehouse: '1 (התלמיד)',
    address: 'עלי זהב, הכוונה טלפונית מספר: 1',
    driver: 'חכמת/עלי',
    truck: 'משאית מנוף 615-41-002',
    deliveredItems: '1. 📦 מק"ט: 111260 | לוח גבס לבן 260 12.50 | כמות: 45\n2. 📦 מק"ט: 818098 | הובלה ללא פריקה שומרון | כמות: 1',
    bagsDelivered: '0 בלות',
    palletsDelivered: '2 משטחים',
    returnedItems: 'הוחזרו 2 משטחים ריקים',
    auditStatus: '✅ אספקה מאומתת מלאה',
    auditNotes: 'נמסר למפקח אבי, נחתם במלואו ללא חריגות.',
    siteManagerSignature: 'אבי מפקח אתר (חתום)',
    docUrl: 'https://drive.google.com/drive/folders/1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY'
  });

  const handleRunBatchScan = async () => {
    setIsProcessingBatch(true);
    await new Promise((res) => setTimeout(res, 900));
    onProcessGalyaBatch();
    setIsProcessingBatch(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNote.docNumber || !manualNote.orderNumber) return;

    const fullNote: DeliveryNote = {
      id: `dn-${Date.now()}`,
      docDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      docNumber: manualNote.docNumber || '6700000',
      orderNumber: manualNote.orderNumber || '6200000',
      customerNumber: manualNote.customerNumber || '600000',
      customerName: manualNote.customerName || 'לקוח',
      warehouse: manualNote.warehouse || '4 (החרש)',
      address: manualNote.address || '',
      driver: manualNote.driver || config.defaultDriver,
      truck: manualNote.truck || config.defaultTruck,
      deliveredItems: manualNote.deliveredItems || '',
      bagsDelivered: manualNote.bagsDelivered || '0 בלות',
      palletsDelivered: manualNote.palletsDelivered || '0 משטחים',
      returnedItems: manualNote.returnedItems || 'ללא החזרות',
      auditStatus: '✅ אספקה מאומתת מלאה',
      auditNotes: manualNote.auditNotes || 'פריקה מאומתת',
      siteManagerSignature: manualNote.siteManagerSignature || 'חתום',
      docUrl: manualNote.docUrl || `https://drive.google.com/drive/folders/${config.deliveryDocsFolderId}`,
      scanBatchName: 'קובץ_ידני.pdf'
    };

    onUploadCustomNote(fullNote);
    setIsManualModalOpen(false);
  };

  const filteredNotes = deliveryNotes.filter((n) => {
    return (
      n.docNumber.includes(searchTerm) ||
      n.orderNumber.includes(searchTerm) ||
      n.customerName.includes(searchTerm) ||
      n.driver.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Action Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-blue-600" />
              <span>סריקת תעודות משלוח, OCR ופענוח נתונים</span>
              <span className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-800 font-bold rounded-full border border-blue-200">
                {deliveryNotes.length} תעודות במאגר
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              פענוח סריקות PDF יומיות מהחרש / גליה (galya@saban94.co.il), חילוץ חתימות, פריטים ופקדונות, ושמירה בתיקי לקוחות בדרייב
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRunBatchScan}
              disabled={isProcessingBatch}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs shadow-blue-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isProcessingBatch ? 'animate-spin' : ''}`} />
              <span>{isProcessingBatch ? 'סורק ומפענח...' : 'סרוק קובץ גליה מהחרש'}</span>
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>העלאת תעודה ידנית</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-7" />
          <input
            type="text"
            placeholder="חיפוש לפי מספר תעודת משלוח, מספר הזמנה, שם לקוח, או שם נהג..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-right"
          />
        </div>
      </div>

      {/* Grid of Delivery Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 font-mono">
                      ת.מ #{note.docNumber}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {note.auditStatus}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium font-mono">
                      {note.docDate}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {note.customerName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    הזמנה מקושרת: <strong className="text-slate-800 font-mono">#{note.orderNumber}</strong> | לקוח: <strong className="text-slate-800 font-mono">{note.customerNumber}</strong>
                  </p>
                </div>

                <div className="text-left">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 block">
                    {note.warehouse}
                  </span>
                </div>
              </div>

              {/* Driver & Unloading metadata */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">נהג ומשאית:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Truck className="w-3 h-3 text-blue-600" />
                    {note.driver} ({note.truck})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">חתימת אתר וזמן פריקה:</span>
                  <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    {note.siteManagerSignature || 'חתום'} ({note.unloadingDurationMinutes || 10} דק')
                  </span>
                </div>
              </div>

              {/* Items delivered */}
              <div className="mb-3">
                <h4 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>פריטים שחולצו בסריקת ה-OCR:</span>
                </h4>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">
                  {note.deliveredItems}
                </div>
              </div>

              {/* Deposits & Returns */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
                <div className="bg-slate-100/80 rounded-xl p-2 text-slate-800">
                  <span className="font-bold block text-slate-600">📦 סופק לאתר:</span>
                  <span>{note.bagsDelivered} | {note.palletsDelivered}</span>
                </div>
                <div className="bg-emerald-50 rounded-xl p-2 text-emerald-900 border border-emerald-200/60">
                  <span className="font-bold block text-emerald-800">🔄 זיכוי / החזרות:</span>
                  <span>{note.returnedItems}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <a
                  href={note.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>צפה בסריקה בדרייב</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {isAuthenticated && (
                  <button
                    onClick={() => onSyncNoteToSheet(note)}
                    className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                    title="הזרק שורה לטאב תעודות_משלוח ב-Google Sheets"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                onClick={() => onNavigateToAudit(note.orderNumber)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                <span>הצלב מול הזמנה #{note.orderNumber}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Note Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <span>הזנת תעודת משלוח / פענוח OCR ידני</span>
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">מספר תעודת משלוח:</label>
                  <input
                    type="text"
                    required
                    value={manualNote.docNumber}
                    onChange={(e) => setManualNote({ ...manualNote, docNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">מספר הזמנה מקושרת:</label>
                  <input
                    type="text"
                    required
                    value={manualNote.orderNumber}
                    onChange={(e) => setManualNote({ ...manualNote, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">שם לקוח:</label>
                  <input
                    type="text"
                    required
                    value={manualNote.customerName}
                    onChange={(e) => setManualNote({ ...manualNote, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">מספר לקוח:</label>
                  <input
                    type="text"
                    value={manualNote.customerNumber}
                    onChange={(e) => setManualNote({ ...manualNote, customerNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">פריטים שסופקו בפועל:</label>
                <textarea
                  rows={3}
                  required
                  value={manualNote.deliveredItems}
                  onChange={(e) => setManualNote({ ...manualNote, deliveredItems: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">בלות שסופקו:</label>
                  <input
                    type="text"
                    value={manualNote.bagsDelivered}
                    onChange={(e) => setManualNote({ ...manualNote, bagsDelivered: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">משטחים שסופקו:</label>
                  <input
                    type="text"
                    value={manualNote.palletsDelivered}
                    onChange={(e) => setManualNote({ ...manualNote, palletsDelivered: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">החזרות / זיכוי משטחים ריקים:</label>
                <input
                  type="text"
                  value={manualNote.returnedItems}
                  onChange={(e) => setManualNote({ ...manualNote, returnedItems: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">הערות פריקה וחתימת מנהל אתר:</label>
                <input
                  type="text"
                  value={manualNote.auditNotes}
                  onChange={(e) => setManualNote({ ...manualNote, auditNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  שמור תעודה והעבר להצלבה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
