import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Send,
  Navigation as NavIcon,
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
  PhoneCall,
  Edit3,
  RefreshCw,
  Tag,
  Check,
  ChevronDown,
  Calendar,
  UserCheck,
  Flame,
  BellRing,
  Eye,
  EyeOff,
  Filter,
  CheckCheck,
  Clock4,
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, SystemConfig } from '../types';
import { MakeWebhookService } from '../lib/makeWebhook';
import { WhatsAppAutomationService, WhatsAppSummaryResult } from '../lib/whatsappAutomation';

export const AVAILABLE_STATUSES = [
  { id: 'בסידור עבודה', label: 'בסידור עבודה', color: 'bg-amber-500/10 text-amber-900 border-amber-300 dark:border-amber-700/40' },
  { id: 'בדרך לאתר', label: 'בדרך לאתר / יצא לחלוקה', color: 'bg-blue-500/10 text-blue-900 border-blue-300 dark:border-blue-700/40' },
  { id: 'סופק במלואו', label: 'סופק במלואו', color: 'bg-emerald-500/10 text-emerald-900 border-emerald-300 dark:border-emerald-700/40' },
  { id: 'אספקה חלקית', label: 'אספקה חלקית', color: 'bg-purple-500/10 text-purple-900 border-purple-300 dark:border-purple-700/40' },
  { id: 'ממתין לתעודה', label: 'ממתין לתעודה חתומה', color: 'bg-indigo-500/10 text-indigo-900 border-indigo-300 dark:border-indigo-700/40' },
  { id: 'מאושר', label: 'מאושר להפצה', color: 'bg-teal-500/10 text-teal-900 border-teal-300 dark:border-teal-700/40' },
  { id: 'בוטל / הושהה', label: 'בוטל / הושהה', color: 'bg-rose-500/10 text-rose-900 border-rose-300 dark:border-rose-700/40' }
];

export const SMART_DRIVERS = [
  { id: 'חכמת/עלי', name: 'חכמת / עלי (משולב)', truck: 'משאית מנוף 615-41-002', color: 'bg-slate-900 text-white' },
  { id: 'חכמת', name: 'חכמת (נהג ראשי)', truck: 'משאית מנוף 615-41-002', color: 'bg-indigo-600 text-white' },
  { id: 'עלי', name: 'עלי (נהג הפצה)', truck: 'משאית רכינה 812-33-501', color: 'bg-emerald-700 text-white' },
  { id: 'עצמאי/הובלה', name: 'הובלה חיצונית', truck: 'משאית קבלן חיצוני', color: 'bg-amber-600 text-white' }
];

// Statuses that are considered "Archived / Completed / Closed"
export const CLOSED_STATUSES = ['סופק במלואו', 'אספקה חלקית', 'בוטל / הושהה', 'בוטל'];

