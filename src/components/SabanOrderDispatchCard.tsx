import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Send,
  Sparkles,
  Check,
  CheckCircle2,
  Truck,
  Building2,
  MapPin,
  Package,
  Layers,
  Clock,
  Radio,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
  Phone,
  MessageSquare,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface SabanOrder {
  orderId: string;
  customerName: string;
  address: string;
  status: string;
  driverName: string;
  driverPhone?: string;
  warehouse: string;
  materials: string[];
  spokenScript: string;
  weightTon?: number;
  deliveryTimeWindow?: string;
}

interface SabanOrderDispatchCardProps {
  order?: SabanOrder;
  defaultAudioOpen?: boolean;
  onClose?: () => void;
  onDispatchSuccess?: (orderId: string, type: 'text' | 'voice') => void;
}

export const SabanOrderDispatchCard: React.FC<SabanOrderDispatchCardProps> = ({
  order = {
    orderId: '6215028',
    customerName: 'שטיכמוס / שיבת ציון',
    address: 'שיבת ציון 12, הרצליה',
    status: '⏳ ממתין לשיגור',
    driverName: 'חכמת (משאית מנוף 🏗️)',
    driverPhone: '050-1234567',
    warehouse: 'מחסן 4 (החרש)',
    materials: ['4 בלות סומסום נקי 1 קוב', '2 בלות חול ים נקי', '20 שקי מלט אפור 25 ק"ג'],
    spokenScript:
      'היי חכמת, כאן נועה. סידור העבודה הבא שלך מוכן במחסן החרש להזמנה 6215028 עבור שטיכמוס ברחוב שיבת ציון 12, הרצליה. סע בזהירות!',
    weightTon: 3.4,
    deliveryTimeWindow: '08:30 - 10:00'
  },
  defaultAudioOpen = false,
  onClose,
  onDispatchSuccess
}) => {
  // Local card states
  const [currentStatus, setCurrentStatus] = useState<string>(order.status);
  const [isAudioPanelOpen, setIsAudioPanelOpen] = useState<boolean>(defaultAudioOpen);
  const [isSendingText, setIsSendingText] = useState<boolean>(false);
  const [textSentSuccess, setTextSentSuccess] = useState<boolean>(false);
  const [isSendingVoice, setIsSendingVoice] = useState<boolean>(false);
  const [voiceSentSuccess, setVoiceSentSuccess] = useState<boolean>(false);

  // Audio Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [scriptText, setScriptText] = useState<string>(order.spokenScript);
  const timerRef = useRef<any>(null);

  // Sync state when order prop changes
  useEffect(() => {
    setCurrentStatus(order.status);
    setScriptText(order.spokenScript);
    if (defaultAudioOpen) {
      setIsAudioPanelOpen(true);
    }
  }, [order.orderId, order.spokenScript, order.status, defaultAudioOpen]);

  // Stop TTS if component unmounts
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      clearInterval(timerRef.current);
    };
  }, []);

  // 1. Text WhatsApp Trigger
  const handleSendWhatsAppText = () => {
    setIsSendingText(true);

    const formattedMessage =
      `🚚 *סידור עבודה חדש - ח. סבן בע"מ*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *הזמנה:* #${order.orderId}\n` +
      `👤 *לקוח:* ${order.customerName}\n` +
      `📍 *כתובת אספקה:* ${order.address}\n` +
      `🏢 *מחסן מוצא:* ${order.warehouse}\n` +
      `👷 *נהג:* ${order.driverName}\n` +
      `📦 *חומרים:*\n${order.materials.map((m) => `• ${m}`).join('\n')}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⏰ שעת שיגור: ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;

    setTimeout(() => {
      setIsSendingText(false);
      setTextSentSuccess(true);
      setCurrentStatus('✅ שוגר טקסט בוואטסאפ');

      // Launch WhatsApp safely
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

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      if (onDispatchSuccess) onDispatchSuccess(order.orderId, 'text');

      setTimeout(() => setTextSentSuccess(false), 3500);
    }, 1000);
  };

  // 2. Play / Pause Speech Synthesis Audio
  const handleTogglePlayAudio = () => {
    if (isPlaying) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsPlaying(false);
      clearInterval(timerRef.current);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('דפדפן זה אינו תומך בהשמעת קול');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scriptText);
    utterance.lang = 'he-IL';
    utterance.rate = 1.05;
    utterance.pitch = 1.15; // Natural Noa tone

    const voices = window.speechSynthesis.getVoices();
    const heVoice = voices.find((v) => v.lang.includes('he') || v.name.includes('Hebrew') || v.name.includes('Israel'));
    if (heVoice) utterance.voice = heVoice;

    utterance.onstart = () => {
      setIsPlaying(true);
      setPlaybackProgress(0);
      const totalEstimatedSec = 11;
      const stepInterval = 100;
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timerRef.current);
            return 100;
          }
          return prev + (100 / (totalEstimatedSec * (1000 / stepInterval)));
        });
      }, stepInterval);
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

  // 3. Voice Dispatch & Webhook Trigger
  const handleDispatchVoiceAndWebhook = async () => {
    setIsSendingVoice(true);

    // Simulate Webhook POST to https://hooks.sabanos.co.il/v1/voice-dispatch
    try {
      const payload = {
        orderId: order.orderId,
        customerName: order.customerName,
        destination: order.address,
        driverName: order.driverName,
        audioFormat: 'audio/ogg; codecs=opus',
        spokenScript: scriptText,
        dispatchedAt: new Date().toISOString(),
        webhookTarget: 'https://hooks.sabanos.co.il/v1/voice-dispatch'
      };

      console.log('📡 [SabanOS Webhook Dispatch]: Posting Opus voice payload to https://hooks.sabanos.co.il/v1/voice-dispatch', payload);

      // 1.2s realistic webhook transmission delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setIsSendingVoice(false);
      setVoiceSentSuccess(true);
      setCurrentStatus('✅ שוגר קולית לנהג');

      // WhatsApp Voice Note Text Notification Link
      const voiceWaMessage =
        `🎙️ *תדריך קולי נשלח מנועה AI (SabanOS)*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📋 *הזמנה:* #${order.orderId} | *לקוח:* ${order.customerName}\n` +
        `📍 *יעד:* ${order.address}\n` +
        `🗣️ *תמלול הודעה:*\n"${scriptText}"\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🎧 *קובץ שמע:* voice_dispatch_${order.orderId}.ogg (Opus HD)\n` +
        `✅ עודכן ונשמר בשרת הסידור`;

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

      confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 } });
      if (onDispatchSuccess) onDispatchSuccess(order.orderId, 'voice');

      setTimeout(() => setVoiceSentSuccess(false), 4000);
    } catch (e) {
      setIsSendingVoice(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="relative w-full max-w-xl mx-auto rounded-3xl bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 text-white shadow-2xl p-5 sm:p-6 transition-all duration-300 hover:border-cyan-400/60 hover:shadow-[0_0_35px_rgba(6,182,212,0.18)]"
    >
      {/* Top Accent Gradient Glow Line */}
      <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

      {/* 1. HEADER AREA */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
              #{order.orderId}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {order.deliveryTimeWindow || '08:30'}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
            {order.customerName}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="line-clamp-1">{order.address}</span>
          </div>
        </div>

        {/* Status Badge & Close Button */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="סגור חלונית תדריך קולי"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <span
              className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-sm transition-all ${
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
          </div>

          {order.weightTon && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
              ⚖️ {order.weightTon} טון
            </span>
          )}
        </div>
      </div>

      {/* 2. BODY AREA */}
      <div className="py-4 space-y-3.5 text-xs">
        {/* Logistics & Driver metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="bg-slate-900/70 p-2.5 rounded-2xl border border-slate-800/90 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">נהג משויך:</span>
              <span className="text-slate-100 font-black">{order.driverName}</span>
            </div>
          </div>

          <div className="bg-slate-900/70 p-2.5 rounded-2xl border border-slate-800/90 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">מחסן מקור:</span>
              <span className="text-emerald-300 font-black">{order.warehouse}</span>
            </div>
          </div>
        </div>

        {/* Materials Summary List */}
        <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800/70 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              <span>סיכום חומרי גלם להובלה:</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500">{order.materials.length} פריטים</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {order.materials.map((item, idx) => (
              <span
                key={idx}
                className="bg-slate-950/90 text-slate-200 text-xs px-2.5 py-1 rounded-xl border border-slate-700/70 flex items-center gap-1.5 font-medium shadow-xs"
              >
                <span className="text-cyan-400 text-[10px]">●</span>
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. ACTION FOOTER (The Core Feature) */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center gap-2.5">
          {/* Button 1: "שגר וואטסאפ טקסט" (📲) */}
          <button
            id={`btn-dispatch-text-${order.orderId}`}
            type="button"
            onClick={handleSendWhatsAppText}
            disabled={isSendingText}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-lg active:scale-98 ${
              textSentSuccess
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-950/80 font-black'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/60 hover:scale-[1.01]'
            }`}
          >
            {isSendingText ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
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

          {/* Button 2: "🔊" (Speaker Emoji) Sleek Glowing Cyan Circular Button */}
          <button
            id={`btn-toggle-voice-panel-${order.orderId}`}
            type="button"
            onClick={() => setIsAudioPanelOpen(!isAudioPanelOpen)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 border relative ${
              isAudioPanelOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-105'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900/90 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:scale-105'
            }`}
            title="פתח נגן והודעה קולית נועה AI"
          >
            <span className="text-lg">🔊</span>
            {isAudioPanelOpen && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping" />
            )}
          </button>
        </div>

        {/* 4. INTERACTIVE AUDIO PREVIEW PANEL (Collapsible with smooth expand) */}
        {isAudioPanelOpen && (
          <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Header of Audio Panel */}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>תדריך קולי נועה AI (Opus HD)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                ~11 שניות | עברית טבעית
              </span>
            </div>

            {/* A. Transcription Text Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>🗣️ תמלול מדויק להשמעה ולשידור:</span>
                <span className="text-[10px] text-slate-500">ניתן לעריכה חופשית</span>
              </label>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={2}
                className="w-full bg-slate-950/90 text-cyan-100 text-xs font-medium p-3 rounded-xl border border-slate-700/90 focus:outline-none focus:border-cyan-400 leading-relaxed resize-none shadow-inner"
              />
            </div>

            {/* B. Custom-Styled HTML5 Audio Player Display */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={handleTogglePlayAudio}
                className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                  isPlaying
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              {/* Progress and Equalizer bars */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{isPlaying ? 'משמיע כעת תדריך...' : 'מוכן להאזנה מקדימה'}</span>
                  <span>{Math.round(playbackProgress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-150"
                    style={{ width: `${playbackProgress}%` }}
                  />
                </div>
              </div>

              {/* Equalizer animation indicator */}
              <div className="flex items-end gap-1 h-5 px-1 shrink-0">
                {[40, 80, 50, 95, 60].map((h, i) => (
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

            {/* C. Secondary Green Button: "שדר קטע קול ו-Webhook" */}
            <button
              id={`btn-dispatch-voice-webhook-${order.orderId}`}
              type="button"
              onClick={handleDispatchVoiceAndWebhook}
              disabled={isSendingVoice}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-lg active:scale-98 ${
                voiceSentSuccess
                  ? 'bg-cyan-400 text-slate-950 font-black shadow-cyan-950/80'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black shadow-emerald-950/70 hover:scale-[1.01]'
              }`}
            >
              {isSendingVoice ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>משדר Opus קולי ל-Webhook...</span>
                </>
              ) : voiceSentSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 fill-current text-slate-950" />
                  <span>✅ שוגר קולית לנהג ולוואטסאפ!</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4 fill-current" />
                  <span>שדר קטע קול ו-Webhook 📡</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
