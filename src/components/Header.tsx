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
  AlertCircle
} from 'lucide-react';
import { GoogleAuthState, SystemConfig } from '../types';

interface HeaderProps {
  auth: GoogleAuthState;
  config: SystemConfig;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  onLogin: () => void;
  onLogout: () => void;
  onSyncAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  auth,
  config,
  isSyncing,
  lastSyncTime,
  onLogin,
  onLogout,
  onSyncAll
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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  SabanOS v2.6
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  מערכת בקרה וחיזוי
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                ח. סבן חומרי בניין — בקרת תעודות משלוח ורכש
              </h1>
            </div>
          </div>

          {/* Center Info: Israel Time & Quick Links */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>שעון ישראל:</span>
              <span className="font-mono font-bold text-slate-800">{currentTime}</span>
            </div>

            <div className="h-3 w-px bg-slate-200" />

            <a
              href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
              title="פתח גיליון Google Sheets מקושר"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>פתח Google Sheet</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <div className="h-3 w-px bg-slate-200" />

            <a
              href={`https://drive.google.com/drive/folders/${config.deliveryDocsFolderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors"
              title="פתח תיקיית תעודות משלוח בדרייב"
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>Drive תעודות</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>

          {/* Google Auth & Sync Controls */}
          <div className="flex items-center gap-2.5">
            {auth.isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onSyncAll}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
                  title="סנכרן את כל הטאבים מול Google Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">סנכרון Sheets</span>
                </button>

                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
                  {auth.userPhoto ? (
                    <img
                      src={auth.userPhoto}
                      alt={auth.userName || 'משתמש מחובר'}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full border border-emerald-400"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      {(auth.userName || 'U')[0]}
                    </div>
                  )}
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 leading-none">
                      {auth.userName || auth.userEmail}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> מחובר ל-Workspace
                    </p>
                  </div>

                  <button
                    onClick={onLogout}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors ml-1"
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
                className="flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs shadow-xs hover:shadow transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{auth.isLoggingIn ? 'מתחבר...' : 'התחבר עם Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
