import {
  Order,
  DeliveryNote,
  CrossAuditRecord,
  CustomerRecord,
  CityRecord,
  TopProduct,
  StagePrediction,
  ProcurementRecommendation,
  SystemConfig
} from '../types';

export const DEFAULT_CONFIG: SystemConfig = {
  spreadsheetId: '1Ie7gKql_EDdrIN9HqunJc9Ey5k0WXXfPRxs0Vp1Bs2c',
  deliveryDocsFolderId: '1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY',
  ordersLabel: 'טופל ע"י Spark',
  deliveryNotesLabel: 'תעודות שטופלו',
  dispatchPhone: '0508861080',
  defaultDriver: 'חכמת/עלי',
  defaultTruck: 'משאית מנוף 615-41-002',
  baseLocation: 'הוד השרון',
  makeWebhookEndpoints: [
    'https://hook.eu1.make.com/j1kfxfn5y4goe1lud3dk1phkw4bkjvyr',
    'https://hook.us2.make.com/e1ifxqwm66ji347ooyg6abuk7i2voom0'
  ]
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1',
    timestamp: '2026-08-19 08:30:00',
    orderNumber: '6214928',
    customerNumber: '605070',
    customerName: 'השוקדים-כללי',
    warehouse: '1 (התלמיד)',
    deliveryAddress: 'עלי זהב, הכוונה טלפונית מספר: 1',
    itemsText: '1. 📦 מק"ט: 111260 | לוח גבס לבן 260 12.50 | כמות: 45\n2. 📦 מק"ט: 818098 | הובלה ללא פריקה שומרון | כמות: 1',
    parsedItems: [
      { sku: '111260', name: 'לוח גבס לבן 260 12.50', quantity: 45, unit: 'לוחות' },
      { sku: '818098', name: 'הובלה ללא פריקה שומרון', quantity: 1, unit: 'הובלה' }
    ],
    blowDeposit: 'תקין (0 בלות)',
    palletDeposit: 'דורש מעקב מנוף (2 משטחים)',
    status: 'בסידור עבודה',
    distance: '34.7 ק"מ',
    duration: 'כ-35 דקות',
    driver: 'חכמת/עלי',
    truck: 'משאית מנוף 615-41-002',
    customerFolderUrl: 'https://drive.google.com/drive/folders/1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY'
  },
  {
    id: 'ord-2',
    timestamp: '2026-08-18 10:15:00',
    orderNumber: '6214939',
    customerNumber: '602568',
    customerName: 'בוקטוס שלום-ביס הרצוג כס',
    warehouse: '4 (החרש)',
    deliveryAddress: 'בי"ס הרצוג, כפר סבא',
    itemsText: '1. 📦 מק"ט: 11551 | טיט שק גדול | כמות: 6\n2. 📦 מק"ט: 10002 | מלט אפור 25 ק"ג | כמות: 40\n3. 📦 מק"ט: 14075 | טיח גבס MP75 | כמות: 10\n4. 📦 מק"ט: 18055 | הובלת מנוף כפר סבא-רעננה | כמות: 1',
    parsedItems: [
      { sku: '11551', name: 'טיט שק גדול (בלה)', quantity: 6, unit: 'בלות' },
      { sku: '10002', name: 'מלט אפור 25 ק"ג', quantity: 40, unit: 'שקים' },
      { sku: '14075', name: 'טיח גבס MP75', quantity: 10, unit: 'שקים' },
      { sku: '18055', name: 'הובלת מנוף כפר סבא-רעננה', quantity: 1, unit: 'הובלה' }
    ],
    blowDeposit: '6 בלות בחיוב',
    palletDeposit: '1 משטח בחיוב',
    status: 'סופק במלואו',
    distance: '8.4 ק"מ',
    duration: 'כ-15 דקות',
    driver: 'חכמת/עלי',
    truck: 'מרצדס מנוף 615-41-002',
    customerFolderUrl: 'https://drive.google.com/drive/folders/1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY'
  },
  {
    id: 'ord-3',
    timestamp: '2026-08-16 11:20:00',
    orderNumber: '6214864',
    customerNumber: '616088',
    customerName: 'ערוגת הבשם',
    warehouse: '4 (החרש)',
    deliveryAddress: 'באר גנים 78, אבן יהודה',
    itemsText: '1. 📦 מק"ט: 11501 | חול שק גדול | כמות: 2\n2. 📦 מק"ט: 11511 | סומסום שק גדול | כמות: 2\n3. 📦 מק"ט: 10002 | מלט אפור 25 ק"ג | כמות: 20\n4. 📦 מק"ט: 818108 | הובלה ללא פריקה | כמות: 1',
    parsedItems: [
      { sku: '11501', name: 'חול שק גדול (בלה)', quantity: 2, unit: 'בלות' },
      { sku: '11511', name: 'סומסום שק גדול (בלה)', quantity: 2, unit: 'בלות' },
      { sku: '10002', name: 'מלט אפור 25 ק"ג', quantity: 20, unit: 'שקים' },
      { sku: '818108', name: 'הובלה ללא פריקה', quantity: 1, unit: 'הובלה' }
    ],
    blowDeposit: '4 בלות',
    palletDeposit: '1 משטח',
    status: 'סופק במלואו',
    distance: '19.8 ק"מ',
    duration: 'כ-22 דקות',
    driver: 'חכמת',
    truck: 'מרצדס מנוף 615-41-002',
    customerFolderUrl: 'https://drive.google.com/drive/folders/1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY'
  }
];

