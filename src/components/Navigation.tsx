import React from 'react';
import {
  ClipboardList,
  FileCheck2,
  GitCompare,
  FolderOpen,
  TrendingUp,
  Truck,
  BookOpen,
  Settings,
  Sparkles,
  Radio
} from 'lucide-react';

export type TabType =
  | 'orders'
  | 'noa_voice'
  | 'morning_report'
  | 'delivery_notes'
  | 'cross_audit'
  | 'customers'
  | 'smart_dashboard'
  | 'logistics'
  | 'dictionary'
  | 'settings';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  ordersCount: number;
  pendingAuditCount: number;
  unverifiedNotesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  ordersCount,
  pendingAuditCount,
  unverifiedNotesCount
}) => {
  const tabs = [
    {
      id: 'orders' as TabType,
      label: 'הזמנות ועבודה יומית',
      icon: ClipboardList,
      badge: ordersCount > 0 ? ordersCount : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'noa_voice' as TabType,
      label: 'נועה AI - קול ושידור 🎙️',
      icon: Radio,
      badge: 'AI קולי',
      badgeColor: 'bg-cyan-100 text-cyan-800 font-bold',
      sparkle: true
    },
    {
      id: 'morning_report' as TabType,
      label: 'מחולל דוח בוקר 🚀',
      icon: Sparkles,
      badge: 'חדש',
      badgeColor: 'bg-indigo-100 text-indigo-800 font-bold'
    },
    {
      id: 'delivery_notes' as TabType,
      label: 'תעודות משלוח ו-OCR',
      icon: FileCheck2,
      badge: unverifiedNotesCount > 0 ? unverifiedNotesCount : undefined,
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'cross_audit' as TabType,
      label: 'הצלבה ובקרה',
      icon: GitCompare,
      badge: pendingAuditCount > 0 ? `${pendingAuditCount} להצלבה` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold'
    },
    {
      id: 'customers' as TabType,
      label: 'תיקי לקוחות ודרייב',
      icon: FolderOpen
    },
    {
      id: 'smart_dashboard' as TabType,
      label: 'דשבורד חכם ורכש',
      icon: TrendingUp,
      sparkle: true
    },
    {
      id: 'logistics' as TabType,
      label: 'ערים ולוגיסטיקה',
      icon: Truck
    },
    {
      id: 'dictionary' as TabType,
      label: 'מילון לוגיסטי',
      icon: BookOpen
    },
    {
      id: 'settings' as TabType,
      label: 'הגדרות ו-Make',
      icon: Settings
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center space-x-reverse space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 relative cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>

                {tab.sparkle && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}

                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                      isActive ? 'bg-emerald-500 text-slate-950 font-black' : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

