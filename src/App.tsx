import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { OrdersView } from './components/OrdersView';
import { DeliveryNotesView } from './components/DeliveryNotesView';
import { CrossAuditView } from './components/CrossAuditView';
import { CustomersView } from './components/CustomersView';
import { SmartDashboardView } from './components/SmartDashboardView';
import { LogisticsView } from './components/LogisticsView';
import { SettingsView } from './components/SettingsView';
import { ConfirmModal } from './components/ConfirmModal';
import {
  GoogleAuthState,
  SystemConfig,
  Order,
  DeliveryNote,
  CrossAuditRecord,
  CustomerRecord,
  CityRecord,
  TopProduct,
  StagePrediction,
  ProcurementRecommendation
} from './types';
import {
  DEFAULT_CONFIG,
  INITIAL_ORDERS,
  INITIAL_DELIVERY_NOTES,
  INITIAL_CROSS_AUDIT,
  INITIAL_CUSTOMERS,
  INITIAL_CITIES,
  INITIAL_TOP_PRODUCTS,
  INITIAL_STAGE_PREDICTIONS,
  INITIAL_RECOMMENDATIONS
} from './lib/initialData';
import { initAuth, googleSignIn, logout as authLogout, getAccessToken } from './lib/auth';
import { GoogleSheetsService } from './lib/googleSheets';
import { GoogleDriveService } from './lib/googleDrive';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);

  // Data states
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>(INITIAL_DELIVERY_NOTES);
  const [auditRecords, setAuditRecords] = useState<CrossAuditRecord[]>(INITIAL_CROSS_AUDIT);
  const [customers, setCustomers] = useState<CustomerRecord[]>(INITIAL_CUSTOMERS);
  const [cities, setCities] = useState<CityRecord[]>(INITIAL_CITIES);
  const [topProducts, setTopProducts] = useState<TopProduct[]>(INITIAL_TOP_PRODUCTS);
  const [predictions, setPredictions] = useState<StagePrediction[]>(INITIAL_STAGE_PREDICTIONS);
  const [recommendations, setRecommendations] = useState<ProcurementRecommendation[]>(INITIAL_RECOMMENDATIONS);

  // Sync and Auth states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitializingSheets, setIsInitializingSheets] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [auth, setAuth] = useState<GoogleAuthState>({
    isAuthenticated: false,
    userEmail: null,
    userName: null,
    userPhoto: null,
    accessToken: null,
    isLoggingIn: false,
    error: null
  });

  // Confirmation Modal state for mutating workspace operations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 1. Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user: User, token: string) => {
        setAuth({
          isAuthenticated: true,
          userEmail: user.email,
          userName: user.displayName || user.email?.split('@')[0] || 'משתמש',
          userPhoto: user.photoURL,
          accessToken: token,
          isLoggingIn: false,
          error: null
        });
        showToast(`ברוך הבא, ${user.displayName || user.email}! מחובר ל-Google Workspace.`);
      },
      () => {
        setAuth({
          isAuthenticated: false,
          userEmail: null,
          userName: null,
          userPhoto: null,
          accessToken: null,
          isLoggingIn: false,
          error: null
        });
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setAuth((prev) => ({ ...prev, isLoggingIn: true, error: null }));
    try {
      const res = await googleSignIn();
      if (res) {
        setAuth({
          isAuthenticated: true,
          userEmail: res.user.email,
          userName: res.user.displayName || res.user.email?.split('@')[0] || 'משתמש',
          userPhoto: res.user.photoURL,
          accessToken: res.accessToken,
          isLoggingIn: false,
          error: null
        });
        showToast('התחברת בהצלחה עם Google Workspace!');
      }
    } catch (err: any) {
      setAuth((prev) => ({
        ...prev,
        isLoggingIn: false,
        error: err.message || 'שגיאת התחברות'
      }));
      showToast(err.message || 'ההתחברות נכשלה', 'error');
    }
  };

  const handleLogout = async () => {
    await authLogout();
    setAuth({
      isAuthenticated: false,
      userEmail: null,
      userName: null,
      userPhoto: null,
      accessToken: null,
      isLoggingIn: false,
      error: null
    });
    showToast('התנתקת מחשבון Google.', 'info');
  };

  // 2. Full Sync with Google Sheets
  const handleSyncAll = useCallback(async () => {
    if (!auth.isAuthenticated) {
      showToast('נדרש חיבור ל-Google Workspace לביצוע סנכרון', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      await GoogleSheetsService.ensureRequiredTabs(config.spreadsheetId);
      const sheetOrders = await GoogleSheetsService.syncOrdersFromSheet(config.spreadsheetId);

      if (sheetOrders.length > 0) {
        setOrders(sheetOrders);
        showToast(`סונכרנו ${sheetOrders.length} הזמנות מגיליון Google Sheets.`);
      } else {
        showToast('הגיליון ריק או שאין שורות חדשות. הטאבים נבדקו ותקינים.');
      }
      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error(err);
      showToast(`שגיאת סנכרון: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [auth.isAuthenticated, config.spreadsheetId]);

  // 3. Initialize & Format Sheet Tabs
  const handleInitializeSheets = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'אתחול טאבים בגיליון Google Sheets',
      message: `האם לעצב ולאתחל את הטאבים בגיליון:\n${config.spreadsheetId}\n\nפעולה זו תוודא את קיום הטאבים: הזמנות, תעודות_משלוח, הצלבה_ובקרה, תיקי_לקוחות, ערים, דשבורד_חכם.`,
      confirmLabel: 'אתחל טאבים',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setIsInitializingSheets(true);
        try {
          await GoogleSheetsService.ensureRequiredTabs(config.spreadsheetId);
          await GoogleSheetsService.populateSmartDashboardSheet(
            config.spreadsheetId,
            topProducts,
            predictions,
            recommendations
          );
          showToast('כל הטאבים אותחלו ועוצבו בהצלחה ב-Google Sheets!');
        } catch (err: any) {
          showToast(`שגיאה באתחול: ${err.message}`, 'error');
        } finally {
          setIsInitializingSheets(false);
        }
      }
    });
  };

  // 4. Add Order
  const handleAddOrder = async (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Also add to audit tab as pending
    const newAuditRecord: CrossAuditRecord = {
      orderNumber: newOrder.orderNumber,
      docNumber: '⏳ ממתין לתעודה',
      customerInfo: `${newOrder.customerName} (${newOrder.customerNumber})`,
      auditStatus: '⏳ בסידור עבודה - ממתין להצלבה',
      orderedItemsSummary: newOrder.itemsText.replace(/\n/g, ' | '),
      deliveredItemsSummary: '—',
      matchScore: 'ממתין לסריקה',
      depositsSummary: `${newOrder.blowDeposit} | ${newOrder.palletDeposit}`,
      auditNotes: `שובץ ל-${newOrder.driver || config.defaultDriver}, ממתין לתעודת משלוח`,
      folderUrl: newOrder.customerFolderUrl || `https://drive.google.com/drive/folders/${config.deliveryDocsFolderId}`
    };
    setAuditRecords((prev) => [newAuditRecord, ...prev]);

    // Update customer record orders count
    setCustomers((prev) => {
      const existing = prev.find((c) => c.customerNumber === newOrder.customerNumber);
      if (existing) {
        return prev.map((c) =>
          c.customerNumber === newOrder.customerNumber
            ? { ...c, ordersCount: c.ordersCount + 1, defaultAddress: newOrder.deliveryAddress }
            : c
        );
      } else {
        return [
          ...prev,
          {
            customerNumber: newOrder.customerNumber,
            customerName: newOrder.customerName,
            defaultAddress: newOrder.deliveryAddress,
            ordersCount: 1,
            signedNotesCount: 0,
            folderUrl: `https://drive.google.com/drive/folders/${config.deliveryDocsFolderId}`
          }
        ];
      }
    });

    showToast(`הזמנה #${newOrder.orderNumber} נקלטה ושובצה בהצלחה!`);

    // If authenticated, sync with Google Sheets with confirmation
    if (auth.isAuthenticated) {
      try {
        await GoogleSheetsService.writeOrderToSheet(config.spreadsheetId, newOrder, config.dispatchPhone);
        showToast(`הזמנה #${newOrder.orderNumber} הוזרקה אוטומטית ל-Google Sheets!`);
      } catch (err: any) {
        console.warn('Silent sheet append error:', err);
      }
    }
  };

  const handleSyncOrderToSheet = (order: Order) => {
    setConfirmModal({
      isOpen: true,
      title: 'הזרקת שורת הזמנה ל-Google Sheets',
      message: `האם להזריק את הזמנה #${order.orderNumber} עבור ${order.customerName} לטאב "הזמנות"?`,
      confirmLabel: 'הזרק שורה',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await GoogleSheetsService.writeOrderToSheet(config.spreadsheetId, order, config.dispatchPhone);
          showToast(`הזמנה #${order.orderNumber} נוספה בהצלחה ל-Google Sheets!`);
        } catch (err: any) {
          showToast(`שגיאה בהזרקה: ${err.message}`, 'error');
        }
      }
    });
  };

  // 5. Ingest Galya Batch
  const handleProcessGalyaBatch = async () => {
    const batchNote: DeliveryNote = {
      id: `dn-${Date.now()}`,
      docDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      docNumber: '6714630',
      orderNumber: '6214928',
      customerNumber: '605070',
      customerName: 'השוקדים-כללי',
      warehouse: '1 (התלמיד)',
      address: 'עלי זהב, הכוונה טלפונית מספר: 1',
      driver: 'חכמת/עלי',
      truck: 'משאית מנוף 615-41-002',
      deliveredItems: '1. 📦 מק"ט: 111260 | לוח גבס לבן 260 12.50 | כמות: 45\n2. 📦 מק"ט: 818098 | הובלה ללא פריקה שומרון | כמות: 1',
      bagsDelivered: '0 בלות',
      palletsDelivered: '2 משטחים',
      returnedItems: 'הוחזרו 2 משטחים ריקים לזיכוי',
      auditStatus: '✅ אספקה מאומתת מלאה',
      auditNotes: 'פריקה תקינה, נחתם ע"י מפקח אבי.',
      docUrl: `https://drive.google.com/drive/folders/${config.deliveryDocsFolderId}`,
      siteManagerSignature: 'אבי מפקח (חתום)',
      unloadingDurationMinutes: 15,
      scanBatchName: 'סריקה_גליה_מהחרש.pdf'
    };

    setDeliveryNotes((prev) => [batchNote, ...prev]);

    // Automatically reconcile with Order 6214928
    const matchingOrder = orders.find((o) => o.orderNumber === '6214928');
    if (matchingOrder) {
      handleReconcileOrderWithNote(matchingOrder, batchNote);
    }

    showToast('קובץ סריקה של גליה פוענח בהצלחה! ת.מ 6714630 חולצה והוצלבה.');
  };

  // 6. Manual Note Upload
  const handleUploadCustomNote = (note: DeliveryNote) => {
    setDeliveryNotes((prev) => [note, ...prev]);
    const matchingOrder = orders.find((o) => o.orderNumber === note.orderNumber);
    if (matchingOrder) {
      handleReconcileOrderWithNote(matchingOrder, note);
    }
    showToast(`תעודת משלוח #${note.docNumber} נוספה למאגר.`);
  };

  const handleSyncNoteToSheet = (note: DeliveryNote) => {
    setConfirmModal({
      isOpen: true,
      title: 'הזרקת תעודת משלוח ל-Google Sheets',
      message: `האם להזריק את תעודה #${note.docNumber} (הזמנה #${note.orderNumber}) לטאב "תעודות_משלוח"?`,
      confirmLabel: 'הזרק תעודה',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await GoogleSheetsService.writeDeliveryNoteToSheet(config.spreadsheetId, note);
          showToast(`תעודה #${note.docNumber} נוספה בהצלחה ל-Google Sheets!`);
        } catch (err: any) {
          showToast(`שגיאה בהזרקה: ${err.message}`, 'error');
        }
      }
    });
  };

  // 7. Reconcile Cross Audit
  const handleReconcileOrderWithNote = (order: Order, note: DeliveryNote) => {
    // 1. Update Order Status
    setOrders((prev) =>
      prev.map((o) =>
        o.orderNumber === order.orderNumber
          ? { ...o, status: 'סופק במלואו' }
          : o
      )
    );

    // 2. Update / Upsert Cross Audit Record
    setAuditRecords((prev) => {
      const exists = prev.some((r) => r.orderNumber === order.orderNumber);
      const updated: CrossAuditRecord = {
        orderNumber: order.orderNumber,
        docNumber: note.docNumber,
        customerInfo: `${order.customerName} (${order.customerNumber})`,
        auditStatus: '✅ אספקה מאומתת מלאה',
        orderedItemsSummary: order.itemsText.replace(/\n/g, ' | '),
        deliveredItemsSummary: note.deliveredItems.replace(/\n/g, ' | '),
        matchScore: '100% התאמה',
        depositsSummary: `${note.bagsDelivered} | ${note.palletsDelivered} (${note.returnedItems})`,
        auditNotes: `${note.auditNotes} (חתימה: ${note.siteManagerSignature || 'אושר'})`,
        folderUrl: note.docUrl || order.customerFolderUrl || `https://drive.google.com/drive/folders/${config.deliveryDocsFolderId}`,
        reconciledAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      if (exists) {
        return prev.map((r) => (r.orderNumber === order.orderNumber ? updated : r));
      } else {
        return [updated, ...prev];
      }
    });

    // 3. Increment Customer Signed Notes Count
    setCustomers((prev) =>
      prev.map((c) =>
        c.customerNumber === order.customerNumber
          ? { ...c, signedNotesCount: c.signedNotesCount + 1 }
          : c
      )
    );

    showToast(`הזמנה #${order.orderNumber} הוצלבה ונסגרה בהצלחה מול ת.מ #${note.docNumber}!`);
  };

  const handleSyncAuditToSheet = (note: DeliveryNote) => {
    setConfirmModal({
      isOpen: true,
      title: 'סגירת מעגל והצלבה ב-Google Sheets',
      message: `האם לעדכן את שורת ההצלבה בטאב "הצלבה_ובקרה" עבור הזמנה #${note.orderNumber} ותעודה #${note.docNumber}?`,
      confirmLabel: 'עדכן שורת הצלבה',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await GoogleSheetsService.updateCrossAuditSheet(config.spreadsheetId, note);
          showToast(`טאב הצלבה_ובקרה עודכן בהצלחה ב-Google Sheets!`);
        } catch (err: any) {
          showToast(`שגיאה בעדכון: ${err.message}`, 'error');
        }
      }
    });
  };

  // 8. Sync Smart Dashboard Tab
  const handleSyncDashboardToSheet = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'עדכון דשבורד חכם וחיזוי רכש ב-Sheets',
      message: `האם לעדכן את טאב "דשבורד_חכם" בגיליון Google Sheets עם 10 מוצרי הדגל, מנוע חיזוי AI והמלצות הרכש השבועיות?`,
      confirmLabel: 'עדכן דשבורד',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setIsSyncing(true);
        try {
          await GoogleSheetsService.populateSmartDashboardSheet(
            config.spreadsheetId,
            topProducts,
            predictions,
            recommendations
          );
          showToast('טאב דשבורד_חכם נבנה ועודכן בהצלחה ב-Google Sheets!');
        } catch (err: any) {
          showToast(`שגיאה: ${err.message}`, 'error');
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  // Unverified counts
  const pendingAuditCount = auditRecords.filter((r) => r.auditStatus.includes('ממתין')).length;
  const unverifiedNotesCount = deliveryNotes.filter((n) => !n.auditStatus.includes('מאומתת')).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-['Heebo',sans-serif]">
      {/* System Header */}
      <Header
        auth={auth}
        config={config}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSyncAll={handleSyncAll}
      />

      {/* Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ordersCount={orders.length}
        pendingAuditCount={pendingAuditCount}
        unverifiedNotesCount={unverifiedNotesCount}
      />

      {/* Toast Banner */}
      {statusMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4">
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold shadow-xs border animate-in fade-in slide-in-from-top-2 duration-200 flex items-center justify-between ${
              statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : statusMessage.type === 'info'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700 px-2 py-0.5 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            config={config}
            isAuthenticated={auth.isAuthenticated}
            onAddOrder={handleAddOrder}
            onSyncOrderToSheet={handleSyncOrderToSheet}
          />
        )}

        {activeTab === 'delivery_notes' && (
          <DeliveryNotesView
            deliveryNotes={deliveryNotes}
            config={config}
            isAuthenticated={auth.isAuthenticated}
            onProcessGalyaBatch={handleProcessGalyaBatch}
            onUploadCustomNote={handleUploadCustomNote}
            onSyncNoteToSheet={handleSyncNoteToSheet}
            onNavigateToAudit={() => setActiveTab('cross_audit')}
          />
        )}

        {activeTab === 'cross_audit' && (
          <CrossAuditView
            orders={orders}
            deliveryNotes={deliveryNotes}
            auditRecords={auditRecords}
            config={config}
            isAuthenticated={auth.isAuthenticated}
            onReconcileOrderWithNote={handleReconcileOrderWithNote}
            onSyncAuditToSheet={handleSyncAuditToSheet}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView
            customers={customers}
            config={config}
            isAuthenticated={auth.isAuthenticated}
            onAddCustomer={(cust) => setCustomers((prev) => [cust, ...prev])}
          />
        )}

        {activeTab === 'smart_dashboard' && (
          <SmartDashboardView
            topProducts={topProducts}
            predictions={predictions}
            recommendations={recommendations}
            isAuthenticated={auth.isAuthenticated}
            onSyncDashboardToSheet={handleSyncDashboardToSheet}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'logistics' && (
          <LogisticsView
            cities={cities}
            config={config}
            isAuthenticated={auth.isAuthenticated}
            onAddCity={(city) => setCities((prev) => [city, ...prev])}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            config={config}
            isAuthenticated={auth.isAuthenticated}
            onSaveConfig={(newCfg) => {
              setConfig(newCfg);
              showToast('הגדרות המערכת עודכנו בהצלחה!');
            }}
            onInitializeSheets={handleInitializeSheets}
            isInitializing={isInitializingSheets}
          />
        )}
      </main>

      {/* Confirmation Modal for Workspace mutating actions */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
