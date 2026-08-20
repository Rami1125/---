import { getAccessToken } from './auth';
import {
  Order,
  DeliveryNote,
  CrossAuditRecord,
  CustomerRecord,
  CityRecord,
  TopProduct,
  StagePrediction,
  ProcurementRecommendation
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
   * Check if spreadsheet exists and fetch sheet names
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
   * Create tabs if they don't exist
   */
  static async ensureRequiredTabs(spreadsheetId: string) {
    const { sheetTitles } = await this.getSpreadsheetInfo(spreadsheetId);
    const required = ['הזמנות', 'תעודות_משלוח', 'הצלבה_ובקרה', 'תיקי_לקוחות', 'ערים', 'דשבורד_חכם'];
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

      // Add headers for created sheets
      if (missing.includes('הזמנות')) {
        await this.appendRow(spreadsheetId, 'הזמנות', [
          'תאריך_ושעה', 'מספר_הזמנה', 'מספר_לקוח', 'שם_לקוח', 'מחסן_יוצא', 'כתובת_אספקה', 'רשימת_מוצרים', 'אימות_בלות', 'אימות_משטחים', 'תיקיית_לקוח', 'קישור_Waze', 'שיתוף_וואטסאפ'
        ]);
      }
      if (missing.includes('תעודות_משלוח')) {
        await this.appendRow(spreadsheetId, 'תעודות_משלוח', [
          'תאריך_סריקה', 'מספר_תעודה', 'מספר_הזמנה', 'מספר_לקוח', 'שם_לקוח', 'מחסן', 'כתובת', 'נהג', 'משאית', 'מוצרים_שסופקו', 'בלות_שסופקו', 'משטחים_שסופקו', 'קישור_לתעודה'
        ]);
      }
      if (missing.includes('הצלבה_ובקרה')) {
        await this.appendRow(spreadsheetId, 'הצלבה_ובקרה', [
          'מספר_הזמנה', 'מספר_תעודה', 'לקוח', 'סטטוס_הצלבה', 'מוצרים_בהזמנה', 'מוצרים_בתעודה', 'אחוז_התאמה', 'פקדונות_בלות_ומשטחים', 'הערות_בקרה_ופריקה', 'קישור_תיק_לקוח'
        ]);
      }
      if (missing.includes('תיקי_לקוחות')) {
        await this.appendRow(spreadsheetId, 'תיקי_לקוחות', [
          'מספר_לקוח', 'שם_לקוח', 'כתובת_קבועה_אתר_מרכזי', 'כמות_הזמנות', 'כמות_תעודות_חתומות', 'קישור_ישיר_לתיקיית_לקוח_בדרייב'
        ]);
      }
      if (missing.includes('ערים')) {
        await this.appendRow(spreadsheetId, 'ערים', [
          'אזור', 'כתובת_מדויקת', 'שם_לקוח_אתר', 'כמות_אספקות', 'מרחק_מהבסיס', 'Waze'
        ]);
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
    const range = `${encodeURIComponent(sheetTitle)}!A1:Z500`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    const data = await this.fetchWithAuth(url);
    return data.values || [];
  }

  /**
   * Sync Orders from Google Sheets tab
   */
  static async syncOrdersFromSheet(spreadsheetId: string): Promise<Order[]> {
    const rows = await this.getSheetValues(spreadsheetId, 'הזמנות');
    if (rows.length <= 1) return [];

    const orders: Order[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0 || !r[1]) continue;
      orders.push({
        id: `ord-gs-${i}-${r[1]}`,
        timestamp: r[0] || new Date().toISOString(),
        orderNumber: String(r[1] || ''),
        customerNumber: String(r[2] || ''),
        customerName: String(r[3] || ''),
        warehouse: String(r[4] || '4 (החרש)'),
        deliveryAddress: String(r[5] || ''),
        itemsText: String(r[6] || ''),
        blowDeposit: String(r[7] || 'תקין'),
        palletDeposit: String(r[8] || 'תקין'),
        status: 'בסידור עבודה',
        distance: '15 ק"מ',
        duration: 'כ-20 דקות',
        customerFolderUrl: String(r[9] || '')
      });
    }
    return orders;
  }

  /**
   * Write an Order to Google Sheets
   */
  static async writeOrderToSheet(spreadsheetId: string, order: Order, dispatchPhone: string) {
    const wazeLink = `https://www.waze.com/ul?q=${encodeURIComponent(order.deliveryAddress)}&navigate=yes`;
    const waShareLink = `https://api.whatsapp.com/send?phone=972${dispatchPhone.replace(/[^\d]/g, '').replace(/^0/, '')}&text=${encodeURIComponent('📦 הזמנה ' + order.orderNumber + ' עבור ' + order.customerName)}`;

    const row = [
      order.timestamp,
      order.orderNumber,
      order.customerNumber,
      order.customerName,
      order.warehouse,
      order.deliveryAddress,
      order.itemsText,
      order.blowDeposit,
      order.palletDeposit,
      order.customerFolderUrl ? `=HYPERLINK("${order.customerFolderUrl}", "📁 תיק לקוח")` : '—',
      `=HYPERLINK("${wazeLink}", "🧭 Waze")`,
      `=HYPERLINK("${waShareLink}", "📲 שתף בוואטסאפ")`
    ];

    await this.appendRow(spreadsheetId, 'הזמנות', row);
  }

  /**
   * Write Delivery Note to Google Sheets
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
   * Reconcile Cross-Audit Row in Sheet
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
   * Sync Smart Dashboard to Google Sheets
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
    values.push(['📊 10 מוצרי הדגל המובילים (בניטרול מוצרי חנות קטנים)']);
    values.push(['מק"ט', 'שם מוצר / חומר', 'קטגוריה', 'סה"כ כמות נמכרת', 'מלאי נוכחי במחסנים', 'סטטוס מלאי']);

    topProducts.forEach(p => {
      values.push([p.sku, p.name, p.category, p.totalSold, p.currentStock, p.stockStatus]);
    });

    values.push([]);
    values.push(['🔮 מנוע חיזוי AI — מעקב שלבי בנייה וצפי חומרים ללקוח']);
    values.push(['שם הלקוח / פרויקט', 'שלב נוכחי מזוהה', 'חומרים שסופקו בשלב קודם', 'צפי חומרים לשלב הבא', 'מועד משוער להזמנה', 'פעולת המלצה למנהל']);

    predictions.forEach(pr => {
      values.push([pr.customerName, pr.currentStage, pr.suppliedMaterials, pr.expectedMaterials, pr.expectedDate, pr.managerRecommendation]);
    });

    values.push([]);
    values.push(['💡 המלצות רכש ומלאי אסטרטגיות לשבוע הקרוב (AI Engine Recommendations)']);
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
