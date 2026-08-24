import React, { useState } from 'react';
import {
  ClipboardList,
  Radio,
  IdCard,
  FileCheck2,
  Share2,
  Sparkles,
  Phone,
  Wifi,
  WifiOff,
  Download,
  Flame
} from 'lucide-react';
import { TabType } from './Navigation';

interface MobileActionDockProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenDriverID: () => void;
  onQuickWhatsApp: () => void;
  ordersCount: number;
  unverifiedNotesCount: number;
  isOnline: boolean;
  onInstallPWA?: () => void;
  canInstallPWA?: boolean;
}

export const MobileActionDock: React.FC<MobileActionDockProps> = ({
  activeTab,
  onTabChange,
  onOpenDriverID,
  onQuickWhatsApp,
  ordersCount,
  unverifiedNotesCount,
  isOnline,
  onInstallPWA,
  canInstallPWA
}) => {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden pointer-events-none pb-[env(safe-area-inset-bottom,8px)]">
      <div className="max-w-md mx-auto px-3 pb-2 pt-1 pointer-events-auto">
        {/* Offline Warning Banner (if offline) */}
        {!isOnline && (
          <div className="mb-2 bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black shadow-lg flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5" />
              <span>מצב אופליין פעיל — הנתונים נשמרים בזיכרון המכשיר</span>
            </div>
            <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded-md">PWA Local</span>
          </div>
        )}

        {/* Floating Dock Container */}
        <div className="bg-slate-950/95 backdrop-blur-xl border-2 border-emerald-500/30 rounded-3xl p-2 shadow-[0_10px_35px_rgba(0,0,0,0.65)] flex items-center justify-between gap-1.5 text-slate-100">
          {/* 1. Orders Tab Button - Big Square */}
          <button
            onClick={() => onTabChange('orders')}
            className={`flex-1 min-w-[56px] h-14 rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 active:scale-92 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ClipboardList className={`w-5 h-5 ${activeTab === 'orders' ? 'text-slate-950 stroke-[2.5]' : 'text-emerald-400'}`} />
            <span className="text-[10px] font-bold mt-0.5 leading-none">הזמנות</span>
            {ordersCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                  activeTab === 'orders' ? 'bg-slate-950 text-white' : 'bg-emerald-500 text-slate-950'
                }`}
              >
                {ordersCount}
              </span>
            )}
          </button>

          {/* 2. Noa AI Voice Hub - Big Square */}
          <button
            onClick={() => onTabChange('noa_voice')}
            className={`flex-1 min-w-[56px] h-14 rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 active:scale-92 cursor-pointer ${
              activeTab === 'noa_voice'
                ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Radio className={`w-5 h-5 ${activeTab === 'noa_voice' ? 'text-slate-950 stroke-[2.5]' : 'text-cyan-400 animate-pulse'}`} />
            <span className="text-[10px] font-bold mt-0.5 leading-none">נועה AI</span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </button>

          {/* 3. Driver Digital ID Badge - Central Highlighted Square */}
          <button
            onClick={onOpenDriverID}
            className="flex-1 min-w-[60px] h-14 rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 active:scale-92 cursor-pointer bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-300/60"
          >
            <IdCard className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            <span className="text-[10px] font-black mt-0.5 leading-none">תעודת זהות</span>
            <span className="text-[8px] bg-slate-950 text-amber-300 px-1 py-0.2 rounded-full absolute -top-1.5 -right-1 font-mono font-black">
              ID 🪪
            </span>
          </button>

          {/* 4. Delivery Notes - Big Square */}
          <button
            onClick={() => onTabChange('delivery_notes')}
            className={`flex-1 min-w-[56px] h-14 rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 active:scale-92 cursor-pointer ${
              activeTab === 'delivery_notes'
                ? 'bg-blue-500 text-white font-black shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileCheck2 className={`w-5 h-5 ${activeTab === 'delivery_notes' ? 'text-white stroke-[2.5]' : 'text-blue-400'}`} />
            <span className="text-[10px] font-bold mt-0.5 leading-none">תעודות</span>
            {unverifiedNotesCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.2 rounded-full">
                {unverifiedNotesCount}
              </span>
            )}
          </button>

          {/* 5. Direct WhatsApp Quick Action - Big Square */}
          <button
            onClick={onQuickWhatsApp}
            className="flex-1 min-w-[56px] h-14 rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 active:scale-92 cursor-pointer bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black shadow-[0_0_15px_rgba(37,211,102,0.4)]"
            title="פתיחת וואטסאפ לשידור מהיר"
          >
            <Share2 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            <span className="text-[10px] font-black mt-0.5 leading-none">וואטסאפ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
