import React, { useState, useMemo } from 'react';
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
  Plus,
  ShoppingCart,
  HardHat,
  Search,
  Filter,
  DollarSign,
  Truck,
  Box,
  ChevronRight,
  BarChart3,
  Flame,
  ArrowUpRight,
  RefreshCw,
  PhoneCall,
  Check,
  Building2,
  PackageCheck
} from 'lucide-react';
import { TopProduct, StagePrediction, ProcurementRecommendation, Order, CustomerRecord } from '../types';
import { SmartAnalyticsEngine, CustomerStageTrajectory, SmartProcurementPlan, WarehouseAnalytics } from '../lib/smartAnalyticsEngine';

interface SmartDashboardViewProps {
  topProducts: TopProduct[];
  predictions: StagePrediction[];
  recommendations: ProcurementRecommendation[];
  orders?: Order[];
  customers?: CustomerRecord[];
  isAuthenticated: boolean;
  onSyncDashboardToSheet: () => void;
  isSyncing: boolean;
}

export const SmartDashboardView: React.FC<SmartDashboardViewProps> = ({
  topProducts,
  predictions,
  recommendations,
  orders = [],
  customers = [],
  isAuthenticated,
  onSyncDashboardToSheet,
  isSyncing
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trajectories' | 'procurement' | 'flagships' | 'warehouses'>('overview');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [procurementPriorityFilter, setProcurementPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedActionId, setCopiedActionId] = useState<string | null>(null);

  // Derive dynamic AI Analytics from live operational data
  const customerTrajectories: CustomerStageTrajectory[] = useMemo(() => {
    return SmartAnalyticsEngine.analyzeCustomerTrajectories(orders, customers);
  }, [orders, customers]);

  const procurementPlans: SmartProcurementPlan[] = useMemo(() => {
    return SmartAnalyticsEngine.generateProcurementPlans(orders, topProducts, recommendations);
  }, [orders, topProducts, recommendations]);

  const warehouseAnalytics: WarehouseAnalytics[] = useMemo(() => {
    return SmartAnalyticsEngine.calculateWarehouseAnalytics(orders);
  }, [orders]);

  // Filtered customer trajectories
  const filteredTrajectories = useMemo(() => {
    return customerTrajectories.filter(t => {
      const matchStage = stageFilter === 'ALL' || t.detectedStage === stageFilter;
      const matchSearch = !searchQuery || 
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerNumber.includes(searchQuery) ||
        t.siteAddress.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStage && matchSearch;
    });
  }, [customerTrajectories, stageFilter, searchQuery]);

  // Filtered procurement plans
  const filteredProcurement = useMemo(() => {
    return procurementPlans.filter(p => {
      const matchPriority = procurementPriorityFilter === 'ALL' || p.priorityLevel.includes(procurementPriorityFilter);
      const matchSearch = !searchQuery ||
        p.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPriority && matchSearch;
    });
  }, [procurementPlans, procurementPriorityFilter, searchQuery]);

  // Summary Metrics
  const totalEstimatedProcurementCost = procurementPlans.reduce((sum, p) => sum + p.costEstimateNis, 0);
  const criticalProcurementCount = procurementPlans.filter(p => p.priorityLevel.includes('קריטי')).length;
  const highConfidenceTrajectories = customerTrajectories.filter(t => t.confidenceScore >= 80).length;

  const handleCopyActionText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedActionId(id);
    setTimeout(() => setCopiedActionId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with AI Intelligence Branding */}
      <div className="bg-gradient-to-l from-emerald-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-emerald-900/40 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute -left-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-400/30 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>מנוע חיזוי AI ואופטימיזציית רכש</span>
              </span>
              <span className="text-xs font-bold text-slate-300 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                ח. סבן חומרי בניין בע"מ
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-800">
                Live Intelligence v3.0
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              דשבורד ניהול חכם, חיזוי שלבי בנייה והמלצות רכש אסטרטגיות
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              מנוע למידה ממוחשב המנתח תנועות חומרים, חוזה מעבר פרויקטים בין שלבים (שלד ➔ בלוקים ➔ טיח ➔ ריצוף/גבס ➔ גמר), ומחשב המלצות רכש מבוססות רמת בטיחות מלאי למחסני החרש והתלמיד.
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <button
                id="btn-sync-smart-dashboard-sheet"
                type="button"
                onClick={onSyncDashboardToSheet}
                disabled={isSyncing}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <FileSpreadsheet className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'מעדכן ב-Sheets...' : 'סנכרן טאב דשבורד_חכם'}</span>
              </button>
            ) : (
              <div className="text-xs text-emerald-300 bg-emerald-950/60 px-4 py-2 rounded-2xl border border-emerald-700/50 flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                <span>התחבר עם Google Workspace לסנכרון</span>
              </div>
            )}
          </div>
        </div>

        {/* High-Level AI KPI Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10 hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>פרויקטים בתחזית שלב</span>
              <HardHat className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {customerTrajectories.length} <span className="text-xs font-normal text-purple-300">אתרים</span>
            </div>
            <span className="text-[10px] text-purple-300/80 mt-0.5 block">
              {highConfidenceTrajectories} בדיוק חיזוי מעל 80%
            </span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10 hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>דחיפות רכש קריטית</span>
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
              {criticalProcurementCount} <span className="text-xs font-normal text-slate-300">פריטים</span>
            </div>
            <span className="text-[10px] text-rose-300/80 mt-0.5 block">
              מתחת לרף מלאי בטיחות
            </span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10 hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>אומדן עלות רכש שבועי</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              ₪{totalEstimatedProcurementCost.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-300/80 mt-0.5 block">
              הזמנות ספקים מומלצות
            </span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10 hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>מוצרי דגל במעקב</span>
              <Layers className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
              {topProducts.length || 10} <span className="text-xs font-normal text-slate-300">מוצרים</span>
            </div>
            <span className="text-[10px] text-blue-300/80 mt-0.5 block">
              ללא פריטי חנות קטנים
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>תמונת מצב חכמה מרוכזת</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trajectories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'trajectories'
                ? 'bg-purple-900 text-purple-100 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HardHat className="w-3.5 h-3.5 text-purple-400" />
            <span>חיזוי שלבי בנייה וצפי לקוחות</span>
            <span className="bg-purple-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {customerTrajectories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('procurement')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'procurement'
                ? 'bg-amber-900 text-amber-100 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
            <span>המלצות רכש ותכנון ספקים</span>
            <span className="bg-amber-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {procurementPlans.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flagships')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'flagships'
                ? 'bg-blue-900 text-blue-100 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>10 מוצרי הדגל המובילים</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('warehouses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'warehouses'
                ? 'bg-teal-900 text-teal-100 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5 text-teal-400" />
            <span>עומס ואיזון מחסנים (החרש/התלמיד)</span>
          </button>
        </div>

        {/* Global Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש חומר, פרויקט, מקט..."
            className="w-full bg-slate-50 text-slate-900 text-xs pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* VIEW 1: OVERVIEW (Comprehensive Mixed View) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Construction Stage Pipeline Summary Bar */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-700">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    תמונת מצב פרויקטים לפי שלבי בנייה (Construction Stage Pipeline)
                  </h3>
                  <p className="text-xs text-slate-500">
                    פילוח לקוחות ואתרי בנייה לפי השלב ההנדסי הנוכחי לחיזוי גלי הזמנות הבאים
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('trajectories')}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
              >
                <span>צפה בכל הפרויקטים</span>
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            {/* Visual Stage Funnel / Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { stage: 'יסודות ושלד', icon: '🏗️', count: customerTrajectories.filter(t => t.detectedStage === 'יסודות ושלד').length, next: 'צפי: בלוקים ואיטום', color: 'border-blue-200 bg-blue-50/50 text-blue-900' },
                { stage: 'איטום ובלוקים', icon: '🧱', count: customerTrajectories.filter(t => t.detectedStage === 'איטום ובלוקים').length, next: 'צפי: טיח ופנים', color: 'border-amber-200 bg-amber-50/50 text-amber-900' },
                { stage: 'טיח ופנים', icon: '📐', count: customerTrajectories.filter(t => t.detectedStage === 'טיח ופנים').length, next: 'צפי: לוחות גבס ודבקים', color: 'border-purple-200 bg-purple-50/50 text-purple-900' },
                { stage: 'ריצוף ותקרות גבס', icon: '✨', count: customerTrajectories.filter(t => t.detectedStage === 'ריצוף ותקרות גבס').length, next: 'צפי: שפכטל וצבע', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900' },
                { stage: 'גמר וצבע', icon: '🎨', count: customerTrajectories.filter(t => t.detectedStage === 'גמר וצבע').length, next: 'צפי: השלמות וסגירה', color: 'border-slate-200 bg-slate-50/80 text-slate-900' }
              ].map((st, i) => (
                <div
                  key={i}
                  onClick={() => { setStageFilter(st.stage); setActiveTab('trajectories'); }}
                  className={`p-3.5 rounded-2xl border ${st.color} flex flex-col justify-between cursor-pointer hover:scale-102 transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{st.icon}</span>
                    <span className="text-lg font-black font-mono">{st.count}</span>
                  </div>
                  <div className="mt-2">
                    <h4 className="font-black text-xs">{st.stage}</h4>
                    <span className="text-[10px] opacity-75 block mt-0.5">{st.next}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-Column Grid: Urgent Procurement Actions + Live Top Flagship Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column A: Immediate Procurement Actions */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        המלצות רכש בעדיפות דחופה (הזמנות ספקים לשבוע זה)
                      </h3>
                      <p className="text-[11px] text-slate-500">פריטים שחצו את רף מלאי הבטיחות במחסנים</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('procurement')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    לכל הרכש ➔
                  </button>
                </div>

                <div className="space-y-2.5">
                  {procurementPlans.slice(0, 3).map((plan, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[10px] text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                              {plan.sku}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              plan.priorityLevel.includes('קריטי') ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {plan.priorityLevel}
                            </span>
                          </div>
                          <h4 className="font-black text-slate-900 text-xs sm:text-sm mt-1">
                            {plan.materialName}
                          </h4>
                        </div>
                        <div className="text-left shrink-0">
                          <span className="text-[10px] text-slate-400 block">אומדן עלות:</span>
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            ₪{plan.costEstimateNis.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-slate-200 text-[11px] text-slate-700 flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900">כמות מומלצת להזמנה:</strong> {plan.recommendedOrderQty}
                        </div>
                        <span className="text-emerald-700 font-bold font-mono">ספק: {plan.supplierName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">סה"כ תקציב רכש שבועי מומלץ:</span>
                <span className="text-base font-black font-mono text-slate-900">
                  ₪{totalEstimatedProcurementCost.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Column B: Top 5 Flagship Volume Drivers */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        מוצרי הדגל המובילים (מחוללי נפח והכנסות)
                      </h3>
                      <p className="text-[11px] text-slate-500">מלט, גבס, בלות חול, טיט ודבקים עיקריים</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('flagships')}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                  >
                    טבלה מלאה ➔
                  </button>
                </div>

                <div className="space-y-2">
                  {topProducts.slice(0, 5).map((p, idx) => (
                    <div
                      key={p.sku || idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-mono font-bold text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-black text-slate-900 text-xs">{p.name}</h4>
                          <span className="text-[11px] text-slate-500 font-mono">מק"ט: {p.sku} | {p.category}</span>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="text-[10px] text-slate-400 block">נמכר:</span>
                        <span className="font-mono font-bold text-slate-900 text-xs">{p.totalSold}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>מנוטר ומפולח ללא פריטי חנות קטנים</span>
                <span className="font-bold text-emerald-700">✓ נתונים מסונכרנים</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CUSTOMER STAGE TRAJECTORIES (AI Predictions) */}
      {activeTab === 'trajectories' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-700">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  מנוע חיזוי AI — מסלולי התקדמות שלבי בנייה וצפי חומרים ללקוחות
                </h3>
                <p className="text-xs text-slate-500">
                  ניתוח היסטוריית אספקות באתר לקוח לחיזוי אוטומטי של שלב הבנייה והצעת רכש יזומה
                </p>
              </div>
            </div>

            {/* Stage Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'יסודות ושלד', 'איטום ובלוקים', 'טיח ופנים', 'ריצוף ותקרות גבס', 'גמר וצבע'].map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setStageFilter(stage)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    stageFilter === stage
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {stage === 'ALL' ? 'כל השלבים' : stage}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrajectories.map((trajectory) => {
              let stageBadgeColor = 'bg-purple-50 text-purple-900 border-purple-200';
              if (trajectory.detectedStage === 'יסודות ושלד') stageBadgeColor = 'bg-blue-50 text-blue-900 border-blue-200';
              if (trajectory.detectedStage === 'איטום ובלוקים') stageBadgeColor = 'bg-amber-50 text-amber-900 border-amber-200';
              if (trajectory.detectedStage === 'ריצוף ותקרות גבס') stageBadgeColor = 'bg-emerald-50 text-emerald-900 border-emerald-200';

              return (
                <div
                  key={trajectory.customerNumber}
                  className="bg-slate-50/70 border border-slate-200 rounded-3xl p-4.5 flex flex-col justify-between space-y-3.5 hover:shadow-md transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          לקוח #{trajectory.customerNumber}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-0.5">
                          {trajectory.customerName}
                        </h4>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          📍 {trajectory.siteAddress}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border shrink-0 ${stageBadgeColor}`}>
                        {trajectory.detectedStage}
                      </span>
                    </div>

                    {/* Progress Bar & Confidence */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                        <span>התקדמות בשלב: {trajectory.stageProgressPercent}%</span>
                        <span className="text-purple-700">דיוק חיזוי: {trajectory.confidenceScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                          style={{ width: `${trajectory.stageProgressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Previous Deliveries */}
                    <div className="mt-3 bg-white p-2.5 rounded-2xl border border-slate-200 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">
                        📦 חומרים אחרונים שסופקו לאתר:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {trajectory.lastDeliveredMaterials.map((mat, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-medium"
                          >
                            {mat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Predicted Next Orders */}
                    <div className="mt-2.5 bg-purple-100/50 p-2.5 rounded-2xl border border-purple-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-purple-950 font-black text-[11px]">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-700" />
                          <span>צפי דרישת חומרים לשלב הבא:</span>
                        </span>
                      </div>
                      {trajectory.predictedNextMaterials.map((pred, i) => (
                        <div key={i} className="bg-white/80 p-2 rounded-xl border border-purple-100 text-[11px] flex items-center justify-between">
                          <div>
                            <strong className="text-purple-950">{pred.materialName}</strong>
                            <span className="text-slate-500 block text-[10px]">כמות מומלצת: {pred.recommendedQty}</span>
                          </div>
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            {pred.urgency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manager Action Recommendation */}
                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-purple-200 flex items-start justify-between gap-2">
                      <div className="text-[11px] text-purple-950 font-medium leading-relaxed">
                        💡 <strong className="font-bold">פעולת מכירות:</strong> {trajectory.salesActionHint}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyActionText(trajectory.salesActionHint, trajectory.customerNumber)}
                        className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 cursor-pointer shrink-0"
                        title="העתק המלצה"
                      >
                        {copiedActionId === trajectory.customerNumber ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <PhoneCall className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: SMART PROCUREMENT & INVENTORY PLANNING */}
      {activeTab === 'procurement' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  המלצות רכש ומלאי שבועיות — תכנון ספקים ואופטימיזציית מחסנים
                </h3>
                <p className="text-xs text-slate-500">
                  אלגוריתם שקלול קצב שריפת חומרים, רף בטיחות, וזמני אספקת ספקים (Lead Time)
                </p>
              </div>
            </div>

            {/* Priority Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'קריטי', 'דחיפות גבוהה', 'רענון תקופתי', 'יציב ותקין'].map((prio) => (
                <button
                  key={prio}
                  type="button"
                  onClick={() => setProcurementPriorityFilter(prio)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    procurementPriorityFilter === prio
                      ? 'bg-amber-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {prio === 'ALL' ? 'כל רמות הדחיפות' : prio}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Procurement Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">דחיפות</th>
                  <th className="py-3 px-3">מק"ט / שם חומר</th>
                  <th className="py-3 px-3">מחסן יעד</th>
                  <th className="py-3 px-3">מלאי נוכחי ורף בטיחות</th>
                  <th className="py-3 px-3">צפי דרישה שבועי</th>
                  <th className="py-3 px-3">המלצת רכש וכמות</th>
                  <th className="py-3 px-3">ספק ראשי וזמן אספקה</th>
                  <th className="py-3 px-3">אומדן עלות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProcurement.map((plan) => {
                  let badge = 'bg-slate-100 text-slate-800 border-slate-200';
                  if (plan.priorityLevel.includes('קריטי')) badge = 'bg-rose-50 text-rose-800 border-rose-200 font-black animate-pulse';
                  else if (plan.priorityLevel.includes('גבוהה')) badge = 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
                  else if (plan.priorityLevel.includes('רענון')) badge = 'bg-blue-50 text-blue-800 border-blue-200';
                  else if (plan.priorityLevel.includes('יציב')) badge = 'bg-emerald-50 text-emerald-800 border-emerald-200';

                  return (
                    <tr key={plan.sku} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] border ${badge}`}>
                          {plan.priorityLevel}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-[10px] text-slate-500 block">
                          {plan.sku}
                        </span>
                        <span className="font-black text-slate-900 text-xs">
                          {plan.materialName}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          קטגוריה: {plan.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-bold text-slate-700">
                        {plan.primaryWarehouse}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block font-mono">
                          {plan.currentStockText}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          רף בטיחות: {plan.safetyThresholdUnits} יח'
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-emerald-700 font-mono">
                          {plan.predictedDemandNextWeekUnits} יח'
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          קצב שריפה: {plan.weeklyBurnRate}/שבוע
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-200">
                          <span className="font-black text-emerald-950 block">
                            {plan.recommendedOrderQty}
                          </span>
                          <span className="text-[10px] text-slate-600 block mt-0.5">
                            {plan.recommendedAction}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block">
                          {plan.supplierName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          זמן אספקה: {plan.leadTimeDays} ימים
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-black text-slate-900 text-xs">
                        ₪{plan.costEstimateNis.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: TOP 10 FLAGSHIP PRODUCTS */}
      {activeTab === 'flagships' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  10 מוצרי הדגל המובילים (בניטרול מוצרי חנות קטנים וברגים)
                </h3>
                <p className="text-xs text-slate-500">
                  חומרי יסוד, מלט, טיט בלות, לוחות גבס, פקדונות ושירותי הובלת מנוף
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">דירוג</th>
                  <th className="py-3 px-3">מק"ט</th>
                  <th className="py-3 px-3">שם מוצר / חומר</th>
                  <th className="py-3 px-3">קטגוריה</th>
                  <th className="py-3 px-3">סה"כ כמות נמכרת</th>
                  <th className="py-3 px-3">מלאי נוכחי במחסנים</th>
                  <th className="py-3 px-3">סטטוס מלאי וביקוש</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {topProducts.map((p, idx) => {
                  let badgeStyle = 'bg-slate-100 text-slate-700';
                  if (p.stockStatus.includes('תקין')) badgeStyle = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
                  else if (p.stockStatus.includes('ביקוש')) badgeStyle = 'bg-blue-50 text-blue-800 border border-blue-200';
                  else if (p.stockStatus.includes('רענון')) badgeStyle = 'bg-amber-50 text-amber-800 border border-amber-200';
                  else if (p.stockStatus.includes('להזמין')) badgeStyle = 'bg-rose-50 text-rose-800 border border-rose-200 font-bold';

                  return (
                    <tr key={p.sku || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">{p.sku}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3.5 px-3 text-slate-500">{p.category}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800">{p.totalSold}</td>
                      <td className="py-3.5 px-3 text-slate-700">{p.currentStock}</td>
                      <td className="py-3.5 px-3">
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
      )}

      {/* VIEW 5: WAREHOUSES OPERATIONAL LOAD & BALANCING */}
      {activeTab === 'warehouses' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {warehouseAnalytics.map((wh) => (
              <div
                key={wh.code}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-teal-50 text-teal-700">
                      <Warehouse className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{wh.warehouseName}</h3>
                      <span className="text-xs text-slate-500">תחום התמחות: {wh.topDemandedCategory}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-teal-100 text-teal-900 rounded-full font-bold text-xs">
                    קוד מחסן: {wh.code}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                    <span className="text-slate-400 block text-[11px]">הזמנות פתוחות פעילות:</span>
                    <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                      {wh.activeOrders} הזמנות
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                    <span className="text-slate-400 block text-[11px]">הזמנות שסופקו בהצלחה:</span>
                    <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">
                      {wh.totalDelivered} תעודות
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                    <span className="text-slate-400 block text-[11px]">בלות לפקדון בחצר / בשטח:</span>
                    <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">
                      {wh.depositBagsOutstanding} בלות
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                    <span className="text-slate-400 block text-[11px]">משטחי עץ לפקדון:</span>
                    <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">
                      {wh.depositPalletsOutstanding} משטחים
                    </span>
                  </div>
                </div>

                <div className="bg-teal-50/70 p-3.5 rounded-2xl border border-teal-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-teal-950">
                    <span>אחוז ניצולת קיבולת מחסן:</span>
                    <span className="font-mono">{wh.utilizationRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-teal-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{ width: `${wh.utilizationRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
