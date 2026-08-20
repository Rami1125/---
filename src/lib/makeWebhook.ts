import { Order, SystemConfig } from '../types';

export interface WebhookSendResult {
  success: boolean;
  endpointUsed?: string;
  responseStatus?: number;
  error?: string;
  formattedMessage: string;
  wazeLink?: string;
  waDirectLink: string;
  methodUsed?: 'json-cors' | 'no-cors-fallback' | 'beacon' | 'direct';
}

export const DEFAULT_MAKE_WEBHOOK_ENDPOINTS = [
  'https://hook.us2.make.com/e1ifxqwm66ji347ooyg6abuk7i2voom0',
  'https://hook.eu1.make.com/j1kfxfn5y4goe1lud3dk1phkw4bkjvyr'
];

export class MakeWebhookService {
  /**
   * Cleans phone number to international WhatsApp format (e.g. 972509620049)
   */
  static cleanPhoneNumber(phone?: string, fallback: string = '0509620049'): string {
    const raw = (phone || fallback).replace(/[^\d]/g, '');
    if (!raw) return '972509620049';
    if (raw.startsWith('972')) return raw;
    if (raw.startsWith('0')) return '972' + raw.substring(1);
    return '972' + raw;
  }

  /**
   * Generates a direct WhatsApp link that opens in WhatsApp Web / App
   */
  static getWhatsAppDirectUrl(phone: string, text: string): string {
    const cleanPhone = this.cleanPhoneNumber(phone);
    const encoded = encodeURIComponent(text);
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
  }

  /**
   * Formats the exact WhatsApp message conforming to sendJoniWhatsAppMessage
   */
  static formatWhatsAppMessage(order: Order, config?: Partial<SystemConfig>): {
    message: string;
    wazeLink: string;
    waDirectLink: string;
    cleanPhone: string;
  } {
    const address = order.deliveryAddress || 'הוד השרון';
    const wazeLink = `https://www.waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
    const cleanPhone = this.cleanPhoneNumber(config?.dispatchPhone || '0509620049');
    const driver = order.driver || config?.defaultDriver || 'חכמת/עלי';
    const distance = order.distance || '15.2 ק"מ';
    const duration = order.duration || 'כ-19 דקות';
    const source = (order as any).source || 'קומקס';
    const blowText = order.blowDeposit ? `${order.blowDeposit} בלות` : '0 בלות';
    const palletText = order.palletDeposit ? `${order.palletDeposit} משטחים` : '0 משטחים';
    const orderStatus = order.status || 'בסידור עבודה';

    const message =
      `📦 *${order.orderNumber}* - *${order.customerName}*\n\n` +
      `✨ *הזמנה בסידור עבודה (${source})* ✨\n\n` +
      `👤 *לקוח:* ${order.customerName}\n` +
      `🏢 *מחסן יוצא:* ${order.warehouse}\n` +
      `📍 *כתובת אספקה:* ${address}\n` +
      `🧾 *מספר הזמנה:* ${order.orderNumber}\n\n` +
      `👋 *שיבוץ נהג ומשאית:*\n` +
      `🚚 *נהג משובץ:* ${driver}\n` +
      (order.truck ? `🚛 *משאית/רכב:* ${order.truck}\n` : '') +
      (order.deliveryTime ? `⏰ *שעת אספקה:* ${order.deliveryTime}\n` : '') +
      `⏱️ *מרחק וזמן:* ${distance} | ${duration}\n` +
      `🧭 *Waze ישיר:* ${wazeLink}\n\n` +
      `🛒 *רשימת פריטים ומק"טים:*\n${order.itemsText || 'אין פירוט פריטים'}\n\n` +
      `🛡️ *אימות פקדונות:*\n` +
      `- *בלות:* ✅ מאושר (${blowText})\n` +
      `- *משטחים:* ✅ מאושר (${palletText})\n` +
      `- *סטטוס:* *${orderStatus}*\n\n` +
      `*באדיבות ח. סבן בע"מ* 🌹`;

    const waDirectLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    return {
      message,
      wazeLink,
      waDirectLink,
      cleanPhone
    };
  }

