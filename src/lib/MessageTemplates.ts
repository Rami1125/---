/**
 * MessageTemplates.ts
 * Dedicated pure formatting functions for Noa AI dispatch messages.
 * Ensures emoji preservation, markdown bolding syntax (*), variable injection,
 * and exact compliance with H. Saban & Noa AI dispatch constraints.
 */

export interface NoaDispatchParams {
  driverName: string;
  orderId: string | number;
  customerName: string;
  address: string;
  warehouse: string;
  materials: string | string[];
  audioUrl?: string;
  customFooter?: string;
}

export interface EnhancedDispatchParams extends NoaDispatchParams {
  slaWindow?: string;
  totalWeightKg?: number;
  weightTon?: number;
  notes?: string;
  craneRequirement?: string;
  blowDeposit?: string | number;
  palletDeposit?: string | number;
}

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
}

/**
 * Exact default placeholder for audio link when real Drive link is not yet generated
 */
export const DEFAULT_AUDIO_PLACEHOLDER = '[כאן יצורף לינק אוטומטי מהדרייב]';

/**
 * Cleans driver name, stripping parentheses and helper roles while preserving Hebrew name.
 * e.g. "חכמת (משאית מנוף 🏗️)" -> "חכמת"
 * e.g. "חכמת/עלי" -> "חכמת"
 */
export function cleanDriverName(driverName: string = ''): string {
  if (!driverName) return 'נהג';
  const clean = driverName
    .replace(/\(.*?\)/g, '')
    .replace(/[()]/g, '')
    .trim()
    .split(/[\s/]+/)[0];
  return clean || driverName.trim();
}

/**
 * Cleans warehouse name.
 * e.g. "מחסן 4 (החרש)" -> "החרש"
 * e.g. "🏢 1 (התלמיד)" -> "התלמיד"
 */
export function cleanWarehouseName(warehouse: string = ''): string {
  if (!warehouse) return 'החרש';
  const match = warehouse.match(/\((.*?)\)/);
  if (match && match[1]) {
    return match[1].replace(/מחסן/g, '').trim();
  }
  return warehouse.replace(/^מחסן\s*/, '').trim();
}

/**
 * Formats materials list either from an array of strings or raw multi-line string.
 * Preserves custom formatting and ensures each line is clean.
 */
export function formatMaterials(materials: string | string[]): string {
  if (!materials) return 'ללא פירוט חומרים';
  if (Array.isArray(materials)) {
    return materials
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => (item.startsWith('•') || item.startsWith('-') ? item : `• ${item}`))
      .join('\n');
  }

  const lines = materials
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return 'ללא פירוט חומרים';

  return lines.join('\n');
}

/**
 * Formats phone number into international format for WhatsApp links (e.g. 972501234567)
 */
export function formatIsraeliPhone(phone: string = ''): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  return `972${digits}`;
}

/**
 * Validates whether essential dispatch parameters are present.
 */