export const INITIAL_DELIVERY_NOTES: DeliveryNote[] = [
  {
    id: 'dn-1',
    docDate: '2026-08-17 09:39',
    docNumber: '6714605',
    orderNumber: '6214939',
    customerNumber: '602568',
    customerName: 'בוקטוס שלום-ביס הרצוג כס',
    warehouse: '4 (החרש)',
    address: 'בי"ס הרצוג, כפר סבא',
    driver: 'חכמת/עלי',
    truck: 'מרצדס מנוף 615-41-002',
    deliveredItems: '1. 📦 מק"ט: 11551 | טיט שק גדול | כמות: 6\n2. 📦 מק"ט: 10002 | מלט אפור 25 ק"ג | כמות: 40\n3. 📦 מק"ט: 14075 | טיח גבס MP75 | כמות: 10\n4. 📦 מק"ט: 18055 | הובלת מנוף כפר סבא-רעננה | כמות: 1',
    bagsDelivered: '6 בלות',
    palletsDelivered: '1 משטח',
    returnedItems: 'הוחזרו 2 משטחים ריקים לזיכוי',
    auditStatus: '✅ אספקה מאומתת מלאה',
    auditNotes: 'נפרק במנוף (12 דקות), חתימת מנהל אתר עמית.',
    docUrl: 'https://drive.google.com/drive/folders/1lHT56OcFW_9CGS7ByYINTpw9qjJkH7se',
    siteManagerSignature: 'עמית מנהל אתר (חתום)',
    unloadingDurationMinutes: 12,
    scanBatchName: 'סריקה_החרש_1708.pdf'
  },
  {
    id: 'dn-2',
    docDate: '2026-08-16 12:57',
    docNumber: '6714590',
    orderNumber: '6214864',
    customerNumber: '616088',
    customerName: 'ערוגת הבשם',
    warehouse: '4 (החרש)',
    address: 'באר גנים 78, אבן יהודה',
    driver: 'חכמת',
    truck: 'מרצדס מנוף 615-41-002',
    deliveredItems: '1. 📦 מק"ט: 11501 | חול שק גדול | כמות: 2\n2. 📦 מק"ט: 11511 | סומסום שק גדול | כמות: 2\n3. 📦 מק"ט: 10002 | מלט אפור 25 ק"ג | כמות: 20\n4. 📦 מק"ט: 818108 | הובלה ללא פריקה | כמות: 1',
    bagsDelivered: '4 בלות',
    palletsDelivered: '1 משטח',
    returnedItems: 'ללא החזרות',
    auditStatus: '✅ אספקה מאומתת מלאה',
    auditNotes: 'נמסר ונחתם ע"י יוסי מלכה. 100% התאמה להזמנת קומקס.',
    docUrl: 'https://drive.google.com/drive/folders/1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY',
    siteManagerSignature: 'יוסי מלכה (חתום)',
    unloadingDurationMinutes: 8,
    scanBatchName: 'סריקה_החרש_1608.pdf'
  }
];

