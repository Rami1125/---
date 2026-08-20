import React, { useState } from 'react';
import {
  Plus,
  Search,
  Send,
  Navigation as NavIcon,
  MessageSquare,
  Package,
  Clock,
  MapPin,
  Truck,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  ArrowUpRight,
  Sparkles,
  CheckSquare,
  Square,
  Copy,
  ExternalLink,
  PhoneCall,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, SystemConfig } from '../types';
import { MakeWebhookService } from '../lib/makeWebhook';
import { WhatsAppAutomationService, WhatsAppSummaryResult } from '../lib/whatsappAutomation';

interface OrdersViewProps {
  orders: Order[];
  config: SystemConfig;
  isAuthenticated: boolean;
  onAddOrder: (order: Order) => void;
  onSyncOrderToSheet: (order: Order) => void;
  onSelectOrderForAudit?: (orderNumber: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  config,
  isAuthenticated,
  onAddOrder,
  onSyncOrderToSheet,
  onSelectOrderForAudit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // WhatsApp Preview / Click-to-Chat / Webhook Modal
  const [whatsappModal, setWhatsappModal] = useState<{
    isOpen: boolean;
    title: string;
    targetPhone: string;
    summaryResult: WhatsAppSummaryResult;
    webhookStatus?: {
      success: boolean;
      endpointUsed?: string;
      error?: string;
    };
  } | null>(null);

  // Form state
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    orderNumber: '6214945',
    customerNumber: '602568',
    customerName: 'בוקטוס שלום-ביס הרצוג כס',
    warehouse: '4 (החרש)',
    deliveryAddress: 'בי"ס הרצוג, כפר סבא',
    itemsText: '1. 📦 מק"ט: 11500 | חול שק גדול (בלה) | כמות: 4\n2. 📦 מק"ט: 10002 | מלט אפור 25 ק"ג | כמות: 20',
    blowDeposit: '4 בלות',
    palletDeposit: '1 משטח',
    status: 'בסידור עבודה',
    distance: '8.4 ק"מ',
    duration: 'כ-15 דקות',
    driver: config.defaultDriver,
    truck: config.defaultTruck
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.includes(searchTerm) ||
      order.customerName.includes(searchTerm) ||
      order.customerNumber.includes(searchTerm) ||
      order.deliveryAddress.includes(searchTerm);

    const matchesWarehouse =
      warehouseFilter === 'ALL' || order.warehouse.includes(warehouseFilter);

    const matchesStatus =
      statusFilter === 'ALL' || order.status === statusFilter;

    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  // Selection handlers
  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  // Single Order sendJoniWhatsAppMessage execution
  const handleSendJoniWhatsApp = async (order: Order) => {
    setIsSendingWhatsApp(order.orderNumber);
    try {
      const res = await MakeWebhookService.sendDispatchNotification(order, config);
      if (res.success) {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      setWhatsappModal({
        isOpen: true,
        title: res.success
          ? `הודעה שוגרה לוואטסאפ בהצלחה! (#${order.orderNumber})`
          : `שגיאה בשידור (#${order.orderNumber})`,
        targetPhone: config.dispatchPhone,
        summaryResult: {
          formattedMessage: res.formattedMessage,
          clickToChatUrl: res.waDirectLink,
          cleanPhone: MakeWebhookService.cleanPhoneNumber(config.dispatchPhone),
          wazeLink: res.wazeLink,
          ordersCount: 1
        },
        webhookStatus: {
          success: res.success,
          endpointUsed: res.endpointUsed,
          error: res.error
        }
      });
    } catch (err: any) {
      const { message, waDirectLink, wazeLink } = MakeWebhookService.formatWhatsAppMessage(order, config);
      setWhatsappModal({
        isOpen: true,
        title: `שגיאת תקשורת בשיגור הזמנה #${order.orderNumber}`,
        targetPhone: config.dispatchPhone,
        summaryResult: {
          formattedMessage: message,
          clickToChatUrl: waDirectLink,
          cleanPhone: MakeWebhookService.cleanPhoneNumber(config.dispatchPhone),
          wazeLink: wazeLink,
          ordersCount: 1
        },
        webhookStatus: {
          success: false,
          error: err?.message || 'שגיאת רשת בלתי צפויה'
        }
      });
    } finally {
      setIsSendingWhatsApp(null);
    }
  };

  // Batch Orders sendJoniWhatsApp execution
  const handleBatchSendJoniWhatsApp = async () => {
    const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
    if (selectedOrders.length === 0) return;

    setIsSendingWhatsApp('BATCH');
    let successCount = 0;
    let lastResult: any = null;

    try {
      for (const order of selectedOrders) {
        const res = await MakeWebhookService.sendDispatchNotification(order, config);
        if (res.success) successCount++;
        lastResult = res;
      }

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 }
      });

      const batchSummary = WhatsAppAutomationService.createBatchOrdersSummary(selectedOrders, config);
      setWhatsappModal({
        isOpen: true,
        title: `שיגור סידור עבודה מרוכז (${successCount}/${selectedOrders.length} הזמנות נשלחו)`,
        targetPhone: config.dispatchPhone,
        summaryResult: batchSummary,
        webhookStatus: {
          success: successCount > 0,
          endpointUsed: lastResult?.endpointUsed,
          error: successCount === 0 ? 'כל ה-Webhooks נכשלו' : undefined
        }
      });
    } catch (err: any) {
      console.warn('Batch webhook failed', err);
    } finally {
      setIsSendingWhatsApp(null);
    }
  };

  // Direct Click-to-Chat launch
  const handleDirectLaunchWhatsApp = (summary: WhatsAppSummaryResult) => {
    window.open(summary.clickToChatUrl, '_blank', 'noopener,noreferrer');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Send via sendJoniWhatsAppMessage
  const handleSendViaWebhookAndWhatsApp = async (order: Order) => {
    await handleSendJoniWhatsApp(order);
  };

  const handleSubmitNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.orderNumber || !newOrder.customerName) return;

    const fullOrder: Order = {
      id: `ord-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      orderNumber: newOrder.orderNumber || '6000000',
      customerNumber: newOrder.customerNumber || '600000',
      customerName: newOrder.customerName || 'לקוח חדש',
      warehouse: newOrder.warehouse || '4 (החרש)',
      deliveryAddress: newOrder.deliveryAddress || 'הוד השרון',
      itemsText: newOrder.itemsText || '',
      blowDeposit: newOrder.blowDeposit || 'תקין',
      palletDeposit: newOrder.palletDeposit || 'תקין',
      status: 'בסידור עבודה',
      distance: newOrder.distance || '15 ק"מ',
      duration: newOrder.duration || 'כ-20 דקות',
      driver: newOrder.driver || config.defaultDriver,
      truck: newOrder.truck || config.defaultTruck,
      customerFolderUrl: `https://drive.google.com/drive/folders/${config.deliveryDocsFolderId}`
    };

    onAddOrder(fullOrder);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Action Buttons & Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>ניהול הזמנות וסידור עבודה</span>
              <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-full border border-slate-200">
                {orders.length} הזמנות
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              קליטת הזמנות קומקס, שיבוץ נהגים ומשאיות, ושיגור סידור עבודה ישירות לוואטסאפ ({config.dispatchPhone})
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs shadow-emerald-200 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>קליטת הזמנה חדשה</span>
            </button>
          </div>
        </div>

        {/* Filters & Selection actions */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="חיפוש לפי מספר הזמנה, שם לקוח, ח.פ / מספר לקוח, או כתובת..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-right"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 font-medium text-right"
            >
              <option value="ALL">כל המחסנים</option>
              <option value="החרש">מחסן 4 (החרש)</option>
              <option value="התלמיד">מחסן 1 (התלמיד)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 font-medium text-right"
            >
              <option value="ALL">כל הסטטוסים</option>
              <option value="בסידור עבודה">בסידור עבודה</option>
              <option value="סופק במלואו">סופק במלואו</option>
              <option value="אספקה חלקית">אספקה חלקית</option>
              <option value="מאושר">מאושר</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center justify-end">
            <button
              onClick={handleSelectAll}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            >
              {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>בטל בחירת הכל</span>
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

      {/* Batch Selection Action Floating Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="sticky top-20 z-40 bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 animate-in fade-in slide-in-from-top-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              {selectedOrderIds.length}
            </div>
            <div>
              <h4 className="text-sm font-black text-white">
                נבחרו {selectedOrderIds.length} הזמנות לסידור עבודה
              </h4>
              <p className="text-xs text-slate-400">
                שליחה מרוכזת לסדרן/נהג: <span className="text-emerald-400 font-mono font-bold">{config.dispatchPhone}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleBatchSendJoniWhatsApp}
              disabled={isSendingWhatsApp === 'BATCH'}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isSendingWhatsApp === 'BATCH' ? 'animate-spin' : ''}`} />
              <span>{isSendingWhatsApp === 'BATCH' ? 'משגר ל-Make...' : 'שגר סידור מרוכז (sendJoniWhatsApp)'}</span>
            </button>

            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
            >
              נקה בחירה
            </button>
          </div>
        </div>
      )}

      {/* Orders Grid / Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredOrders.map((order) => {
          const wazeUrl = `https://www.waze.com/ul?q=${encodeURIComponent(order.deliveryAddress)}&navigate=yes`;
          const isSelected = selectedOrderIds.includes(order.id);

          return (
            <div
              key={order.id}
              className={`bg-white rounded-2xl border transition-all flex flex-col justify-between p-5 shadow-xs ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                  : 'border-slate-200 hover:shadow-md'
              }`}
            >
              <div>
                {/* Header of card with selection checkbox */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleSelectOrder(order.id)}
                      className="mt-1 p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                      title={isSelected ? 'הסר מבחירה מרוכזת' : 'בחר לסידור עבודה מרוכז'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 font-mono">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            order.status === 'סופק במלואו'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {order.status}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {order.timestamp}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {order.customerName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        מספר לקוח קומקס: <strong className="text-slate-700 font-mono">{order.customerNumber}</strong> | מחסן: <strong className="text-slate-700">{order.warehouse}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery Address & Routing */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3 text-xs space-y-1.5">
                  <div className="flex items-start gap-2 text-slate-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{order.deliveryAddress}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{order.driver || config.defaultDriver} ({order.truck || config.defaultTruck})</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span>{order.distance}</span>
                      <span>•</span>
                      <span>{order.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Items breakdown */}
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>פריטי הזמנה מקומקס:</span>
                  </h4>
                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">
                    {order.itemsText}
                  </div>
                </div>

                {/* Deposits verification */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                  <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-2 text-amber-900">
                    <span className="font-bold block">🛡️ פקדון בלות:</span>
                    <span className="text-amber-800 font-medium">{order.blowDeposit}</span>
                  </div>
                  <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-2 text-blue-900">
                    <span className="font-bold block">🛡️ פקדון משטחים:</span>
                    <span className="text-blue-800 font-medium">{order.palletDeposit}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <a
                    href={wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors"
                    title="פתח ניווט Waze לכתובת האספקה"
                  >
                    <NavIcon className="w-3 h-3" />
                    <span>Waze</span>
                  </a>

                  {order.customerFolderUrl && (
                    <a
                      href={order.customerFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors"
                      title="פתח תיקיית לקוח ב-Google Drive"
                    >
                      <FolderOpen className="w-3 h-3 text-amber-600" />
                      <span className="hidden sm:inline">תיק לקוח</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isAuthenticated && (
                    <button
                      onClick={() => onSyncOrderToSheet(order)}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                      title="הזרק שורה לטאב הזמנות ב-Google Sheets"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleSendJoniWhatsApp(order)}
                    disabled={isSendingWhatsApp === order.orderNumber}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingWhatsApp === order.orderNumber ? 'animate-spin' : ''}`} />
                    <span>{isSendingWhatsApp === order.orderNumber ? 'משגר ל-Make...' : 'שגר וואטסאפ'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* WhatsApp / Make.com Webhook Delivery Modal */}
      {whatsappModal && whatsappModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold ${
                  whatsappModal.webhookStatus?.success !== false ? 'bg-emerald-600' : 'bg-amber-600'
                }`}>
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {whatsappModal.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    באמצעות פונקציית <span className="font-mono text-emerald-800 font-bold">sendJoniWhatsAppMessage</span> (Make Webhooks)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWhatsappModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Delivery & Webhook status info */}
            <div className={`rounded-xl p-3 border mb-4 text-xs ${
              whatsappModal.webhookStatus?.success !== false
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center justify-between font-bold mb-1">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-700" />
                  <span>נשלח לוואטסאפ של ג'וני/סדרן:</span>
                  <span className="font-mono text-emerald-800 font-black">{whatsappModal.summaryResult.cleanPhone}</span>
                </div>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black ${
                  whatsappModal.webhookStatus?.success !== false
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-amber-200 text-amber-900'
                }`}>
                  {whatsappModal.webhookStatus?.success !== false ? '✅ נשלח ל-Webhook' : '⚠️ שגיאת Webhook'}
                </span>
              </div>
              {whatsappModal.webhookStatus?.endpointUsed && (
                <div className="text-[11px] text-slate-500 font-mono mt-1 truncate" dir="ltr">
                  Endpoint: {whatsappModal.webhookStatus.endpointUsed}
                </div>
              )}
              {whatsappModal.webhookStatus?.error && (
                <div className="text-[11px] text-amber-800 mt-1 font-medium">
                  {whatsappModal.webhookStatus.error}
                </div>
              )}
            </div>

            {/* Formatted Message Display */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">גוף ההודעה שנשלחה לוואטסאפ:</label>
                <button
                  onClick={() => handleCopyMessage(whatsappModal.summaryResult.formattedMessage)}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedNotification ? 'הועתק!' : 'העתק טקסט'}</span>
                </button>
              </div>
              <div className="bg-slate-900 text-emerald-300 rounded-xl p-4 font-mono text-xs whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto border border-slate-800">
                {whatsappModal.summaryResult.formattedMessage}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWhatsappModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                סגור
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyMessage(whatsappModal.summaryResult.formattedMessage)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedNotification ? 'הועתק בהצלחה' : 'העתק הודעה'}</span>
                </button>

                <button
                  onClick={() => handleDirectLaunchWhatsApp(whatsappModal.summaryResult)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-200 flex items-center gap-2 transition-all cursor-pointer"
                  title="פתיחה ידנית ב-WhatsApp Web במקרה הצורך"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>פתח ב-WhatsApp Web (גיבוי)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Add Order Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>קליטת הזמנה חדשה מקומקס</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNewOrder} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">מספר הזמנה (קומקס):</label>
                  <input
                    type="text"
                    required
                    value={newOrder.orderNumber}
                    onChange={(e) => setNewOrder({ ...newOrder, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">מספר לקוח (ח.פ / קוד):</label>
                  <input
                    type="text"
                    required
                    value={newOrder.customerNumber}
                    onChange={(e) => setNewOrder({ ...newOrder, customerNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">שם לקוח / פרויקט:</label>
                  <input
                    type="text"
                    required
                    value={newOrder.customerName}
                    onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">מחסן יוצא:</label>
                  <select
                    value={newOrder.warehouse}
                    onChange={(e) => setNewOrder({ ...newOrder, warehouse: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  >
                    <option value="4 (החרש)">4 (החרש - כפר סבא)</option>
                    <option value="1 (התלמיד)">1 (התלמיד - הוד השרון)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">כתובת אספקה מלאה (לניווט Waze):</label>
                <input
                  type="text"
                  required
                  value={newOrder.deliveryAddress}
                  onChange={(e) => setNewOrder({ ...newOrder, deliveryAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">רשימת מוצרים ומק"טים:</label>
                <textarea
                  rows={4}
                  required
                  value={newOrder.itemsText}
                  onChange={(e) => setNewOrder({ ...newOrder, itemsText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">אימות בלות (פקדון):</label>
                  <input
                    type="text"
                    value={newOrder.blowDeposit}
                    onChange={(e) => setNewOrder({ ...newOrder, blowDeposit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">אימות משטחים (פקדון):</label>
                  <input
                    type="text"
                    value={newOrder.palletDeposit}
                    onChange={(e) => setNewOrder({ ...newOrder, palletDeposit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  שמור הזמנה ושבץ לסידור
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
