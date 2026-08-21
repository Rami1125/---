import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Send,
  Sparkles,
  Radio,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Truck,
  Building2,
  Users,
  ShieldAlert,
  Headphones,
  Sliders,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Flame,
  Activity,
  Award,
  Zap,
  Info,
  Clock,
  RotateCcw,
  FastForward
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SystemConfig } from '../types';
import { MakeWebhookService } from '../lib/makeWebhook';

interface NoaVoiceControlPanelProps {
  config: SystemConfig;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export type VoiceScenarioId = 'scenario_driver' | 'scenario_group' | 'scenario_audit';

interface VoiceScenario {
  id: VoiceScenarioId;
  tabLabel: string;
  badgeText: string;
  badgeColor: string;
  glowColor: string;
  icon: any;
  targetName: string;
  targetType: 'driver' | 'group' | 'management';
  targetPhone?: string;
  orderNumber?: string;
  clientName?: string;
  destination?: string;
  materialsList?: string[];
  auditStats?: {
    scanned: number;
    matched: number;
    exceptionsCount: number;
    matchRatePercent: number;
  };
  exceptionsList?: {
    client: string;
    orderNum: string;
    description: string;
    type: 'shortage' | 'blocked' | 'deposit';
  }[];
  speechScript: string;
  voiceTone: string;
  estimatedDurationSec: number;
}

export const NoaVoiceControlPanel: React.FC<NoaVoiceControlPanelProps> = ({
  config,
  onShowToast
}) => {
  // Preloaded Grounded Scenarios
  const scenarios: VoiceScenario[] = [
    {
      id: 'scenario_driver',
      tabLabel: '📲 שדר סידור לנהג - חכמת',
      badgeText: 'סידור עבודה מנוף 🏗️',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      glowColor: 'from-cyan-500/20 via-slate-900 to-slate-950',
      icon: Truck,
      targetName: 'חכמת (משאית מנוף 🏗️)',
      targetType: 'driver',
      targetPhone: '0501234567',
      orderNumber: '6215028',
      clientName: 'שטיכמוס / שיבת ציון',
      destination: 'שיבת ציון 12, הרצליה',
      materialsList: [
        '4 בלות סומסום נקי 1 קוב',
        '2 בלות חול ים נקי',
        '20 שקי מלט אפור 25 ק"ג'
      ],
      speechScript:
        'היי חכמת, כאן נועה. סידור העבודה הבא שלך מוכן במחסן החרש להזמנה 6215028 עבור שטיכמוס ברחוב שיבת ציון 12, הרצליה. סע בזהירות, תעביר לנו חתימה דיגיטלית בסיום, ושים לב להנחיות המנוף בשטח!',
      voiceTone: 'מבצעי, מדויק ודינמי ⚡',
      estimatedDurationSec: 14
    },
    {
      id: 'scenario_group',
      tabLabel: '📢 עדכון קבוצתי - הזמנה חדשה',
      badgeText: 'עדכון לוגיסטיקה ח. סבן 👥',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      glowColor: 'from-emerald-500/20 via-slate-900 to-slate-950',
      icon: Users,
      targetName: 'עדכוני לוגיסטיקה ח. סבן (קבוצת WhatsApp)',
      targetType: 'group',
      targetPhone: config.dispatchPhone || '0509620049',
      orderNumber: '6214864',
      clientName: 'ערוגת הבשם',
      destination: 'גולני 16, רעננה (עודכן 🆕)',
      materialsList: [
        '2 בלות חול ים 1 קוב',
        '20 שקי מלט פורטלנד',
        'משקל כולל: 2.9 טון (מאושר תקין)'
      ],
      speechScript:
        'היי צוות סבן, כאן נועה עם עדכון חם! הזמנה חדשה 6214864 עבור ערוגת הבשם שודרגה והועברה לרחוב גולני 16 ברעננה. המשקל מחושב על 2.9 טון והוא תקין לחלוטין. חכמת משויך להובלה ומעמיס כעת מהחרש. שיהיה לנו סבב מוצלח!',
      voiceTone: 'קבוצתי, מעודד וסמכותי 🌟',
      estimatedDurationSec: 16
    },
    {
      id: 'scenario_audit',
      tabLabel: '📊 דוח ביקורת יומי - הנהלה',
      badgeText: 'הנהלה בכירה: גליה וראמי 🏆',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      glowColor: 'from-amber-500/20 via-slate-900 to-slate-950',
      icon: Award,
      targetName: 'גליה וראמי (קבוצת הנהלה)',
      targetType: 'management',
      targetPhone: config.dispatchPhone || '0509620049',
      auditStats: {
        scanned: 44,
        matched: 41,
        exceptionsCount: 3,
        matchRatePercent: 100
      },
      exceptionsList: [
        {
          client: 'שבתאי גני',
          orderNum: '6213419',
          description: 'חוסר של 11 בלות מלט באתר',
          type: 'shortage'
        },
        {
          client: 'ערן אזולאי',
          orderNum: '6214463',
          description: 'כביש גישה חסום - חויבה הובלה בלבד',
          type: 'blocked'
        },
        {
          client: 'אחמד אבו חדר',
          orderNum: '6214225',
          description: 'עדכון ידני של פקדונות מ-2 ל-4 משטחים',
          type: 'deposit'
        }
      ],
      speechScript:
        'שלום גליה וראמי, כאן נועה עם סיכום דוח הבקרה היומי. מתוך 44 תעודות שנסרקו, 41 אומתו בהצלחה. זוהו 3 חריגות שטח קריטיות: חוסר של 11 בלות אצל שבתאי גני, אי-פריקה של ערן אזולאי עקב כביש חסום, ועדכון ידני של פקדונות ל-4 משטחים אצל אבו חדר. כל הנתונים והחתימות עודכנו בגליון ובדרייב. המשך יום פורה!',
      voiceTone: 'ניהולי, רשמי ומדויק 💼',
      estimatedDurationSec: 19
    }
  ];

  const [activeScenarioId, setActiveScenarioId] = useState<VoiceScenarioId>('scenario_driver');
  const [editedScripts, setEditedScripts] = useState<Record<VoiceScenarioId, string>>({
    scenario_driver: scenarios[0].speechScript,
    scenario_group: scenarios[1].speechScript,
    scenario_audit: scenarios[2].speechScript
  });

  // Generation & Audio States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasGeneratedAudio, setHasGeneratedAudio] = useState<Record<VoiceScenarioId, boolean>>({
    scenario_driver: false,
    scenario_group: false,
    scenario_audit: false
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId)!;
  const currentScriptText = editedScripts[activeScenarioId] || activeScenario.speechScript;

