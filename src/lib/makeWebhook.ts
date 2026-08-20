import { Order, SystemConfig } from '../types';

export interface WebhookSendResult {
  success: boolean;
  endpointUsed?: string;
  responseStatus?: number;
  error?: string;
  formattedMessage: string;
  wazeLink: string;
  waDirectLink: string;
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
    const orderStatus = order.status || 'מאושר';

    const message =
      `📦 *${order.orderNumber}* - *${order.customerName}*\n\n` +
      `✨ *הזמנה חדשה בסידור עבודה (${source})* ✨\n\n` +
      `👤 *לקוח:* ${order.customerName}\n` +
      `🏢 *מחסן יוצא:* ${order.warehouse}\n` +
      `📍 *כתובת אספקה:* ${address}\n` +
      `🧾 *מספר הזמנה:* ${order.orderNumber}\n\n` +
      `👋 *שיבוץ נהג ומשאית:*\n` +
      `🚚 *נהג משובץ:* ${driver}\n` +
      `⏱️ *מרחק וזמן:* ${distance} | ${duration}\n` +
      `🧭 *Waze ישיר:* ${wazeLink}\n\n` +
      `🛒 *רשימת פריטים ומק"טים:*\n${order.itemsText || 'אין פריטים'}\n\n` +
      `🛡️ *אימות פקדונות:*\n` +
      `- *בלות:* ✅ מאושר (${blowText})\n` +
      `- *משטחים:* ✅ מאושר (${palletText})\n` +
      `- *סטטוס:* *${orderStatus}*\n\n` +
      `*באדיבות נועה* 🌹`;

    const waDirectLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    return {
      message,
      wazeLink,
      waDirectLink,
      cleanPhone
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

    const payload = {
      phone: cleanPhone,
      message,
      event: 'whatsapp_order',
      orderNumber: String(order.orderNumber),
      customerName: String(order.customerName),
      customerNumber: String(order.customerNumber || ''),
      warehouse: String(order.warehouse),
      deliveryAddress: String(order.deliveryAddress || 'הוד השרון'),
      itemsText: String(order.itemsText || ''),
      driver: String(order.driver || config?.defaultDriver || 'חכמת/עלי'),
      distance: String(order.distance || '15.2 ק"מ'),
      duration: String(order.duration || 'כ-19 דקות'),
      wazeUrl: String(wazeLink),
      source: String((order as any).source || 'קומקס'),
      timestamp: new Date().toISOString()
    };

    const configEndpoints = (config?.makeWebhookEndpoints || []).filter(e => e && e.trim().length > 0);
    const endpoints = configEndpoints.length > 0 ? configEndpoints : DEFAULT_MAKE_WEBHOOK_ENDPOINTS;

    let lastError: string | null = null;

    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok || response.status === 200 || response.status === 204) {
          return {
            success: true,
            endpointUsed: endpoint,
            responseStatus: response.status,
            formattedMessage: message,
            wazeLink,
            waDirectLink
          };
        } else {
          lastError = `קוד שגיאה מהשרת: ${response.status}`;
        }
      } catch (err: any) {
        lastError = err?.message || 'שגיאת רשת בשליחה ל-Webhook';
        console.warn(`Make webhook endpoint ${i + 1} failed:`, err);
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