export function validateDispatchParams(params: Partial<NoaDispatchParams>): ValidationResult {
  const missingFields: string[] = [];
  if (!params.driverName) missingFields.push('driverName');
  if (!params.orderId) missingFields.push('orderId');
  if (!params.customerName) missingFields.push('customerName');
  if (!params.address) missingFields.push('address');
  if (!params.warehouse) missingFields.push('warehouse');

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * 🎙️ Pure Spoken Script Generator (Gemini TTS / OpenAI TTS input)
 * Exact format:
 * "היי [Driver Name], כאן נועה. סידור העבודה הבא שלך מוכן במחסן [Warehouse] להזמנה [Order ID] עבור [Customer Name] ברחוב [Address]. סע בזהירות!"
 */
export function generateNoaSpokenScript(params: NoaDispatchParams): string {
  const driver = cleanDriverName(params.driverName);
  const warehouse = cleanWarehouseName(params.warehouse);
  const orderId = String(params.orderId).replace(/^#/, '').trim();
  const customer = params.customerName?.trim() || '';
  const address = params.address?.trim() || '';

  return `היי ${driver}, כאן נועה. סידור העבודה הבא שלך מוכן במחסן ${warehouse} להזמנה ${orderId} עבור ${customer} ברחוב ${address}. סע בזהירות!`;
}

/**
 * 📱 Strict Noa AI WhatsApp Message Generator
 * Follows exact emoji & bolding syntax:
 *
 * 👷‍♂️ היי *[Driver Name]*,
 * סידור העבודה שלך מוכן ליציאה.
 *
 * 📦 *פרטי ההזמנה:*
 * • הזמנה: *[Order ID]*
 * • לקוח: *[Customer Name]*
 * • כתובת: *[Address]*
 * • איסוף מ: *[Warehouse]*
 *
 * 📋 *תכולת הסחורה:*
 * [List of materials]
 *
 * 🎧 *מעדיף להאזין?* לחץ כאן לשמיעת התדריך הקולי:
 * [Audio Link]
 *
 * סע בזהירות! 🚛
 * _באדיבות נועה AI_ 👱‍♀️
 */
export function generateNoaWhatsAppMessage(params: NoaDispatchParams): string {
  const driver = cleanDriverName(params.driverName);
  const warehouse = cleanWarehouseName(params.warehouse);
  const orderId = String(params.orderId).trim();
  const customer = params.customerName?.trim() || '';
  const address = params.address?.trim() || '';
  const materialsList = formatMaterials(params.materials);
  const audioLink = (params.audioUrl && params.audioUrl.trim()) ? params.audioUrl.trim() : DEFAULT_AUDIO_PLACEHOLDER;
  const footer = params.customFooter || '_באדיבות נועה AI_ 👱‍♀️';

  return (
    `👷‍♂️ היי *${driver}*,\n` +
    `סידור העבודה שלך מוכן ליציאה.\n\n` +
    `📦 *פרטי ההזמנה:*\n` +
    `• הזמנה: *${orderId}*\n` +
    `• לקוח: *${customer}*\n` +
    `• כתובת: *${address}*\n` +
    `• איסוף מ: *${warehouse}*\n\n` +
    `📋 *תכולת הסחורה:*\n` +
    `${materialsList}\n\n` +
    `🎧 *מעדיף להאזין?* לחץ כאן לשמיעת התדריך הקולי:\n` +
    `${audioLink}\n\n` +
    `סע בזהירות! 🚛\n` +
    `${footer}`
  );
}

/**
 * 📦 Enhanced Logistics WhatsApp Message Generator
 * Includes weight calculation, SLA delivery window, and deposit counts if provided.
 */
export function generateEnhancedWhatsAppMessage(params: EnhancedDispatchParams): string {
  const driver = cleanDriverName(params.driverName);
  const warehouse = cleanWarehouseName(params.warehouse);
  const orderId = String(params.orderId).trim();
  const customer = params.customerName?.trim() || '';
  const address = params.address?.trim() || '';
  const materialsList = formatMaterials(params.materials);
  const audioLink = (params.audioUrl && params.audioUrl.trim()) ? params.audioUrl.trim() : DEFAULT_AUDIO_PLACEHOLDER;

  let extraOrderDetails = '';
  if (params.slaWindow) {
    extraOrderDetails += `• חלון אספקה: *${params.slaWindow}*\n`;
  }
  if (params.totalWeightKg || params.weightTon) {
    const tons = params.weightTon || (params.totalWeightKg ? Number((params.totalWeightKg / 1000).toFixed(2)) : 0);
    if (tons > 0) {
      extraOrderDetails += `• משקל כולל: *${tons.toFixed(2)} טון* ⚖️\n`;
    }
  }

  let depositSection = '';
  if (params.blowDeposit || params.palletDeposit) {
    depositSection = `\n🛡️ *פקדונות לחיוב:* בלות: *${params.blowDeposit || 0}* | משטחים: *${params.palletDeposit || 0}*\n`;
  }

  return (
    `👷‍♂️ היי *${driver}*,\n` +
    `סידור העבודה שלך מוכן ליציאה.\n\n` +
    `📦 *פרטי ההזמנה:*\n` +
    `• הזמנה: *#${orderId.replace(/^#/, '')}*\n` +
    `• לקוח: *${customer}*\n` +
    `• כתובת: *${address}*\n` +
    `• איסוף מ: *מחסן ${warehouse}*\n` +
    `${extraOrderDetails}\n` +
    `📋 *תכולת הסחורה:*\n` +
    `${materialsList}\n` +
    `${depositSection}\n` +
    `🎧 *מעדיף להאזין?* לחץ כאן לשמיעת התדריך הקולי:\n` +
    `${audioLink}\n\n` +
    `סע בזהירות! 🚛\n` +
    `_באדיבות נועה AI_ 🤖`
  );
}

/**
 * 🔗 Generates a WhatsApp Web / mobile direct link with encoded message.
 */
export function generateWhatsAppWebUrl(driverPhone: string, message: string): string {
  const cleanPhone = formatIsraeliPhone(driverPhone);
  const encodedText = encodeURIComponent(message);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * 📡 Generates Make / Webhook JSON payload matching Google Sheets & JONI architecture.
 */
export function generateMakeWebhookPayload(params: EnhancedDispatchParams & { driverPhone?: string; columnR_Data?: string; source?: string }) {
  const spokenScript = generateNoaSpokenScript(params);
  const whatsappCaption = generateNoaWhatsAppMessage(params);

  return {
    orderId: String(params.orderId),
    customerName: String(params.customerName),
    address: String(params.address),
    driverName: String(params.driverName),
    driverPhone: formatIsraeliPhone(params.driverPhone || ''),
    warehouseSource: cleanWarehouseName(params.warehouse),
    materialsSummary: typeof params.materials === 'string' ? params.materials : params.materials.join(', '),
    columnR_Data: params.columnR_Data || params.notes || '',
    spokenScript,
    whatsappCaption,
    audioUrl: params.audioUrl || '',
    source: params.source || 'SabanOS Noa AI Engine',
    timestamp: new Date().toISOString()
  };
}