export const INITIAL_CROSS_AUDIT: CrossAuditRecord[] = [
  {
    orderNumber: '6214939',
    docNumber: '6714605',
    customerInfo: 'בוקטוס שלום-ביס הרצוג כס (602568)',
    auditStatus: '✅ אספקה מאומתת מלאה',
    orderedItemsSummary: 'טיט שק (6), מלט אפור (40), טיח MP75 (10), מנוף (1)',
    deliveredItemsSummary: 'טיט שק (6), מלט אפור (40), טיח MP75 (10), מנוף (1)',
    matchScore: '100% התאמה',
    depositsSummary: '6 בלות | 1 משטח (הוחזרו 2 לזיכוי)',
    auditNotes: 'נפרק במנוף (12 דקות), חתימת מנהל אתר עמית.',
    folderUrl: 'https://drive.google.com/drive/folders/1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY',
    reconciledAt: '2026-08-17 10:05'
  },
  {
    orderNumber: '6214864',
    docNumber: '6714590',
    customerInfo: 'ערוגת הבשם (616088)',
    auditStatus: '✅ אספקה מאומתת מלאה',
    orderedItemsSummary: 'חול בלה (2), סומסום (2), מלט אפור (20), הובלה (1)',
    deliveredItemsSummary: 'חול בלה (2), סומסום (2), מלט אפור (20), הובלה (1)',
    matchScore: '100% התאמה',
    depositsSummary: '4 בלות | 1 משטח',
    auditNotes: 'נמסר ונחתם ע"י יוסי מלכה. 100% התאמה להזמנת קומקס.',
    folderUrl: 'https://drive.google.com/drive/folders/1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY',
    reconciledAt: '2026-08-16 13:15'
  },
  {
    orderNumber: '6214928',
    docNumber: '⏳ ממתין לתעודה',
    customerInfo: 'השוקדים-כללי (605070)',
    auditStatus: '⏳ בסידור עבודה - ממתין להצלבה',
    orderedItemsSummary: 'לוח גבס לבן 260 (45), הובלה ללא פריקה (1)',
    deliveredItemsSummary: '—',
    matchScore: 'ממתין לסריקה',
    depositsSummary: 'תקין | דורש מעקב מנוף',
    auditNotes: 'שובץ ל-חכמת/עלי, ממתין לתעודת משלוח חתומה',
    folderUrl: 'https://drive.google.com/drive/folders/1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY'
  }
];

export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    customerNumber: '602568',
    customerName: 'בוקטוס שלום-ביס הרצוג כס',
    defaultAddress: 'בי"ס הרצוג, כפר סבא',
    ordersCount: 8,
    signedNotesCount: 8,
    folderUrl: 'https://drive.google.com/drive/folders/1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY',
    phone: '052-4458921',
    contactPerson: 'עמית מנהל אתר',
    currentProjectStage: 'גמר וטיח'
  },
  {
    customerNumber: '605070',
    customerName: 'השוקדים-כללי',
    defaultAddress: 'עלי זהב, הכוונה טלפונית מספר: 1',
    ordersCount: 5,
    signedNotesCount: 4,
    folderUrl: 'https://drive.google.com/drive/folders/1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY',
    phone: '054-9981240',
    contactPerson: 'אבי מפקח',
    currentProjectStage: 'גמר וטיח'
  },
  {
    customerNumber: '616088',
    customerName: 'ערוגת הבשם',
    defaultAddress: 'באר גנים 78, אבן יהודה',
    ordersCount: 12,
    signedNotesCount: 12,
    folderUrl: 'https://drive.google.com/drive/folders/1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY',
    phone: '050-3341890',
    contactPerson: 'יוסי מלכה',
    currentProjectStage: 'ריצוף ותקרות'
  },
  {
    customerNumber: '608920',
    customerName: 'זבולון-עדירן / ביל"ו',
    defaultAddress: 'אזור תעשייה ביל"ו, רחוב החרושת 4',
    ordersCount: 3,
    signedNotesCount: 3,
    folderUrl: 'https://drive.google.com/drive/folders/1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY',
    phone: '053-7762190',
    contactPerson: 'איציק זבולון',
    currentProjectStage: 'שלד ויסודות'
  }
];

export const INITIAL_TOP_PRODUCTS: TopProduct[] = [
  { sku: '11500', name: 'חול שק גדול (בלה)', category: 'חומרי יסוד', totalSold: 180, currentStock: 'מלא (120 בלות)', stockStatus: '✅ תקין' },
  { sku: '10002', name: 'מלט אפור 25 ק"ג (נשר)', category: 'מלט וטיט', totalSold: 450, currentStock: 'תקין (350 שקים)', stockStatus: '✅ תקין' },
  { sku: '11551', name: 'טיט שק גדול (בלה)', category: 'מוצרי בלה', totalSold: 120, currentStock: 'גבוה (85 בלות)', stockStatus: '⚡ ביקוש גבוה' },
  { sku: '14075', name: 'טיח גבס MP75 שק 25 ק"ג', category: 'טיח וגמר', totalSold: 320, currentStock: 'בינוני (40 שקים)', stockStatus: '⚠️ נדרש רענון מלאי' },
  { sku: '111260', name: 'לוח גבס לבן 260 12.50', category: 'גבס ותקרות', totalSold: 680, currentStock: 'גבוה (500 לוחות)', stockStatus: '✅ תקין' },
  { sku: '818070', name: 'הובלה ללא פריקה תל אביב מרכז', category: 'שירותי הובלה', totalSold: 95, currentStock: '—', stockStatus: '🟢 פעיל' },
  { sku: '60002', name: 'שק גדול פקדון (בלה)', category: 'פקדונות', totalSold: 140, currentStock: 'תקין במלאי', stockStatus: '✅ תקין' },
  { sku: '60060', name: 'משטח סבן פקדון', category: 'פקדונות', totalSold: 210, currentStock: 'תקין במלאי', stockStatus: '✅ תקין' },
  { sku: '10015', name: 'בטון מהיר מוכן 25 ק"ג', category: 'בטון ומוספים', totalSold: 215, currentStock: 'נמוך מאוד (15 שקים)', stockStatus: '🚨 מומלץ להזמין השבוע' },
  { sku: '18055', name: 'הובלת מנוף כפר סבא-רעננה', category: 'שירותי מנוף', totalSold: 64, currentStock: '—', stockStatus: '🟢 פעיל' }
];

