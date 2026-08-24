// Deploy as Web app: Execute as owner, access according to your Workspace policy.
// Set SHEET_ID in Script Properties or replace the placeholder below.
const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'dictionary';
  if (action !== 'dictionary') return json_({ ok: false, error: 'Unknown action' });
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('מילון_לוגסטי');
  const values = sheet ? sheet.getDataRange().getValues() : [];
  return json_({ ok: true, items: values.slice(1).map(function (row) { return { sku: String(row[0] || ''), productName: String(row[1] || ''), quantityHint: String(row[2] || ''), requiresBlowDeposit: String(row[3] || ''), requiresPalletDeposit: String(row[4] || ''), requiresDrumDeposit: String(row[5] || ''), requiresBlockPalletDeposit: String(row[6] || ''), noaConclusions: String(row[7] || '') }; }) });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (payload.action === 'learnKeyword') return learnKeyword_(payload);
    if (payload.action !== 'createOrder') return json_({ ok: false, error: 'Unknown action' });
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('הזמנות');
    if (!sheet) throw new Error('הטאב הזמנות לא נמצא');
    const orderNumber = 'AI-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
    const items = (payload.items || []).map(function (item) { return item.quantity + ' ' + (item.unit || 'יח׳') + ' ' + item.name; }).join(' | ');
    sheet.appendRow([new Date(), orderNumber, payload.customerNumber || '', payload.customerName || '', payload.warehouse || '', payload.address || '', items, payload.deposits?.blow || '0 בלות', payload.deposits?.pallet || '0 משטחים', '', '', '', '', 'לא', 'בסידור עבודה', '', '', '']);
    return json_({ ok: true, orderNumber: orderNumber });
  } catch (error) { return json_({ ok: false, error: error.message }); }
}

function learnKeyword_(payload) {
  const keyword = String(payload.keyword || '').trim();
  const sku = String(payload.sku || '').trim();
  if (!keyword || !sku) return json_({ ok: false, error: 'SKU ומונח נדרשים' });
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('מילון_לוגסטי');
  if (!sheet) throw new Error('הטאב מילון_לוגסטי לא נמצא');
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const skuCol = headers.indexOf('SKU') >= 0 ? headers.indexOf('SKU') : 0;
  const keywordCol = headers.indexOf('Keywords') >= 0 ? headers.indexOf('Keywords') : 8;
  const rowIndex = values.findIndex(function(row, index) { return index > 0 && String(row[skuCol] || '').trim() === sku; });
  if (rowIndex < 1) return json_({ ok: false, error: 'SKU לא נמצא במילון' });
  const existing = String(values[rowIndex][keywordCol] || '').split(',').map(function(value) { return value.trim(); }).filter(Boolean);
  if (existing.indexOf(keyword) < 0) existing.push(keyword);
  sheet.getRange(rowIndex + 1, keywordCol + 1).setValue(existing.join(', '));
  return json_({ ok: true, sku: sku, keyword: keyword, learned: existing.indexOf(keyword) >= 0 });
}
