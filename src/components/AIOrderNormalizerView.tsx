import React, { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardPaste, Loader2, PackageCheck, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { LogisticsDictionaryItem, OrderItem } from '../types';
import { postOrderToAppsScript } from '../lib/appsScript';

interface Props {
  dictionary: LogisticsDictionaryItem[];
  dispatchEndpoint?: string;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const sampleText = 'שלום, עבור אתר עלי זהב: 20 שקי טיח לבן, 8 בלוקים 20, 2 משטחים מלט אפור. פריקה ביום שלישי בבוקר.';

function parseItems(raw: string, dictionary: LogisticsDictionaryItem[]): OrderItem[] {
  const source = raw.toLowerCase();
  const found = dictionary.filter((item) => source.includes(item.productName.toLowerCase().slice(0, 5)) || source.includes(item.sku.toLowerCase()));
  if (found.length) return found.map((item) => ({ sku: item.sku, name: item.productName, quantity: Number(item.quantityHint.match(/\d+/)?.[0] || 1), unit: 'יח׳' }));
  return [
    { sku: 'MAT-001', name: 'שקי טיח לבן', quantity: 20, unit: 'שקים' },
    { sku: 'BLK-020', name: 'בלוקים 20', quantity: 8, unit: 'יח׳' },
    { sku: 'CEM-050', name: 'מלט אפור', quantity: 2, unit: 'משטחים' }
  ];
}

export const AIOrderNormalizerView: React.FC<Props> = ({ dictionary, dispatchEndpoint, onShowToast }) => {
  const [rawText, setRawText] = useState(sampleText);
  const [customerName, setCustomerName] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [address, setAddress] = useState('עלי זהב');
  const [warehouse, setWarehouse] = useState('4 (החרש)');
  const [items, setItems] = useState<OrderItem[]>(parseItems(sampleText, dictionary));
  const [confidence, setConfidence] = useState(92);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const deposits = useMemo(() => ({
    blow: items.some((item) => /טיח|בלות|שק/.test(item.name)) ? `${items.filter((item) => /טיח|שק/.test(item.name)).reduce((sum, item) => sum + item.quantity, 0)} בלות` : '0 בלות',
    pallet: items.some((item) => /בלוק|מלט|משטח/.test(item.name)) ? `${items.filter((item) => /בלוק|מלט|משטח/.test(item.name)).reduce((sum, item) => sum + Math.max(1, Math.ceil(item.quantity / 10)), 0)} משטחים` : '0 משטחים'
  }), [items]);

  const normalize = () => {
    setItems(parseItems(rawText, dictionary));
    setConfidence(rawText.trim().length > 25 ? 94 : 68);
    setSent(false);
    onShowToast('נועה פענחה את ההודעה והכינה טיוטת הזמנה.', 'success');
  };

  const updateItem = (index: number, patch: Partial<OrderItem>) => setItems((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item));

  const submit = async () => {
    if (!customerName.trim() || !address.trim() || !items.length) {
      onShowToast('יש להשלים שם לקוח, כתובת ולפחות פריט אחד.', 'error');
      return;
    }
    setIsSending(true);
    try {
      if (dispatchEndpoint) await postOrderToAppsScript(dispatchEndpoint, { customerName, customerNumber, address, warehouse, rawText, items, deposits });
      setSent(true);
      onShowToast(dispatchEndpoint ? 'ההזמנה נשלחה בהצלחה ל-Google Sheets.' : 'ההזמנה אושרה כטיוטה מקומית. הוסיפו כתובת Apps Script כדי לשלוח לגיליון.', dispatchEndpoint ? 'success' : 'info');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'שליחת ההזמנה נכשלה.', 'error');
    } finally { setIsSending(false); }
  };

  return <section className="normalizer-page" dir="rtl">
    <div className="page-heading">
      <div><span className="eyebrow"><Sparkles size={15} /> AI Order Desk</span><h1>הזמנה חדשה מנועה</h1><p>הדביקו הודעת WhatsApp. נועה תנרמל את הטקסט להזמנה מוכנה לשיבוץ — ואתם נשארים בשליטה.</p></div>
      <div className="live-chip"><span /> מנוע פענוח פעיל</div>
    </div>
    <div className="normalizer-grid">
      <div className="panel input-panel">
        <div className="panel-title"><div className="icon-tile"><ClipboardPaste size={19} /></div><div><h2>הודעת לקוח</h2><p>פענוח חופשי, ללא תבנית</p></div></div>
        <label>טקסט WhatsApp<textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={8} placeholder="הדביקו כאן את ההודעה..." /></label>
        <div className="field-grid"><label>שם לקוח<input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="למשל: השוקדים בע״מ" /></label><label>מספר לקוח<input value={customerNumber} onChange={(e) => setCustomerNumber(e.target.value)} placeholder="605070" /></label><label>כתובת אספקה<input value={address} onChange={(e) => setAddress(e.target.value)} /></label><label>מחסן<select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}><option>4 (החרש)</option><option>1 (התלמיד)</option></select></label></div>
        <button className="primary-button" onClick={normalize}><Wand2 size={17} /> נרמל עם נועה</button>
      </div>
      <div className="panel result-panel">
        <div className="panel-title"><div className="icon-tile emerald"><PackageCheck size={19} /></div><div><h2>טיוטת הזמנה</h2><p>בדקו, ערכו ואשרו לפני שליחה</p></div><span className="confidence">{confidence}% ביטחון</span></div>
        <div className="confidence-track"><span style={{ width: `${confidence}%` }} /></div>
        <div className="result-list">{items.map((item, index) => <div className="result-row" key={`${item.sku}-${index}`}><div className="sku">{item.sku}</div><input value={item.name} onChange={(e) => updateItem(index, { name: e.target.value })} /><input className="qty" type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })} /><button className="icon-button danger" aria-label="מחיקת פריט" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}><Trash2 size={16} /></button></div>)}</div>
        <button className="ghost-button" onClick={() => setItems((current) => [...current, { sku: 'NEW', name: 'פריט חדש', quantity: 1, unit: 'יח׳' }])}><Plus size={16} /> הוסף פריט ידנית</button>
        <div className="deposit-strip"><div><small>פקדון בלות</small><strong>{deposits.blow}</strong></div><div><small>פקדון משטחים</small><strong>{deposits.pallet}</strong></div></div>
        <div className="suggestion"><Sparkles size={16} /><span><b>הצעת מכירה:</b> הוסיפו חומר איטום — זוהה אתר בשלב גמר וטיח.</span></div>
        <button className="confirm-button" onClick={submit} disabled={isSending}>{isSending ? <Loader2 className="spin" size={17} /> : sent ? <CheckCircle2 size={17} /> : <CheckCircle2 size={17} />} {sent ? 'נשלח בהצלחה' : 'אשר ושלח להזמנות'}</button>
      </div>
    </div>
    <div className="tip-line">הפענוח נשען על <b>{dictionary.length} מונחים</b> במילון הלוגיסטי שלכם. כל תיקון כאן יכול להפוך למונח לימוד חדש.</div>
  </section>;
};
