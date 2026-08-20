import {
  Order,
  DeliveryNote,
  CrossAuditRecord,
  CustomerRecord,
  CityRecord,
  TopProduct,
  StagePrediction,
  ProcurementRecommendation,
  LogisticsDictionaryItem,
  CustomerDashboardRecord,
  SystemConfig
} from '../types';

export const DEFAULT_CONFIG: SystemConfig = {
  spreadsheetId: '1Ie7gKql_EDdrIN9HqunJc9Ey5k0WXXfPRxs0Vp1Bs2c',
  deliveryDocsFolderId: '1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY',
  ordersLabel: 'טופל ע"י Spark',
  deliveryNotesLabel: 'תעודות שטופלו',
  dispatchPhone: '0509620049',
  defaultDriver: 'חכמת/עלי',
  defaultTruck: 'משאית מנוף 615-41-002',
  baseLocation: 'הוד השרון',
  makeWebhookEndpoints: [
    'https://hook.us2.make.com/e1ifxqwm66ji347ooyg6abuk7i2voom0',
    'https://hook.eu1.make.com/j1kfxfn5y4goe1lud3dk1phkw4bkjvyr'
  ]
};

// All initial datasets are empty - dynamically synced from live Google Sheets (1Ie7gKql_EDdrIN9HqunJc9Ey5k0WXXfPRxs0Vp1Bs2c)
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_DELIVERY_NOTES: DeliveryNote[] = [];
export const INITIAL_CROSS_AUDIT: CrossAuditRecord[] = [];
export const INITIAL_CUSTOMERS: CustomerRecord[] = [];
export const INITIAL_CITIES: CityRecord[] = [];
export const INITIAL_TOP_PRODUCTS: TopProduct[] = [];
export const INITIAL_STAGE_PREDICTIONS: StagePrediction[] = [];
export const INITIAL_RECOMMENDATIONS: ProcurementRecommendation[] = [];
export const INITIAL_LOGISTICS_DICTIONARY: LogisticsDictionaryItem[] = [];
export const INITIAL_CUSTOMER_DASHBOARD: CustomerDashboardRecord[] = [];
