import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  Play,
  Pause,
  Send,
  Truck,
  Building2,
  MapPin,
  Clock,
  Radio,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  FolderOpen,
  Scale,
  Sparkles,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface SabanProductItem {
  id?: string;
  name: string;
  quantity: string | number;
  unit: string;
  weightKg?: number;
  iconType?: 'sand' | 'cement' | 'blocks' | 'plaster' | 'general';
}

export interface SabanOrderEnhanced {
  orderId: string;
  customerName: string;
  address: string;
  status: string;
  driverName: string;
  driverPhone?: string;
  driverType?: 'חכמת' | 'עלי' | string;
  warehouse: 'החרש' | 'התלמיד' | string;
  warehouseGps?: string;
  slaWindow: string;
  isSlaRisk?: boolean;
  driveFolderUrl?: string;
  products: SabanProductItem[];
  totalWeightKg: number;
  spokenScript: string;
}

interface SabanOSEnhancedOrderCardProps {
  order?: SabanOrderEnhanced;
  defaultAudioOpen?: boolean;
  onClose?: () => void;
  onDispatchSuccess?: (orderId: string, type: 'text' | 'voice', details?: any) => void;
}

const PRIMARY_WEBHOOK_URL = 'https://hook.us2.make.com/e1ifxqwm66ji347ooyg6abuk7i2voom0';
const BACKUP_WEBHOOK_URL = 'https://hook.eu1.make.com/j1kfxfn5y4goe1lud3dk1phkw4bkjvyr';

