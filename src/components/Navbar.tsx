import React, { useState } from 'react';
import { 
  Layers, 
  PlusCircle, 
  KeyRound, 
  Receipt, 
  Sun, 
  Moon,
  User, 
  Zap, 
  RefreshCw,
  Menu,
  X,
  Globe,
  Phone,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Language, Theme, UserAccount } from '../types';
import { translations } from '../data/translations';

interface NavbarProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  theme?: Theme;
  onToggleTheme?: () => void;
  activeTab: 'browse' | 'post' | 'owner' | 'my-requests' | 'admin';
  setActiveTab: (tab: 'browse' | 'post' | 'owner' | 'my-requests' | 'admin') => void;
  userPhone: string;
  currentUser?: UserAccount | null;
  onOpenUserPhoneModal: () => void;
  onOpenUserAuthModal?: () => void;
  dataSaverMode?: boolean;
  onToggleDataSaver?: () => void;
  isSyncing?: boolean;
  onManualRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onLanguageChange,
  theme = 'light',
  onToggleTheme,
  activeTab,
  setActiveTab,
  userPhone,
  currentUser,
  onOpenUserPhoneModal,
  onOpenUserAuthModal,
  dataSaverMode = true,
  onToggleDataSaver,
  isSyncing = false,
  onManualRefresh,
}) => {
  const t = translations[currentLang];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: 'browse' | 'post' | 'owner' | 'my-requests' | 'admin') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-xs transition-colors w-full max-w-full overflow-x-hidden">
        {/* Top Banner Notice (Compact, perfectly truncated to prevent overflow) */}
        <div className="bg-emerald-600 dark:bg-emerald-700 text-emerald-50 text-[11px] sm:text-xs py-1 px-3 sm:px-4 font-medium flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full min-w-0">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-200 animate-pulse shrink-0"></span>
            <span className="truncate">
              {currentLang === 'am'
                ? (dataSaverMode
                    ? '🇪🇹 ቤሴ • ⚡ ዳታ ቆጣቢ በርቷል • የባለቤቱን ስልክ በቀጥታ ያግኙ'
                    : '🇪🇹 ቤሴ • ቤቶች • መኪኖች • ማሽነሪዎች • የባለቤቱን ስልክ በቀጥታ ያግኙ')
                : (dataSaverMode
                    ? '🇪🇹 Bese • ⚡ Data Saver Active • Direct Owner Contacts'
                    : '🇪🇹 Bese • Homes • Cars • Machineries • Direct Owner Contacts')}
            </span>
            <span className="hidden md:inline-block ml-auto text-emerald-200 text-xs font-mono shrink-0">
              Bole • Gerji • Bulbula • CMC • Ayat
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15 sm:h-17">
            {/* Logo & Brand */}
            <div
              id="brand-logo"
              onClick={() => handleNavClick('browse')}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0 shrink"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0 truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg sm:text-xl tracking-tight text-stone-900 dark:text-white font-sans truncate">
                    {t.appTitle}
                  </span>
                  <span className="hidden xs:inline-block bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-300/60 dark:border-emerald-700/60 shrink-0">
                    {currentLang === 'am' ? 'ቤት • መኪና' : 'Homes'}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links (Large Screens Only) */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                id="nav-browse"
                onClick={() => handleNavClick('browse')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {t.browseHouses}
              </button>

              <button
                id="nav-post"
                onClick={() => handleNavClick('post')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'post'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>{t.postHouse}</span>
              </button>

              <button
                id="nav-owner"
                onClick={() => handleNavClick('owner')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'owner'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <KeyRound className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                <span>{t.ownerPortal}</span>
              </button>

              <button
                id="nav-requests"
                onClick={() => handleNavClick('my-requests')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'my-requests'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Receipt className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                <span>{t.myRequests}</span>
              </button>
            </nav>

            {/* Desktop Settings / Tools (Large Screens) */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Refresh */}
              {onManualRefresh && (
                <button
                  id="btn-refresh-listings-desktop"
                  onClick={onManualRefresh}
                  disabled={isSyncing}
                  className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center transition-colors cursor-pointer border border-stone-200 dark:border-stone-700 disabled:opacity-50"
                  title={isSyncing ? t.syncing : t.refreshListings}
                  aria-label="Refresh Listings"
                >
                  <RefreshCw className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              )}

              {/* Data Saver */}
              {onToggleDataSaver && (
                <button
                  id="btn-data-saver-desktop"
                  onClick={onToggleDataSaver}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    dataSaverMode
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                      : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 hover:text-stone-800'
                  }`}
                  title={dataSaverMode ? t.dataSaverOn : t.dataSaverOff}
                >
                  <Zap className={`w-3.5 h-3.5 ${dataSaverMode ? 'text-emerald-600 dark:text-emerald-400 fill-emerald-500' : 'text-stone-400'}`} />
                  <span>{t.dataSaver}</span>
                </button>
              )}

              {/* Night Mode / Light Mode Toggle */}
              {onToggleTheme && (
                <button
                  id="btn-theme-toggle-desktop"
                  onClick={onToggleTheme}
                  className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
                  title={theme === 'dark' ? t.lightMode : t.darkMode}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-stone-600" />
                  )}
                </button>
              )}

              {/* Language Switcher */}
              <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold">
                <button
                  onClick={() => onLanguageChange('am')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    currentLang === 'am'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  አማርኛ
                </button>
                <button
                  onClick={() => onLanguageChange('en')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    currentLang === 'en'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>

              {/* User Account / Profile */}
              {onOpenUserAuthModal && (
                <button
                  onClick={onOpenUserAuthModal}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    currentUser
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 shadow-2xs'
                      : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="max-w-24 truncate">
                    {currentUser ? currentUser.name : (currentLang === 'am' ? 'ግባ' : 'Login')}
                  </span>
                </button>
              )}
            </div>

            {/* Mobile & Tablet Right Controls: Post CTA + The 3-Line Hamburger Menu */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Quick Post button */}
              <button
                id="btn-mobile-post"
                onClick={() => handleNavClick('post')}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-transform"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{currentLang === 'am' ? 'ለጥፍ' : 'Post'}</span>
              </button>

              {/* 3-LINE HAMBURGER MENU BUTTON (Houses Language, Night Mode, Settings) */}
              <button
                id="btn-mobile-3line-menu"
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                aria-label="Open Settings and Menu"
                title={currentLang === 'am' ? 'ቅንብሮች እና ማውጫ' : 'Settings & Menu'}
              >
                <Menu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE SETTINGS & NAVIGATION DRAWER (The 3-line Menu) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs sm:max-w-sm bg-white dark:bg-stone-900 h-full shadow-2xl border-l border-stone-200 dark:border-stone-800 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250"
          >
            {/* Drawer Header */}
            <div>
              <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-850">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-stone-900 dark:text-white">
                      {currentLang === 'am' ? 'ቅንብሮች እና ማውጫ' : 'Settings & Menu'}
                    </h3>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400">
                      {currentLang === 'am' ? 'ቋንቋ • ገጽታ • መለያ' : 'Language • Theme • Account'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content Sections */}
              <div className="p-4 space-y-4">
                {/* 1. LANGUAGE CHANGER (Amharic / English) */}
                <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2">
                  <label className="text-[11px] font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{currentLang === 'am' ? 'ቋንቋ ይምረጡ' : 'Language'}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onLanguageChange('am')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        currentLang === 'am'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>🇪🇹 አማርኛ</span>
                      {currentLang === 'am' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onLanguageChange('en')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        currentLang === 'en'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>English</span>
                      {currentLang === 'en' && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 2. NIGHT / LIGHT MODE CHANGER */}
                {onToggleTheme && (
                  <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2">
                    <label className="text-[11px] font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                      {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-amber-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                      <span>{currentLang === 'am' ? 'ገጽታ (ቀን / ማታ)' : 'Night & Day Mode'}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          if (theme !== 'dark') onToggleTheme();
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                          theme === 'dark'
                            ? 'bg-stone-900 text-amber-300 border-amber-500/50 shadow-xs'
                            : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5 text-amber-400" />
                        <span>{currentLang === 'am' ? 'ጨለማ' : 'Night'}</span>
                        {theme === 'dark' && <Check className="w-3 h-3 text-amber-400" />}
                      </button>
                      <button
                        onClick={() => {
                          if (theme !== 'light') onToggleTheme();
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                          theme === 'light'
                            ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                            : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5 text-amber-600" />
                        <span>{currentLang === 'am' ? 'ብሩህ' : 'Light'}</span>
                        {theme === 'light' && <Check className="w-3 h-3 text-amber-600" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. DATA SAVER MODE TOGGLE */}
                {onToggleDataSaver && (
                  <button
                    onClick={onToggleDataSaver}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      dataSaverMode
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                        : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        dataSaverMode ? 'bg-emerald-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600'
                      }`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold block">
                          {currentLang === 'am' ? 'ዳታ ቆጣቢ ሞድ' : 'Data Saver Mode'}
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400">
                          {dataSaverMode
                            ? (currentLang === 'am' ? 'በርቷል (ካርድ ይቆጥባል)' : 'Active (Saves Data)')
                            : (currentLang === 'am' ? 'ጠፍቷል' : 'Disabled')}
                        </span>
                      </div>
                    </div>
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      dataSaverMode ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        dataSaverMode ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </div>
                  </button>
                )}

                {/* 4. USER ACCOUNT & UNLOCKED HOUSES */}
                {onOpenUserAuthModal && (
                  <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2">
                    <label className="text-[11px] font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{currentLang === 'am' ? 'የተጠቃሚ መለያ' : 'User Account'}</span>
                    </label>
                    {currentUser ? (
                      <div className="space-y-2">
                        <div className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-stone-900 dark:text-white block">{currentUser.name}</span>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{currentUser.phone}</span>
                          </div>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                            {currentUser.unlockedPropertyIds?.length || 0} {currentLang === 'am' ? 'የተከፈቱ' : 'Unlocked'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onOpenUserAuthModal();
                          }}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          {currentLang === 'am' ? 'የተከፈቱ ቤቶቼን እይ' : 'View My Unlocked Houses'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenUserAuthModal();
                        }}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        <span>{currentLang === 'am' ? 'ግባ / ተመዝገብ (የፈላጊዎች መግቢያ)' : 'Sign In / Register'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 5. NAVIGATION LINKS */}
                <div className="space-y-1 pt-1 border-t border-stone-100 dark:border-stone-800">
                  <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block px-2 mb-1">
                    {currentLang === 'am' ? 'ገጾች' : 'Navigation'}
                  </label>
                  
                  <button
                    onClick={() => handleNavClick('browse')}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      activeTab === 'browse'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.browseHouses}</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('post')}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      activeTab === 'post'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.postHouse}</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('owner')}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      activeTab === 'owner'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.ownerPortal}</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('my-requests')}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      activeTab === 'my-requests'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.myRequests}</span>
                  </button>
                </div>

                {/* 6. REFRESH LISTINGS */}
                {onManualRefresh && (
                  <button
                    onClick={() => {
                      onManualRefresh();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isSyncing}
                    className="w-full py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? t.syncing : t.refreshListings}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Footer: Direct Support Hotline */}
            <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-850">
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
                {currentLang === 'am' ? 'የደንበኞች አገልግሎት ስልክ' : 'Customer Support Hotline'}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="tel:0991154337"
                  className="flex-1 py-1.5 px-2 bg-emerald-600 text-white rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>0991154337</span>
                </a>
                <a
                  href="tel:0983150749"
                  className="flex-1 py-1.5 px-2 bg-stone-800 text-white rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>0983150749</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
