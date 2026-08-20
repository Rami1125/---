import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Navigation,
  ExternalLink,
  Plus,
  Search,
  Building,
  Gauge,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { CityRecord, SystemConfig } from '../types';

interface LogisticsViewProps {
  cities: CityRecord[];
  config: SystemConfig;
  isAuthenticated: boolean;
  onAddCity: (city: CityRecord) => void;
}

export const LogisticsView: React.FC<LogisticsViewProps> = ({
  cities,
  config,
  isAuthenticated,
  onAddCity
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newCity, setNewCity] = useState<Partial<CityRecord>>({
    region: 'מרכז',
    address: 'פתח תקווה, רחוב השפלה 12',
    customerName: 'קבוצת ש.ח הנדסה',
    deliveryCount: 1,
    distance: '12.5 ק"מ'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.address || !newCity.customerName) return;

    const wazeUrl = `https://www.waze.com/ul?q=${encodeURIComponent(newCity.address)}&navigate=yes`;
    const fullCity: CityRecord = {
      region: newCity.region || 'מרכז',
      address: newCity.address,
      customerName: newCity.customerName,
      deliveryCount: newCity.deliveryCount || 1,
      distance: newCity.distance || '15 ק"מ',
      duration: newCity.duration || '20 דק\'',
      wazeUrl
    };

    onAddCity(fullCity);
    setIsAddModalOpen(false);
  };

  const filteredCities = cities.filter((c) => {
    return (
      c.address.includes(searchTerm) ||
      c.customerName.includes(searchTerm) ||
      c.region.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              <span>לוגיסטיקה, ערים ומסלולי חלוקה</span>
              <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded-full border border-emerald-200">
                בסיס יציאה: {config.baseLocation}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              מעקב יעדי אספקה, חישוב מרחקים מהבסיס בהוד השרון, שיגור Waze מהיר וסידור עבודה שבועי
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>הוספת יעד / עיר חדשה</span>
            </button>
          </div>
        </div>

        {/* Fleet & Base Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <span className="text-slate-400 block text-[11px]">נהג ראשי משובץ:</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{config.defaultDriver}</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <span className="text-slate-400 block text-[11px]">משאית וציוד פריקה:</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{config.defaultTruck}</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <span className="text-slate-400 block text-[11px]">טלפון סידור עבודה:</span>
            <span className="font-bold text-emerald-700 font-mono mt-0.5 block">{config.dispatchPhone}</span>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-7" />
          <input
            type="text"
            placeholder="חיפוש לפי כתובת, שם לקוח או אזור גיאוגרפי..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-right"
          />
        </div>
      </div>

      {/* Grid of Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCities.map((city, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {city.region}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  {city.distance} מהבסיס
                </span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm mb-1">
                {city.customerName}
              </h4>

              <div className="flex items-start gap-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span className="font-medium">{city.address}</span>
              </div>

              <div className="text-xs text-slate-500 mb-3">
                <span className="font-bold text-slate-800 font-mono">{city.deliveryCount}</span> אספקות תועדו
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <a
                href={city.wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>נווט ב-Waze</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>הוספת יעד אספקה חדש</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">אזור גיאוגרפי:</label>
                <select
                  value={newCity.region}
                  onChange={(e) => setNewCity({ ...newCity, region: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="שרון">שרון</option>
                  <option value="מרכז">מרכז</option>
                  <option value="שומרון">שומרון</option>
                  <option value="שפלה">שפלה</option>
                  <option value="דרום">דרום</option>
                  <option value="צפון">צפון</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">כתובת יעד מדויקת (לניווט):</label>
                <input
                  type="text"
                  required
                  value={newCity.address}
                  onChange={(e) => setNewCity({ ...newCity, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">שם לקוח / אתר:</label>
                <input
                  type="text"
                  required
                  value={newCity.customerName}
                  onChange={(e) => setNewCity({ ...newCity, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">מרחק משוער מהבסיס (הוד השרון):</label>
                <input
                  type="text"
                  value={newCity.distance}
                  onChange={(e) => setNewCity({ ...newCity, distance: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  שמור יעד
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
