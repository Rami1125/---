export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unit?: string;
}

export interface Order {
  id: string;
  timestamp: string;
  orderNumber: string;
  customerNumber: string;
  customerName: string;
  warehouse: string;
  deliveryAddress: string;
  itemsText: string;
  parsedItems?: OrderItem[];
  blowDeposit: string;
  palletDeposit: string;
  status: 'מאושר' | 'בסידור עבודה' | 'סופק במלואו' | 'אספקה חלקית' | 'ממתין לתעודה';
  distance: string;
  duration: string;
  customerFolderUrl?: string;
  driver?: string;
  truck?: string;
  notes?: string;
}

export interface DeliveryNote {
  id: string;
  docDate: string;
  docNumber: string;
  orderNumber: string;
  customerNumber: string;
  customerName: string;
  warehouse: string;
  address: string;
  driver: string;
  truck: string;
  deliveredItems: string;
  parsedItems?: OrderItem[];
  bagsDelivered: string;
  palletsDelivered: string;
  returnedItems: string;
  auditStatus: '✅ אספקה מאומתת מלאה' | '⚠️ אי התאמה / חוסר' | '⏳ ממתין לתעודה' | '🔍 בבדיקה';
  auditNotes: string;
  docUrl: string;
  siteManagerSignature?: string;
  unloadingDurationMinutes?: number;
  scanBatchName?: string;
}

export interface CrossAuditRecord {
  orderNumber: string;
  docNumber: string;
  customerInfo: string;
  auditStatus: string;
  orderedItemsSummary: string;
  deliveredItemsSummary: string;
  matchScore: string;
  depositsSummary: string;
  auditNotes: string;
  folderUrl: string;
  reconciledAt?: string;
}

export interface CustomerRecord {
  customerNumber: string;
  customerName: string;
  defaultAddress: string;
  ordersCount: number;
  signedNotesCount: number;
  folderUrl: string;
  phone?: string;
  contactPerson?: string;
  currentProjectStage?: 'שלד ויסודות' | 'גמר וטיח' | 'ריצוף ותקרות' | 'הושלם';
}

export interface CityRecord {
  region: string;
  address: string;
  customerName: string;
  deliveryCount: number;
  distance: string;
  wazeUrl: string;
}

export interface TopProduct {
  sku: string;
  name: string;
  category: string;
  totalSold: number | string;
  currentStock: string;
  stockStatus: '✅ תקין' | '⚡ ביקוש גבוה' | '⚠️ נדרש רענון מלאי' | '🚨 מומלץ להזמין השבוע' | '🟢 פעיל';
}

export interface StagePrediction {
  customerName: string;
  currentStage: string;
  suppliedMaterials: string;
  expectedMaterials: string;
  expectedDate: string;
  managerRecommendation: string;
}

export interface ProcurementRecommendation {
  priority: '🚨 דחיפות גבוהה' | '⚠️ עדיפות בינונית' | '✅ מבוקש ויציב';
  materialName: string;
  currentStock: string;
  weeklyDemand: string;
  warehouseAction: string;
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
