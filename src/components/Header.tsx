import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FolderSync,
  LogOut,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  IdCard,
  Wifi,
  WifiOff
} from 'lucide-react';
import { GoogleAuthState, SystemConfig } from '../types';

interface HeaderProps {
  auth: GoogleAuthState;
  config: SystemConfig;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  isOnline?: boolean;
  pendingQueueCount?: number;
  onLogin: () => void;
  onLogout: () => void;
  onSyncAll: () => void;
  onOpenDriverID?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  auth,
  config,
  isSyncing,
  lastSyncTime,
  isOnline = true,
  pendingQueueCount = 0,
  onLogin,
  onLogout,
  onSyncAll,
  onOpenDriverID
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('he-IL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Jerusalem'
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950 shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-black tracking-wider text-emerald-400 uppercase bg-emerald-950/80 px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-500/30">
                  SabanOS v2.6
                </span>
                {/* Network Status Badge */}
                <div
                  className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    isOnline
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse'
                  }`}
                  title={isOnline ? 'מחובר לרשת אונליין' : 'עבודה במצב אופליין מקומי'}
                >
                  {isOnline ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="hidden xs:inline">אונליין</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                      <span>אופליין {pendingQueueCount > 0 ? `(${pendingQueueCount})` : ''}</span>
                    </>
                  )}
                </div>
              </div>
              <h1 className="text-sm sm:text-lg font-black text-white leading-tight truncate">
                ח. סבן — בקרת תעודות משלוח ורכש
              </h1>
            </div>
          </div>

          {/* Center Info: Israel Time & Quick Links */}
          <div className="hidden xl:flex items-center gap-4 bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>שעון ישראל:</span>
              <span className="font-mono font-bold text-white">{currentTime}</span>
            </div>

            <div className="h-3 w-px bg-slate-700" />

            <a
              href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              title="פתח גיליון Google Sheets מקושר"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheet</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <div className="h-3 w-px bg-slate-700" />

            <a
              href={`https://drive.google.com/drive/folders/${config.deliveryDocsFolderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
              title="פתח תיקיית תעודות משלוח בדרייב"
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>Drive תעודות</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>

          {/* Right Controls: Digital ID & Google Auth */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Digital Driver ID Button */}
            {onOpenDriverID && (
              <button
                onClick={onOpenDriverID}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                title="הצג תעודת זהות דיגיטלית לנהג"
              >
                <IdCard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">תעודת זהות</span>
                <span className="sm:hidden">ID</span>
              </button>
            )}

            {auth.isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={onSyncAll}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  title="סנכרן את כל הטאבים מול Google Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">סנכרון</span>
                </button>

                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-2 sm:px-2.5 py-1 rounded-xl">
                  {auth.userPhoto ? (
                    <img
                      src={auth.userPhoto}
                      alt={auth.userName || 'משתמש מחובר'}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-emerald-400"
                    />
                  ) : (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      {(auth.userName || 'U')[0]}
                    </div>
                  )}
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-white leading-none truncate max-w-[100px]">
                      {auth.userName || auth.userEmail}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> מחובר
                    </p>
                  </div>

                  <button
                    onClick={onLogout}
                    className="text-slate-400 hover:text-rose-400 p-1 rounded-lg transition-colors"
                    title="התנתק מחשבון Google"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={auth.isLoggingIn}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs shadow-md hover:shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                  <path fill="#000000" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#000000" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#000000" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#000000" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="hidden xs:inline">{auth.isLoggingIn ? 'מתחבר...' : 'התחבר ב-Google'}</span>
                <span className="xs:hidden">כניסה</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

