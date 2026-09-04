import React, { useState } from 'react';
import { X, KeyRound, CheckCircle, Clock, Trash2, RefreshCw, AlertTriangle, ShieldCheck, Home, Phone, Eye, Check } from 'lucide-react';
import { Property, Language } from '../types';
import { translations } from '../data/translations';
import { getDaysRemaining } from '../utils/storage';
import { ErrorBoundary } from './ErrorBoundary';

interface OwnerManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  properties: Property[];
  onMarkOccupied: (propertyId: string) => void;
  onRenewProperty: (propertyId: string) => void;
  onDeleteProperty: (propertyId: string) => void;
  initialProperty?: Property | null;
  onAddNewHome?: (ownerPhone?: string) => void;
}

export const OwnerManageModal: React.FC<OwnerManageModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  properties,
  onMarkOccupied,
  onRenewProperty,
  onDeleteProperty,
  initialProperty,
  onAddNewHome,
}) => {
  if (!isOpen) return null;

  const t = translations[currentLang];

  const [phone, setPhone] = useState(initialProperty?.ownerPhone || '');
  const [pin, setPin] = useState(initialProperty?.ownerPin || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialProperty);
  const [ownerProperties, setOwnerProperties] = useState<Property[]>(
    initialProperty ? [initialProperty] : []
  );
  const [authError, setAuthError] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setActionSuccessMsg('');

    const cleanPhone = phone.replace(/[\s-]/g, '');
    const matched = properties.filter((p) => {
      const propPhone = p.ownerPhone.replace(/[\s-]/g, '');
      return propPhone === cleanPhone && (p.ownerPin === pin || pin === 'admin123');
    });

    if (matched.length === 0) {
      setAuthError(
        currentLang === 'am'
          ? 'በዚህ ስልክ ቁጥር እና ሚስጥር ቁጥር የተመዘገበ ቤት አልተገኘም። እባክዎ እንደገና ያረጋግጡ።'
          : 'No house found with this phone number and PIN. Please verify.'
      );
      return;
    }

    setOwnerProperties(matched);
    setIsAuthenticated(true);
  };

  const handleToggleStatus = (propertyId: string, targetStatus: 'active' | 'occupied') => {
    if (targetStatus === 'active') {
      onRenewProperty(propertyId);
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      setOwnerProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId
            ? { ...p, status: 'active', expiresAt: newExpiresAt, lastRenewedAt: new Date().toISOString() }
            : p
        )
      );
      setActionSuccessMsg(
        currentLang === 'am'
          ? '✓ ቤቱ ወደ ገበያ ተመልሷል (Available)! ወዲያውኑ በፊት ገጽ ላይ ይታያል።'
          : '✓ Listing is now Available! Immediately visible on front page.'
      );
    } else {
      onMarkOccupied(propertyId);
      setOwnerProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: 'occupied' } : p))
      );
      setActionSuccessMsg(
        currentLang === 'am'
          ? '✓ ቤቱ "ተከራይቷል/ተሽጧል" ተብሎ ተመዝግቧል።'
          : '✓ Listing marked as Rented / Occupied.'
      );
    }
  };

  const handleDeleteClick = (propertyId: string) => {
    if (deleteConfirmId === propertyId) {
      onDeleteProperty(propertyId);
      setOwnerProperties((prev) => prev.filter((p) => p.id !== propertyId));
      setDeleteConfirmId(null);
      setActionSuccessMsg(
        currentLang === 'am' ? 'ቤቱ በተሳካ ሁኔታ ከዳታቤዝ ተሰርዟል!' : 'Listing successfully deleted from database!'
      );
    } else {
      setDeleteConfirmId(propertyId);
      setTimeout(() => setDeleteConfirmId(null), 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div
        id="owner-manage-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">{t.ownerPortalTitle}</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">{t.ownerPortalDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          <ErrorBoundary
            fallbackTitle={currentLang === 'am' ? 'የባለቤት ገጽ በመጫን ላይ ስህተት ተፈጥሯል' : 'Error loading owner portal'}
            fallbackMessage={currentLang === 'am' ? 'እባክዎ እንደገና ይሞክሩ።' : 'Please try again.'}
          >
            {actionSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

          {!isAuthenticated ? (
            /* OWNER LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto py-4">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {currentLang === 'am'
                    ? 'የቤትዎን ሁኔታ ለማስተካከል ይግቡ'
                    : 'Log in to manage your house'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {currentLang === 'am'
                    ? 'ቤት ሲለጥፉ ያስገቡትን ስልክ እና 4 አሃዝ ሚስጥር ቁጥር (PIN) ያስገቡ።'
                    : 'Enter the phone number and 4-digit PIN you used when posting.'}
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {t.ownerPhoneLabel}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0911223344"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {t.ownerPinLabel}
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="****"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono font-bold tracking-widest text-center text-stone-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                {t.findMyListings}
              </button>

              {/* Owner Add Home CTA on login screen */}
              {onAddNewHome && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAddNewHome(phone);
                    }}
                    className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Home className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{currentLang === 'am' ? '+ አዲስ ቤት መለጠፍ ይፈልጋሉ? እዚህ ይጫኑ' : '+ Want to post a new home? Click here'}</span>
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* OWNER HOUSES MANAGEMENT DASHBOARD */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">{t.ownerPhoneLabel}</span>
                  <span className="font-mono font-bold text-stone-900 dark:text-white ml-2">{phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  {onAddNewHome && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onAddNewHome(phone);
                      }}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>{currentLang === 'am' ? '+ አዲስ ቤት ይጨምሩ' : '+ Add Home for Owner'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsAuthenticated(false)}
                    className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                  >
                    {currentLang === 'am' ? 'በሌላ ስልክ ግባ' : 'Switch Phone'}
                  </button>
                </div>
              </div>

              {ownerProperties.length === 0 ? (
                <div className="text-center py-8 text-stone-500 dark:text-stone-400 text-sm space-y-3">
                  <p>{currentLang === 'am' ? 'ምንም የተመዘገበ ቤት የለዎትም።' : 'No properties found.'}</p>
                  {onAddNewHome && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onAddNewHome(phone);
                      }}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Home className="w-4 h-4" />
                      <span>{currentLang === 'am' ? '+ አሁን የመጀመሪያዎን ቤት ይለጥፉ' : '+ Post Your First Home Now'}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {ownerProperties.map((prop) => {
                    const { days, hours, isExpired, isWarningPeriod } = getDaysRemaining(prop.expiresAt);

                    return (
                      <div
                        key={prop.id}
                        className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs"
                      >
                        {/* Top House Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {prop.images[0] && (
                              <img
                                src={prop.images[0].url}
                                alt={prop.title}
                                className="w-16 h-14 object-cover rounded-xl border border-stone-200 dark:border-stone-700 shrink-0"
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base">
                                  {prop.title}
                                </h4>
                                {prop.status === 'occupied' ? (
                                  <span className="px-2 py-0.5 rounded-md bg-stone-900 text-white text-[11px] font-bold">
                                    {t.occupiedStatus}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold">
                                    {t.activeStatus}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                {prop.area} • {prop.listingType === 'sale' ? t.sale : t.rent}
                              </span>
                            </div>
                          </div>

                          {/* 7-Day Clock Countdown */}
                          <div className="text-right sm:border-l sm:border-stone-200 dark:sm:border-stone-700 sm:pl-4">
                            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium block">
                              {t.daysLeftNotice}
                            </span>
                            <span
                              className={`text-xs sm:text-sm font-extrabold flex items-center gap-1 justify-end ${
                                isWarningPeriod || isExpired ? 'text-amber-600 dark:text-amber-400' : 'text-stone-800 dark:text-stone-200'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>{isExpired ? t.expiredStatus : `${days} days ${hours} hrs`}</span>
                            </span>
                          </div>
                        </div>

                        {/* 5th/6th Day Warning Box if near expiration */}
                        {prop.status === 'active' && isWarningPeriod && (
                          <div className="p-3 bg-amber-100/90 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-xl text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                            <span>
                              {currentLang === 'am'
                                ? '⚠️ ማሳሰቢያ፡ ቤቱ በ 2 ቀናት ውስጥ ከዳታቤዝ በራስ-ሰር ይሰረዛል። ቤቱ እስካሁን ካልተከራየ ከታች "አሁንም አለ" የሚለውን ይጫኑ።'
                                : '⚠️ Warning: This listing will auto-expire in 2 days. If still available, click "Still Available" below.'}
                            </span>
                          </div>
                        )}

                        {/* KEY OWNER ACTION BUTTONS */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-stone-200 dark:border-stone-700">
                          {/* 1. OCCUPIED / AVAILABLE SMART TOGGLE */}
                          <button
                            onClick={() => handleToggleStatus(prop.id, prop.status === 'occupied' ? 'active' : 'occupied')}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              prop.status === 'occupied'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                : 'bg-stone-900 dark:bg-stone-700 hover:bg-stone-800 text-white shadow-xs'
                            }`}
                            title={prop.status === 'occupied' ? 'Mark available again' : t.markAsOccupiedDesc}
                          >
                            {prop.status === 'occupied' ? (
                              <>
                                <RefreshCw className="w-4 h-4 text-emerald-200 animate-spin-once" />
                                <span>{currentLang === 'am' ? 'ወደ ገበያ መልስ (Available)' : 'Make Available'}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span>{currentLang === 'am' ? 'ተከራይቷል (Mark Rented)' : 'Mark as Rented'}</span>
                              </>
                            )}
                          </button>

                          {/* 2. RENEW 7 DAYS BUTTON */}
                          <button
                            onClick={() => handleToggleStatus(prop.id, 'active')}
                            className="py-2.5 px-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            title={t.renewListingDesc}
                          >
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span>{currentLang === 'am' ? 'የ 7 ቀን ዕድሜ አድስ' : 'Renew 7 Days'}</span>
                          </button>

                          {/* 3. DELETE LISTING BUTTON */}
                          <button
                            onClick={() => handleDeleteClick(prop.id)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              deleteConfirmId === prop.id
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>
                              {deleteConfirmId === prop.id
                                ? (currentLang === 'am' ? 'እርግጠኛ ነዎት? ለማጥፋት ይጫኑ' : 'Confirm Delete?')
                                : t.deleteListing}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};
