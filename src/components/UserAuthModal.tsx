import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Phone, 
  User, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Layers, 
  Building2, 
  KeyRound, 
  AlertCircle,
  Eye,
  EyeOff,
  CreditCard,
  Check
} from 'lucide-react';
import { UserAccount, Language, Property, UnlockRequest } from '../types';
import { translations } from '../data/translations';
import { loginUserAccount, registerUserAccount, isPhoneBanned } from '../utils/storage';
import { ErrorBoundary } from './ErrorBoundary';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  currentUser: UserAccount | null;
  allProperties?: Property[];
  unlockedProperties?: Property[];
  unlockRequests?: UnlockRequest[];
  onLoginSuccess: (user: UserAccount) => void;
  onLogout: () => void;
  onSelectProperty?: (property: Property) => void;
  onOpenPropertyDetails?: (property: Property) => void;
  onOpenBuyPackageModal?: () => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  currentUser,
  allProperties = [],
  unlockedProperties = [],
  unlockRequests = [],
  onLoginSuccess,
  onLogout,
  onSelectProperty,
  onOpenPropertyDetails,
  onOpenBuyPackageModal,
}) => {
  if (!isOpen) return null;

  const t = translations[currentLang];
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [showAuthFormEvenIfLoggedIn, setShowAuthFormEvenIfLoggedIn] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ (ለምሳሌ 0911223344)።'
          : 'Please enter a valid phone number (e.g. 0911223344).'
      );
      return;
    }

    if (isPhoneBanned(cleanPhone)) {
      setErrorMsg(t.bannedAccountAlert || 'This phone number has been flagged for violations.');
      return;
    }

    const cleanPin = pin.trim();
    if (!cleanPin || cleanPin.length < 4) {
      setErrorMsg(
        currentLang === 'am'
          ? 'የሚስጥር ቁጥር (PIN/Password) ቢያንስ 4 ዲጂት መሆን አለበት።'
          : 'PIN/Password must be at least 4 digits.'
      );
      return;
    }

    if (authMode === 'register') {
      if (!name.trim()) {
        setErrorMsg(currentLang === 'am' ? 'እባክዎ ሙሉ ስምዎን ያስገቡ።' : 'Please enter your full name.');
        return;
      }
      const res = registerUserAccount(name.trim(), cleanPhone, cleanPin);
      if (!res.success || !res.user) {
        setErrorMsg(res.message);
        return;
      }
      onLoginSuccess(res.user);
      setSuccessMsg(
        currentLang === 'am'
          ? 'መለያዎ በተሳካ ሁኔታ ተመዝግቧል! አሁን ቤቶችን መመልከት ይችላሉ።'
          : 'Account registered and active! You can now browse and unlock listings.'
      );
    } else {
      const res = loginUserAccount(cleanPhone, cleanPin);
      if (!res.success || !res.user) {
        setErrorMsg(
          res.message ||
            (currentLang === 'am'
              ? 'ስልክ ቁጥር ወይም የሚስጥር ቁጥር አልተገኘም። እባክዎ ይመዝገቡ።'
              : 'Invalid phone or PIN. Please register.')
        );
        return;
      }
      onLoginSuccess(res.user);
      setSuccessMsg(currentLang === 'am' ? 'በተሳካ ሁኔታ ገብተዋል!' : 'Logged in successfully!');
    }
  };

  // Find user's unlocked properties safely
  const cleanUserPhone = currentUser?.phone?.replace(/[\s-]/g, '') || '';
  const resolvedUnlockedProperties: Property[] = React.useMemo(() => {
    if (unlockedProperties && unlockedProperties.length > 0) {
      return unlockedProperties;
    }
    const propList = allProperties || [];
    const unlockedIds = currentUser?.unlockedPropertyIds || [];
    if (unlockedIds.length === 0) return [];
    return propList.filter((p) => p && unlockedIds.includes(p.id));
  }, [unlockedProperties, allProperties, currentUser?.unlockedPropertyIds]);

  // Find user's deposit & unlock payment approvals
  const userRequests = React.useMemo(() => {
    if (!cleanUserPhone) return [];
    return (unlockRequests || []).filter(
      (req) => req && req.buyerPhone && req.buyerPhone.replace(/[\s-]/g, '') === cleanUserPhone
    );
  }, [unlockRequests, cleanUserPhone]);

  // Total remaining unlocks
  const totalRemainingUnlocks = (currentUser?.packages || []).reduce(
    (sum, p) => sum + (p.remainingUnlocks || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div
        id="user-auth-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
                {currentUser
                  ? (currentLang === 'am' ? 'የቤት ፈላጊ መለያ እና ጥቅሎች' : 'Home Finder Account & Unlocks')
                  : (authMode === 'login'
                      ? (currentLang === 'am' ? 'የተጠቃሚ መግቢያ' : 'User Login')
                      : (currentLang === 'am' ? 'አዲስ የቤት ፈላጊ ምዝገባ' : 'Register for Home Finders'))}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {currentUser
                  ? (currentLang === 'am' ? 'ክፍያዎችዎ፣ የቀሩ ቤቶች እና የተከፈቱ መረጃዎች' : 'Your approvals, remaining unlocks & watched houses')
                  : (currentLang === 'am'
                      ? 'አንዴ ይመዝገቡ፤ መለያዎ ወዲያውኑ ንቁ ይሆናል። ክፍያ የሚጠየቀው ቤት ለመክፈት ሲፈልጉ ብቻ ነው።'
                      : 'Register once. Account is immediately active. Payment asked only when unlocking.')}
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

        {/* Content Area */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
          <ErrorBoundary
            fallbackTitle={currentLang === 'am' ? 'የተጠቃሚ መረጃ በመጫን ላይ ስህተት ተፈጥሯል' : 'Error loading user account'}
            fallbackMessage={currentLang === 'am' ? 'እባክዎ እንደገና ይሞክሩ ወይም ውጣ የሚለውን ተጭነው በድጋሚ ይግቡ።' : 'Please retry or click logout to sign in again.'}
            onReset={onLogout}
          >
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

          {currentUser && !showAuthFormEvenIfLoggedIn ? (
            /* LOGGED IN USER PROFILE DASHBOARD */
            <div className="space-y-5">
              {/* User Card */}
              <div className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                        {currentUser.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                        Active
                      </span>
                    </div>
                    <p className="font-mono text-xs text-stone-500 dark:text-stone-400 font-semibold flex items-center gap-1.5 mt-0.5">
                      <span>📞 {currentUser.phone}</span>
                      <span>•</span>
                      <span>PIN: {currentUser.pin}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowAuthFormEvenIfLoggedIn(true)}
                    className="py-2 px-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
                    title={currentLang === 'am' ? 'በሌላ ስልክ ቁጥር ግባ ወይም ተመዝገብ' : 'Switch account / Register new'}
                  >
                    <span>{currentLang === 'am' ? 'ቀይር' : 'Switch'}</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="py-2 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{currentLang === 'am' ? 'ውጣ' : 'Logout'}</span>
                  </button>
                </div>
              </div>

              {/* UNLOCKED HOUSES SUMMARY STAT */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border-2 border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{currentLang === 'am' ? 'የተከፈቱልዎ ቤቶች' : 'Your Unlocked Listings'}</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                    {resolvedUnlockedProperties.length > 0
                      ? (currentLang === 'am'
                          ? `ለእርስዎ የተከፈቱ ${resolvedUnlockedProperties.length} ቤቶች አሉ። የባለቤት ስልካቸውን በማንኛውም ጊዜ ማየት ይችላሉ።`
                          : `You have ${resolvedUnlockedProperties.length} unlocked listings. You can view owner contacts anytime.`)
                      : (currentLang === 'am'
                          ? 'እስካሁን የተከፈተ ቤት የለም። የሚፈልጉትን ቤት መርጠው የመክፈቻ ክፍያውን መፈጸም ይችላሉ።'
                          : 'No listings unlocked yet. Choose a house and submit receipt to unlock.')}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="px-3.5 py-2 rounded-2xl bg-emerald-600 text-white font-black text-xl shadow-md">
                    {resolvedUnlockedProperties.length}
                  </div>
                </div>
              </div>

              {/* USER PAYMENT APPROVALS LIST */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>{currentLang === 'am' ? 'የክፍያ ማረጋገጫዎች ሁኔታ' : 'Your Payment Approvals'} ({userRequests.length})</span>
                </h4>

                {userRequests.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-stone-900 dark:text-white text-xs">
                            {req.type === 'package_purchase'
                              ? (currentLang === 'am' ? '🎁 የ 5 ቤቶች ጥቅል ክፍያ' : '🎁 5-House Package')
                              : (currentLang === 'am' ? '🔑 የቤት መክፈቻ ክፍያ' : '🔑 Single Unlock')}
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            {req.amountBirr || 0} ETB • {(req.paymentMethod || 'Payment').toUpperCase()} • {req.transactionRef || 'Receipt'}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : req.status === 'pending'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {req.status === 'approved'
                            ? (currentLang === 'am' ? '✓ ተረጋግጧል' : '✓ Approved')
                            : req.status === 'pending'
                            ? (currentLang === 'am' ? '⏳ በግምገማ ላይ' : '⏳ Pending Review')
                            : (currentLang === 'am' ? 'ውድቅ' : 'Rejected')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-stone-400 text-center py-2 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-700">
                    {currentLang === 'am' ? 'እስካሁን ምንም የተላከ የክፍያ ስክሪንሽት የለም' : 'No payment requests submitted yet'}
                  </p>
                )}
              </div>

              {/* UNLOCKED HOUSES TO WATCH LIST */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {currentLang === 'am' ? 'የተከፈቱልዎ ቤቶች (Watch List)' : 'Your Unlocked Houses to Watch'} ({resolvedUnlockedProperties.length})
                  </span>
                </h4>

                {resolvedUnlockedProperties.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {resolvedUnlockedProperties.map((prop) => (
                      <div
                        key={prop.id}
                        onClick={() => {
                          onClose();
                          if (onSelectProperty) onSelectProperty(prop);
                          else if (onOpenPropertyDetails) onOpenPropertyDetails(prop);
                        }}
                        className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:border-emerald-500 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="truncate mr-2">
                          <p className="font-bold text-stone-900 dark:text-white text-xs truncate">
                            {prop.title || 'House'}
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            {prop.area || 'Addis Ababa'} • {Number(prop.price || 0).toLocaleString()} ETB • Owner: {prop.ownerName || 'Owner'}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {currentLang === 'am' ? 'ስልክ ይመልከቱ →' : 'View Contact →'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-stone-400 text-center py-2 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-700">
                    {currentLang === 'am' ? 'እስካሁን የተከፈተ ቤት የለም' : 'No properties unlocked yet'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* REGISTRATION / LOGIN FORM */
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {currentUser && showAuthFormEvenIfLoggedIn && (
                <div className="flex items-center justify-between p-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs">
                  <span className="text-stone-600 dark:text-stone-400">
                    {currentLang === 'am' ? `በ ${currentUser.name} ገብተዋል` : `Currently logged in as ${currentUser.name}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAuthFormEvenIfLoggedIn(false)}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    ← {currentLang === 'am' ? 'ወደ መለያዬ ተመለስ' : 'Back to My Account'}
                  </button>
                </div>
              )}
              {/* Tab Selector */}
              <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl grid grid-cols-2 gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg('');
                  }}
                  className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {currentLang === 'am' ? 'አዲስ ተመዝገብ (Register)' : 'Register Once'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg('');
                  }}
                  className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {currentLang === 'am' ? 'መለያ አለኝ (Login)' : 'Already Registered'}
                </button>
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {currentLang === 'am' ? 'ሙሉ ስም' : 'Full Name'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Abebe Kebede"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {currentLang === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0911223344"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {currentLang === 'am' ? 'የሚስጥር ቁጥር (4+ ዲጂት PIN)' : 'Registry Password / PIN (4+ digits)'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    maxLength={10}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono font-black text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  {currentLang === 'am'
                    ? 'የከፈቷቸው ቤቶች እና ጥቅሎች ለስልክዎ ብቻ ሚስጥራዊ ሆነው እንዲቀመጡ ያረጋግጣል።'
                    : 'Protects your purchased unlocks and keeps them strictly private to your phone'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl text-sm font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {authMode === 'register'
                      ? (currentLang === 'am' ? 'ተመዝገብ እና ወዲያውኑ ጀምር' : 'Register & Start Browsing')
                      : (currentLang === 'am' ? 'ግባ' : 'Log In')}
                  </span>
                </button>
              </div>
            </form>
          )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};
