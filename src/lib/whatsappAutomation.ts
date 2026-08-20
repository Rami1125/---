import { Order, SystemConfig } from '../types';

export interface WhatsAppSummaryResult {
  formattedMessage: string;
  clickToChatUrl: string;
  cleanPhone: string;
  wazeLink?: string;
  ordersCount: number;
}

export class WhatsAppAutomationService {
  /**
   * Normalizes an Israeli phone number to international WhatsApp format (e.g., 972501234567).
   */
  static cleanPhoneNumber(phone: string): string {
    const raw = (phone || '').replace(/[^\d]/g, '');
    if (!raw) return '972545931267'; // Default fallback
    if (raw.startsWith('972')) return raw;
    if (raw.startsWith('0')) return '972' + raw.substring(1);
    return '972' + raw;
  }

  /**
   * Formats a single order summary into a polished WhatsApp markdown message.
   */
  static formatSingleOrderMessage(order: Order, config: SystemConfig): string {
    const wazeLink = `https://www.waze.com/ul?q=${encodeURIComponent(order.deliveryAddress || config.baseLocation)}&navigate=yes`;
    const driver = order.driver || config.defaultDriver;
    const truck = order.truck || config.defaultTruck;

    return (
      `📦 *${order.orderNumber}* - *${order.customerName} (${order.customerNumber})*\n\n` +
      `✨ *הזמנה חדשה בסידור עבודה - SabanOS* ✨\n\n` +
      `👤 *לקוח:* ${order.customerName} (ח.פ/קוד: ${order.customerNumber})\n` +
      `🏢 *מחסן יוצא:* ${order.warehouse}\n` +
      `📍 *כתובת אספקה:* ${order.deliveryAddress}\n` +
      `🧾 *מספר הזמנה:* ${order.orderNumber}\n` +
      `📅 *תאריך ושעה:* ${order.timestamp || new Date().toISOString().substring(0, 16)}\n\n` +
      `👋 *שיבוץ נהג ומשאית:*\n` +
      `🚚 *נהג:* ${driver} | *משאית:* ${truck}\n` +
      `⏱️ *מרחק וזמן:* ${order.distance || 'לפי מסלול'} | ${order.duration || 'לפי תנועה'}\n` +
      `🧭 *ניווט Waze ישיר:* ${wazeLink}\n\n` +
      `🛒 *רשימת פריטים ומק"טים:*\n${order.itemsText}\n\n` +
      `🛡️ *אימות פקדונות:*\n` +
      `- *בלות:* ${order.blowDeposit || '0'}\n` +
      `- *משטחים:* ${order.palletDeposit || '0'}\n` +
      `- *סטטוס נוכחי:* *${order.status || 'בסידור עבודה'}*\n\n` +
      `*באדיבות נועה* 🌹`
    );
  }

  /**
   * Formats a batch order summary for multiple selected orders.
   */
  static formatBatchOrdersMessage(orders: Order[], config: SystemConfig): string {
    if (orders.length === 0) return '';
    if (orders.length === 1) return this.formatSingleOrderMessage(orders[0], config);

    const driver = orders[0].driver || config.defaultDriver;
    const truck = orders[0].truck || config.defaultTruck;
    const today = new Date().toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });

    let message =
      `📋 *סידור עבודה מרוכז - ח. סבן חומרי בניין*\n` +
      `📅 *תאריך:* ${today}\n` +
      `🚚 *נהג משובץ:* ${driver} (${truck})\n` +
      `📍 *בסיס יציאה:* ${config.baseLocation}\n` +
      `📦 *סה"כ הזמנות בסידור:* ${orders.length}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n`;

    orders.forEach((order, index) => {
      const wazeLink = `https://www.waze.com/ul?q=${encodeURIComponent(order.deliveryAddress)}&navigate=yes`;
      message +=
        `🔹 *תחנה #${index + 1}: הזמנה ${order.orderNumber}*\n` +
        `👤 *לקוח:* ${order.customerName} (${order.customerNumber})\n` +
        `🏢 *מחסן:* ${order.warehouse}\n` +
        `📍 *כתובת:* ${order.deliveryAddress}\n` +
        `🧭 *Waze:* ${wazeLink}\n` +
        `📦 *מוצרים:* \n${order.itemsText}\n` +
        `🛡️ *פקדונות:* בלות: ${order.blowDeposit || '0'} | משטחים: ${order.palletDeposit || '0'}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n`;
    });

    message +=
      `📞 *סדרן ראשי:* ${config.dispatchPhone}\n` +
      `*באדיבות נועה* 🌹`;

    return message;
  }

  /**
   * Generates a WhatsApp click-to-chat URL for an order or batch of orders.
   */
  static generateClickToChatUrl(
    message: string,
    phoneOverride?: string,
    defaultConfigPhone?: string
  ): string {
    const rawPhone = phoneOverride || defaultConfigPhone || '054-5931267';
    const cleanPhone = this.cleanPhoneNumber(rawPhone);
    const encodedText = encodeURIComponent(message);
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }

  /**
   * Creates a complete summary result for a single order.
   */
  static createSingleOrderSummary(
    order: Order,
    config: SystemConfig,
    phoneOverride?: string
  ): WhatsAppSummaryResult {
    const formattedMessage = this.formatSingleOrderMessage(order, config);
    const cleanPhone = this.cleanPhoneNumber(phoneOverride || config.dispatchPhone);
    const clickToChatUrl = this.generateClickToChatUrl(formattedMessage, cleanPhone);
    const wazeLink = `https://www.waze.com/ul?q=${encodeURIComponent(order.deliveryAddress || config.baseLocation)}&navigate=yes`;

    return {
      formattedMessage,
      clickToChatUrl,
      cleanPhone,
      wazeLink,
      ordersCount: 1
    };
  }

  /**
   * Creates a complete summary result for a batch of selected orders.
   */
  static createBatchOrdersSummary(
    orders: Order[],
    config: SystemConfig,
    phoneOverride?: string
  ): WhatsAppSummaryResult {
    const formattedMessage = this.formatBatchOrdersMessage(orders, config);
    const cleanPhone = this.cleanPhoneNumber(phoneOverride || config.dispatchPhone);
    const clickToChatUrl = this.generateClickToChatUrl(formattedMessage, cleanPhone);

    return {
      formattedMessage,
      clickToChatUrl,
      cleanPhone,
      ordersCount: orders.length
    };
  }

  /**
   * Opens the WhatsApp click-to-chat URL in a new window/tab.
   */
  static sendViaWhatsAppClickToChat(
    orders: Order | Order[],
    config: SystemConfig,
    phoneOverride?: string
  ): WhatsAppSummaryResult {
    const orderList = Array.isArray(orders) ? orders : [orders];
    const summary =
      orderList.length === 1
        ? this.createSingleOrderSummary(orderList[0], config, phoneOverride)
        : this.createBatchOrdersSummary(orderList, config, phoneOverride);

    // Open WhatsApp Click-to-Chat in a new tab safely
    try {
      window.open(summary.clickToChatUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('Could not auto-open popup, returning URL', e);
    }

    return summary;
  }
}
