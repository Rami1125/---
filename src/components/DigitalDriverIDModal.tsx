import React, { useState, useEffect } from 'react';
import {
  IdCard,
  ShieldCheck,
  Truck,
  Phone,
  Building2,
  Calendar,
  AlertTriangle,
  QrCode,
  Share2,
  Download,
  Edit3,
  CheckCircle2,
  X,
  Sparkles,
  HardHat,
  Award,
  HeartPulse,
  WifiOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DriverProfile } from '../types';
import { OfflineStorageEngine } from '../lib/offlineStorage';

interface DigitalDriverIDModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDriverName?: string;
  initialTruck?: string;
  initialWarehouse?: string;
  onProfileUpdated?: (profile: DriverProfile) => void;
}

export const DigitalDriverIDModal: React.FC<DigitalDriverIDModalProps> = ({
  isOpen,
  onClose,
  initialDriverName,
  initialTruck,
  initialWarehouse,
  onProfileUpdated
}) => {
  const [profile, setProfile] = useState<DriverProfile>(() => OfflineStorageEngine.getDriverProfile());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<DriverProfile>(profile);

  useEffect(() => {
    const saved = OfflineStorageEngine.getDriverProfile();
    // If incoming props has a specific driver, merge it
    if (initialDriverName && initialDriverName !== saved.fullName) {
      const merged: DriverProfile = {
        ...saved,
        fullName: initialDriverName,
        truckType: initialTruck || saved.truckType,
        warehouse: initialWarehouse || saved.warehouse
      };
      setProfile(merged);
      setEditForm(merged);
    } else {
      setProfile(saved);
      setEditForm(saved);
    }
  }, [isOpen, initialDriverName, initialTruck, initialWarehouse]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    OfflineStorageEngine.saveDriverProfile(editForm);
    setProfile(editForm);
    setIsEditing(false);
    if (onProfileUpdated) onProfileUpdated(editForm);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const handleShareWhatsApp = () => {
    const text =
      `🪪 *תעודת זהות דיגיטלית - נהג ח. סבן לוגיסטיקה*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *שם הנהג:* ${profile.fullName}\n` +
      `🆔 *ת.ז:* ${profile.idNumber} | *עובד:* #${profile.id}\n` +
      `🚛 *משאית:* ${profile.truckNumber} (${profile.truckType})\n` +
      `🏢 *מחסן שיוך:* מחסן ${profile.warehouse}\n` +
      `📜 *רישיון נהיגה:* ${profile.driverLicense} (${profile.licenseType})\n` +
      `🛡️ *היתרים:* ${profile.craneOperatorPermit ? '✅ מנופאי מוסמך' : ''} | ${profile.hazardousMaterialsPermit ? '✅ היתר חומ"ס' : ''}\n` +
      `📅 *תוקף רענון בטיחות:* ${profile.safetyCertificateExpiry}\n` +
      `☎️ *איש קשר חירום:* ${profile.emergencyContactName} (${profile.emergencyContactPhone})\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔐 _תעודה מאומתת דיגיטלית ע"י SabanOS & Noa AI_`;

    const cleanPhone = profile.phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyBadgeData = () => {
    const text = `נהג: ${profile.fullName} | ת.ז: ${profile.idNumber} | משאית: ${profile.truckNumber} | מחסן: ${profile.warehouse} | טלפון: ${profile.phone}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 p-4 sm:p-5 flex items-center justify-between border-b border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner">
              <IdCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-black text-emerald-200 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  תעודת זהות דיגיטלית
                </span>
                <span className="text-[10px] text-teal-200 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> מאומת SabanOS
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                כרטיס נהג ולוגיסטיקה ח. סבן
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Badge Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {isEditing ? (
            /* Edit Form */
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">שם מלא של הנהג</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-emerald-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">מספר תעודת זהות</label>
                  <input
                    type="text"
                    value={editForm.idNumber}
                    onChange={(e) => setEditForm({ ...editForm, idNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">מספר טלפון נייד</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">מספר משאית</label>
                  <input
                    type="text"
                    value={editForm.truckNumber}
                    onChange={(e) => setEditForm({ ...editForm, truckNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">סוג רכב ומשאית</label>
                  <select
                    value={editForm.truckType}
                    onChange={(e) => setEditForm({ ...editForm, truckType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-emerald-500 font-bold"
                  >
                    <option value="משאית מנוף 🏗️">משאית מנוף 🏗️</option>
                    <option value="דבל חול 🚛">דבל חול 🚛</option>
                    <option value="משאית חלוקה רגילה 📦">משאית חלוקה רגילה 📦</option>
                    <option value="טריילר כבד 🚚">טריילר כבד 🚚</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">מחסן יציאה ושיוך</label>
                  <select
                    value={editForm.warehouse}
                    onChange={(e) => setEditForm({ ...editForm, warehouse: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-emerald-500 font-bold"
                  >
                    <option value="החרש">מחסן החרש</option>
                    <option value="התלמיד">מחסן התלמיד</option>
                    <option value="סבן - מרלו&quot;ג ראשי">סבן - מרלו"ג ראשי</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">מספר רישיון נהיגה</label>
                  <input
                    type="text"
                    value={editForm.driverLicense}
                    onChange={(e) => setEditForm({ ...editForm, driverLicense: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">תוקף רענון בטיחות</label>
                  <input
                    type="date"
                    value={editForm.safetyCertificateExpiry}
                    onChange={(e) => setEditForm({ ...editForm, safetyCertificateExpiry: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">איש קשר לשעת חירום</label>
                  <input
                    type="text"
                    value={editForm.emergencyContactName}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">טלפון חירום</label>
                  <input
                    type="text"
                    value={editForm.emergencyContactPhone}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all cursor-pointer shadow-md"
                >
                  שמור תעודה בזיכרון המכשיר
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-all cursor-pointer"
                >
                  ביטול
                </button>
              </div>
            </form>
          ) : (
            /* Badge Visual Card */
            <div className="space-y-4">
              {/* Main Badge Container with holographic border */}
              <div className="relative p-5 rounded-3xl bg-gradient-to-b from-slate-800/90 via-slate-850 to-slate-900 border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)] overflow-hidden">
                {/* Watermark Pattern */}
                <div className="absolute top-2 left-3 opacity-10 pointer-events-none">
                  <Building2 className="w-32 h-32 text-emerald-400" />
                </div>

                {/* Top Profile Strip */}
                <div className="flex items-start justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-950">
                        <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-emerald-300 text-2xl font-black">
                          {profile.fullName.slice(0, 1) || 'ח'}
                        </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full shadow">
                        <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          {profile.id}
                        </span>
                        <span className="text-[11px] text-slate-400">ח. סבן לוגיסטיקה</span>
                      </div>
                      <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">{profile.fullName}</h4>
                      <p className="text-xs text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                        <HardHat className="w-3.5 h-3.5 text-amber-400" /> {profile.truckType}
                      </p>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-black">
                      {profile.truckNumber}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">מחסן {profile.warehouse}</p>
                  </div>
                </div>

                {/* Key Attributes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-4 pt-4 border-t border-slate-700/60 relative z-10 text-right">
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">תעודת זהות</span>
                    <span className="text-xs font-bold text-white font-mono">{profile.idNumber}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">מספר רישיון</span>
                    <span className="text-xs font-bold text-white font-mono">{profile.driverLicense}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">טלפון נייד</span>
                    <a href={`tel:${profile.phone}`} className="text-xs font-bold text-emerald-400 font-mono hover:underline block">
                      {profile.phone}
                    </a>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">תוקף בטיחות</span>
                    <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      {profile.safetyCertificateExpiry}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">סוג דם / עזרה ראשונה</span>
                    <span className="text-xs font-bold text-rose-400 font-mono flex items-center gap-1">
                      <HeartPulse className="w-3 h-3 text-rose-500" />
                      {profile.bloodType || 'O+'} (מוסמך)
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">אישור מנופאי</span>
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <Award className="w-3 h-3 text-emerald-400" />
                      {profile.craneOperatorPermit ? 'בתוקף ✅' : 'ללא'}
                    </span>
                  </div>
                </div>

                {/* Barcode & Security Gate Check-in */}
                <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/80 flex items-center justify-between gap-3 relative z-10">
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-200">
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      <span>ברקוד כניסה למחסן</span>
                    </div>
                    {/* Simulated Clean Barcode Pattern */}
                    <div className="h-9 my-1.5 flex items-end justify-center gap-1 bg-white px-2 py-1 rounded-md">
                      {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 4, 1, 2, 3].map((height, i) => (
                        <div
                          key={i}
                          className="bg-slate-900 rounded-xs"
                          style={{
                            width: `${(i % 3) + 1.5}px`,
                            height: `${height * 6 + 10}px`
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono tracking-widest block text-center">
                      {profile.barcodeValue}
                    </span>
                  </div>

                  <div className="w-px h-16 bg-slate-800" />

                  {/* Emergency Contact Quick Dial */}
                  <div className="text-right">
                    <span className="text-[10px] text-rose-400 font-bold block">חירום / מוקד סבן</span>
                    <p className="text-xs font-bold text-white leading-tight mt-0.5">{profile.emergencyContactName}</p>
                    <a
                      href={`tel:${profile.emergencyContactPhone}`}
                      className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold font-mono transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{profile.emergencyContactPhone}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Offline availability guarantee badge */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-300">
                <WifiOff className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="leading-tight">
                  תעודת הזהות נשמרת בזיכרון הפנימי של הדפדפן (PWA Cache) וזמינה לנהג בכל רגע גם ללא חיבור לאינטרנט.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Dock */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-98"
            >
              <Share2 className="w-4 h-4" />
              <span>שתף תעודה בוואטסאפ</span>
            </button>

            <button
              onClick={handleCopyBadgeData}
              className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="העתק נתונים ללוח"
            >
              <CheckCircle2 className={`w-4 h-4 ${copied ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{copied ? 'הועתק!' : 'העתק'}</span>
            </button>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/20"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'סגור עריכה' : 'ערוך פרטים'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