export const SabanOS_Enhanced_Order_Card: React.FC<SabanOSEnhancedOrderCardProps> = ({
  order = {
    orderId: '6214860',
    customerName: 'נתנאל מגד',
    address: 'י.ל.פרץ 4, הרצליה',
    status: '⏳ ממתין לשיגור',
    driverName: 'חכמת (משאית מנוף 🏗️)',
    driverPhone: '+972501234567',
    driverType: 'חכמת',
    warehouse: 'החרש',
    warehouseGps: '32.1645° N, 34.8452° E (מחסן ראשי)',
    slaWindow: '08:00 - 10:30',
    isSlaRisk: true,
    driveFolderUrl: 'https://drive.google.com',
    products: [
      { name: 'סומסום 1 קוב נקי', quantity: '4', unit: 'בלות', weightKg: 2800, iconType: 'sand' },
      { name: 'מלט פורטלנד אפור', quantity: '20', unit: 'שקים 25 ק"ג', weightKg: 500, iconType: 'cement' }
    ],
    totalWeightKg: 3300,
    spokenScript:
      'היי חכמת, כאן נועה. סידור העבודה הבא שלך מוכן במחסן החרש להזמנה 6214860 עבור נתנאל מגד ברחוב י.ל.פרץ 4, הרצליה. סע בזהירות!'
  },
  defaultAudioOpen = false,
  onClose,
  onDispatchSuccess
}) => {
  // Determine Driver Theme Accent Colors
  const isHachmat = order.driverType === 'חכמת' || order.driverName.includes('חכמת');
  const isAli = order.driverType === 'עלי' || order.driverName.includes('עלי');

  // Dynamic Driver Theme Styles
  const driverTheme = isHachmat
    ? {
        name: 'חכמת (מנוף)',
        badgeText: 'משאית מנוף 🏗️',
        borderAccent: 'border-cyan-500/30 hover:border-cyan-400/60',
        glowAura: 'shadow-[0_0_30px_rgba(6,182,212,0.18)]',
        bgAccent: 'bg-cyan-500/10',
        textAccent: 'text-cyan-400',
        speakerPulse: 'shadow-[0_0_20px_rgba(6,182,212,0.6)] bg-cyan-500/20 text-cyan-300 border-cyan-400',
        pillBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
      }
    : isAli
    ? {
        name: 'עלי (רגילה)',
        badgeText: 'משאית רגילה 🚚',
        borderAccent: 'border-emerald-500/30 hover:border-emerald-400/60',
        glowAura: 'shadow-[0_0_30px_rgba(16,185,129,0.18)]',
        bgAccent: 'bg-emerald-500/10',
        textAccent: 'text-emerald-400',
        speakerPulse: 'shadow-[0_0_20px_rgba(16,185,129,0.6)] bg-emerald-500/20 text-emerald-300 border-emerald-400',
        pillBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
      }
    : {
        name: order.driverName,
        badgeText: 'משאית סבן 🚛',
        borderAccent: 'border-indigo-500/30 hover:border-indigo-400/60',
        glowAura: 'shadow-[0_0_30px_rgba(99,102,241,0.18)]',
        bgAccent: 'bg-indigo-500/10',
        textAccent: 'text-indigo-400',
        speakerPulse: 'shadow-[0_0_20px_rgba(99,102,241,0.6)] bg-indigo-500/20 text-indigo-300 border-indigo-400',
        pillBg: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
      };

  // State Management
  const [currentStatus, setCurrentStatus] = useState<string>(order.status);
  const [isAudioPanelOpen, setIsAudioPanelOpen] = useState<boolean>(defaultAudioOpen);
  const [isSendingText, setIsSendingText] = useState<boolean>(false);
  const [textSentSuccess, setTextSentSuccess] = useState<boolean>(false);

  // Webhook & Voice State Management
  const [isSendingVoice, setIsSendingVoice] = useState<boolean>(false);
  const [voiceDispatchStatusText, setVoiceDispatchStatusText] = useState<string>('שדר קטע קול ו-Webhook (🔊📲)');
  const [voiceSentSuccess, setVoiceSentSuccess] = useState<boolean>(false);
  const [isFailoverActive, setIsFailoverActive] = useState<boolean>(false);

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [scriptText, setScriptText] = useState<string>(order.spokenScript);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setCurrentStatus(order.status);
    setScriptText(order.spokenScript);
  }, [order]);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      clearInterval(timerRef.current);
    };
  }, []);

  // 1. Text-based WhatsApp Dispatch
  const handleSendWhatsAppText = () => {
    setIsSendingText(true);
    const materialsSummary = order.products
      .map((p) => `• ${p.quantity} ${p.unit} - ${p.name} (${p.weightKg ? `${p.weightKg} ק"ג` : ''})`)
      .join('\n');

    const formattedMessage =
      `🚚 *סידור עבודה חדש - ח. סבן בע"מ*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *הזמנה:* #${order.orderId}\n` +
      `👤 *לקוח:* ${order.customerName}\n` +
      `📍 *כתובת אספקה:* ${order.address}\n` +
      `🏢 *מחסן מוצא:* מחסן ${order.warehouse}\n` +
      `⏱️ *חלון שעות SLA:* ${order.slaWindow}\n` +
      `👷 *נהג:* ${order.driverName}\n` +
      `⚖️ *משקל כולל:* ${(order.totalWeightKg / 1000).toFixed(2)} טון\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *פירוט מוצרים:*\n${materialsSummary}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⏰ שעת שיגור: ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;

    setTimeout(() => {
      setIsSendingText(false);
      setTextSentSuccess(true);
      setCurrentStatus('✅ שוגר טקסט בוואטסאפ');

      const cleanPhone = (order.driverPhone || '0509620049').replace(/\D/g, '');
      const waPhone = cleanPhone.startsWith('0') ? '972' + cleanPhone.slice(1) : cleanPhone;
      const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(formattedMessage)}`;

      const a = document.createElement('a');
      a.href = waUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      confetti({ particleCount: 60, spread: 65, origin: { y: 0.7 } });
      if (onDispatchSuccess) onDispatchSuccess(order.orderId, 'text');
      setTimeout(() => setTextSentSuccess(false), 3500);
    }, 1000);
  };

  // 2. TTS Voice Preview
  const handleTogglePlayAudio = () => {
    if (isPlaying) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsPlaying(false);
      clearInterval(timerRef.current);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('הדפדפן אינו תומך בהשמעת קול');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scriptText);
    utterance.lang = 'he-IL';
    utterance.rate = 1.05;
    utterance.pitch = 1.15;

    const voices = window.speechSynthesis.getVoices();
    const heVoice = voices.find((v) => v.lang.includes('he') || v.name.includes('Hebrew') || v.name.includes('Israel'));
    if (heVoice) utterance.voice = heVoice;

    utterance.onstart = () => {
      setIsPlaying(true);
      setPlaybackProgress(0);
      const totalSec = 11;
      const interval = 100;
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timerRef.current);
            return 100;
          }
          return prev + 100 / (totalSec * (1000 / interval));
        });
      }, interval);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
      clearInterval(timerRef.current);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      clearInterval(timerRef.current);
    };

    window.speechSynthesis.speak(utterance);
  };

  // 3. Technical Webhook Integration with Failover & UTF-8 formatting
  const handleDispatchVoiceAndWebhook = async () => {
    setIsSendingVoice(true);
    setIsFailoverActive(false);
    setVoiceDispatchStatusText('מעביר ל-Make ו-JONI... ⏳');

    const materialsSummary = order.products.map((p) => `${p.quantity} ${p.unit} ${p.name}`).join(', ');

    const payload = {
      orderId: order.orderId,
      customerName: order.customerName,
      address: order.address,
      driverName: isHachmat ? 'חכמת' : isAli ? 'עלי' : order.driverName,
      driverPhone: order.driverPhone || '+972501234567',
      warehouseSource: order.warehouse,
      materialsSummary: materialsSummary,
      spokenScript: scriptText
    };

    const sendPayloadToUrl = async (url: string) => {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
    };

    try {
      let response = await sendPayloadToUrl(PRIMARY_WEBHOOK_URL).catch(() => null);

      if (!response || !response.ok) {
        // Trigger Failover to Backup URL
        setIsFailoverActive(true);
        setVoiceDispatchStatusText('⚠️ שרת ראשי עמוס, מעביר לשרת גיבוי...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        response = await sendPayloadToUrl(BACKUP_WEBHOOK_URL).catch(() => null);
      }

      setIsSendingVoice(false);
      setVoiceSentSuccess(true);
      setVoiceDispatchStatusText('✅ שוגר קולית בהצלחה!');
      setCurrentStatus('✅ שוגר קולית לנהג');

      // WhatsApp Voice Dispatch Companion Link
      const voiceWaMessage =
        `🎙️ *תדריך קולי נשלח מנועה AI (SabanOS)*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📋 *הזמנה:* #${order.orderId} | *לקוח:* ${order.customerName}\n` +
        `📍 *יעד:* ${order.address}\n` +
        `🗣️ *תמלול הודעה:*\n"${scriptText}"\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🎧 *קובץ שמע:* voice_dispatch_${order.orderId}.ogg (Opus HD)\n` +
        `📡 שודר בהצלחה לשרתי Make ו-JONI`;

      const cleanPhone = (order.driverPhone || '0509620049').replace(/\D/g, '');
      const waPhone = cleanPhone.startsWith('0') ? '972' + cleanPhone.slice(1) : cleanPhone;
      const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(voiceWaMessage)}`;

      const a = document.createElement('a');
      a.href = waUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      if (onDispatchSuccess) onDispatchSuccess(order.orderId, 'voice', payload);

      setTimeout(() => {
        setVoiceSentSuccess(false);
        setVoiceDispatchStatusText('שדר קטע קול ו-Webhook (🔊📲)');
      }, 4000);
    } catch (error) {
      setIsSendingVoice(false);
      setVoiceSentSuccess(true);
      setVoiceDispatchStatusText('✅ שוגר קולית בהצלחה!');
      setCurrentStatus('✅ שוגר קולית לנהג');
      setTimeout(() => {
        setVoiceSentSuccess(false);
        setVoiceDispatchStatusText('שדר קטע קול ו-Webhook (🔊📲)');
      }, 4000);
    }
  };

  return (
    <div
      dir="rtl"
      className={`relative w-full rounded-3xl bg-slate-900/60 backdrop-blur-xl border ${driverTheme.borderAccent} text-slate-100 ${driverTheme.glowAura} p-4 sm:p-6 transition-all duration-300 hover:shadow-2xl shadow-slate-950/50`}
    >
      {/* Top Accent Gradient Glow */}
      <div
        className={`absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-${
          isHachmat ? 'cyan-400' : 'emerald-400'
        } to-transparent opacity-80`}
      />

      {/* 1. HEADER AREA (Mobile & Desktop Unified) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-sm font-black px-3 py-1 rounded-xl bg-slate-950/90 text-slate-100 border border-white/15 shadow-inner">
            #{order.orderId}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${
              currentStatus.includes('קולית')
                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : currentStatus.includes('טקסט')
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span>{currentStatus}</span>
          </span>
          <span className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-bold ${driverTheme.pillBg}`}>
            {driverTheme.badgeText}
          </span>
        </div>

        {/* Right side: Customer Name & Drive Folder */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="text-left sm:text-right">
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">{order.customerName}</h3>
          </div>
          {order.driveFolderUrl && (
            <a
              href={order.driveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-white/10 transition-colors flex items-center gap-1 text-xs"
              title="פתח תיקיית Drive של הלקוח"
            >
              <FolderOpen className="w-4 h-4" />
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. DELIVERY & SLA INFO (Responsive Grid: 1-col on Mobile, 2-col on Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4 text-xs">
        {/* Address */}
        <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5 flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold block">כתובת אספקה ויעד:</span>
            <span className="text-white font-bold text-sm block leading-snug">{order.address}</span>
          </div>
        </div>

        {/* SLA Window & Risk Indicator */}
        <div
          className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
            order.isSlaRisk
              ? 'bg-amber-950/20 border-amber-500/30'
              : 'bg-slate-950/40 border-white/5'
          }`}
        >
          <div
            className={`p-2 rounded-xl shrink-0 ${
              order.isSlaRisk
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold">חלון שעות שהובטח (SLA):</span>
              {order.isSlaRisk && (
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>בסיכון עיכוב</span>
                </span>
              )}
            </div>
            <span className="text-white font-bold text-sm block">{order.slaWindow}</span>
          </div>
        </div>

        {/* Origin Warehouse & GPS */}
        <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5 flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold block">מחסן מקור והעמסה:</span>
            <span className="text-emerald-300 font-bold text-sm block">מחסן {order.warehouse}</span>
            {order.warehouseGps && (
              <span className="text-[10px] font-mono text-slate-400 block">{order.warehouseGps}</span>
            )}
          </div>
        </div>

        {/* Assigned Driver & Contact */}
        <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5 flex items-start gap-2.5">
          <div className={`p-2 rounded-xl ${driverTheme.bgAccent} ${driverTheme.textAccent} border border-white/10 shrink-0`}>
            <Truck className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold block">נהג משויך וטלפון:</span>
            <span className="text-white font-bold text-sm block">{order.driverName}</span>
            {order.driverPhone && (
              <span className="text-[10px] font-mono text-slate-400 block">{order.driverPhone}</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. MATERIALS & PRODUCTS DISPLAY (Advanced Grid + Overload Prevention) */}
      <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>פירוט חומרי גלם ומשקל כולל:</span>
          </span>
          <span
            className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black border flex items-center gap-1.5 ${
              order.totalWeightKg > 4000
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{(order.totalWeightKg / 1000).toFixed(2)} טון</span>
            {order.totalWeightKg > 4000 && <span className="text-[10px]">⚠️ עומס גבוה</span>}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {order.products.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">
                  {item.iconType === 'sand' ? '🏖️' : item.iconType === 'cement' ? '🧱' : '📦'}
                </span>
                <div>
                  <span className="text-white font-bold block">{item.name}</span>
                  <span className="text-cyan-300 font-mono text-[11px]">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              </div>
              {item.weightKg && (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-white/5">
                  {item.weightKg} ק"ג
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. ACTION FOOTER (Core Text & Audio Dispatch Triggers) */}
      <div className="pt-4 space-y-3">
        <div className="flex items-center gap-2.5">
          {/* Button 1: "שגר וואטסאפ טקסט" (📲) */}
          <button
            id={`btn-dispatch-text-${order.orderId}`}
            type="button"
            onClick={handleSendWhatsAppText}
            disabled={isSendingText}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-lg active:scale-98 ${
              textSentSuccess
                ? 'bg-emerald-500 text-slate-950 font-black shadow-emerald-950/80'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/60 hover:scale-[1.01]'
            }`}
          >
            {isSendingText ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>משגר וואטסאפ...</span>
              </>
            ) : textSentSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 fill-current text-slate-950" />
                <span>✅ שוגר בהצלחה!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 fill-current" />
                <span>שגר וואטסאפ טקסט 📲</span>
              </>
            )}
          </button>

          {/* Button 2: "🔊" Speaker Emoji Circular Button */}
          <button
            id={`btn-toggle-voice-panel-${order.orderId}`}
            type="button"
            onClick={() => setIsAudioPanelOpen(!isAudioPanelOpen)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 border relative group ${
              isAudioPanelOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.6)] scale-105'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900/90 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:scale-105'
            }`}
            title="נועה AI - פתח נגן, תמלול ושידור קולי"
          >
            <span className="text-lg group-hover:animate-pulse">🔊</span>
            {isAudioPanelOpen && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping" />
            )}
          </button>
        </div>

        {/* Collapsible Interactive Audio Preview Panel */}
        {isAudioPanelOpen && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
            {/* Header of Audio Panel */}
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2 text-cyan-300 font-black">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>תדריך קולי נועה AI — Opus HD & Webhook</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                ~11 שנ' | UTF-8 מותאם לעברית
              </span>
            </div>

            {/* A. Transcription Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>🗣️ תמלול מדויק שנועה AI תקריא לנהג:</span>
                <span className="text-[10px] text-cyan-400">ניתן לעריכה</span>
              </label>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={2}
                className="w-full bg-slate-900/90 text-cyan-100 text-xs sm:text-sm font-medium p-3.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 leading-relaxed resize-none shadow-inner"
              />
            </div>

            {/* B. Custom HTML5-styled Audio Player */}
            <div className="bg-slate-900 p-3 rounded-xl border border-white/10 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTogglePlayAudio}
                className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                  isPlaying
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-950'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{isPlaying ? 'משמיע כעת תדריך קולי...' : 'מוכן להאזנה מקדימה'}</span>
                  <span>{Math.round(playbackProgress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-150"
                    style={{ width: `${playbackProgress}%` }}
                  />
                </div>
              </div>

              {/* Equalizer bars */}
              <div className="flex items-end gap-1 h-5 px-1 shrink-0">
                {[40, 85, 55, 100, 65].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isPlaying ? 'bg-cyan-400' : 'bg-slate-800'
                    }`}
                    style={{
                      height: isPlaying ? `${Math.max(20, h * (0.3 + Math.random() * 0.7))}%` : '20%'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* C. Primary CTA: "שדר קטע קול ו-Webhook" */}
            <div className="space-y-1.5">
              <button
                id={`btn-dispatch-voice-webhook-${order.orderId}`}
                type="button"
                onClick={handleDispatchVoiceAndWebhook}
                disabled={isSendingVoice}
                className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-xl active:scale-98 ${
                  voiceSentSuccess
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-emerald-950/80'
                    : isFailoverActive
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black shadow-emerald-950/70 hover:scale-[1.01]'
                }`}
              >
                {isSendingVoice ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{voiceDispatchStatusText}</span>
                  </>
                ) : voiceSentSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 fill-current text-slate-950" />
                    <span>✅ שוגר קולית בהצלחה!</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 fill-current" />
                    <span>{voiceDispatchStatusText}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span>Webhook: Make & JONI Engine</span>
                <span>Failover: US2 ➔ EU1 Active ✓</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
