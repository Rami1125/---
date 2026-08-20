import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { LogisticsDictionaryItem, SystemConfig } from '../types';
import { GoogleSheetsService } from '../lib/googleSheets';

interface LogisticsDictionaryViewProps {
  dictionary: LogisticsDictionaryItem[];
  config: SystemConfig;
  isAuthenticated: boolean;
  onAddItem: (item: LogisticsDictionaryItem) => void;
  onRefreshFromSheet: () => void;
  isSyncing: boolean;
}

export const LogisticsDictionaryView: React.FC<LogisticsDictionaryViewProps> = ({
  dictionary,
  config,
  isAuthenticated,
  onAddItem,
  onRefreshFromSheet,
  isSyncing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newItem, setNewItem] = useState<Partial<LogisticsDictionaryItem>>({
    sku: '',
    productName: '',
    quantityHint: '1',
    requiresBlowDeposit: 'לא',
    requiresPalletDeposit: 'כן',
    requiresDrumDeposit: 'לא',
    requiresBlockPalletDeposit: 'לא',
    noaConclusions: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.sku || !newItem.productName) return;

    const fullItem: LogisticsDictionaryItem = {
      sku: newItem.sku,
      productName: newItem.productName,
      quantityHint: newItem.quantityHint || '1',
      requiresBlowDeposit: newItem.requiresBlowDeposit || 'לא',
      requiresPalletDeposit: newItem.requiresPalletDeposit || 'לא',
      requiresDrumDeposit: newItem.requiresDrumDeposit || 'לא',
      requiresBlockPalletDeposit: newItem.requiresBlockPalletDeposit || 'לא',
      noaConclusions: newItem.noaConclusions || 'חומר דורש מעקב פקדון בהתאם לכמויות'
    };

    onAddItem(fullItem);

    if (isAuthenticated) {
      try {
        await GoogleSheetsService.appendRow(config.spreadsheetId, 'מילון_לוגסטי', [
          fullItem.sku,
          fullItem.productName,
          fullItem.quantityHint,
          fullItem.requiresBlowDeposit,
          fullItem.requiresPalletDeposit,
          fullItem.requiresDrumDeposit,
          fullItem.requiresBlockPalletDeposit,
          fullItem.noaConclusions
        ]);
      } catch (err) {
        console.warn('Append to sheet warning:', err);
      }
    }

    setIsAddModalOpen(false);
    setNewItem({
      sku: '',
      productName: '',
      quantityHint: '1',
      requiresBlowDeposit: 'לא',
      requiresPalletDeposit: 'כן',
      requiresDrumDeposit: 'לא',
      requiresBlockPalletDeposit: 'לא',
      noaConclusions: ''
    });
  };

  const filteredItems = dictionary.filter((item) => {
    return (
      item.sku.includes(searchTerm) ||
      item.productName.includes(searchTerm) ||
      item.noaConclusions.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                טאב: מילון_לוגסטי (טבלה1)
              </span>
              <span className="text-xs text-slate-400">גיליון: {config.spreadsheetId}</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>מילון לוגיסטי וחוקי פקדונות (בלות, משטחים, חביות)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              הגדרות מק"טים, חוקי חיוב פקדונות אוטומטיים ומסקנות חישוב נועה לבקרת אספקה במחסני ח. סבן
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={onRefreshFromSheet}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                title="רענן מגיליון Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>רענן מ-Sheets</span>
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>הוספת מק"ט למילון</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="חיפוש לפי מק״ט, שם מוצר או מסקנות חישוב..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all"
            />
          </div>
          <div className="text-xs text-slate-500 font-bold whitespace-nowrap">
            {filteredItems.length} פריטים במילון
          </div>
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">אין נתונים בטאב "מילון_לוגסטי"</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            הנתונים נמשכים באופן חי מגיליון Google Sheets. לחץ על "רענן מ-Sheets" או הוסף פריט חדש למילון.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {isAuthenticated && (
              <button
                onClick={onRefreshFromSheet}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl"
              >
                סנכרן מ-Google Sheets
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
            >
              + הוסף מק"ט ראשון
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">מק"ט</th>
                  <th className="py-3 px-4">שם מוצר</th>
                  <th className="py-3 px-4">כמות יסוד</th>
                  <th className="py-3 px-4 text-center">פקדון בלה?</th>
                  <th className="py-3 px-4 text-center">פקדון משטח?</th>
                  <th className="py-3 px-4 text-center">פקדון חבית?</th>
                  <th className="py-3 px-4 text-center">משטח בלוק?</th>
                  <th className="py-3 px-4">מסקנות וחישוב נועה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{item.sku}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.productName}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{item.quantityHint}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          item.requiresBlowDeposit.includes('כן') || item.requiresBlowDeposit === 'true'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.requiresBlowDeposit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          item.requiresPalletDeposit.includes('כן') || item.requiresPalletDeposit === 'true'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.requiresPalletDeposit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          item.requiresDrumDeposit.includes('כן') || item.requiresDrumDeposit === 'true'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.requiresDrumDeposit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          item.requiresBlockPalletDeposit.includes('כן') || item.requiresBlockPalletDeposit === 'true'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.requiresBlockPalletDeposit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 leading-relaxed max-w-xs">{item.noaConclusions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              <span>הוספת פריט חדש לטאב מילון_לוגסטי</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">מק"ט מוצר</label>
                  <input
                    type="text"
                    required
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    placeholder="לדוגמה: 11551"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">כמות יסוד</label>
                  <input
                    type="text"
                    value={newItem.quantityHint}
                    onChange={(e) => setNewItem({ ...newItem, quantityHint: e.target.value })}
                    placeholder="1"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">שם מוצר / חומר</label>
                <input
                  type="text"
                  required
                  value={newItem.productName}
                  onChange={(e) => setNewItem({ ...newItem, productName: e.target.value })}
                  placeholder="לדוגמה: טיט שק גדול (בלה)"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">פקדון בלה</label>
                  <select
                    value={newItem.requiresBlowDeposit}
                    onChange={(e) => setNewItem({ ...newItem, requiresBlowDeposit: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded-lg"
                  >
                    <option value="לא">לא</option>
                    <option value="כן">כן</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">פקדון משטח</label>
                  <select
                    value={newItem.requiresPalletDeposit}
                    onChange={(e) => setNewItem({ ...newItem, requiresPalletDeposit: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded-lg"
                  >
                    <option value="לא">לא</option>
                    <option value="כן">כן</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">פקדון חבית</label>
                  <select
                    value={newItem.requiresDrumDeposit}
                    onChange={(e) => setNewItem({ ...newItem, requiresDrumDeposit: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded-lg"
                  >
                    <option value="לא">לא</option>
                    <option value="כן">כן</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">משטח בלוק</label>
                  <select
                    value={newItem.requiresBlockPalletDeposit}
                    onChange={(e) => setNewItem({ ...newItem, requiresBlockPalletDeposit: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded-lg"
                  >
                    <option value="לא">לא</option>
                    <option value="כן">כן</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">מסקנות וחישוב נועה</label>
                <textarea
                  rows={2}
                  value={newItem.noaConclusions}
                  onChange={(e) => setNewItem({ ...newItem, noaConclusions: e.target.value })}
                  placeholder="הערות אוטומטיות לחישוב פקדון במעמד פריקה..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  שמור במילון
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