export const INITIAL_STAGE_PREDICTIONS: StagePrediction[] = [
  {
    customerName: 'בוקטוס שלום - בי"ס הרצוג',
    currentStage: 'גמר וטיח',
    suppliedMaterials: 'שלד + בטון + בלוקים',
    expectedMaterials: 'טיח MP75, מלט, שקי טיט, חול',
    expectedDate: 'השבוע הקרוב (18-22/08)',
    managerRecommendation: 'היערכות להספקת מנוף ביום רביעי'
  },
  {
    customerName: 'השוקדים - פרויקט עלי זהב',
    currentStage: 'התחלת טיח וגמר',
    suppliedMaterials: 'בסיס ויסודות',
    expectedMaterials: 'לוחות גבס, פרופילים, שליכט ודבקים',
    expectedDate: 'תוך 10 ימים',
    managerRecommendation: 'מומלץ לוודא מלאי לוחות גבס במחסן 1'
  },
  {
    customerName: 'זבולון-עדירן / ביל"ו',
    currentStage: 'השלמת שלד',
    suppliedMaterials: 'חול, בטון מהיר',
    expectedMaterials: 'טיט שק גדול, מלט אפור, בלוקים',
    expectedDate: 'בימים הקרובים',
    managerRecommendation: 'תיאום הובלת מנוף ושקים'
  }
];

export const INITIAL_RECOMMENDATIONS: ProcurementRecommendation[] = [
  {
    priority: '🚨 דחיפות גבוהה',
    materialName: 'בטון מהיר מוכן 25 ק"ג (מק"ט 10015)',
    currentStock: 'נמוך מאוד (15 שקים)',
    weeklyDemand: '+80 שקים',
    warehouseAction: 'הזמנת רענון מלאי מיידית מספקים למחסן 4 (החרש)'
  },
  {
    priority: '⚠️ עדיפות בינונית',
    materialName: 'טיח גבס MP75 (מק"ט 14075)',
    currentStock: 'בינוני (40 שקים)',
    weeklyDemand: '+150 שקים',
    warehouseAction: 'ריכוז הזמנות לפרויקטים בחיזוי שבועי'
  },
  {
    priority: '✅ מבוקש ויציב',
    materialName: 'טיט שק גדול (מק"ט 11551)',
    currentStock: 'תקין (85 בלות)',
    weeklyDemand: '+30 בלות',
    warehouseAction: 'וידוא זמינות פקדונות בלות ומשטחים תקינים'
  }
];

export const INITIAL_CITIES: CityRecord[] = [
  { region: 'שרון', address: 'בי"ס הרצוג, כפר סבא', customerName: 'בוקטוס שלום', deliveryCount: 8, distance: '8.4 ק"מ', wazeUrl: 'https://www.waze.com/ul?q=%D7%91%D7%99%22%D7%A1%20%D7%94%D7%A8%D7%A6%D7%95%D7%92%20%D7%9B%D7%A4%D7%A8%20%D7%A1%D7%91%D7%90&navigate=yes' },
  { region: 'שומרון', address: 'עלי זהב, הכוונה טלפונית', customerName: 'השוקדים-כללי', deliveryCount: 5, distance: '34.7 ק"מ', wazeUrl: 'https://www.waze.com/ul?q=%D7%A2%D7%9C%D7%99%20%D7%96%D7%94%D7%91&navigate=yes' },
  { region: 'שרון', address: 'באר גנים 78, אבן יהודה', customerName: 'ערוגת הבשם', deliveryCount: 12, distance: '19.8 ק"מ', wazeUrl: 'https://www.waze.com/ul?q=%D7%91%D7%90%D7%A8%20%D7%92%D7%A0%D7%99%D7%9D%2078%20%D7%90%D7%91%D7%9F%20%D7%99%D7%94%D7%95%D7%93%D7%94&navigate=yes' },
  { region: 'שפלה', address: 'אזור תעשייה ביל"ו', customerName: 'זבולון-עדירן', deliveryCount: 3, distance: '42.1 ק"מ', wazeUrl: 'https://www.waze.com/ul?q=%D7%91%D7%99%D7%9C%22%D7%95%20%D7%A1%D7%A0%D7%98%D7%A8&navigate=yes' }
];
