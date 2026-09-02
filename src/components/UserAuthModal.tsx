import React, { useState } from 'react';
import { X, Lock, Phone, User, LogIn, LogOut, CheckCircle2, Shield, Sparkles, Layers, Building2, KeyRound, AlertCircle } from 'lucide-react';
import { UserAccount, Language, Property } from '../types';
import { translations } from '../data/translations';
import { loginUserAccount, registerUserAccount, isPhoneBanned } from '../utils/storage';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  currentUser: UserAccount | null;
  allProperties: Property[];
  onLoginSuccess: (user: UserAccount) => void;
  onLogout: () => void;
  onSelectProperty: (property: Property) => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  currentUser,
  allProperties,
  onLoginSuccess,
  onLogout,
  onSelectProperty,
}) => {
  if (!isOpen) return null;

  const t = translations[currentLang];
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMsg(currentLang === 'am' ? 'እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ።' : 'Please enter a valid phone number.');
      return;
    }

    if (isPhoneBanned(cleanPhone)) {
      setErrorMsg(t.bannedAccountAlert);
      return;
    }

    if (!pin.trim() || pin.trim().length < 4) {
      setErrorMsg(currentLang === 'am' ? 'የሚስጥር ቁጥር (PIN) ቢያንስ 4 ዲጂት መሆን አለበት።' : 'PIN must be at least 4 digits.');
      return;
    }

    if (authMode === 'register') {
      if (!name.trim()) {
        setErrorMsg(currentLang === 'am' ? 'እባክዎ ሙሉ ስምዎን ያስገቡ።' : 'Please enter your full name.');
        return;
      }
      const newUser = registerUserAccount(cleanPhone, pin.trim(), name.trim());
      onLoginSuccess(newUser);
      setSuccessMsg(currentLang === 'am' ? 'አካውንትዎ በተሳካ ሁኔታ ተፈጥሯል!' : 'Account created successfully!');
      setTimeout(() => onClose(), 900);
    } else {
      const user = loginUserAccount(cleanPhone, pin.trim());
      if (!user) {
        setErrorMsg(
          currentLang === 'am'
            ? 'ስልክ ቁጥር ወይም የሚስጥር ቁጥር አልተገኘም። እባክዎ እንደገና ይሞክሩ ወይም ይመዝገቡ።'
            : 'Invalid phone or PIN. Please try again or register.'
        );
        return;
      }
      onLoginSuccess(user);
      setSuccessMsg(currentLang === 'am' ? 'በተሳካ ሁኔታ ገብተዋል!' : 'Logged in successfully!');
      setTimeout(() => onClose(), 900);
    }
  };

  // Find user's unlocked properties
  const unlockedProperties = currentUser?.unlockedPropertyIds
    ? allProperties.filter((p) => currentUser.unlockedPropertyIds.includes(p.id))
    : [];

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
                  ? (currentLang === 'am' ? 'የእኔ አካውንት እና ጥቅሎች' : 'My Account & Packages')
                  : (authMode === 'login' ? (currentLang === 'am' ? 'የተጠቃሚ መግቢያ' : 'User Login') : (currentLang === 'am' ? 'አዲስ አካውንት መክፈቻ' : 'Create Account'))}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {currentLang === 'am'
                  ? 'የተከፈቱ ቤቶች እና ጥቅሎች ለስልክዎ ብቻ ሚስጥራዊ ሆነው ይቀመጣሉ'
                  : 'Your unlocked houses & packages are strictly private to your login'}
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

          {currentUser ? (
            /* LOGGED IN PROFILE VIEW */
            <div className="space-y-5">
              <div className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                      {currentUser.name}
                    </h3>
                    <p className="font-mono text-xs text-stone-500 dark:text-stone-400 font-semibold">
                      {currentUser.phone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="py-2 px-3.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{currentLang === 'am' ? 'ውጣ' : 'Logout'}</span>
                </button>
              </div>

              {/* Active Packages Summary */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>{currentLang === 'am' ? 'የእርስዎ ንቁ ጥቅሎች (Unlocks)' : 'Your Active Packages'}</span>
                </h4>

                {currentUser.packages && currentUser.packages.length > 0 ? (
                  <div className="space-y-2">
                    {currentUser.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-extrabold text-stone-900 dark:text-white text-xs">
                            {currentLang === 'am'
                              ? `እስከ ${pkg.maxHousePrice.toLocaleString()} ብር ቤቶች`
                              : `Houses up to ${pkg.maxHousePrice.toLocaleString()} ETB`}
                          </div>
                          <span className="text-[11px] text-stone-500 dark:text-stone-400">
                            {currentLang === 'am' ? `ከ 5 ቤቶች ውስጥ` : `Out of 5 unlocks`}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                            {pkg.remainingUnlocks} {currentLang === 'am' ? 'ይቀራል' : 'left'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-center text-xs text-stone-500">
                    {currentLang === 'am'
                      ? 'እስካሁን ምንም የተገዛ ጥቅል የለዎትም። ቤት ሲከፍቱ የ 5 ቤቶች ጥቅል መግዛት ይችላሉ።'
                      : 'No active packages yet. Purchase a 5-house package when unlocking any house.'}
                  </div>
                )}
              </div>

              {/* Unlocked Houses List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {currentLang === 'am' ? 'የተከፈቱልዎ ቤቶች' : 'Your Unlocked Properties'} ({unlockedProperties.length})
                  </span>
                </h4>

                {unlockedProperties.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {unlockedProperties.map((prop) => (
                      <div
                        key={prop.id}
                        onClick={() => {
                          onClose();
                          onSelectProperty(prop);
                        }}
                        className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:border-emerald-500 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="truncate mr-2">
                          <p className="font-bold text-stone-900 dark:text-white text-xs truncate">
                            {prop.title}
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            {prop.area} • {prop.price.toLocaleString()} ETB
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {currentLang === 'am' ? 'ስልክ ይመልከቱ →' : 'View Contact →'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-stone-400 text-center py-2">
                    {currentLang === 'am' ? 'እስካሁን የተከፈተ ቤት የለም' : 'No properties unlocked yet'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* AUTH FORM: LOGIN OR REGISTER */
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {/* Tab Selector */}
              <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl grid grid-cols-2 gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {currentLang === 'am' ? 'ግባ (Login)' : 'Login'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {currentLang === 'am' ? 'ተመዝገብ (Sign Up)' : 'Sign Up'}
                </button>
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {currentLang === 'am' ? 'ሙሉ ስም' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Abebe Kebede"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-white font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {currentLang === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0911223344"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {currentLang === 'am' ? 'የሚስጥር ቁጥር (4-Digit PIN)' : 'Security PIN (4+ digits)'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    maxLength={10}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono font-black text-stone-900 dark:text-white"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  {currentLang === 'am'
                    ? 'የከፈቷቸው ቤቶች ለሌላ ሰው እንዳይታዩ የሚያረጋግጥ'
                    : 'Protects your purchased unlocks and keeps them strictly private'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl text-sm font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {authMode === 'login'
                      ? (currentLang === 'am' ? 'ግባ' : 'Log In')
                      : (currentLang === 'am' ? 'ተመዝገብ እና ጀምር' : 'Create Account & Continue')}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
