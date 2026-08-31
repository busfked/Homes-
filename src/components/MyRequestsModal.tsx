import React, { useState } from 'react';
import { X, Receipt, CheckCircle2, Clock, Phone, MessageSquare, Send, MapPin, Building, Lock } from 'lucide-react';
import { Property, UnlockRequest, Language } from '../types';
import { translations } from '../data/translations';

interface MyRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  userPhone: string;
  onUpdateUserPhone: (phone: string) => void;
  unlockRequests: UnlockRequest[];
  properties: Property[];
  onOpenHouseDetail: (property: Property) => void;
}

export const MyRequestsModal: React.FC<MyRequestsModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  userPhone,
  onUpdateUserPhone,
  unlockRequests,
  properties,
  onOpenHouseDetail,
}) => {
  if (!isOpen) return null;

  const t = translations[currentLang];
  const [phoneInput, setPhoneInput] = useState(userPhone);

  const cleanPhone = phoneInput.replace(/[\s-]/g, '');
  const myRequests = unlockRequests.filter(
    (r) => cleanPhone && r.buyerPhone.replace(/[\s-]/g, '') === cleanPhone
  );

  const handlePhoneSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserPhone(phoneInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div
        id="my-requests-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">{t.myRequests}</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {currentLang === 'am'
                  ? 'የከፈሉባቸውን የክፍያ ጥያቄዎች እና የተከፈቱ የባለቤት ስልኮችን ይመልከቱ'
                  : 'Check status of your unlock fee payments & unlocked owner contacts'}
              </p>
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
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Phone Lookup Form */}
          <form onSubmit={handlePhoneSave} className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2">
            <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
              {currentLang === 'am' ? 'ስልክ ቁጥርዎን ያስገቡ (ጥያቄዎችዎን ለማምጣት)' : 'Enter your phone number to find your unlocked houses'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="0911223344"
                className="flex-1 px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white"
              />
              <button
                type="submit"
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                {currentLang === 'am' ? 'ፈልግ' : 'Find'}
              </button>
            </div>
          </form>

          {/* Results List */}
          <div className="space-y-4">
            {myRequests.length === 0 ? (
              <div className="text-center py-10 text-stone-500 dark:text-stone-400 text-xs sm:text-sm">
                {cleanPhone
                  ? currentLang === 'am'
                    ? 'በዚህ ስልክ ቁጥር የተመዘገበ የክፍያ ጥያቄ የለም።'
                    : 'No requests found for this phone number yet.'
                  : currentLang === 'am'
                  ? 'እባክዎ ከላይ ስልክ ቁጥርዎን ያስገቡ።'
                  : 'Please enter your phone number above.'}
              </div>
            ) : (
              myRequests.map((req) => {
                const prop = properties.find((p) => p.id === req.propertyId);
                const rawPhone = prop?.ownerPhone.replace(/\D/g, '') || '';
                const telegramPhone = rawPhone.startsWith('0') ? '251' + rawPhone.slice(1) : rawPhone;

                return (
                  <div
                    key={req.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      req.status === 'approved'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-xs'
                        : req.status === 'pending'
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                        : 'bg-rose-50/40 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700'
                    }`}
                  >
                    {/* Status row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        {req.propertyArea} • {req.propertyTitle}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          req.status === 'approved'
                            ? 'bg-emerald-600 text-white'
                            : req.status === 'pending'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {req.status === 'approved' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Unlocked
                          </>
                        ) : req.status === 'pending' ? (
                          <>
                            <Clock className="w-3 h-3" /> Pending Review
                          </>
                        ) : (
                          'Rejected'
                        )}
                      </span>
                    </div>

                    {/* Unlocked Contact Details Box */}
                    {req.status === 'approved' && prop ? (
                      <div className="bg-white dark:bg-stone-850 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3 mt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-stone-500 dark:text-stone-400 block">{t.ownerName}</span>
                            <span className="font-bold text-stone-900 dark:text-white">{prop.ownerName}</span>
                          </div>
                          <div>
                            <span className="text-stone-500 dark:text-stone-400 block">{t.ownerPhone}</span>
                            <span className="font-black text-emerald-700 dark:text-emerald-400 text-base font-mono">
                              {prop.ownerPhone}
                            </span>
                          </div>
                          <div className="sm:col-span-2 pt-1 border-t border-stone-100 dark:border-stone-700">
                            <span className="text-stone-500 dark:text-stone-400 block">{t.exactLocation}</span>
                            <span className="font-medium text-stone-800 dark:text-stone-200">{prop.exactLandmark}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 dark:border-stone-700">
                          <a
                            href={`tel:${prop.ownerPhone}`}
                            className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{t.callOwner}</span>
                          </a>
                          <a
                            href={`sms:${prop.ownerPhone}`}
                            className="py-2 px-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{t.smsOwner}</span>
                          </a>
                          <a
                            href={`https://t.me/+${telegramPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{t.telegramOwner}</span>
                          </a>
                        </div>
                      </div>
                    ) : req.status === 'pending' ? (
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-2 bg-emerald-100/60 dark:bg-emerald-950/60 p-2.5 rounded-lg">
                        {currentLang === 'am'
                          ? 'የክፍያ ስክሪንሽትዎ በአድሚን እየተረጋገጠ ነው። እንደተረጋገጠ የባለቤቱ ስልክ ወዲያውኑ እዚህ ይከፈታል።'
                          : 'Your payment screenshot is currently in queue. Once approved, the direct phone unlocks here.'}
                      </p>
                    ) : (
                      <p className="text-xs text-rose-800 dark:text-rose-300 mt-2">
                        {currentLang === 'am'
                          ? 'ክፍያው ውድቅ ተደርጓል። እባክዎ ትክክለኛ ስክሪንሽት እንደገና ያስገቡ።'
                          : 'This screenshot was rejected. Please resubmit a valid payment receipt.'}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
