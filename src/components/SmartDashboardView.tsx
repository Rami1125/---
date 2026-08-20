import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  Layers,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  Warehouse,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  Zap,
  Info,
  Clock,
  Plus
} from 'lucide-react';
import { TopProduct, StagePrediction, ProcurementRecommendation } from '../types';

interface SmartDashboardViewProps {
  topProducts: TopProduct[];
  predictions: StagePrediction[];
  recommendations: ProcurementRecommendation[];
  isAuthenticated: boolean;
  onSyncDashboardToSheet: () => void;
  isSyncing: boolean;
}

export const SmartDashboardView: React.FC<SmartDashboardViewProps> = ({
  topProducts,
  predictions,
  recommendations,
  isAuthenticated,
  onSyncDashboardToSheet,
  isSyncing
}) => {
  const [activeSubSection, setActiveSubSection] = useState<'all' | 'products' | 'predictions' | 'procurement'>('all');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-400/30">
                AI Forecasting & Intelligence
              </span>
              <span className="text-xs text-slate-300">
                ח. סבן חומרי בניין
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              דשבורד ניהול חכם, חיזוי שלבי בנייה והמלצות רכש
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              מנוע חיזוי AI לזיהוי מעבר פרויקטים בין שלבי בנייה (שלד ➔ טיח ➔ ריצוף), ניטור 10 מוצרי הדגל בנטרול פריטי חנות קטנים, ואופטימיזציית מלאי למחסני החרש והתלמיד.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={onSyncDashboardToSheet}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'מעדכן ב-Sheets...' : 'סנכרן טאב דשבורד_חכם'}</span>
              </button>
            ) : (
              <div className="text-xs text-emerald-300 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>התחבר לחשבון Google כדי לסנכרן עם ה-Sheet</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-300 block text-[11px]">מוצרי דגל בניטור</span>
            <span className="text-xl font-black text-white font-mono mt-0.5 block">
              {topProducts.length} מוצרים
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-300 block text-[11px]">פרויקטים בתחזית AI</span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
              {predictions.length} אתרים
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-300 block text-[11px]">המלצות רכש שבועיות</span>
            <span className="text-xl font-black text-amber-300 font-mono mt-0.5 block">
              {recommendations.length} פריטים
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-300 block text-[11px]">דחיפות עליונה במלאי</span>
            <span className="text-xl font-black text-rose-400 font-mono mt-0.5 block">
              1 (בטון מהיר)
            </span>
          </div>
        </div>
      </div>

      {/* Part 1: Top 10 Flagship Products */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                10 מוצרי הדגל המובילים (בניטרול מוצרי חנות קטנים וברגים)
              </h3>
              <p className="text-xs text-slate-500">
                חומרי יסוד, מלט, טיט בלות, גבס, פקדונות ושירותי הובלת מנוף
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3">מק"ט</th>
                <th className="py-3 px-3">שם מוצר / חומר</th>
                <th className="py-3 px-3">קטגוריה</th>
                <th className="py-3 px-3">סה"כ כמות נמכרת</th>
                <th className="py-3 px-3">מלאי נוכחי במחסנים</th>
                <th className="py-3 px-3">סטטוס מלאי וביקוש</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {topProducts.map((p) => {
                let badgeStyle = 'bg-slate-100 text-slate-700';
                if (p.stockStatus.includes('תקין')) badgeStyle = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
                else if (p.stockStatus.includes('ביקוש')) badgeStyle = 'bg-blue-50 text-blue-800 border border-blue-200';
                else if (p.stockStatus.includes('רענון')) badgeStyle = 'bg-amber-50 text-amber-800 border border-amber-200';
                else if (p.stockStatus.includes('להזמין')) badgeStyle = 'bg-rose-50 text-rose-800 border border-rose-200 font-bold';

                return (
                  <tr key={p.sku} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{p.sku}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-3 text-slate-500">{p.category}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{p.totalSold}</td>
                    <td className="py-3 px-3 text-slate-700">{p.currentStock}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] ${badgeStyle}`}>
                        {p.stockStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part 2: AI Construction Stage Predictor */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              מנוע חיזוי AI — מעקב שלבי בנייה וצפי חומרים ללקוח
            </h3>
            <p className="text-xs text-slate-500">
              מודל למידה המנתח אספקות עבר (שלד ➔ טיח ➔ גמר) וחוזה את דרישות ההזמנה הבאות
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictions.map((pred, i) => (
            <div
              key={i}
              className="bg-purple-50/30 border border-purple-200/70 rounded-2xl p-4.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-black text-slate-900 text-sm">
                    {pred.customerName}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                    {pred.currentStage}
                  </span>
                </div>

                <div className="space-y-2 text-xs my-3">
                  <div className="bg-white rounded-xl p-2.5 border border-purple-100">
                    <span className="text-slate-400 block text-[10px]">חומרים שסופקו בשלב קודם:</span>
                    <span className="text-slate-700 font-medium">{pred.suppliedMaterials}</span>
                  </div>

                  <div className="bg-purple-100/50 rounded-xl p-2.5 border border-purple-200 text-purple-950">
                    <span className="text-purple-800 font-bold block text-[10px]">🔮 צפי חומרים לשלב הבא:</span>
                    <span className="font-semibold">{pred.expectedMaterials}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-purple-100 text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-600" />
                    <span>מועד משוער:</span>
                  </span>
                  <span className="font-bold text-slate-800">{pred.expectedDate}</span>
                </div>
                <div className="text-purple-900 font-bold text-[11px] bg-white p-2 rounded-lg border border-purple-200">
                  💡 המלצה: {pred.managerRecommendation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part 3: Weekly Procurement Strategic Recommendations */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              המלצות רכש ומלאי אסטרטגיות לשבוע הקרוב (AI Recommendations)
            </h3>
            <p className="text-xs text-slate-500">
              הנחיות פעולה ישירות להזמנת ספקים ורענון מלאי במחסן 4 (החרש) ומחסן 1 (התלמיד)
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec, i) => {
            let priorityBadge = 'bg-rose-50 text-rose-800 border-rose-200';
            if (rec.priority.includes('בינונית')) priorityBadge = 'bg-amber-50 text-amber-800 border-amber-200';
            else if (rec.priority.includes('יציב')) priorityBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';

            return (
              <div
                key={i}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3">
                  <span className={`px-3 py-1 rounded-full font-black border text-xs whitespace-nowrap ${priorityBadge}`}>
                    {rec.priority}
                  </span>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">
                      {rec.materialName}
                    </h4>
                    <p className="text-slate-600 mt-0.5">
                      פעולה נדרשת במחסן: <strong className="text-slate-900">{rec.warehouseAction}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shrink-0 text-slate-700 font-medium">
                  <div>
                    <span className="text-[10px] text-slate-400 block">מלאי נוכחי:</span>
                    <span className="font-bold text-slate-800">{rec.currentStock}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">צפי ביקוש שבועי:</span>
                    <span className="font-bold text-emerald-700">{rec.weeklyDemand}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