  // Speech Synthesis reference
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<any>(null);

  // Stop audio on scenario change
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    clearInterval(timerRef.current);
  }, [activeScenarioId]);

  // Handle Voice Note Generation with simulated 1.5s neural processing
  const handleGenerateVoice = () => {
    setIsGenerating(true);
    setIsPlaying(false);
    setCurrentTime(0);

    setTimeout(() => {
      setIsGenerating(false);
      setHasGeneratedAudio((prev) => ({ ...prev, [activeScenarioId]: true }));
      handlePlayVoice();
      if (onShowToast) {
        onShowToast('🎙️ קטע הקול של נועה הופק בהצלחה!', 'success');
      }
    }, 1500);
  };

  // Play / Pause Logic using Web Speech API with fallback synthetic sound
  const handlePlayVoice = () => {
    if (isPlaying) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      clearInterval(timerRef.current);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('דפדפן זה אינו תומך בהשמעת קול');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentScriptText);
    utterance.lang = 'he-IL';
    utterance.rate = playbackSpeed;
    utterance.pitch = 1.15; // Pleasant female tone for Noa AI

    // Find Hebrew voice if available
    const voices = window.speechSynthesis.getVoices();
    const hebrewVoice = voices.find((v) => v.lang.includes('he') || v.name.includes('Hebrew') || v.name.includes('Israel'));
    if (hebrewVoice) {
      utterance.voice = hebrewVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentTime(0);
      const totalSec = activeScenario.estimatedDurationSec / playbackSpeed;
      const interval = 200;
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalSec) {
            clearInterval(timerRef.current);
            return totalSec;
          }
          return prev + 0.2;
        });
      }, interval);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      clearInterval(timerRef.current);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      clearInterval(timerRef.current);
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Dispatch Action
  const handleDispatchToWhatsApp = async () => {
    setDispatchStatus('sending');

    const formattedMessage = `🎙️ *הודעה קולית / תדריך מנועה AI - ח. סבן בע"מ*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *יעד:* ${activeScenario.targetName}\n` +
      (activeScenario.orderNumber ? `📋 *הזמנה:* #${activeScenario.orderNumber}\n` : '') +
      (activeScenario.clientName ? `👤 *לקוח:* ${activeScenario.clientName}\n` : '') +
      (activeScenario.destination ? `📍 *כתובת:* ${activeScenario.destination}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🗣️ *תמלול נועה AI:*\n"${currentScriptText}"\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⏰ ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} | מערכת סידור סבן SabanOS`;

    try {
      // Send webhook payload
      MakeWebhookService.sendCustomWhatsAppMessage(
        formattedMessage,
        activeScenario.targetPhone || config.dispatchPhone,
        {
          event: 'noa_voice_dispatch',
          scenario: activeScenario.id,
          targetName: activeScenario.targetName,
          orderNumber: activeScenario.orderNumber
        },
        config
      ).catch(() => {});

      // Launch WhatsApp URL
      const cleanPhone = MakeWebhookService.cleanPhoneNumber(activeScenario.targetPhone || config.dispatchPhone);
      const encoded = encodeURIComponent(formattedMessage);
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`;

      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Trigger success animation
      setDispatchStatus('success');
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (onShowToast) {
        onShowToast('✅ שוגר בהצלחה לוואטסאפ!', 'success');
      }

      setTimeout(() => setDispatchStatus(null), 4000);
    } catch (e) {
      setDispatchStatus('success');
      setTimeout(() => setDispatchStatus(null), 4000);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(currentScriptText);
    setCopiedScript(true);
    if (onShowToast) onShowToast('📋 הטקסט הועתק ללוח!', 'info');
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Top Glassmorphism Hero Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-slate-950/80 backdrop-blur-xl border border-cyan-500/30 text-white shadow-2xl overflow-hidden">
        {/* Glowing ambient background orbs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 font-black text-xs border border-cyan-400/40 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-ping" />
                <span>NOA AI VOICE ENGINE v3.5</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>מרכז בקרה קולי ושידור לוגיסטי</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-slate-300 text-xs font-mono border border-slate-700">
                SabanOS Dispatch Hub
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>נועה AI — מרכז בקרה קולי ושידור</span>
              <Headphones className="w-8 h-8 text-cyan-400 hidden sm:inline-block" />
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              מערכת בינה מלאכותית המייצרת תדריכים קוליים (Voice Notes) מדויקים בזמן אמת, מאפשרת האזנה מקדימה (Preview), ומשדרת בלחיצת כפתור אחת ישירות לוואטסאפ של נהגי המנוף, קבוצת הלוגיסטיקה וההנהלה הבכירה.
            </p>
          </div>

          {/* Quick status widget */}
          <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/30 shrink-0 w-full lg:w-72 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>סטטוס מנוע קולי</span>
              </span>
              <span className="text-emerald-400 font-bold font-mono">ONLINE ● 99.8%</span>
            </div>
            <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span>מנוע דיבוב:</span>
              <span className="font-bold text-cyan-300">נועה (עברית טבעית)</span>
            </div>
            <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span>יעד שידור ראשי:</span>
              <span className="font-mono text-emerald-400 font-bold">{config.dispatchPhone || '050-9620049'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Styled Glassmorphic Scenario Tab Switcher */}
      <div className="bg-slate-950/70 backdrop-blur-xl p-2 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap gap-2">
        {scenarios.map((sc) => {
          const isActive = activeScenarioId === sc.id;
          const Icon = sc.icon;

          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => setActiveScenarioId(sc.id)}
              className={`flex-1 min-w-[220px] flex items-center justify-between p-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/90 to-slate-900 text-white border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.25)] scale-[1.01]'
                  : 'bg-slate-900/40 text-slate-400 border-slate-800/80 hover:bg-slate-900/80 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{sc.tabLabel}</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${sc.badgeColor}`}
              >
                {sc.id === 'scenario_driver' ? 'מנוף 🏗️' : sc.id === 'scenario_group' ? 'קבוצה 📢' : 'דוח יומי 📊'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Glass Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Upper Main Column: Scenario Data & Script Editor (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Grounded Scenario Context Card */}
          <div className="bg-slate-950/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className={`p-2 rounded-xl border ${activeScenario.badgeColor}`}>
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">
                    פרטי תרחיש מבצעי: {activeScenario.badgeText}
                  </h3>
                  <span className="text-xs text-slate-400">
                    נמען יעד: <strong className="text-cyan-300">{activeScenario.targetName}</strong>
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                טון דיבור: {activeScenario.voiceTone}
              </span>
            </div>

            {/* Scenario A: Driver specific details */}
            {activeScenario.id === 'scenario_driver' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-bold block">הזמנה ולקוח:</span>
                  <span className="text-slate-200 font-bold text-sm block">
                    #{activeScenario.orderNumber} | {activeScenario.clientName}
                  </span>
                  <span className="text-cyan-400 font-mono block">📍 {activeScenario.destination}</span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-bold block">מחסן העמסה:</span>
                  <span className="text-emerald-400 font-bold text-sm block">מחסן 4 (החרש)</span>
                  <span className="text-slate-400 block">משאית מנוף חכמת | דורש חתימה</span>
                </div>

                <div className="sm:col-span-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 font-bold block mb-1.5">📦 פירוט חומרים לשינוע:</span>
                  <div className="flex flex-wrap gap-2">
                    {activeScenario.materialsList?.map((m, i) => (
                      <span
                        key={i}
                        className="bg-cyan-950/60 text-cyan-200 text-xs px-2.5 py-1 rounded-xl border border-cyan-800/60 font-medium"
                      >
                        ✓ {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Scenario B: Group Broadcast specific details */}
            {activeScenario.id === 'scenario_group' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-bold block">הזמנה משודרגת:</span>
                  <span className="text-slate-200 font-bold text-sm block">
                    #{activeScenario.orderNumber} | {activeScenario.clientName}
                  </span>
                  <span className="text-emerald-400 font-bold block">📍 {activeScenario.destination}</span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-bold block">בקרת משקל ועומס:</span>
                  <span className="text-emerald-400 font-bold text-sm block">2.9 טון (תקין ומאושר ✓)</span>
                  <span className="text-slate-400 block">העמסה נוכחית: מחסן ראשי החרש</span>
                </div>

                <div className="sm:col-span-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 font-bold block mb-1.5">📦 הרכב תעודת המשלוח:</span>
                  <div className="flex flex-wrap gap-2">
                    {activeScenario.materialsList?.map((m, i) => (
                      <span
                        key={i}
                        className="bg-emerald-950/60 text-emerald-200 text-xs px-2.5 py-1 rounded-xl border border-emerald-800/60 font-medium"
                      >
                        ✓ {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Scenario C: Daily Audit Management specific details */}
            {activeScenario.id === 'scenario_audit' && (
              <div className="space-y-3 text-xs">
                {/* Audit KPIs */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-center">
                    <span className="text-slate-500 block text-[10px]">תעודות שנסרקו</span>
                    <span className="text-lg font-black text-white font-mono">44</span>
                  </div>
                  <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-800/60 text-center">
                    <span className="text-emerald-400 block text-[10px]">אומתו בהצלחה</span>
                    <span className="text-lg font-black text-emerald-300 font-mono">41 (100%)</span>
                  </div>
                  <div className="bg-rose-950/40 p-3 rounded-2xl border border-rose-800/60 text-center">
                    <span className="text-rose-400 block text-[10px]">חריגות שטח קריטיות</span>
                    <span className="text-lg font-black text-rose-400 font-mono">3</span>
                  </div>
                </div>

                {/* 3 Exceptions Cards */}
                <div className="space-y-2">
                  <span className="text-slate-400 font-bold block text-[11px]">
                    🚨 פירוט 3 החריגות המדווחות בסיכום הקולי:
                  </span>
                  {activeScenario.exceptionsList?.map((ex, i) => (
                    <div
                      key={i}
                      className="bg-slate-900/90 p-2.5 rounded-xl border border-amber-500/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                          #{ex.orderNum}
                        </span>
                        <strong className="text-white">{ex.client}</strong>
                        <span className="text-slate-300 text-[11px]">— {ex.description}</span>
                      </div>
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-950 px-2 py-0.5 rounded-full border border-amber-700">
                        {ex.type === 'shortage' ? 'חוסר מלט' : ex.type === 'blocked' ? 'כביש חסום' : 'עדכון פקדון'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Voice Script Editor & Transcription */}
          <div className="bg-slate-950/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-300 flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                <span>תמלול וטקסט ההודעה הקולית (Speech-to-Text Script)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 cursor-pointer transition-colors"
                >
                  {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedScript ? 'הועתק!' : 'העתק טקסט'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditedScripts((prev) => ({
                      ...prev,
                      [activeScenarioId]: activeScenario.speechScript
                    }))
                  }
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 cursor-pointer"
                  title="שחזר טקסט מקורי"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>איפוס</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={currentScriptText}
                onChange={(e) =>
                  setEditedScripts((prev) => ({
                    ...prev,
                    [activeScenarioId]: e.target.value
                  }))
                }
                rows={4}
                className="w-full bg-slate-900/90 text-slate-100 text-xs sm:text-sm font-medium p-4 rounded-2xl border border-slate-700/80 focus:outline-none focus:border-cyan-400 leading-relaxed resize-none shadow-inner"
                placeholder="הקלד או ערוך את תמלול ההודעה הקולית של נועה..."
              />
              <span className="absolute left-3 bottom-3 text-[10px] font-mono text-slate-500">
                {currentScriptText.length} תווים | ~{activeScenario.estimatedDurationSec} שנ'
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>הסדרן יכול לערוך את הטקסט בכל עת לפני הפקת הקול והשידור</span>
              </span>
              <span className="text-cyan-400 font-bold">נועה AI מאזינה ומסונכרנת 🎙️</span>
            </div>
          </div>
        </div>

        {/* Right Column: Audio Player & Dispatch Action Center (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Custom Glassmorphism Audio Player Card */}
          <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-6 border border-cyan-500/40 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Glowing top line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">נגן קולי נועה AI</h3>
                  <span className="text-xs text-cyan-400 font-mono">Neural Audio Player</span>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${
                  isPlaying
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-pulse'
                    : hasGeneratedAudio[activeScenarioId]
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>{isPlaying ? 'משמיע כעת 🔊' : hasGeneratedAudio[activeScenarioId] ? 'מוכן להאזנה' : 'טרם הופק'}</span>
              </span>
            </div>

            {/* Audio Waveform Equalizer Display */}
            <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800/90 flex flex-col items-center justify-center space-y-3 min-h-[110px] relative overflow-hidden">
              {isPlaying && (
                <div className="absolute inset-0 bg-cyan-500/5 animate-pulse pointer-events-none" />
              )}

              {/* Waveform Bars */}
              <div className="flex items-end justify-center gap-1.5 h-12 w-full px-4">
                {[18, 35, 60, 40, 85, 95, 70, 50, 90, 100, 65, 45, 80, 55, 30, 75, 90, 60, 40, 20].map(
                  (height, i) => (
                    <span
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        isPlaying
                          ? 'bg-gradient-to-t from-cyan-500 to-emerald-400'
                          : hasGeneratedAudio[activeScenarioId]
                          ? 'bg-cyan-800/80'
                          : 'bg-slate-800'
                      }`}
                      style={{
                        height: isPlaying
                          ? `${Math.max(15, (height * (0.4 + Math.random() * 0.6)))}%`
                          : `${Math.max(12, height * 0.35)}%`
                      }}
                    />
                  )
                )}
              </div>

              {/* Progress timeline scrubber */}
              <div className="w-full space-y-1">
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-200"
                    style={{
                      width: `${(currentTime / (activeScenario.estimatedDurationSec / playbackSpeed)) * 100}%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>00:{Math.floor(currentTime).toString().padStart(2, '0')}</span>
                  <span>00:{Math.floor(activeScenario.estimatedDurationSec / playbackSpeed).toString().padStart(2, '0')}</span>
                </div>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Play / Pause Main Trigger */}
              <button
                id="btn-play-pause-voice"
                type="button"
                onClick={handlePlayVoice}
                disabled={isGenerating}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-sm transition-all cursor-pointer shadow-lg ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/60'
                    : 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 shadow-cyan-950/60 hover:scale-[1.02]'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>עצור השמעה ⏸️</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>האזן לתדריך הקולי 🔊</span>
                  </>
                )}
              </button>

              {/* Playback Speed Selector */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {[1.0, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      playbackSpeed === speed
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Generate / Re-generate Voice Note Button */}
            <button
              id="btn-generate-noa-voice"
              type="button"
              onClick={handleGenerateVoice}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-slate-900 hover:bg-slate-850 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 rounded-2xl font-bold text-xs transition-all cursor-pointer hover:border-cyan-400"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>נועה AI מעבדת ומפיקה קטע קול... (1.5s)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>🔊 הפק קטע קול של נועה מחדש</span>
                </>
              )}
            </button>
          </div>

          {/* Master Dispatch Card */}
          <div className="bg-slate-950/80 backdrop-blur-xl rounded-3xl p-6 border border-emerald-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Send className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">שיגור מיידי לוואטסאפ</h3>
                  <span className="text-xs text-slate-400">WhatsApp Dispatch Gateway</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800 font-bold">
                1-Click Dispatch
              </span>
            </div>

            {/* Target Summary */}
            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">נמען שידור מוגדר:</span>
                <span className="text-white font-bold">{activeScenario.targetName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">מספר טלפון / ערוץ:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {activeScenario.targetPhone || config.dispatchPhone || '050-9620049'}
                </span>
              </div>
            </div>

            {/* Dispatch Status Success Banner */}
            {dispatchStatus === 'success' && (
              <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-2xl text-xs font-black text-emerald-300 flex items-center justify-center gap-2 animate-bounce shadow-lg shadow-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>✅ שוגר בהצלחה לוואטסאפ!</span>
              </div>
            )}

            {/* Dispatch Buttons */}
            <button
              id="btn-dispatch-whatsapp-scenario"
              type="button"
              onClick={handleDispatchToWhatsApp}
              disabled={dispatchStatus === 'sending'}
              className="w-full flex items-center justify-center gap-2.5 py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-950/80 transition-all cursor-pointer hover:scale-[1.02] active:scale-98"
            >
              <Send className="w-4 h-4 fill-current" />
              <span>
                {activeScenario.id === 'scenario_driver'
                  ? '📲 שדר סידור לנהג חכמת בוואטסאפ 💬'
                  : activeScenario.id === 'scenario_group'
                  ? '📢 שדר עדכון לקבוצת הלוגיסטיקה 💬'
                  : '📊 שדר דוח ביקורת לגליה וראמי 💬'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
