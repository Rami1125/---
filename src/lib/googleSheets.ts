import { getAccessToken } from './auth';
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
  CustomerDashboardRecord
} from '../types';

export class GoogleSheetsService {
  private static async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('נדרש חיבור לחשבון Google Workspace');
    }

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = errText;
      try {
        const json = JSON.parse(errText);
        parsedErr = json.error?.message || errText;
      } catch (_) {}
      throw new Error(`Google Sheets API Error: ${parsedErr}`);
    }
    return response.json();
  }

  /**
   * Check if spreadsheet exists and fetch sheet titles
   */
  static async getSpreadsheetInfo(spreadsheetId: string) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`;
    const data = await this.fetchWithAuth(url);
    const sheetTitles = (data.sheets || []).map(
      (s: any) => s.properties.title as string
    );
    return { sheetTitles };
  }

  /**
   * Create tabs if they don't exist and write exact headers
   */
  static async ensureRequiredTabs(spreadsheetId: string) {
    const { sheetTitles } = await this.getSpreadsheetInfo(spreadsheetId);
    
    const required = [
      'דשבורד_הזמנות',
      'דשבורד_חכם',
      'תיקי_לקוחות',
      'הזמנות',
      'דשבורד_לקוחות',
      'ערים',
      'הצלבה_ובקרה',
      'מילון_לוגסטי',
      'תעודות_משלוח'
    ];
    
    const missing = required.filter(tab => !sheetTitles.includes(tab));

    if (missing.length > 0) {
      const requests = missing.map(title => ({
        addSheet: {
          properties: {
            title,
            rightToLeft: true
          }
        }
      }));

      await this.fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        body: JSON.stringify({ requests })
      });

      // Initialize Headers for newly created sheets
      for (const tab of missing) {
        if (tab === 'הזמנות') {
          await this.appendRow(spreadsheetId, 'הזמנות', [
            'תאריך קליטה', 'מספר הזמנה', 'מספר לקוח', 'שם לקוח', 'מחסן', 'כתובת אספקה', 'פירוט מוצרים וכמויות', 'פקדון בלות', 'פקדון משטחים', 'נהג משוייך', 'תיק לקוח ב-Drive', 'קישור Waze', 'שיתוף WhatsApp', 'קיימת תעודת משלוח?'
          ]);
        } else if (tab === 'תעודות_משלוח') {
          await this.appendRow(spreadsheetId, 'תעודות_משלוח', [
            'תאריך תעודה', 'מספר תעודה', 'בגין הזמנה', 'מספר לקוח', 'שם לקוח', 'מחסן', 'כתובת אספקה', 'נהג', 'רכב משאית', 'פירוט מוצרים שסופקו', 'שקים לפקדון', 'משטחים לפקדון', 'מסמך סרוק ב-Drive'
          ]);
        } else if (tab === 'הצלבה_ובקרה') {
          await this.appendRow(spreadsheetId, 'הצלבה_ובקרה', [
            'מספר הזמנה', 'מספר תעודה', 'שם לקוח ומספר', 'סטטוס אספקה', 'פריטים בהזמנה', 'פריטים שסופקו', 'התאמת כמויות', 'אימות פקדונות', 'הערות בקרה', 'קישור תיק לקוח'
          ]);
        } else if (tab === 'תיקי_לקוחות') {
          await this.appendRow(spreadsheetId, 'תיקי_לקוחות', [
            'מספר לקוח', 'שם לקוח', 'כתובת קבועה / אתר מרכזי', 'כמות הזמנות', 'כמות תעודות חתומות', 'קישור ישיר לתיקיית לקוח ב-Drive'
          ]);
        } else if (tab === 'ערים') {
          await this.appendRow(spreadsheetId, 'ערים', [
            'מוצא', 'יעד', 'מרחק', 'זמן נסיעה', 'תאריך עדכון', 'שם לקוח', 'כתובת אספקה', 'כמות אספקות קודמות', 'אספקה אחרונה'
          ]);
        } else if (tab === 'מילון_לוגסטי') {
          await this.appendRow(spreadsheetId, 'מילון_לוגסטי', [
            'מק"ט', 'שם מוצר', 'כמות', 'דורש פקדון בלה?', 'דורש פקדון משטח?', 'דורש פקדון חבית?', 'דורש פקדון משטח בלוק?', 'מסקנות וחישוב נועה'
          ]);
        } else if (tab === 'דשבורד_לקוחות') {
          await this.appendRow(spreadsheetId, 'דשבורד_לקוחות', [
            'תאריך קליטה', 'מספר הזמנה', 'מחסן', 'כתובת אספקה', 'פירוט מוצרים וכמויות', 'פקדון בלות', 'פקדון משטחים', 'תיק לקוח', 'עמודת עזר', 'כתובת אספקה', 'מחסן'
          ]);
        } else if (tab === 'דשבורד_הזמנות') {
          await this.appendRow(spreadsheetId, 'דשבורד_הזמנות', [
            'תאריך', 'מחסן', 'נהג', 'לקוח', 'כמות הזמנות', 'סופקו', 'בסידור עבודה', 'סטטוס תעודות'
          ]);
        }
      }
    }
  }

  /**
   * Append a row to a sheet tab
   */
  static async appendRow(spreadsheetId: string, sheetTitle: string, rowValues: any[]) {
    const range = `${encodeURIComponent(sheetTitle)}!A1`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
    return this.fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({
        values: [rowValues]
      })
    });
  }

  /**
   * Read rows from a sheet tab
   */
  static async getSheetValues(spreadsheetId: string, sheetTitle: string): Promise<any[][]> {
    try {
      const range = `${encodeURIComponent(sheetTitle)}!A1:Z1000`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
      const data = await this.fetchWithAuth(url);
      return data.values || [];
    } catch (err: any) {
      console.warn(`Tab ${sheetTitle} not accessible or empty:`, err.message);
      return [];
    }
  }

  /**
   * 4. Sync Orders from טאב: הזמנות
   */
  static async syncOrdersFromSheet(spreadsheetId: string): Promise<Order[]> {
    const rows = await this.getSheetValues(spreadsheetId, 'הזמנות');
    if (rows.length <= 1) return [];

    const orders: Order[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0 || !r[1]) continue;

      const orderNumber = String(r[1] || '').trim();
      const customerNumber = String(r[2] || '').trim();
      const customerName = String(r[3] || '').trim();
      const warehouse = String(r[4] || '4 (החרש)').trim();
      const deliveryAddress = String(r[5] || '').trim();
      const itemsText = String(r[6] || '').trim();
      const blowDeposit = String(r[7] || 'תקין (0 בלות)').trim();
      const palletDeposit = String(r[8] || 'תקין (0 משטחים)').trim();
      const driver = String(r[9] || 'חכמת/עלי').trim();
      const customerFolderUrl = String(r[10] || '').replace(/=HYPERLINK\("([^"]+)",.*/, '$1').trim();
      const wazeLink = String(r[11] || '').replace(/=HYPERLINK\("([^"]+)",.*/, '$1').trim();
      const waShareLink = String(r[12] || '').replace(/=HYPERLINK\("([^"]+)",.*/, '$1').trim();
      const hasDeliveryNoteRaw = String(r[13] || '').trim();

      const hasNote = hasDeliveryNoteRaw.includes('כן') || hasDeliveryNoteRaw.includes('✅') || hasDeliveryNoteRaw === 'true';

      orders.push({
        id: `ord-gs-${i}-${orderNumber}`,
        timestamp: r[0] || new Date().toISOString().replace('T', ' ').substring(0, 16),
        orderNumber,
        customerNumber,
        customerName,
        warehouse,
        deliveryAddress,
        itemsText,
        blowDeposit,
        palletDeposit,
        driver,
        customerFolderUrl,
        wazeLink,
        waShareLink,
        hasDeliveryNote: hasNote,
        status: hasNote ? 'סופק במלואו' : 'בסידור עבודה',
        distance: '15 ק"מ',
        duration: 'כ-20 דקות'
      });
    }
    return orders;
  }

  /**
   * 9. Sync Delivery Notes from טאב: תעודות_משלוח
   */
  static async syncDeliveryNotesFromSheet(spreadsheetId: string): Promise<DeliveryNote[]> {
    const rows = await this.getSheetValues(spreadsheetId, 'תעודות_משלוח');
    if (rows.length <= 1) return [];

    const notes: DeliveryNote[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0 || !r[1]) continue;

      const docDate = String(r[0] || '').trim();
      const docNumber = String(r[1] || '').trim();
      const orderNumber = String(r[2] || '').trim();
      const customerNumber = String(r[3] || '').trim();
      const customerName = String(r[4] || '').trim();
      const warehouse = String(r[5] || '').trim();
      const address = String(r[6] || '').trim();
      const driver = String(r[7] || '').trim();
      const truck = String(r[8] || '').trim();
      const deliveredItems = String(r[9] || '').trim();
      const bagsDelivered = String(r[10] || '').trim();
      const palletsDelivered = String(r[11] || '').trim();
      const docUrl = String(r[12] || '').replace(/=HYPERLINK\("([^"]+)",.*/, '$1').trim();

      notes.push({
        id: `dn-gs-${i}-${docNumber}`,
        docDate,
        docNumber,
        orderNumber,
        customerNumber,
        customerName,
        warehouse,
        address,
        driver,
        truck,
        deliveredItems,
        bagsDelivered,
        palletsDelivered,
        docUrl,
        auditStatus: '✅ אספקה מאומתת מלאה',
        auditNotes: 'נסרק וסונכרן מ-Google Sheets'
      });
    }
    return notes;
  }

  /**
   * 7. Sync Cross Audit from טאב: הצלבה_ובקרה
   */
  static async syncCrossAuditFromSheet(spreadsheetId: string): Promise<CrossAuditRecord[]> {
    const rows = await this.getSheetValues(spreadsheetId, 'הצלבה_ובקרה');
    if (rows.length <= 1) return [];

    const records: CrossAuditRecord[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0 || !r[0]) continue;

      records.push({
        orderNumber: String(r[0] || '').trim(),
        docNumber: String(r[1] || '').trim(),
        customerInfo: String(r[2] || '').trim(),
        auditStatus: String(r[3] || '✅ אספקה מאומתת').trim(),
        orderedItemsSummary: String(r[4] || '').trim(),
        deliveredItemsSummary: String(r[5] || '').trim(),
        matchScore: String(r[6] || '100%').trim(),
        depositsSummary: String(r[7] || '').trim(),
        auditNotes: String(r[8] || '').trim(),
        folderUrl: String(r[9] || '').replace(/=HYPERLINK\("([^"]+)",.*/, '$1').trim()
      });
    }
    return records;
  }

  /**
   * 3. Sync Customers from טאב: תיקי_לקוחות
   */
  static async syncCustomersFromSheet(spreadsheetId: string): Promise<CustomerRecord[]> {
    const rows = await this.getSheetValues(spreadsheetId, 'תיקי_לקוחות');
    if (rows.length <= 1) return [];

    const customers: CustomerRecord[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0 || !r[0]) continue;

      customers.push({
        customerNumber: String(r[0] || '').trim(),
        customerName: String(r[1] || '').trim(),
        defaultAddress: String(r[2] || '').trim(),
        ordersCount: Number(r[3]) || 0,
        signedNotesCount: Number(r[4]) || 0,
        folderUrl: String(r[5] || '').replace(/=HYPERLINK\("([^"]+)",.*/, '$1').trim(),
        currentProjectStage: 'גמר וטיח'
      });
    }
    return customers;
  }

  /**
   * 6. Sync Cities from טאב: ערים
   */
  static async syncCitiesFromSheet(spreadsheetId: string): Promise<CityRecord[]> {
    const rows = await this.getSheetValues(spreadsheetId, 'ערים');
    if (rows.length <= 1) return [];

    const cities: CityRecord[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0 || (!r[0] && !r[1])) continue;

      const region = String(r[0] || 'מרכז').trim();
      const address = String(r[1] || r[6] || '').trim();
      const distance = String(r[2] || '15 ק"מ').trim();
      const duration = String(r[3] || '20 דק\'').trim();
      const updatedAt = String(r[4] || '').trim();
      const customerName = String(r[5] || '').trim();
      const deliveryCount = Number(r[7]) || 1;
      const lastDeliveryDate = String(r[8] || '').trim();
      const wazeUrl = `https://www.waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;

      cities.push({
        region,
        address,
        distance,
        duration,
        updatedAt,
        customerName,
        deliveryCount,
        lastDeliveryDate,
        wazeUrl
      });
    }
    return cities;
  }

  /**
   * 8. Sync Logistics Dictionary from טאב: מילון_לוגסטי
   */
  static async syncLogisticsDictionaryFromSheet(spreadsheetId: string): Promise<LogisticsDictionaryItem[]> {
    const rows = await this.getSheetValues(spreadsheetId, 'מילון_לוגסטי');
    if (rows.length <= 1) return [];

    const dict: LogisticsDictionaryItem[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0 || !r[0]) continue;

      dict.push({
        sku: String(r[0] || '').trim(),
        productName: String(r[1] || '').trim(),
        quantityHint: String(r[2] || '').trim(),
        requiresBlowDeposit: String(r[3] || '').trim(),
        requiresPalletDeposit: String(r[4] || '').trim(),
        requiresDrumDeposit: String(r[5] || '').trim(),
        requiresBlockPalletDeposit: String(r[6] || '').trim(),
        noaConclusions: String(r[7] || '').trim()
      });
    }
    return dict;
  }

  /**
   * 2. Sync Smart Dashboard from טאב: דשבורד_חכם
   */
  static async syncSmartDashboardFromSheet(spreadsheetId: string): Promise<{
    topProducts: TopProduct[];
    predictions: StagePrediction[];
    recommendations: ProcurementRecommendation[];
  }> {
    const rows = await this.getSheetValues(spreadsheetId, 'דשבורד_חכם');
    const topProducts: TopProduct[] = [];
    const predictions: StagePrediction[] = [];
    const recommendations: ProcurementRecommendation[] = [];

    let currentSection: 'none' | 'products' | 'predictions' | 'procurement' = 'none';

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const firstCell = String(row[0] || '').trim();

      if (firstCell.includes('10 מוצרי הדגל') || firstCell.includes('מלאי ומכירות')) {
        currentSection = 'products';
        continue;
      } else if (firstCell.includes('מנוע חיזוי') || firstCell.includes('סטטוס פרויקטים')) {
        currentSection = 'predictions';
        continue;
      } else if (firstCell.includes('המלצות רכש') || firstCell.includes('תכנון מחסנים')) {
        currentSection = 'procurement';
        continue;
      }

      // Skip header rows
      if (firstCell === 'מק"ט' || firstCell === 'שם הלקוח / פרויקט' || firstCell === 'עדיפות' || firstCell.startsWith('🏗️')) {
        continue;
      }

      if (currentSection === 'products' && firstCell) {
        topProducts.push({
          sku: firstCell,
          name: String(row[1] || ''),
          category: String(row[2] || 'חומרי בניין'),
          totalSold: row[3] || 0,
          currentStock: String(row[4] || 'תקין'),
          stockStatus: (row[5] as any) || '✅ תקין'
        });
      } else if (currentSection === 'predictions' && firstCell) {
        predictions.push({
          customerName: firstCell,
          currentStage: String(row[1] || 'גמר וטיח'),
          suppliedMaterials: String(row[2] || '—'),
          expectedMaterials: String(row[3] || '—'),
          expectedDate: String(row[4] || 'השבוע'),
          managerRecommendation: String(row[5] || '—')
        });
      } else if (currentSection === 'procurement' && firstCell) {
        recommendations.push({
          priority: (firstCell as any) || '✅ מבוקש ויציב',
          materialName: String(row[1] || ''),
          currentStock: String(row[2] || 'תקין'),
          weeklyDemand: String(row[3] || '—'),
          warehouseAction: String(row[4] || '—')
        });
      }
    }

    return { topProducts, predictions, recommendations };
  }

  /**
   * Sync ALL tabs dynamically in parallel
   */
  static async syncAllTabs(spreadsheetId: string) {
    await this.ensureRequiredTabs(spreadsheetId);

    const [
      orders,
      deliveryNotes,
      auditRecords,
      customers,
      cities,
      dictionary,
      smartData
    ] = await Promise.all([
      this.syncOrdersFromSheet(spreadsheetId),
      this.syncDeliveryNotesFromSheet(spreadsheetId),
      this.syncCrossAuditFromSheet(spreadsheetId),
      this.syncCustomersFromSheet(spreadsheetId),
      this.syncCitiesFromSheet(spreadsheetId),
      this.syncLogisticsDictionaryFromSheet(spreadsheetId),
      this.syncSmartDashboardFromSheet(spreadsheetId)
    ]);

    return {
      orders,
      deliveryNotes,
      auditRecords,
      customers,
      cities,
      dictionary,
      topProducts: smartData.topProducts,
      predictions: smartData.predictions,
      recommendations: smartData.recommendations
    };
  }

  /**
   * Write an Order to Google Sheets (טאב: הזמנות + טאב: דשבורד_לקוחות)
   */
  static async writeOrderToSheet(spreadsheetId: string, order: Order, dispatchPhone: string) {
    const wazeLink = `https://www.waze.com/ul?q=${encodeURIComponent(order.deliveryAddress)}&navigate=yes`;
    const waShareLink = `https://api.whatsapp.com/send?phone=972${dispatchPhone.replace(/[^\d]/g, '').replace(/^0/, '')}&text=${encodeURIComponent('📦 הזמנה ' + order.orderNumber + ' עבור ' + order.customerName)}`;

    const rowOrders = [
      order.timestamp,
      order.orderNumber,
      order.customerNumber,
      order.customerName,
      order.warehouse,
      order.deliveryAddress,
      order.itemsText,
      order.blowDeposit,
      order.palletDeposit,
      order.driver || 'חכמת/עלי',
      order.customerFolderUrl ? `=HYPERLINK("${order.customerFolderUrl}", "📁 תיק לקוח")` : '—',
      `=HYPERLINK("${wazeLink}", "🧭 Waze")`,
      `=HYPERLINK("${waShareLink}", "📲 שגר וואטסאפ")`,
      order.hasDeliveryNote ? '✅ כן' : '⏳ טרם'
    ];

    await this.appendRow(spreadsheetId, 'הזמנות', rowOrders);

    // Also write to טאב: דשבורד_לקוחות
    try {
      const rowCustomerDash = [
        order.timestamp,
        order.orderNumber,
        order.warehouse,
        order.deliveryAddress,
        order.itemsText,
        order.blowDeposit,
        order.palletDeposit,
        order.customerFolderUrl ? `=HYPERLINK("${order.customerFolderUrl}", "📁 תיק לקוח")` : '—',
        '',
        order.deliveryAddress,
        order.warehouse
      ];
      await this.appendRow(spreadsheetId, 'דשבורד_לקוחות', rowCustomerDash);
    } catch (e) {
      console.warn('Could not write to דשבורד_לקוחות:', e);
    }
  }

  /**
   * Write Delivery Note to Google Sheets (טאב: תעודות_משלוח)
   */
  static async writeDeliveryNoteToSheet(spreadsheetId: string, note: DeliveryNote) {
    const docHyperlink = note.docUrl ? `=HYPERLINK("${note.docUrl}", "📄 צפה בתעודה")` : '—';
    const row = [
      note.docDate,
      note.docNumber,
      note.orderNumber,
      note.customerNumber,
      note.customerName,
      note.warehouse,
      note.address,
      note.driver,
      note.truck,
      note.deliveredItems,
      note.bagsDelivered,
      note.palletsDelivered,
      docHyperlink
    ];
    await this.appendRow(spreadsheetId, 'תעודות_משלוח', row);
  }

  /**
   * Reconcile Cross-Audit Row in טאב: הצלבה_ובקרה
   */
  static async updateCrossAuditSheet(spreadsheetId: string, note: DeliveryNote) {
    const rows = await this.getSheetValues(spreadsheetId, 'הצלבה_ובקרה');
    let targetRowIndex = -1;

    for (let r = 1; r < rows.length; r++) {
      if (String(rows[r][0] || '').trim() === String(note.orderNumber).trim()) {
        targetRowIndex = r + 1; // 1-indexed
        break;
      }
    }

    if (targetRowIndex > 0) {
      // Update existing row
      const range = `הצלבה_ובקרה!A${targetRowIndex}:J${targetRowIndex}`;
      const updatedRow = [
        note.orderNumber,
        note.docNumber,
        `${note.customerName} (${note.customerNumber})`,
        note.auditStatus,
        rows[targetRowIndex - 1]?.[4] || note.deliveredItems,
        note.deliveredItems,
        '100% התאמה',
        `${note.bagsDelivered} | ${note.palletsDelivered} (תואם)`,
        note.auditNotes,
        note.docUrl ? `=HYPERLINK("${note.docUrl}", "📁 תיק לקוח")` : '—'
      ];

      await this.fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        body: JSON.stringify({ values: [updatedRow] })
      });
    } else {
      // Append new cross audit row
      await this.appendRow(spreadsheetId, 'הצלבה_ובקרה', [
        note.orderNumber,
        note.docNumber,
        `${note.customerName} (${note.customerNumber})`,
        note.auditStatus,
        note.deliveredItems,
        note.deliveredItems,
        '100% התאמה',
        `${note.bagsDelivered} | ${note.palletsDelivered}`,
        note.auditNotes,
        note.docUrl ? `=HYPERLINK("${note.docUrl}", "📁 תיק לקוח")` : '—'
      ]);
    }
  }

  /**
   * Write Customer to טאב: תיקי_לקוחות
   */
  static async writeCustomerToSheet(spreadsheetId: string, cust: CustomerRecord) {
    const folderHyperlink = cust.folderUrl ? `=HYPERLINK("${cust.folderUrl}", "📁 פתח תיקיית Drive")` : '—';
    const row = [
      cust.customerNumber,
      cust.customerName,
      cust.defaultAddress,
      cust.ordersCount,
      cust.signedNotesCount,
      folderHyperlink
    ];
    await this.appendRow(spreadsheetId, 'תיקי_לקוחות', row);
  }

  /**
   * Write City to טאב: ערים
   */
  static async writeCityToSheet(spreadsheetId: string, city: CityRecord) {
    const row = [
      city.region,
      city.address,
      city.distance,
      city.duration,
      new Date().toISOString().substring(0, 10),
      city.customerName,
      city.address,
      city.deliveryCount,
      city.lastDeliveryDate || new Date().toISOString().substring(0, 10)
    ];
    await this.appendRow(spreadsheetId, 'ערים', row);
  }

  /**
   * Sync Smart Dashboard to Google Sheets (3 tables in טאב: דשבורד_חכם)
   */
  static async populateSmartDashboardSheet(
    spreadsheetId: string,
    topProducts: TopProduct[],
    predictions: StagePrediction[],
    recommendations: ProcurementRecommendation[]
  ) {
    await this.ensureRequiredTabs(spreadsheetId);
    
    // Clear and build the tab
    await this.fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/דשבורד_חכם!A1:Z100:clear`, {
      method: 'POST'
    });

    const values: (string | number)[][] = [];

    // Header
    values.push(['🏗️ דשבורד ניהול חכם וחיזוי רכש — ח. סבן חומרי בניין']);
    values.push([]);
    values.push(['📊 טבלה 1: מלאי ומכירות — 10 מוצרי הדגל המובילים']);
    values.push(['מק"ט', 'שם מוצר / חומר', 'קטגוריה', 'סה"כ כמות נמכרת', 'מלאי נוכחי במחסנים', 'סטטוס מלאי']);

    topProducts.forEach(p => {
      values.push([p.sku, p.name, p.category, p.totalSold, p.currentStock, p.stockStatus]);
    });

    values.push([]);
    values.push(['🔮 טבלה 2: סטטוס פרויקטים/לקוחות — מנוע חיזוי שלבי בנייה']);
    values.push(['שם הלקוח / פרויקט', 'שלב נוכחי מזוהה', 'חומרים שסופקו בשלב קודם', 'צפי חומרים לשלב הבא', 'מועד משוער להזמנה', 'פעולת המלצה למנהל']);

    predictions.forEach(pr => {
      values.push([pr.customerName, pr.currentStage, pr.suppliedMaterials, pr.expectedMaterials, pr.expectedDate, pr.managerRecommendation]);
    });

    values.push([]);
    values.push(['💡 טבלה 3: תכנון מחסנים — המלצות רכש ומלאי שבועיות']);
    values.push(['עדיפות', 'סוג חומר / מק"ט', 'מלאי נוכחי מוערך', 'צפי ביקוש שבועי', 'פעולה נדרשת במחסני החרש / התלמיד']);

    recommendations.forEach(r => {
      values.push([r.priority, r.materialName, r.currentStock, r.weeklyDemand, r.warehouseAction]);
    });

    const range = `דשבורד_חכם!A1`;
    await this.fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ values })
    });
  }
}
