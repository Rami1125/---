export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unit?: string;
}

// 4. טאב: הזמנות
export interface Order {
  id: string;
  timestamp: string; // תאריך קליטה
  orderNumber: string; // מספר הזמנה
  customerNumber: string; // מספר לקוח
  customerName: string; // שם לקוח
  warehouse: string; // מחסן
  deliveryAddress: string; // כתובת אספקה
  itemsText: string; // פירוט מוצרים וכמויות
  parsedItems?: OrderItem[];
  blowDeposit: string; // פקדון בלות
  palletDeposit: string; // פקדון משטחים
  driver?: string; // נהג משוייך
  customerFolderUrl?: string; // תיק לקוח ב-Drive
  wazeLink?: string; // קישור Waze
  waShareLink?: string; // שיתוף WhatsApp
  hasDeliveryNote?: boolean | string; // קיימת תעודת משלוח?
  status: 'מאושר' | 'בסידור עבודה' | 'סופק במלואו' | 'אספקה חלקית' | 'ממתין לתעודה';
  distance: string;
  duration: string;
  truck?: string;
  notes?: string;
}

// 9. טאב: תעודות_משלוח
export interface DeliveryNote {
  id: string;
  docDate: string; // תאריך תעודה
  docNumber: string; // מספר תעודה
  orderNumber: string; // בגין הזמנה
  customerNumber: string; // מספר לקוח
  customerName: string; // שם לקוח
  warehouse: string; // מחסן
  address: string; // כתובת אספקה
  driver: string; // נהג
  truck: string; // רכב משאית
  deliveredItems: string; // פירוט מוצרים שסופקו
  parsedItems?: OrderItem[];
  bagsDelivered: string; // שקים לפקדון
  palletsDelivered: string; // משטחים לפקדון
  returnedItems?: string;
  docUrl: string; // מסמך סרוק ב-Drive
  auditStatus: '✅ אספקה מאומתת מלאה' | '⚠️ אי התאמה / חוסר' | '⏳ ממתין לתעודה' | '🔍 בבדיקה';
  auditNotes: string;
  siteManagerSignature?: string;
  unloadingDurationMinutes?: number;
  scanBatchName?: string;
}

// 7. טאב: הצלבה_ובקרה
export interface CrossAuditRecord {
  orderNumber: string; // מספר הזמנה
  docNumber: string; // מספר תעודה
  customerInfo: string; // שם לקוח ומספר
  auditStatus: string; // סטטוס אספקה
  orderedItemsSummary: string; // פריטים בהזמנה
  deliveredItemsSummary: string; // פריטים שסופקו
  matchScore: string; // התאמת כמויות
  depositsSummary: string; // אימות פקדונות
  auditNotes: string; // הערות בקרה
  folderUrl: string; // קישור תיק לקוח
  reconciledAt?: string;
}

// 3. טאב: תיקי_לקוחות
export interface CustomerRecord {
  customerNumber: string; // מספר לקוח
  customerName: string; // שם לקוח
  defaultAddress: string; // כתובת קבועה / אתר מרכזי
  ordersCount: number; // כמות הזמנות
  signedNotesCount: number; // כמות תעודות חתומות
  folderUrl: string; // קישור ישיר לתיקיית לקוח ב-Drive
  phone?: string;
  contactPerson?: string;
  currentProjectStage?: 'שלד ויסודות' | 'גמר וטיח' | 'ריצוף ותקרות' | 'הושלם';
}

// 6. טאב: ערים (לוגיסטיקה ומרחקים)
export interface CityRecord {
  region: string; // מוצא / אזור
  address: string; // יעד / כתובת אספקה
  distance: string; // מרחק
  duration: string; // זמן נסיעה
  updatedAt?: string; // תאריך עדכון
  customerName: string; // שם לקוח
  deliveryCount: number; // כמות אספקות קודמות
  lastDeliveryDate?: string; // אספקה אחרונה
  wazeUrl: string;
}

// 8. טאב: מילון_לוגסטי (טבלה1)
export interface LogisticsDictionaryItem {
  sku: string; // מק"ט
  productName: string; // שם מוצר
  quantityHint: string; // כמות
  requiresBlowDeposit: string; // דורש פקדון בלה?
  requiresPalletDeposit: string; // דורש פקדון משטח?
  requiresDrumDeposit: string; // דורש פקדון חבית?
  requiresBlockPalletDeposit: string; // דורש פקדון משטח בלוק?
  noaConclusions: string; // מסקנות וחישוב נועה
}

// 5. טאב: דשבורד_לקוחות
export interface CustomerDashboardRecord {
  timestamp: string; // תאריך קליטה
  orderNumber: string; // מספר הזמנה
  warehouse: string; // מחסן
  deliveryAddress: string; // כתובת אספקה
  itemsSummary: string; // פירוט מוצרים וכמויות
  blowDeposit: string; // פקדון בלות
  palletDeposit: string; // פקדון משטחים
  customerFolderUrl: string; // תיק לקוח
  auxCol?: string; // [עמודת עזר ריקה]
  secondaryAddress?: string; // כתובת אספקה
  secondaryWarehouse?: string; // מחסן
}

// 2. טאב: דשבורד_חכם - טבלה 1
export interface TopProduct {
  sku: string; // מק"ט
  name: string; // שם מוצר / חומר
  category: string; // קטגוריה
  totalSold: number | string; // סה"כ כמות נמכרת
  currentStock: string; // מלאי נוכחי במחסנים
  stockStatus: '✅ תקין' | '⚡ ביקוש גבוה' | '⚠️ נדרש רענון מלאי' | '🚨 מומלץ להזמין השבוע' | '🟢 פעיל';
}

// 2. טאב: דשבורד_חכם - טבלה 2
export interface StagePrediction {
  customerName: string; // שם הלקוח / פרויקט
  currentStage: string; // שלב נוכחי מזוהה
  suppliedMaterials: string; // חומרים שסופקו בשלב קודם
  expectedMaterials: string; // צפי חומרים לשלב הבא
  expectedDate: string; // מועד משוער להזמנה
  managerRecommendation: string; // פעולת המלצה למנהל
}

// 2. טאב: דשבורד_חכם - טבלה 3
export interface ProcurementRecommendation {
  priority: '🚨 דחיפות גבוהה' | '⚠️ עדיפות בינונית' | '✅ מבוקש ויציב'; // עדיפות
  materialName: string; // סוג חומר / מק"ט
  currentStock: string; // מלאי נוכחי מוערך
  weeklyDemand: string; // צפי ביקוש שבועי
  warehouseAction: string; // פעולה נדרשת במחסני החרש / התלמיד
}

export interface SystemConfig {
  spreadsheetId: string;
  deliveryDocsFolderId: string;
  ordersLabel: string;
  deliveryNotesLabel: string;
  dispatchPhone: string;
  defaultDriver: string;
  defaultTruck: string;
  baseLocation: string;
  makeWebhookEndpoints: string[];
}

export interface GoogleAuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  accessToken: string | null;
  isLoggingIn: boolean;
  error: string | null;
}

