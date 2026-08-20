import React, { useState } from 'react';
import {
  Settings,
  FileSpreadsheet,
  FolderSync,
  Phone,
  Truck,
  MapPin,
  Webhook,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { SystemConfig } from '../types';
import { DEFAULT_CONFIG } from '../lib/initialData';

interface SettingsViewProps {
  config: SystemConfig;
  isAuthenticated: boolean;
  onSaveConfig: (newConfig: SystemConfig) => void;
  onInitializeSheets: () => void;
  isInitializing: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  isAuthenticated,
  onSaveConfig,
  onInitializeSheets,
  isInitializing
}) => {
  const [formData, setFormData] = useState<SystemConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    setFormData(DEFAULT_CONFIG);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-700" />
              <span>הגדרות מערכת ואינטגרציות</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              הגדרת קובצי Google Sheets, תיקיות Drive, שרתי Make.com ופרטי צי משאיות של ח. סבן
            </p>
          </div>

          {savedSuccess && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ההגדרות נשמרו בהצלחה!
            </span>
          )}
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Google Workspace Settings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>אינטגרציית Google Sheets & Drive</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              מזהה גיליון Google Spreadsheet ID:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={formData.spreadsheetId}
                onChange={(e) => setFormData({ ...formData, spreadsheetId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 text-left"
              />
              <a
                href={`https://docs.google.com/spreadsheets/d/${formData.spreadsheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 shrink-0"
              >
                <span>פתח</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              גיליון היעד המכיל את הטאבים: הזמנות, תעודות_משלוח, הצלבה_ובקרה, תיקי_לקוחות, ערים, דשבורד_חכם
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              מזהה תיקיית אב ראשית ב-Google Drive (תעודות משלוח):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={formData.deliveryDocsFolderId}
                onChange={(e) => setFormData({ ...formData, deliveryDocsFolderId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 text-left"
              />
              <a
                href={`https://drive.google.com/drive/folders/${formData.deliveryDocsFolderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 shrink-0"
              >
                <span>פתח</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              בתיקייה זו נוצרות באופן אוטומטי תיקיות הלקוחות עם תת-תיקיות "1. הזמנות" ו-"2. תעודות משלוח"
            </p>
          </div>

          {isAuthenticated && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onInitializeSheets}
                disabled={isInitializing}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isInitializing ? 'animate-spin' : ''}`} />
                <span>{isInitializing ? 'יוצר ומאתחל טאבים...' : 'אתחל ועצב טאבים חסרים בגיליון Google Sheets'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Fleet & Dispatch Settings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>הגדרות סידור עבודה, צי משאיות ובסיס</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                טלפון סדרן ראשי (להודעות WhatsApp):
              </label>
              <input
                type="text"
                required
                value={formData.dispatchPhone}
                onChange={(e) => setFormData({ ...formData, dispatchPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                בסיס יציאה ראשי:
              </label>
              <input
                type="text"
                required
                value={formData.baseLocation}
                onChange={(e) => setFormData({ ...formData, baseLocation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                נהג ברירת מחדל:
              </label>
              <input
                type="text"
                required
                value={formData.defaultDriver}
                onChange={(e) => setFormData({ ...formData, defaultDriver: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                משאית ברירת מחדל:
              </label>
              <input
                type="text"
                required
                value={formData.defaultTruck}
                onChange={(e) => setFormData({ ...formData, defaultTruck: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Make.com Webhooks */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Webhook className="w-4 h-4 text-purple-600" />
            <span>כתובות Webhook לשיגור WhatsApp דרך Make.com</span>
          </h3>

          <div className="space-y-3">
            {formData.makeWebhookEndpoints.map((ep, idx) => (
              <div key={idx}>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Endpoint #{idx + 1}:
                </label>
                <input
                  type="text"
                  value={ep}
                  onChange={(e) => {
                    const newEndpoints = [...formData.makeWebhookEndpoints];
                    newEndpoints[idx] = e.target.value;
                    setFormData({ ...formData, makeWebhookEndpoints: newEndpoints });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 text-left"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>שחזר הגדרות יצרן</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>שמור שינויים</span>
          </button>
        </div>
      </form>
    </div>
  );
};