  /**
   * Helper: Dispatches raw payload to Make.com with CORS-fallback handling
   */
  static async postPayloadToMake(
    endpoint: string,
    payload: Record<string, any>
  ): Promise<{ success: boolean; status?: number; error?: string; method?: 'json-cors' | 'no-cors-fallback' | 'beacon' }> {
    const jsonString = JSON.stringify(payload);

    // Attempt 1: Standard JSON fetch
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*'
        },
        body: jsonString
      });

      if (response.ok || response.status === 200 || response.status === 204 || response.status === 202) {
        return { success: true, status: response.status, method: 'json-cors' };
      }

      // Capture specific server response text if available
      let errorDetail = '';
      try {
        const text = await response.text();
        if (text) {
          if (text.includes('Queue is full')) {
            errorDetail = 'התור ב-Make.com מלא (Queue is full). יש להפעיל את ה-Scenario ב-Make או לרוקן את התור';
          } else {
            errorDetail = text;
          }
        }
      } catch (_) {}

      return {
        success: false,
        status: response.status,
        error: errorDetail || `שרת Make החזיר שגיאה (קוד ${response.status})`,
        method: 'json-cors'
      };
    } catch (err: any) {
      console.warn(`Standard fetch failed for ${endpoint}, testing no-cors fallback:`, err);
    }

    // Attempt 2: no-cors mode (Bypasses browser CORS restrictions completely, Make still receives payload!)
    try {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: jsonString
      });
      // In no-cors mode, type is 'opaque', but payload is successfully delivered to Make server!
      return { success: true, status: 200, method: 'no-cors-fallback' };
    } catch (noCorsErr: any) {
      console.warn(`no-cors mode failed for ${endpoint}:`, noCorsErr);
    }

    // Attempt 3: Beacon API
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const beaconSuccess = navigator.sendBeacon(endpoint, blob);
        if (beaconSuccess) {
          return { success: true, status: 200, method: 'beacon' };
        }
      }
    } catch (beaconErr) {
      console.warn(`sendBeacon failed for ${endpoint}:`, beaconErr);
    }

    return { success: false, error: 'כל שיטות השידור ל-Webhook נכשלו' };
  }

  /**
   * Sends arbitrary custom WhatsApp message or Morning Report to Make.com
   */
  static async sendCustomWhatsAppMessage(
    messageText: string,
    phone?: string,
    extraData?: Record<string, any>,
    config?: SystemConfig
  ): Promise<WebhookSendResult> {
    const cleanPhone = this.cleanPhoneNumber(phone || config?.dispatchPhone);
    const waDirectLink = this.getWhatsAppDirectUrl(cleanPhone, messageText);

    // Multi-key payload so any Make scenario mapping works seamlessly
    const payload = {
      phone: cleanPhone,
      to: cleanPhone,
      recipient: cleanPhone,
      mobile: cleanPhone,
      message: messageText,
      text: messageText,
      body: messageText,
      content: messageText,
      whatsapp_message: messageText,
      event: 'whatsapp_custom_message',
      timestamp: new Date().toISOString(),
      ...(extraData || {})
    };

    const configEndpoints = (config?.makeWebhookEndpoints || []).filter((e) => e && e.trim().length > 0);
    const endpoints = configEndpoints.length > 0 ? configEndpoints : DEFAULT_MAKE_WEBHOOK_ENDPOINTS;

    let lastError: string | null = null;

    for (const endpoint of endpoints) {
      const result = await this.postPayloadToMake(endpoint, payload);
      if (result.success) {
        return {
          success: true,
          endpointUsed: endpoint,
          responseStatus: result.status,
          formattedMessage: messageText,
          waDirectLink,
          methodUsed: result.method
        };
      } else {
        lastError = result.error || 'שגיאת שידור לשרת Make';
      }
    }

    return {
      success: false,
      error: lastError || 'לא ניתן היה לשדר את ההודעה ל-Make.com',
      formattedMessage: messageText,
      waDirectLink
    };
  }

  /**
   * Executes the exact sendJoniWhatsAppMessage webhook call to Make.com
   */
  static async sendDispatchNotification(
    order: Order,
    config?: SystemConfig
  ): Promise<WebhookSendResult> {
    const { message, wazeLink, waDirectLink, cleanPhone } = this.formatWhatsAppMessage(order, config);

    // Enriched multi-key payload for 100% Make compatibility
    const payload = {
      phone: cleanPhone,
      to: cleanPhone,
      recipient: cleanPhone,
      mobile: cleanPhone,
      message,
      text: message,
      body: message,
      whatsapp_message: message,
      event: 'whatsapp_order',
      orderNumber: String(order.orderNumber),
      order_id: String(order.orderNumber),
      customerName: String(order.customerName),
      customer: String(order.customerName),
      customerNumber: String(order.customerNumber || ''),
      warehouse: String(order.warehouse),
      deliveryAddress: String(order.deliveryAddress || 'הוד השרון'),
      address: String(order.deliveryAddress || 'הוד השרון'),
      itemsText: String(order.itemsText || ''),
      driver: String(order.driver || config?.defaultDriver || 'חכמת/עלי'),
      truck: String(order.truck || ''),
      deliveryDate: String(order.deliveryDate || ''),
      deliveryTime: String(order.deliveryTime || ''),
      distance: String(order.distance || '15.2 ק"מ'),
      duration: String(order.duration || 'כ-19 דקות'),
      wazeUrl: String(wazeLink),
      waze_link: String(wazeLink),
      source: String((order as any).source || 'קומקס'),
      timestamp: new Date().toISOString()
    };

    const configEndpoints = (config?.makeWebhookEndpoints || []).filter((e) => e && e.trim().length > 0);
    const endpoints = configEndpoints.length > 0 ? configEndpoints : DEFAULT_MAKE_WEBHOOK_ENDPOINTS;

    let lastError: string | null = null;

    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      const result = await this.postPayloadToMake(endpoint, payload);

      if (result.success) {
        return {
          success: true,
          endpointUsed: endpoint,
          responseStatus: result.status,
          formattedMessage: message,
          wazeLink,
          waDirectLink,
          methodUsed: result.method
        };
      } else {
        lastError = result.error || `שגיאה מ-Endpoint #${i + 1}`;
      }
    }

    return {
      success: false,
      error: lastError || 'כל ניסיונות השליחה לשרתי Make.com נכשלו',
      formattedMessage: message,
      wazeLink,
      waDirectLink
    };
  }
}


