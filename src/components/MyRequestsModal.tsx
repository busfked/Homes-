import React, { useState } from 'react';
import { 
  X, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MessageSquare, 
  Send, 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  User, 
  Sparkles,
  AlertCircle,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { Property, UnlockRequest, Language, UserAccount } from '../types';
import { translations } from '../data/translations';
import { loginUserAccount } from '../utils/storage';
import { fetchUserByPhoneFromSupabase } from '../utils/supabaseClient';

interface MyRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  currentUser?: UserAccount | null;
  onLoginSuccess: (user: UserAccount) => void;
  onOpenUserAuthModal: () => void;
  unlockRequests: UnlockRequest[];
  properties: Property[];
  onOpenHouseDetail: (property: Property) => void;
}

export const MyRequestsModal: React.FC<MyRequestsModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  currentUser,
  onLoginSuccess,
  onOpenUserAuthModal,
  unlockRequests,
  properties,
  onOpenHouseDetail,
}) => {
  if (!isOpen) return null;

  const t = translations[currentLang];
  const [phoneInput, setPhoneInput] = useState(currentUser?.phone || '');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Authenticated user's clean phone
  const cleanPhone = (currentUser?.phone || '').replace(/[\s-]/g, '');

  // Strictly filter: ONLY buyer unlock requests for this authenticated phone, NEVER owner listing fees!
  const myRequests = currentUser && cleanPhone
    ? unlockRequests.filter(
        (r) =>
          r.type !== 'owner_listing_fee' &&
          r.requestType !== 'owner_listing_fee' &&
          r.buyerPhone &&
          r.buyerPhone.replace(/[\s-]/g, '') === cleanPhone
      )
    : [];

  const handleSecureLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanInputPhone = phoneInput.trim().replace(/[\s-]/g, '');
    const cleanInputPin = pinInput.trim();

    if (!cleanInputPhone || cleanInputPhone.length < 9) {
      setAuthError(
        currentLang === 'am'
          ? 'እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ (ለምሳሌ 0911223344)'
          : 'Please enter a valid phone number (e.g. 0911223344)'
      );
      return;
    }

    if (!cleanInputPin) {
      setAuthError(
        currentLang === 'am'
          ? 'የአካውንትዎን ፒን (PIN) ወይም ፓስወርድ ያስገቡ'
          : 'Please enter your account PIN / password'
      );
      return;
    }

    setIsVerifying(true);
    try {
      // 1. Try local storage lookup
      const localResult = loginUserAccount(cleanInputPhone, cleanInputPin);
      if (localResult.success && localResult.user) {
        onLoginSuccess(localResult.user);
        setIsVerifying(false);
        return;
      }

      // 2. Fallback to Supabase remote user lookup
      const remoteUser = await fetchUserByPhoneFromSupabase(cleanInputPhone);
      if (remoteUser) {
        if (!remoteUser.pin || remoteUser.pin === cleanInputPin) {
          onLoginSuccess(remoteUser);
          setIsVerifying(false);
          return;
        } else {
          setAuthError(
            currentLang === 'am'
              ? 'የተሳሳተ ፒን (PIN) ኮድ አስገብተዋል። እባክዎ እንደገና ይሞክሩ።'
              : 'Incorrect PIN / password. Please try again.'
          );
          setIsVerifying(false);
          return;
        }
      }

      setAuthError(
        currentLang === 'am'
          ? 'በዚህ ስልክ ቁጥር የተመዘገበ አካውንት አልተገኘም። እባክዎ ይመዝገቡ ወይም ትክክለኛ ስልክ ያስገቡ።'
          : 'No registered account found for this phone. Please register first.'
      );
    } catch {
      setAuthError(
        currentLang === 'am'
          ? 'ማረጋገጥ አልተቻለም። እባክዎ እንደገና ይሞክሩ።'
          : 'Verification failed. Please try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div
        id="my-requests-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-850">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100">
                  {currentLang === 'am' ? 'የእኔ የተከፈቱ ቤቶች እና ጥያቄዎች' : 'My Unlocked Houses & Requests'}
                </h2>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                  {currentLang === 'am' ? 'የተጠበቀ' : 'Protected'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {currentLang === 'am'
                  ? 'የከፈሉባቸውን ቤቶች እና የተፈቀዱ የባለቤት ስልኮችን ብቻ ይመልከቱ'
                  : 'View exclusively the homes and owner contacts you have paid for'}
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
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1. If user is NOT logged in: Prompt secure login / PIN verification */}
          {!currentUser ? (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {currentLang === 'am'
                      ? 'የባለቤቶች ስልክና መረጃ የተጠበቀ ነው'
                      : 'Owner Contacts & Paid Unlocks Are Protected'}
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                    {currentLang === 'am'
                      ? 'የከፈሉባቸውን ቤቶች ለማየት እባክዎ የስልክ ቁጥርዎን እና ፒን (PIN) ኮድዎን ያስገቡ። ያልከፈሉ ወይም ያልተፈቀደላቸው ሰዎች የስልክ ቁጥሮችን ማየት አይችሉም።'
                      : 'To protect owner privacy and ensure only paying buyers access contacts, please enter your Phone and PIN to verify your account.'}
                  </p>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSecureLogin} className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3.5">
                <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-sm">
                  <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{currentLang === 'am' ? 'በስልክ እና ፒን ይግቡ' : 'Sign In with Phone & PIN'}</span>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {currentLang === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="0911223344"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {currentLang === 'am' ? '4 አሃዝ ፒን (PIN) / ፓስወርድ' : '4-Digit PIN / Password'}
                  </label>
                  <input
                    type="password"
                    maxLength={10}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="••••"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {isVerifying
                        ? (currentLang === 'am' ? 'በማረጋገጥ ላይ...' : 'Verifying...')
                        : (currentLang === 'am' ? 'አረጋግጥና ቤቶቼን አሳይ' : 'Verify & View My Houses')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenUserAuthModal();
                    }}
                    className="w-full sm:w-auto py-2.5 px-4 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {currentLang === 'am' ? 'አዲስ አካውንት ክፈት' : 'Register New Account'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* 2. User IS logged in: Display their authenticated status and ONLY their verified requests */
            <div className="space-y-4">
              {/* Account Status Badge */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-stone-900 dark:text-white">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] font-mono bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.5 rounded-md font-bold">
                        {currentUser.phone}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {currentLang === 'am'
                        ? `የተከፈቱ ቤቶች: ${currentUser.unlockedPropertyIds?.length || 0} • ቀሪ ክሬዲት: ${currentUser.packages?.reduce((sum, p) => sum + p.remainingUnlocks, 0) || 0}`
                        : `Unlocked Houses: ${currentUser.unlockedPropertyIds?.length || 0} • Remaining Credits: ${currentUser.packages?.reduce((sum, p) => sum + p.remainingUnlocks, 0) || 0}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onOpenUserAuthModal}
                  className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 rounded-lg hover:bg-emerald-200 transition-colors cursor-pointer shrink-0"
                >
                  {currentLang === 'am' ? 'አካውንት አስተዳድር' : 'Manage'}
                </button>
              </div>

              {/* Requests and Unlocked Listings */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {currentLang === 'am' ? 'የእርስዎ የክፍያ ጥያቄዎች እና የተከፈቱ ቤቶች' : 'Your Payment Requests & Unlocked Houses'} ({myRequests.length})
                </h3>

                {myRequests.length === 0 ? (
                  <div className="text-center py-10 px-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 space-y-3">
                    <Receipt className="w-8 h-8 mx-auto text-stone-400" />
                    <div>
                      <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                        {currentLang === 'am'
                          ? 'እስካሁን ምንም የተከፈተ ቤት የለም'
                          : 'No Unlocked Houses Yet'}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
                        {currentLang === 'am'
                          ? 'የቤቱን ዝርዝር አይተው "የባለቤት ስልክ ክፈት" የሚለውን በመጫን ክፍያ ሲፈጽሙ አስተዳዳሪው እንዳረጋገጠው ስልኩ እዚህ ይከፈትልዎታል።'
                          : 'When you browse properties and submit an unlock deposit, the owner direct contact unlocks here once verified by admin.'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                      }}
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      {currentLang === 'am' ? 'ቤቶችን ፈልግ' : 'Browse Properties'}
                    </button>
                  </div>
                ) : (
                  myRequests.map((req) => {
                    const prop = properties.find((p) => p.id === req.propertyId);
                    const rawPhone = prop?.ownerPhone?.replace(/\D/g, '') || '';
                    const telegramPhone = rawPhone.startsWith('0') ? '251' + rawPhone.slice(1) : rawPhone;

                    return (
                      <div
                        key={req.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          req.status === 'approved'
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-xs'
                            : req.status === 'pending'
                            ? 'bg-amber-50/40 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                            : 'bg-rose-50/40 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700'
                        }`}
                      >
                        {/* Status row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                            {req.propertyArea} • {req.propertyTitle}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              req.status === 'approved'
                                ? 'bg-emerald-600 text-white'
                                : req.status === 'pending'
                                ? 'bg-amber-500 text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {req.status === 'approved' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                {currentLang === 'am' ? 'ተከፍቷል (ጸድቋል)' : 'Unlocked'}
                              </>
                            ) : req.status === 'pending' ? (
                              <>
                                <Clock className="w-3 h-3" />
                                {currentLang === 'am' ? 'በመጠባበቅ ላይ' : 'Pending Review'}
                              </>
                            ) : (
                              <>{currentLang === 'am' ? 'ውድቅ ተደርጓል' : 'Rejected'}</>
                            )}
                          </span>
                        </div>

                        {/* Unlocked Contact Details Box (ONLY shown if approved and prop exists) */}
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

                            {/* View Property Card link */}
                            <div className="pt-2 text-right">
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenHouseDetail(prop);
                                }}
                                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>{currentLang === 'am' ? 'የቤቱን ሙሉ ዝርዝር እይ' : 'View full property details'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : req.status === 'pending' ? (
                          <p className="text-xs text-amber-800 dark:text-amber-300 mt-2 bg-amber-100/60 dark:bg-amber-950/60 p-2.5 rounded-lg font-medium">
                            {currentLang === 'am'
                              ? 'የክፍያ ስክሪንሽትዎ በአድሚን እየተረጋገጠ ነው። እንደተረጋገጠ የባለቤቱ ስልክ ወዲያውኑ እዚህ ይከፈትልዎታል።'
                              : 'Your payment screenshot is under admin verification. Once verified, the owner phone unlocks here immediately.'}
                          </p>
                        ) : (
                          <p className="text-xs text-rose-800 dark:text-rose-300 mt-2 bg-rose-100/60 dark:bg-rose-950/60 p-2.5 rounded-lg">
                            {currentLang === 'am'
                              ? 'ክፍያው ውድቅ ተደርጓል። እባክዎ ትክክለኛ የባንክ ስክሪንሽት እንደገና ያስገቡ።'
                              : 'This receipt was rejected. Please resubmit a valid bank screenshot.'}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
