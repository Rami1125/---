import React, { useState } from 'react';
import {
  FolderOpen,
  Building2,
  FileCheck2,
  ClipboardList,
  ExternalLink,
  Plus,
  Search,
  Phone,
  UserCheck,
  MapPin,
  Sparkles,
  FolderPlus
} from 'lucide-react';
import { CustomerRecord, SystemConfig } from '../types';
import { GoogleDriveService } from '../lib/googleDrive';

interface CustomersViewProps {
  customers: CustomerRecord[];
  config: SystemConfig;
  isAuthenticated: boolean;
  onAddCustomer: (cust: CustomerRecord) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  config,
  isAuthenticated,
  onAddCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState<string | null>(null);

  const [newCustomer, setNewCustomer] = useState<Partial<CustomerRecord>>({
    customerNumber: '619050',
    customerName: 'אלקטרה בנייה - מגדלי שרונה',
    defaultAddress: 'רחוב הארבעה 28, תל אביב',
    phone: '054-1234567',
    contactPerson: 'דני מנהל רכש',
    currentProjectStage: 'שלד ויסודות'
  });

  const handleCreateDriveFolder = async (cust: CustomerRecord) => {
    if (!isAuthenticated) return;
    setIsCreatingFolder(cust.customerNumber);
    try {
      const res = await GoogleDriveService.getOrCreateCustomerFolder(
        config.deliveryDocsFolderId,
        cust.customerNumber,
        cust.customerName
      );
      cust.folderUrl = res.rootUrl;
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingFolder(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.customerNumber || !newCustomer.customerName) return;

    const fullCust: CustomerRecord = {
      customerNumber: newCustomer.customerNumber || '600000',
      customerName: newCustomer.customerName || 'לקוח חדש',
      defaultAddress: newCustomer.defaultAddress || 'הוד השרון',
      ordersCount: 1,
      signedNotesCount: 0,
      phone: newCustomer.phone || '',
      contactPerson: newCustomer.contactPerson || '',
      currentProjectStage: newCustomer.currentProjectStage || 'גמר וטיח',
      folderUrl: `https://drive.google.com/drive/folders/${config.deliveryDocsFolderId}`
    };

    onAddCustomer(fullCust);
    setIsAddModalOpen(false);
  };

  const filteredCustomers = customers.filter((c) => {
    return (
      c.customerNumber.includes(searchTerm) ||
      c.customerName.includes(searchTerm) ||
      c.defaultAddress.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-600" />
              <span>תיקי לקוחות וארכיון Drive</span>
              <span className="text-xs px-2.5 py-0.5 bg-amber-50 text-amber-800 font-bold rounded-full border border-amber-200">
                {customers.length} לקוחות פעילים
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              סנכרון מבנה תיקיות Drive לכל לקוח (תת-תיקיות: 1. הזמנות | 2. תעודות משלוח) ומעקב נפח פעילות
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>הוספת כרטיס לקוח חדש</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-7" />
          <input
            type="text"
            placeholder="חיפוש לפי מספר לקוח, שם לקוח / קבלן, או כתובת אתר..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-right"
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.customerNumber}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-base">
                      [{cust.customerNumber}]
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                      {cust.currentProjectStage || 'גמר וטיח'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {cust.customerName}
                  </h3>
                </div>

                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              {/* Address & Contact info */}
              <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="font-medium text-slate-800">{cust.defaultAddress}</span>
                </div>
                {(cust.contactPerson || cust.phone) && (
                  <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>{cust.contactPerson || 'איש קשר'}</span>
                    </div>
                    {cust.phone && (
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{cust.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Counters */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-2.5 text-center">
                  <span className="text-[11px] font-bold text-emerald-800 block">📦 הזמנות שטופלו</span>
                  <span className="text-base font-black text-emerald-950 font-mono mt-0.5 block">
                    {cust.ordersCount} הזמנות
                  </span>
                </div>

                <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-2.5 text-center">
                  <span className="text-[11px] font-bold text-blue-800 block">📄 תעודות חתומות</span>
                  <span className="text-base font-black text-blue-950 font-mono mt-0.5 block">
                    {cust.signedNotesCount} תעודות
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
              <a
                href={cust.folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl border border-amber-200 transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-amber-600" />
                <span>פתח תיקיית לקוח ב-Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {isAuthenticated && (
                <button
                  onClick={() => handleCreateDriveFolder(cust)}
                  disabled={isCreatingFolder === cust.customerNumber}
                  className="flex items-center gap-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl font-medium transition-colors"
                  title="וודא קיום תת-תיקיות: 1. הזמנות | 2. תעודות משלוח בדרייב"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>{isCreatingFolder === cust.customerNumber ? 'יוצר...' : 'רענן תיקיות'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-600" />
                <span>פתיחת כרטיס לקוח חדש</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">מספר לקוח (קומקס / ח.פ):</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.customerNumber}
                    onChange={(e) => setNewCustomer({ ...newCustomer, customerNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">שלב פרויקט נוכחי:</label>
                  <select
                    value={newCustomer.currentProjectStage}
                    onChange={(e) => setNewCustomer({ ...newCustomer, currentProjectStage: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="שלד ויסודות">שלד ויסודות</option>
                    <option value="גמר וטיח">גמר וטיח</option>
                    <option value="ריצוף ותקרות">ריצוף ותקרות</option>
                    <option value="הושלם">הושלם</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">שם לקוח מלא / שם חברה:</label>
                <input
                  type="text"
                  required
                  value={newCustomer.customerName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">כתובת אתר מרכזי:</label>
                <input
                  type="text"
                  required
                  value={newCustomer.defaultAddress}
                  onChange={(e) => setNewCustomer({ ...newCustomer, defaultAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">איש קשר באתר:</label>
                  <input
                    type="text"
                    value={newCustomer.contactPerson}
                    onChange={(e) => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">טלפון ישיר:</label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  שמור לקוח
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
