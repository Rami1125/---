import React, { useState, useMemo } from 'react';
import {
  FileText,
  Copy,
  Send,
  RefreshCw,
  CheckSquare,
  Square,
  Truck,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  Check,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, SystemConfig } from '../types';
import { GoogleSheetsService } from '../lib/googleSheets';
import { MakeWebhookService } from '../lib/makeWebhook';

interface MorningReportGeneratorProps {
  orders: Order[];
  config: SystemConfig;
  isAuthenticated: boolean;
  onRefreshData?: () => Promise<void>;
}

export const MorningReportGenerator: React.FC<MorningReportGeneratorProps> = ({
  orders,
  config,
  isAuthenticated,
  onRefreshData
}) => {
  // Selection state
  const [selectedOrderNumbers, setSelectedOrderNumbers] = useState<string[]>(() => {
    // By default select all active orders in "בסידור עבודה"
    return orders
      .filter((o) => o.status === 'בסידור עבודה' || !o.status.includes('סופק') && !o.status.includes('בוטל'))
      .map((o) => o.orderNumber);
  });

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'WORK_PLAN' | 'ALL'>('WORK_PLAN');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [driverFilter, setDriverFilter] = useState<string>('ALL');
  const [targetPhone, setTargetPhone] = useState<string>(config.dispatchPhone || '0509620049');
  const [customReportText, setCustomReportText] = useState<string>('');
  const [isGenerated, setIsGenerated] = useState<boolean>(true);
  const [isSyncingFromSheets, setIsSyncingFromSheets] = useState<boolean>(false);
  const [isSendingWebhook, setIsSendingWebhook] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; message: string; isQueueFull?: boolean } | null>(null);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status filter
      if (statusFilter === 'WORK_PLAN') {
        const s = o.status || '';
        if (s.includes('סופק במלואו') || s.includes('אספקה חלקית') || s.includes('בוטל')) {
          return false;
        }
      }

      // Warehouse filter
      if (warehouseFilter !== 'ALL' && !o.warehouse.includes(warehouseFilter)) {
        return false;
      }

      // Driver filter
      if (driverFilter !== 'ALL') {
        const d = o.driver || '';
        if (!d.includes(driverFilter)) return false;
      }

      return true;
    });
  }, [orders, statusFilter, warehouseFilter, driverFilter]);

  // Selected orders array
  const selectedOrders = useMemo(() => {
    return orders.filter((o) => selectedOrderNumbers.includes(o.orderNumber));
  }, [orders, selectedOrderNumbers]);

  // Helper to extract clean time HH:MM from timestamp or deliveryTime
  const extractTime = (order: Order, defaultTime: string): string => {
    if (order.deliveryTime && order.deliveryTime.trim()) {
      return order.deliveryTime.trim();
    }
    if (order.timestamp) {
      // Look for HH:MM pattern
      const match = order.timestamp.match(/(\d{2}:\d{2})/);
      if (match) return match[1];
    }
    return defaultTime;
  };

  // Helper to format today's date in Hebrew format (e.g. 20.08.2026 or 20/08/2026)
  const getFormattedDate = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Logic: Build Morning Report Text from an array of orders
  const buildReportText = (targetOrders: Order[]): string => {
    if (targetOrders.length === 0) {
      return '⚠️ לא נבחרו הזמנות לדוח. אנא סמן לפחות הזמנה אחת מהרשימה.';
    }

    const todayDate = getFormattedDate();

    // Grouping by driver
    const hikmatOrders: { time: string; text: string; warehouse: string; truckType: 'מנוף' | 'משאית' }[] = [];
    const aliOrders: { time: string; text: string; warehouse: string; truckType: 'מנוף' | 'משאית' }[] = [];
    const otherOrders: { time: string; text: string; driverName: string; warehouse: string; truckType: 'מנוף' | 'משאית' }[] = [];

    let countHarash = 0;
    let countTalmid = 0;
    let countCrane = 0;
    let countTruck = 0;

    targetOrders.forEach((o, idx) => {
      // 1. Warehouse counts
      const w = o.warehouse || '';
      if (w.includes('החרש') || w.includes('4')) {
        countHarash++;
      } else if (w.includes('התלמיד') || w.includes('1')) {
        countTalmid++;
      } else {
        countHarash++;
      }

      // 2. Driver grouping & split logic
      const driverRaw = (o.driver || 'חכמת/עלי').trim();
      const truckRaw = (o.truck || '').trim();

      if (driverRaw === 'חכמת/עלי' || (driverRaw.includes('חכמת') && driverRaw.includes('עלי'))) {
        const assignedDriver = idx % 2 === 0 ? 'חכמת' : 'עלי';
        const defaultTime = assignedDriver === 'חכמת' ? `0${7 + hikmatOrders.length}:00` : `0${7 + aliOrders.length}:00`;
        const time = extractTime(o, defaultTime);

        if (assignedDriver === 'חכמת') {
          countCrane++;
          hikmatOrders.push({
            time,
            text: `${time} | 📦 ${o.orderNumber}: ${o.customerName}`,
            warehouse: w,
            truckType: 'מנוף'
          });
        } else {
          countTruck++;
          aliOrders.push({
            time,
            text: `${time} | 📦 ${o.orderNumber}: ${o.customerName}`,
            warehouse: w,
            truckType: 'משאית'
          });
        }
      } else if (driverRaw.includes('חכמת')) {
        const defaultTime = `0${7 + hikmatOrders.length}:00`;
        const time = extractTime(o, defaultTime);
        countCrane++;
        hikmatOrders.push({
          time,
          text: `${time} | 📦 ${o.orderNumber}: ${o.customerName}`,
          warehouse: w,
          truckType: 'מנוף'
        });
      } else if (driverRaw.includes('עלי')) {
        const defaultTime = `0${7 + aliOrders.length}:00`;
        const time = extractTime(o, defaultTime);
        countTruck++;
        aliOrders.push({
          time,
          text: `${time} | 📦 ${o.orderNumber}: ${o.customerName}`,
          warehouse: w,
          truckType: 'משאית'
        });
      } else {
        const time = extractTime(o, '08:00');
        const isCrane = truckRaw.includes('מנוף');
        if (isCrane) countCrane++; else countTruck++;
        otherOrders.push({
          time,
          text: `${time} | 📦 ${o.orderNumber}: ${o.customerName}`,
          driverName: driverRaw,
          warehouse: w,
          truckType: isCrane ? 'מנוף' : 'משאית'
        });
      }
    });

    // Construct the requested WhatsApp template
    let report = `📅 *דוח בוקר - ח. סבן | [${todayDate}]*\n\n`;

    // Hikmat Section
    if (hikmatOrders.length > 0) {
      report += `👤 *חכמת (מנוף 🏗️):*\n`;
      hikmatOrders.forEach((item) => {
        report += `${item.text}\n`;
      });
      report += `\n`;
    }

    // Ali Section
    if (aliOrders.length > 0) {
      report += `👤 *עלי (משאית 🚛):*\n`;
      aliOrders.forEach((item) => {
        report += `${item.text}\n`;
      });
      report += `\n`;
    }

    // Other Drivers
    if (otherOrders.length > 0) {
      const groupedByOther: { [key: string]: typeof otherOrders } = {};
      otherOrders.forEach((item) => {
        groupedByOther[item.driverName] = groupedByOther[item.driverName] || [];
        groupedByOther[item.driverName].push(item);
      });

      Object.entries(groupedByOther).forEach(([dName, list]) => {
        report += `👤 *${dName}:*\n`;
        list.forEach((item) => {
          report += `${item.text}\n`;
        });
        report += `\n`;
      });
    }

    // Summary Section
    report += `📊 *סיכום סידור:*\n`;
    report += `*סה"כ הזמנות: ${targetOrders.length}*\n`;
    report += `📦 *מהמחסנים: החרש (${countHarash}) | התלמיד (${countTalmid})*\n`;
    report += `🚛 *סוגי הובלה: מנוף (${countCrane}) | משאית (${countTruck})*\n\n`;
    report += `*סידור נעים, שיהיה לנו בוקר טוב!* ✨`;

    return report;
  };

  // Auto-generate report text whenever selectedOrders or orders change
  React.useEffect(() => {
    const text = buildReportText(selectedOrders);
    setCustomReportText(text);
    setIsGenerated(true);
  }, [selectedOrders]);

  // Explicit Manual Generation Trigger
  const handleGenerateReport = () => {
    const text = buildReportText(selectedOrders);
    setCustomReportText(text);
    setIsGenerated(true);

    if (selectedOrders.length > 0) {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // Toggle selection
  const handleToggleSelect = (orderNumber: string) => {
    setSelectedOrderNumbers((prev) =>
      prev.includes(orderNumber) ? prev.filter((id) => id !== orderNumber) : [...prev, orderNumber]
    );
  };

  // Select all / Deselect all
  const handleSelectAll = () => {
    if (selectedOrderNumbers.length === filteredOrders.length) {
      setSelectedOrderNumbers([]);
    } else {
      setSelectedOrderNumbers(filteredOrders.map((o) => o.orderNumber));
    }
  };

  // Copy to Clipboard
  const handleCopyWhatsApp = () => {
    const textToCopy = customReportText || buildReportText(selectedOrders);
    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Safe WhatsApp Launcher helper (Bypasses iframe popup restrictions)
  const launchWhatsAppUrl = (url: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (_) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Direct WhatsApp Open to target phone
  const handleOpenWhatsAppDirect = (overridePhone?: string) => {
    const textToSend = customReportText || buildReportText(selectedOrders);
    const phoneToUse = overridePhone || targetPhone || config.dispatchPhone;
    const cleanPhone = MakeWebhookService.cleanPhoneNumber(phoneToUse);
    const encoded = encodeURIComponent(textToSend);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    launchWhatsAppUrl(url);
  };

  // Share to any WhatsApp group or contact
  const handleShareToWhatsAppGroup = () => {
    const textToSend = customReportText || buildReportText(selectedOrders);
    const encoded = encodeURIComponent(textToSend);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    launchWhatsAppUrl(url);
  };

  // Direct WhatsApp Web link
  const handleOpenWhatsAppWeb = (overridePhone?: string) => {
    const textToSend = customReportText || buildReportText(selectedOrders);
    const phoneToUse = overridePhone || targetPhone || config.dispatchPhone;
    const cleanPhone = MakeWebhookService.cleanPhoneNumber(phoneToUse);
    const encoded = encodeURIComponent(textToSend);
    const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    launchWhatsAppUrl(url);
  };

  // Send to Webhook (Make / Dispatcher)
  const handleSendWebhook = async () => {
    const textToSend = customReportText || buildReportText(selectedOrders);
    setIsSendingWebhook(true);
    setWebhookResult(null);

    const phoneToUse = targetPhone || config.dispatchPhone;

    try {
      const extraPayload = {
        event: 'morning_report_generated',
        date: getFormattedDate(),
        dispatchPhone: phoneToUse,
        targetPhone: phoneToUse,
        totalOrdersCount: selectedOrders.length,
        orders: selectedOrders.map((o) => ({
          orderNumber: o.orderNumber,
          customerNumber: o.customerNumber,
          customerName: o.customerName,
          warehouse: o.warehouse,
          driver: o.driver,
          deliveryTime: o.deliveryTime,
          status: o.status
        }))
      };

      const result = await MakeWebhookService.sendCustomWhatsAppMessage(
        textToSend,
        phoneToUse,
        extraPayload,
        config
      );

      setIsSendingWebhook(false);
      if (result.success) {
        setWebhookResult({
          success: true,
          message: `הודעת WhatsApp שודרה בהצלחה ל-Make.com (${result.endpointUsed || 'Endpoint פעיל'})! שיטה: ${result.methodUsed || 'ישיר'}`
        });
        confetti({ particleCount: 60, spread: 65, origin: { y: 0.65 } });
      } else {
        const isQueueFull = result.error?.includes('Queue is full') || result.responseStatus === 400;
        setWebhookResult({
          success: false,
          isQueueFull,
          message: isQueueFull
            ? 'שרת Make עמוס (Queue is full) או שה-Scenario כבוי. לחץ מיד על כפתור "פתח בוואטסאפ ישיר" לשליחה ללא תלות ב-Make!'
            : `שגיאה בשידור ל-Make: ${result.error || 'בדוק שתרחיש Make מופעל (Active)'}. לחץ על "פתח בוואטסאפ ישיר" לשליחה מיידית!`
        });
      }
    } catch (e: any) {
      setIsSendingWebhook(false);
      setWebhookResult({
        success: false,
        message: `שגיאת תקשורת: ${e?.message || 'אנא השתמש בכפתור פתח בוואטסאפ ישיר'}`
      });
    }
  };

  // Refresh from sheets
  const handleRefresh = async () => {
    if (onRefreshData) {
      setIsSyncingFromSheets(true);
      try {
        await onRefreshData();
      } finally {
        setIsSyncingFromSheets(false);
      }
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-black px-2.5 py-0.5 bg-indigo-100 text-indigo-900 rounded-lg border border-indigo-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
                <span>מחולל דוח בוקר עצמאי (Standalone Web App)</span>
              </span>
              <span className="text-xs text-slate-500 font-mono">
                טאב מקור: <strong className="text-slate-800 font-bold">דשבורד_הזמנות</strong>
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600" />
              <span>מחולל דוח בוקר יומי לסידור עבודה ו-WhatsApp</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              ממשק עצמאי השואב נתונים בזמן אמת מ-Google Sheets (טאב "דשבורד_הזמנות"), מאפשר בחירת הזמנות בתיבות סימון, קיבוץ אוטומטי לפי נהג (חכמת/עלי) וחישוב סיכום מדויק ל-WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {isAuthenticated && onRefreshData && (
              <button
                onClick={handleRefresh}
                disabled={isSyncingFromSheets}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFromSheets ? 'animate-spin' : ''}`} />
                <span>רענן מ-Sheets</span>
              </button>
            )}

            <button
              onClick={handleGenerateReport}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-md shadow-indigo-200 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>הפק דוח בוקר 🚀</span>
            </button>
          </div>
        </div>

        {/* Filter and Selection Deck */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="md:col-span-4">
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold text-right cursor-pointer"
            >
              <option value="WORK_PLAN">📋 הצג רק הזמנות פתוחות (בסידור עבודה)</option>
              <option value="ALL">🌐 הצג את כל ההזמנות (כולל סופקו/בוטלו)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium text-right cursor-pointer"
            >
              <option value="ALL">🚚 כל הנהגים (חכמת / עלי)</option>
              <option value="חכמת">חכמת (מנוף)</option>
              <option value="עלי">עלי (משאית)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium text-right cursor-pointer"
            >
              <option value="ALL">🏢 כל המחסנים (החרש / התלמיד)</option>
              <option value="החרש">מחסן 4 (החרש)</option>
              <option value="התלמיד">מחסן 1 (התלמיד)</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-end">
            <button
              onClick={handleSelectAll}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              {selectedOrderNumbers.length === filteredOrders.length && filteredOrders.length > 0 ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>בטל בחירה</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-500" />
                  <span>בחר הכל ({filteredOrders.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout: Left (Orders Selection Table) / Right (WhatsApp Report Preview & Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">
                  רשימת הזמנות לבחירה מטאב "דשבורד_הזמנות"
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-800 rounded-full border border-indigo-200">
                נבחרו {selectedOrderNumbers.length} מתוך {filteredOrders.length}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10">
                  <tr>
                    <th className="p-2.5 w-10 text-center">
                      <button
                        onClick={handleSelectAll}
                        className="cursor-pointer"
                        title="בחר / נקה הכל"
                      >
                        {selectedOrderNumbers.length === filteredOrders.length && filteredOrders.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 mx-auto" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 mx-auto" />
                        )}
                      </button>
                    </th>
                    <th className="p-2.5">מס' הזמנה</th>
                    <th className="p-2.5">לקוח / אתר</th>
                    <th className="p-2.5">מחסן</th>
                    <th className="p-2.5">נהג</th>
                    <th className="p-2.5">שעה</th>
                    <th className="p-2.5">סטטוס</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredOrders.map((order) => {
                    const isSelected = selectedOrderNumbers.includes(order.orderNumber);
                    const time = extractTime(order, '07:30');

                    return (
                      <tr
                        key={order.id || order.orderNumber}
                        onClick={() => handleToggleSelect(order.orderNumber)}
                        className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-50/60 font-semibold' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by row click
                            className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 font-mono font-bold text-slate-900">
                          #{order.orderNumber}
                        </td>
                        <td className="p-2.5 max-w-[160px] truncate" title={order.customerName}>
                          {order.customerName}
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-600">
                          {order.warehouse.includes('החרש') ? '🏭 4️⃣ החרש' : order.warehouse.includes('התלמיד') ? '🏟️ 1️⃣ התלמיד' : order.warehouse}
                        </td>
                        <td className="p-2.5">
                          <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {order.driver || 'חכמת/עלי'}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-indigo-700 font-bold">
                          {time}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              order.status === 'בסידור עבודה'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : order.status.includes('סופק')
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">לא נמצאו הזמנות התואמות את הסינון הנוכחי</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>סה"כ הזמנות נבחרות להפקה: <strong className="text-slate-900 font-bold">{selectedOrderNumbers.length}</strong></span>
            <button
              onClick={handleGenerateReport}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>רענן תוכן דוח</span>
              <ArrowRight className="w-3 h-3 rotate-180" />
            </button>
          </div>
        </div>

        {/* Right Column: Textarea & Output Preview (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">
                  תוצאה סופית מעוצבת ל-WhatsApp
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                Ready for WhatsApp
              </span>
            </div>

            {/* Formatted Textarea Output */}
            <div className="relative">
              <textarea
                value={customReportText || (isGenerated ? '' : 'לחץ על "הפק דוח בוקר 🚀" כדי לייצר את הטקסט המעוצב על בסיס ההזמנות שנבחרו...')}
                onChange={(e) => setCustomReportText(e.target.value)}
                placeholder="טקסט דוח בוקר יופיע כאן..."
                rows={14}
                className="w-full bg-slate-950/90 text-emerald-300 font-mono text-xs p-4 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 leading-relaxed resize-y whitespace-pre-line text-right selection:bg-emerald-800 selection:text-white"
                dir="rtl"
              />
            </div>

            {/* Destination Phone & Quick Options */}
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>מספר טלפון / יעד לשליחה:</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {MakeWebhookService.cleanPhoneNumber(targetPhone)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="050-9620049"
                  className="w-full bg-slate-900 text-white font-mono text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setTargetPhone(config.dispatchPhone || '0509620049')}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  סדרן ({config.dispatchPhone || '0509620049'})
                </button>
                <button
                  type="button"
                  onClick={() => setTargetPhone('0501234567')}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  חכמת (מנוף)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetPhone('0507654321')}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  עלי (משאית)
                </button>
              </div>
            </div>

            {/* Webhook status message banner */}
            {webhookResult && (
              <div
                className={`mt-3 p-3 rounded-2xl text-xs font-bold space-y-2 ${
                  webhookResult.success
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {webhookResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{webhookResult.message}</span>
                </div>

                {!webhookResult.success && (
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsAppDirect()}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer text-xs animate-pulse"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>עקוף תקלה: שלח כעת ישירות בוואטסאפ 💬</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons Deck */}
          <div className="pt-4 mt-3 border-t border-slate-800 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Copy Button */}
              <button
                id="btn-copy-morning-report"
                type="button"
                onClick={handleCopyWhatsApp}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  copySuccess
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                {copySuccess ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>הועתק בהצלחה! 🎉</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-400" />
                    <span>העתק לוואטסאפ (Copy)</span>
                  </>
                )}
              </button>

              {/* Direct WhatsApp Open */}
              <button
                id="btn-open-whatsapp-direct"
                type="button"
                onClick={() => handleOpenWhatsAppDirect()}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-950 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>פתח בוואטסאפ לסדרן 💬</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Share to WhatsApp Group or any Contact */}
              <button
                id="btn-share-whatsapp-group"
                type="button"
                onClick={handleShareToWhatsAppGroup}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-700/60 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>שתף לקבוצה / איש קשר 👥</span>
              </button>

              {/* WhatsApp Web Direct */}
              <button
                id="btn-open-whatsapp-web"
                type="button"
                onClick={() => handleOpenWhatsAppWeb()}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>פתח ב-WhatsApp Web 💻</span>
              </button>
            </div>

            {/* Webhook Button */}
            <button
              id="btn-send-morning-webhook"
              type="button"
              onClick={handleSendWebhook}
              disabled={isSendingWebhook}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer hover:scale-[1.01] disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isSendingWebhook ? 'animate-spin' : ''}`} />
              <span>{isSendingWebhook ? 'משדר ל-Webhook...' : 'שלח ל-Webhook (Make / סדרן) 🚀'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Google Apps Script Integration Box */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-black text-white">סקריפט Google Apps Script ישיר לשליחה אוטומטית מתוך הגיליון ל-MAKE</h3>
              <p className="text-[11px] text-slate-400">הדבק סקריפט זה ב-Extensions &gt; Apps Script ב-Google Sheets להרצה ידנית או בטריגר יומי אוטומטי (שעה 07:00)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const gasCode = `/**
 * פונקציה לשליחת דוח בוקר ישירות מגיליון Google Sheets לצינור MAKE
 * ח. סבן בע"מ - סידור עבודה יומי
 */
function sendMorningReportToMake() {
  const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();
  const SHEET = SPREADSHEET.getSheetByName("דשבורד_הזמנות");
  
  if (!SHEET) {
    Logger.log("❌ שגיאה: לא נמצא טאב בשם 'דשבורד_הזמנות'");
    return;
  }

  // כתובת ה-Webhook של Make.com
  const MAKE_WEBHOOK_URL = "${config.makeWebhookEndpoints[0] || 'https://hook.us2.make.com/e1ifxqwm66ji347ooyg6abuk7i2voom0'}";
  const DISPATCH_PHONE = "${config.dispatchPhone || '0509620049'}";

  const data = SHEET.getDataRange().getValues();
  if (data.length <= 1) {
    Logger.log("⚠️ אין נתונים בגיליון");
    return;
  }

  // תאריך של היום
  const today = new Date();
  const dateStr = Utilities.formatDate(today, "GMT+3", "dd.MM.yyyy");

  const hikmatList = [];
  const aliList = [];
  const otherList = [];

  let countHarash = 0;
  let countTalmid = 0;
  let countCrane = 0;
  let countTruck = 0;
  let totalOrders = 0;

  // סריקת כל השורות מטאב דשבורד_הזמנות (מתחיל משורה 2 - דילוג על כותרות)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const timestampRaw = String(row[0] || '');
    const orderNumber = String(row[1] || '').trim();
    const customerName = String(row[3] || '').trim();
    const warehouse = String(row[4] || '').trim();
    const driver = String(row[9] || '').trim();
    const status = String(row[10] || '').trim();

    if (!orderNumber || !customerName) continue;

    // סינון: רק הזמנות פתוחות בסידור עבודה
    if (status.includes("סופק") || status.includes("בוטל")) continue;

    totalOrders++;

    // ספירת מחסנים
    if (warehouse.includes("החרש") || warehouse.includes("4")) {
      countHarash++;
    } else if (warehouse.includes("התלמיד") || warehouse.includes("1")) {
      countTalmid++;
    } else {
      countHarash++;
    }

    // שליפת שעה
    let time = "07:30";
    const timeMatch = timestampRaw.match(/(\\d{2}:\\d{2})/);
    if (timeMatch) {
      time = timeMatch[1];
    }

    // פיצול וקיבוץ נהגים
    if (driver === "חכמת/עלי" || (driver.includes("חכמת") && driver.includes("עלי"))) {
      if (totalOrders % 2 === 1) {
        countCrane++;
        const defaultTime = "0" + (6 + hikmatList.length + 1) + ":00";
        hikmatList.push((time !== "07:30" ? time : defaultTime) + " | 📦 " + orderNumber + ": " + customerName);
      } else {
        countTruck++;
        const defaultTime = "0" + (6 + aliList.length + 1) + ":00";
        aliList.push((time !== "07:30" ? time : defaultTime) + " | 📦 " + orderNumber + ": " + customerName);
      }
    } else if (driver.includes("חכמת")) {
      countCrane++;
      const defaultTime = "0" + (6 + hikmatList.length + 1) + ":00";
      hikmatList.push((time !== "07:30" ? time : defaultTime) + " | 📦 " + orderNumber + ": " + customerName);
    } else if (driver.includes("עלי")) {
      countTruck++;
      const defaultTime = "0" + (6 + aliList.length + 1) + ":00";
      aliList.push((time !== "07:30" ? time : defaultTime) + " | 📦 " + orderNumber + ": " + customerName);
    } else {
      countTruck++;
      otherList.push(time + " | 📦 " + orderNumber + ": " + customerName + " (" + driver + ")");
    }
  }

  if (totalOrders === 0) {
    Logger.log("ℹ️ לא נמצאו הזמנות פתוחות לשידור");
    return;
  }

  // בניית גוף ההודעה
  let msg = "📅 *דוח בוקר - ח. סבן | [" + dateStr + "]*\\n\\n";

  if (hikmatList.length > 0) {
    msg += "👤 *חכמת (מנוף 🏗️):*\\n";
    msg += hikmatList.join("\\n") + "\\n\\n";
  }

  if (aliList.length > 0) {
    msg += "👤 *עלי (משאית 🚛):*\\n";
    msg += aliList.join("\\n") + "\\n\\n";
  }

  if (otherList.length > 0) {
    msg += "👤 *נהגים נוספים:*\\n";
    msg += otherList.join("\\n") + "\\n\\n";
  }

  msg += "📊 *סיכום סידור:*\\n";
  msg += "*סה\\"כ הזמנות: " + totalOrders + "*\\n";
  msg += "📦 *מהמחסנים: החרש (" + countHarash + ") | התלמיד (" + countTalmid + ")*\\n";
  msg += "🚛 *סוגי הובלה: מנוף (" + countCrane + ") | משאית (" + countTruck + ")*\\n\\n";
  msg += "*סידור נעים, שיהיה לנו בוקר טוב!* ✨";

  // פירמוט טלפון בינלאומי
  let cleanPhone = DISPATCH_PHONE.replace(/[^\\d]/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '972' + cleanPhone.substring(1);
  if (!cleanPhone.startsWith('972')) cleanPhone = '972' + cleanPhone;

  // שידור ל-MAKE
  const payload = {
    phone: cleanPhone,
    to: cleanPhone,
    recipient: cleanPhone,
    message: msg,
    text: msg,
    whatsapp_message: msg,
    event: "morning_report_from_sheets",
    totalOrders: totalOrders,
    date: dateStr,
    timestamp: new Date().toISOString()
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(MAKE_WEBHOOK_URL, options);
    Logger.log("✅ תגובה מ-MAKE (" + response.getResponseCode() + "): " + response.getContentText());
  } catch (err) {
    Logger.log("❌ שגיאת שידור מ-Apps Script: " + err.toString());
  }
}`;
              navigator.clipboard.writeText(gasCode);
              alert('הקוד הועתק בהצלחה! ניתן להדביק אותו ב-Extensions > Apps Script ב-Google Sheets');
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span>העתק קוד Apps Script ללוח</span>
          </button>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl font-mono text-[11px] text-emerald-400 max-h-56 overflow-y-auto leading-relaxed text-left" dir="ltr">
          <pre>{`function sendMorningReportToMake() {
  const SHEET = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("דשבורד_הזמנות");
  const MAKE_WEBHOOK_URL = "${config.makeWebhookEndpoints[0] || 'https://hook.us2.make.com/e1ifxqwm66ji347ooyg6abuk7i2voom0'}";
  // שואב נתונים, מקבץ לפי נהג (חכמת/עלי), מחשב סיכום מחסנים ומשדר ל-MAKE
  // ... (לחץ על כפתור ההעתקה לקוד המלא)
}`}</pre>
        </div>
      </div>

      {/* Integration Reference & API Guide */}
      <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 text-slate-700 text-xs leading-relaxed space-y-3">
        <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>הסבר חיבור טכני ל-Google Sheets API (שליפה ישירה מטאב "דשבורד_הזמנות")</span>
        </div>
        <p>
          האפליקציה שואבת בזמן אמת את נתוני טאב <strong className="text-slate-900 font-mono">"דשבורד_הזמנות"</strong> בגיליון <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">{config.spreadsheetId}</code> באמצעות קריאת Google Sheets REST API:
        </p>
        <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto text-left" dir="ltr">
          GET https://sheets.googleapis.com/v4/spreadsheets/{config.spreadsheetId}/values/דשבורד_הזמנות!A1:N
        </div>
        <p>
          עמודות שנשלפות ומעובדות: <strong>עמודה A</strong> (תאריך ושעת קליטה), <strong>עמודה B</strong> (מספר הזמנה), <strong>עמודה D</strong> (שם לקוח / אתר), <strong>עמודה E</strong> (מחסן יוצא - החרש/התלמיד), <strong>עמודה J</strong> (נהג משוייך), ו-<strong>עמודה K</strong> (סטטוס אספקה נוכחי).
        </p>
      </div>
    </div>
  );
};