interface OrdersViewProps {
  orders: Order[];
  config: SystemConfig;
  isAuthenticated: boolean;
  onAddOrder: (order: Order) => void;
  onUpdateOrder?: (order: Order) => void;
  onUpdateOrderStatus?: (orderNumber: string, newStatus: string) => void;
  onSyncOrderToSheet: (order: Order) => void;
  onSyncOrdersDashboard?: () => void;
  onSelectOrderForAudit?: (orderNumber: string) => void;
  isSyncingDashboard?: boolean;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  config,
  isAuthenticated,
  onAddOrder,
  onUpdateOrder,
  onUpdateOrderStatus,
  onSyncOrderToSheet,
  onSyncOrdersDashboard,
  onSelectOrderForAudit,
  isSyncingDashboard = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [driverFilter, setDriverFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [showClosedOrders, setShowClosedOrders] = useState(false); // Default: hide completed/cancelled/partial
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'urgentDelivery'>('newest');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [activeStatusMenuOrderId, setActiveStatusMenuOrderId] = useState<string | null>(null);
  const [activeDriverMenuOrderId, setActiveDriverMenuOrderId] = useState<string | null>(null);
  const [customStatusInput, setCustomStatusInput] = useState('');
  const [isCustomStatusModalOpen, setIsCustomStatusModalOpen] = useState<{ isOpen: boolean; order: Order | null }>({
    isOpen: false,
    order: null
  });

  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // WhatsApp Preview / Click-to-Chat / Webhook Modal
  const [whatsappModal, setWhatsappModal] = useState<{
    isOpen: boolean;
    title: string;
    targetPhone: string;
    summaryResult: WhatsAppSummaryResult;
    isReminder?: boolean;
    webhookStatus?: {
      success: boolean;
      endpointUsed?: string;
      error?: string;
    };
  } | null>(null);

  // New Order Form state
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
    driver: config.defaultDriver || 'חכמת/עלי',
    truck: config.defaultTruck || 'משאית מנוף 615-41-002',
    deliveryDate: new Date().toISOString().substring(0, 10),
    deliveryTime: '11:00'
  });

  // Calculate if order is approaching or urgent (< 3 hours or today)
  const getOrderUrgency = (order: Order): { isUrgent: boolean; isApproaching: boolean; diffHours: number | null; label: string } => {
    if (CLOSED_STATUSES.includes(order.status)) {
      return { isUrgent: false, isApproaching: false, diffHours: null, label: 'הושלם/בוטל' };
    }

    if (!order.deliveryDate) {
      // Fallback check order.timestamp
      return { isUrgent: false, isApproaching: false, diffHours: null, label: '' };
    }

    try {
      const timeStr = order.deliveryTime || '12:00';
      const targetDate = new Date(`${order.deliveryDate}T${timeStr}:00`);
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 0 && diffHours > -12) {
        return { isUrgent: true, isApproaching: true, diffHours, label: 'מועד חלף / דחוף מיידית!' };
      }
      if (diffHours >= 0 && diffHours <= 3) {
        return { isUrgent: true, isApproaching: true, diffHours, label: `מתקרב למועד! (בעוד כ-${Math.max(1, Math.round(diffHours * 60))} דק')` };
      }
      if (diffHours > 3 && diffHours <= 8) {
        return { isUrgent: false, isApproaching: true, diffHours, label: `מתוכנן להיום (בשעה ${timeStr})` };
      }
    } catch {
      // ignore
    }

    return { isUrgent: false, isApproaching: false, diffHours: null, label: '' };
  };

  // Helper to parse order timestamp/number for strictly newest to oldest sorting
  const getOrderSortScore = (order: Order): number => {
    if (order.timestamp) {
      const parsed = Date.parse(order.timestamp);
      if (!isNaN(parsed)) return parsed;
    }
    const num = parseInt(order.orderNumber.replace(/\D/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  // Filtered & Sorted orders
  const { visibleOrders, hiddenClosedCount } = useMemo(() => {
    let closedCount = 0;

    const filtered = orders.filter((order) => {
      const isClosed = CLOSED_STATUSES.includes(order.status);
      if (isClosed) {
        closedCount++;
      }

      // Hide closed orders unless user toggled "showClosedOrders" or searched specifically for that status
      if (isClosed && !showClosedOrders && statusFilter === 'ALL') {
        return false;
      }

      const matchesSearch =
        order.orderNumber.includes(searchTerm) ||
        order.customerName.includes(searchTerm) ||
        order.customerNumber.includes(searchTerm) ||
        order.deliveryAddress.includes(searchTerm) ||
        (order.driver && order.driver.includes(searchTerm)) ||
        (order.status && order.status.includes(searchTerm));

      const matchesWarehouse =
        warehouseFilter === 'ALL' || order.warehouse.includes(warehouseFilter);

      const matchesStatus =
        statusFilter === 'ALL' || order.status === statusFilter;

      const matchesDriver =
        driverFilter === 'ALL' || (order.driver && order.driver.includes(driverFilter));

      const matchesDate =
        !dateFilter || (order.deliveryDate && order.deliveryDate === dateFilter);

      return matchesSearch && matchesWarehouse && matchesStatus && matchesDriver && matchesDate;
    });

    // Sorting: default is Newest to Oldest
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'urgentDelivery') {
        const urgA = getOrderUrgency(a).isApproaching ? 1 : 0;
        const urgB = getOrderUrgency(b).isApproaching ? 1 : 0;
        if (urgA !== urgB) return urgB - urgA;
      }

      if (sortBy === 'oldest') {
        return getOrderSortScore(a) - getOrderSortScore(b);
      }

      // Default: 'newest' (מהחדש לישן)
      return getOrderSortScore(b) - getOrderSortScore(a);
    });

    return { visibleOrders: sorted, hiddenClosedCount: closedCount };
  }, [orders, searchTerm, warehouseFilter, statusFilter, driverFilter, dateFilter, showClosedOrders, sortBy]);

  // Selection handlers
  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === visibleOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(visibleOrders.map((o) => o.id));
    }
  };

  // Status Change Handler with real-time online update
  const handleStatusChange = (orderNumber: string, newStatus: string) => {
    setActiveStatusMenuOrderId(null);
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderNumber, newStatus);
    }
  };

  // Quick Driver Assign Handler
  const handleQuickDriverAssign = (order: Order, driverId: string, driverName: string, truckName: string) => {
    setActiveDriverMenuOrderId(null);
    const updated = {
      ...order,
      driver: driverName,
      truck: truckName
    };
    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }
  };

  // Quick Date/Time Update Handler
  const handleQuickDateTimeChange = (order: Order, dateVal: string, timeVal: string) => {
    const updated = {
      ...order,
      deliveryDate: dateVal,
      deliveryTime: timeVal
    };
    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }
  };

  // Custom Status Apply
  const handleApplyCustomStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStatusInput.trim() || !isCustomStatusModalOpen.order) return;
    handleStatusChange(isCustomStatusModalOpen.order.orderNumber, customStatusInput.trim());
    setIsCustomStatusModalOpen({ isOpen: false, order: null });
    setCustomStatusInput('');
  };

  // Single Order sendJoniWhatsApp execution
  const handleSendJoniWhatsApp = async (order: Order, isUrgentReminder = false) => {
    setIsSendingWhatsApp(order.orderNumber);
    try {
      const res = await MakeWebhookService.sendDispatchNotification(order, config);
      if (res.success) {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      setWhatsappModal({
        isOpen: true,
        title: isUrgentReminder
          ? `🚨 תזכורת דחופה למועד אספקה שוגרה לוואטסאפ! (#${order.orderNumber})`
          : `הודעת סידור עבודה שוגרה בהצלחה! (#${order.orderNumber})`,
        targetPhone: config.dispatchPhone,
        isReminder: isUrgentReminder,
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
        particleCount: 90,
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
      status: newOrder.status || 'בסידור עבודה',
      distance: newOrder.distance || '15 ק"מ',
      duration: newOrder.duration || 'כ-20 דקות',
      driver: newOrder.driver || config.defaultDriver || 'חכמת/עלי',
      truck: newOrder.truck || config.defaultTruck || 'משאית מנוף 615-41-002',
      deliveryDate: newOrder.deliveryDate || new Date().toISOString().substring(0, 10),
      deliveryTime: newOrder.deliveryTime || '12:00',
      customerFolderUrl: `https://drive.google.com/drive/folders/${config.deliveryDocsFolderId}`
    };

    onAddOrder(fullOrder);
    setIsAddModalOpen(false);
  };

  const handleSaveEditedOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    if (onUpdateOrder) {
      onUpdateOrder(editingOrder);
    }
    setEditingOrder(null);
  };

  const getStatusBadgeStyle = (status: string) => {
    const match = AVAILABLE_STATUSES.find((s) => s.id === status);
    if (match) return match.color;
    if (status.includes('סופק')) return 'bg-emerald-500/10 text-emerald-900 border-emerald-300';
    if (status.includes('דרך') || status.includes('חלוקה')) return 'bg-blue-500/10 text-blue-900 border-blue-300';
    if (status.includes('בוטל')) return 'bg-rose-500/10 text-rose-900 border-rose-300';
    return 'bg-amber-500/10 text-amber-900 border-amber-300';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm relative overflow-hidden">
        {/* Subtle accent background line */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-linear-to-r from-emerald-500 via-teal-500 to-indigo-600" />

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-xs font-black px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-200 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                <span>דשבורד סידור עבודה חכם • סדר מהחדש לישן</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                גיליון: {config.spreadsheetId}
              </span>
              {hiddenClosedCount > 0 && !showClosedOrders && (
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200 flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  <span>{hiddenClosedCount} סופקו/בוטלו הוסתרו אוטומטית</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Package className="w-6 h-6 text-emerald-600" />
              <span>ניהול הזמנות, שיוך נהג חכם (חכמת/עלי) ותזכורות מועד</span>
              <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-800 font-black rounded-full border border-emerald-200">
                {visibleOrders.length} כרטיסים פעילים
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              כרטיסי הזמנה מעוצבים ויזואלית, בורר תאריך ושעת אספקה מהיר, שיוך נהג בלחיצה, אפקט פעימה ויזואלי להזמנות שמועדן מתקרב, ושיגור תזכורת WhatsApp מעוצבת.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Toggle show/hide closed orders */}
            <button
              onClick={() => setShowClosedOrders((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-2xl border transition-all cursor-pointer shadow-xs ${
                showClosedOrders
                  ? 'bg-slate-900 text-white border-slate-800'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="הצג או הסתר הזמנות בסטטוס סופק במלואו / אספקה חלקית / בוטל"
            >
              {showClosedOrders ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>מציג סופקו/בוטלו ({hiddenClosedCount})</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>הסתר סופקו/בוטלו ({hiddenClosedCount})</span>
                </>
              )}
            </button>

            {isAuthenticated && onSyncOrdersDashboard && (
              <button
                onClick={onSyncOrdersDashboard}
                disabled={isSyncingDashboard}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                title="סנכרן טאב דשבורד_הזמנות ב-Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDashboard ? 'animate-spin' : ''}`} />
                <span>רענן דשבורד_הזמנות</span>
              </button>
            )}

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-200 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>קליטת הזמנה חדשה</span>
            </button>
          </div>
        </div>

        {/* Enhanced Multi-Filter Bar with Smart Sorting & Driver Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="חיפוש מהיר: הזמנה, לקוח, כתובת, נהג, מק''ט..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-right font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-bold text-right cursor-pointer"
            >
              <option value="newest">⏱️ מיון: מהחדש לישן</option>
              <option value="urgentDelivery">🚨 לפי דחיפות ומועד קרוב</option>
              <option value="oldest">⏳ מיון: מהישן לחדש</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium text-right cursor-pointer"
            >
              <option value="ALL">🚚 כל הנהגים (חכמת / עלי)</option>
              <option value="חכמת">חכמת</option>
              <option value="עלי">עלי</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium text-right cursor-pointer"
            >
              <option value="ALL">🏢 כל המחסנים</option>
              <option value="החרש">מחסן 4 (החרש)</option>
              <option value="התלמיד">מחסן 1 (התלמיד)</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-end">
            <button
              onClick={handleSelectAll}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              {selectedOrderIds.length === visibleOrders.length && visibleOrders.length > 0 ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>בטל בחירה</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-500" />
                  <span>בחר הכל ({visibleOrders.length})</span>
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
                נבחרו {selectedOrderIds.length} הזמנות לשיגור סידור עבודה
              </h4>
              <p className="text-xs text-slate-400">
                שליחה מרוכזת לוואטסאפ של הסדרן/נהג: <span className="text-emerald-400 font-mono font-bold">{config.dispatchPhone}</span>
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
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              נקה בחירה
            </button>
          </div>
        </div>
      )}

      {/* Orders Grid - Elevated Visual Hierarchy Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {visibleOrders.map((order) => {
          const wazeUrl = `https://www.waze.com/ul?q=${encodeURIComponent(order.deliveryAddress)}&navigate=yes`;
          const isSelected = selectedOrderIds.includes(order.id);
          const isStatusMenuOpen = activeStatusMenuOrderId === order.orderNumber;
          const isDriverMenuOpen = activeDriverMenuOrderId === order.orderNumber;
          const urgency = getOrderUrgency(order);
          const currentDriver = order.driver || config.defaultDriver || 'חכמת/עלי';
          const isClosed = CLOSED_STATUSES.includes(order.status);

          return (
            <div
              key={order.id}
              className={`rounded-3xl border transition-all flex flex-col justify-between p-5.5 shadow-sm relative overflow-hidden ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/20 shadow-md'
                  : urgency.isUrgent
                  ? 'border-amber-400 bg-gradient-to-b from-amber-50/40 to-white shadow-md'
                  : isClosed
                  ? 'border-slate-200 bg-slate-50/60 opacity-80 hover:opacity-100'
                  : 'border-slate-200/90 bg-white hover:shadow-lg hover:border-slate-300'
              }`}
            >
              {/* Approaching delivery pulsing banner badge */}
              {urgency.isApproaching && !isClosed && (
                <div className="mb-3.5 -mx-5.5 -mt-5.5 px-4 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-xs font-black flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                    <span>🚨 {urgency.label}</span>
                  </div>
                  <button
                    onClick={() => handleSendJoniWhatsApp(order, true)}
                    className="bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white transition-colors cursor-pointer flex items-center gap-1"
                    title="שלח תזכורת מיידית לנהג ב-WhatsApp"
                  >
                    <BellRing className="w-3 h-3" />
                    <span>שלח תזכורת WhatsApp</span>
                  </button>
                </div>
              )}

              <div>
                {/* Header: Order Number, Customer, Date, Status, Driver */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleSelectOrder(order.id)}
                      className="mt-1 p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      title={isSelected ? 'הסר מבחירה' : 'בחר להפצה'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg font-black text-slate-900 font-mono tracking-tight">
                          #{order.orderNumber}
                        </span>

                        {/* Interactive Status Badge & Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveStatusMenuOrderId(isStatusMenuOpen ? null : order.orderNumber)
                            }
                            className={`text-xs px-2.5 py-1 rounded-full font-black border flex items-center gap-1.5 transition-all cursor-pointer hover:opacity-90 shadow-2xs ${getStatusBadgeStyle(
                              order.status
                            )}`}
                            title="לחץ לשינוי סטטוס אספקה אונליין"
                          >
                            <span>{order.status}</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {/* Quick Status Dropdown Menu */}
                          {isStatusMenuOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                              <div className="text-[11px] font-bold text-slate-400 px-2 py-1 border-b border-slate-100 mb-1 flex items-center justify-between">
                                <span>שינוי סטטוס אספקה אונליין:</span>
                                <Tag className="w-3 h-3 text-slate-400" />
                              </div>
                              <div className="space-y-1">
                                {AVAILABLE_STATUSES.map((statusItem) => (
                                  <button
                                    key={statusItem.id}
                                    onClick={() => handleStatusChange(order.orderNumber, statusItem.id)}
                                    className={`w-full text-right px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                                      order.status === statusItem.id
                                        ? 'bg-slate-900 text-white'
                                        : 'hover:bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    <span className="truncate">{statusItem.label}</span>
                                    {order.status === statusItem.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                                  </button>
                                ))}
                                <button
                                  onClick={() => {
                                    setActiveStatusMenuOrderId(null);
                                    setIsCustomStatusModalOpen({ isOpen: true, order });
                                    setCustomStatusInput(order.status);
                                  }}
                                  className="w-full text-right px-2.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center justify-between pt-1.5 border-t border-slate-100 cursor-pointer"
                                >
                                  <span>+ סטטוס מותאם אישית...</span>
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {order.timestamp || 'עכשיו'}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900">
                        {order.customerName}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>קוד לקוח: <strong className="text-slate-700 font-mono">{order.customerNumber}</strong></span>
                        <span>•</span>
                        <span>מחסן יוצא: <strong className="text-slate-700">{order.warehouse}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Top Right: Edit Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingOrder(order)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer"
                      title="עריכת כרטיס הזמנה מלאה"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ערוך</span>
                    </button>
                  </div>
                </div>

                {/* Delivery Date & Time + Smart Driver Assignment Bar */}
                <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80 mb-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Date & Time Picker */}
                    <div className="bg-white rounded-xl p-2 border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>מועד אספקה:</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={order.deliveryDate || ''}
                          onChange={(e) =>
                            handleQuickDateTimeChange(order, e.target.value, order.deliveryTime || '11:00')
                          }
                          className="text-xs font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                          title="שנה תאריך אספקה"
                        />
                        <input
                          type="time"
                          value={order.deliveryTime || '11:00'}
                          onChange={(e) =>
                            handleQuickDateTimeChange(order, order.deliveryDate || new Date().toISOString().substring(0, 10), e.target.value)
                          }
                          className="text-xs font-bold text-slate-900 bg-slate-50 px-1.5 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                          title="שנה שעת אספקה"
                        />
                      </div>
                    </div>

                    {/* Driver Assignment Dropdown */}
                    <div className="relative">
                      <div
                        onClick={() =>
                          setActiveDriverMenuOrderId(isDriverMenuOpen ? null : order.orderNumber)
                        }
                        className="bg-white hover:bg-slate-50 transition-colors rounded-xl p-2 border border-slate-200 flex items-center justify-between gap-2 shadow-2xs cursor-pointer"
                        title="לחץ לשיוך נהג חכם (חכמת או עלי)"
                      >
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold truncate">
                          <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>נהג:</span>
                          <span className="text-slate-900 font-black truncate">{currentDriver}</span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                          <span>שייך נהג</span>
                          <ChevronDown className="w-3 h-3" />
                        </span>
                      </div>

                      {/* Driver quick selection menu */}
                      {isDriverMenuOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                          <div className="text-[11px] font-bold text-slate-400 px-2 py-1 border-b border-slate-100 mb-1 flex items-center justify-between">
                            <span>שיוך נהג ומשאית (אונליין):</span>
                            <UserCheck className="w-3 h-3 text-indigo-600" />
                          </div>
                          <div className="space-y-1">
                            {SMART_DRIVERS.map((d) => (
                              <button
                                key={d.id}
                                onClick={() => handleQuickDriverAssign(order, d.id, d.name, d.truck)}
                                className={`w-full text-right p-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                                  currentDriver.includes(d.id)
                                    ? 'bg-slate-900 text-white'
                                    : 'hover:bg-indigo-50 text-slate-800'
                                }`}
                              >
                                <div>
                                  <div className="font-black">{d.name}</div>
                                  <div className={`text-[10px] ${currentDriver.includes(d.id) ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {d.truck}
                                  </div>
                                </div>
                                {currentDriver.includes(d.id) && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Address & Waze Navigation info */}
                  <div className="flex items-start justify-between gap-2 text-xs pt-1 border-t border-slate-200/60">
                    <div className="flex items-start gap-1.5 text-slate-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="font-bold">{order.deliveryAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 shrink-0">
                      <span>{order.distance}</span>
                      <span>•</span>
                      <span>{order.duration}</span>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="text-[11px] text-indigo-950 bg-indigo-50 p-2 rounded-xl border border-indigo-100 font-medium">
                      <strong>הערות פריקה / מנוף:</strong> {order.notes}
                    </div>
                  )}
                </div>

                {/* Items breakdown */}
                <div className="mb-3">
                  <div className="bg-slate-900 text-emerald-400 rounded-2xl p-3 border border-slate-800 text-xs font-mono whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">
                    {order.itemsText}
                  </div>
                </div>

                {/* Deposits verification badges */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                  <div className="bg-amber-500/10 border border-amber-300/80 rounded-xl p-2 text-amber-950">
                    <span className="font-black block">🛡️ פקדון בלות:</span>
                    <span className="text-amber-900 font-bold">{order.blowDeposit}</span>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-300/80 rounded-xl p-2 text-blue-950">
                    <span className="font-black block">🛡️ פקדון משטחים:</span>
                    <span className="text-blue-900 font-bold">{order.palletDeposit}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Waze, WhatsApp, Drive, Sheets */}
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
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-200 cursor-pointer"
                      title="הזרק שורה לטאב הזמנות ב-Google Sheets"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleSendJoniWhatsApp(order)}
                    disabled={isSendingWhatsApp === order.orderNumber}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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

      {visibleOrders.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-800">לא נמצאו כרטיסי הזמנות בסינון הנוכחי</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {hiddenClosedCount > 0 && !showClosedOrders
              ? `ישנן ${hiddenClosedCount} הזמנות שהושלמו/בוטלו והוסתרו מהתצוגה. לחץ על "מציג סופקו/בוטלו" לצפייה בהן.`
              : 'נסה לשנות את מונח החיפוש או לאפס את המסננים.'}
          </p>
          {hiddenClosedCount > 0 && !showClosedOrders && (
            <button
              onClick={() => setShowClosedOrders(true)}
              className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              הצג {hiddenClosedCount} הזמנות שהושלמו
            </button>
          )}
        </div>
      )}

      {/* WhatsApp / Make.com Webhook Delivery Modal */}
      {whatsappModal && whatsappModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold shadow-xs ${
                  whatsappModal.isReminder ? 'bg-amber-600' : whatsappModal.webhookStatus?.success !== false ? 'bg-emerald-600' : 'bg-rose-600'
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Delivery & Webhook status info */}
            <div className={`rounded-2xl p-3.5 border mb-4 text-xs ${
              whatsappModal.webhookStatus?.success !== false
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center justify-between font-bold mb-1">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-700" />
                  <span>נשלח לוואטסאפ של הסדרן/נהג:</span>
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
              <div className="bg-slate-900 text-emerald-300 rounded-2xl p-4 font-mono text-xs whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto border border-slate-800 shadow-inner">
                {whatsappModal.summaryResult.formattedMessage}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWhatsappModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                סגור
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyMessage(whatsappModal.summaryResult.formattedMessage)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
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

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <span>עריכת כרטיס הזמנה #{editingOrder.orderNumber}</span>
              </h3>
              <button
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedOrder} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">מספר הזמנה (קומקס):</label>
                  <input
                    type="text"
                    required
                    value={editingOrder.orderNumber}
                    onChange={(e) => setEditingOrder({ ...editingOrder, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">מספר לקוח (ח.פ / קוד):</label>
                  <input
                    type="text"
                    required
                    value={editingOrder.customerNumber}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customerNumber: e.target.value })}
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
                    value={editingOrder.customerName}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">מחסן יוצא:</label>
                  <select
                    value={editingOrder.warehouse}
                    onChange={(e) => setEditingOrder({ ...editingOrder, warehouse: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 cursor-pointer"
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
                  value={editingOrder.deliveryAddress}
                  onChange={(e) => setEditingOrder({ ...editingOrder, deliveryAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">תאריך יעד לאספקה:</label>
                  <input
                    type="date"
                    value={editingOrder.deliveryDate || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">שעת יעד לאספקה:</label>
                  <input
                    type="time"
                    value={editingOrder.deliveryTime || '11:00'}
                    onChange={(e) => setEditingOrder({ ...editingOrder, deliveryTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">נהג משוייך (חכמת או עלי):</label>
                  <select
                    value={editingOrder.driver || 'חכמת/עלי'}
                    onChange={(e) => setEditingOrder({ ...editingOrder, driver: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold cursor-pointer"
                  >
                    <option value="חכמת/עלי">חכמת / עלי (משולב)</option>
                    <option value="חכמת">חכמת</option>
                    <option value="עלי">עלי</option>
                    <option value="עצמאי/הובלה">הובלה חיצונית</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">סטטוס אספקה:</label>
                  <select
                    value={editingOrder.status}
                    onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold cursor-pointer"
                  >
                    {AVAILABLE_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">רשימת מוצרים ומק"טים:</label>
                <textarea
                  rows={4}
                  required
                  value={editingOrder.itemsText}
                  onChange={(e) => setEditingOrder({ ...editingOrder, itemsText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">אימות בלות (פקדון):</label>
                  <input
                    type="text"
                    value={editingOrder.blowDeposit}
                    onChange={(e) => setEditingOrder({ ...editingOrder, blowDeposit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">אימות משטחים (פקדון):</label>
                  <input
                    type="text"
                    value={editingOrder.palletDeposit}
                    onChange={(e) => setEditingOrder({ ...editingOrder, palletDeposit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">הערות נוספות למשלוח / לנהג:</label>
                <input
                  type="text"
                  value={editingOrder.notes || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                  placeholder="הערות פריקה, מנוף, זמני הגעה..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  שמור שינויים ועדכן ב-Sheets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Status Modal */}
      {isCustomStatusModalOpen.isOpen && isCustomStatusModalOpen.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-600" />
              <span>הגדרת סטטוס אספקה מותאם אישית</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              עבור הזמנה #{isCustomStatusModalOpen.order.orderNumber} ({isCustomStatusModalOpen.order.customerName})
            </p>

            <form onSubmit={handleApplyCustomStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">שם הסטטוס החדש:</label>
                <input
                  type="text"
                  required
                  value={customStatusInput}
                  onChange={(e) => setCustomStatusInput(e.target.value)}
                  placeholder="לדוגמה: נדחה למחר, ממתין לפריקה, חוסר במלאי..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomStatusModalOpen({ isOpen: false, order: null })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  החל סטטוס אונליין
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>קליטת הזמנה חדשה מקומקס</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 cursor-pointer"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">תאריך יעד לאספקה:</label>
                  <input
                    type="date"
                    value={newOrder.deliveryDate || ''}
                    onChange={(e) => setNewOrder({ ...newOrder, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">שעת יעד לאספקה:</label>
                  <input
                    type="time"
                    value={newOrder.deliveryTime || '11:00'}
                    onChange={(e) => setNewOrder({ ...newOrder, deliveryTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">שיוך נהג:</label>
                  <select
                    value={newOrder.driver || 'חכמת/עלי'}
                    onChange={(e) => setNewOrder({ ...newOrder, driver: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold cursor-pointer"
                  >
                    <option value="חכמת/עלי">חכמת / עלי (משולב)</option>
                    <option value="חכמת">חכמת</option>
                    <option value="עלי">עלי</option>
                    <option value="עצמאי/הובלה">הובלה חיצונית</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">סטטוס התחלתי:</label>
                  <select
                    value={newOrder.status}
                    onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold cursor-pointer"
                  >
                    {AVAILABLE_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
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
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
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
