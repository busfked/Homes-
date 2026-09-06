import React from 'react';
import { 
  Building2, 
  Car, 
  Tractor, 
  Layers, 
  PlusCircle, 
  ShieldCheck, 
  KeyRound, 
  Receipt, 
  Sun, 
  Moon,
  User,
  Sparkles,
  Zap,
  RefreshCw
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
  pendingApprovalsCount: number;
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
  pendingApprovalsCount,
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

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-xs transition-colors">
      {/* Top Banner Notice */}
      <div className="bg-emerald-600 dark:bg-emerald-700 text-emerald-50 text-xs py-1.5 px-4 font-medium flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-200 animate-pulse"></span>
          <span className="truncate">
            {currentLang === 'am'
              ? (dataSaverMode
                  ? '🇪🇹 ቤሴ መፍትሄ • ⚡ ዳታ ቆጣቢ በርቷል (የሞባይል ካርድዎን ይቆጥባል) • የባለቤቱን ስልክ በቀጥታ ያግኙ'
                  : '🇪🇹 ቤሴ መፍትሄ • ቤቶች • መኪኖች • ማሽነሪዎች • የባለቤቱን ስልክ በቀጥታ ያግኙ')
              : (dataSaverMode
                  ? '🇪🇹 Bese Solutions • ⚡ Data Saver Active (Conserves Mobile Airtime) • Direct Owner Brokerage'
                  : '🇪🇹 Bese Solutions • Homes • Cars • Machineries • Direct Verified Owner Brokerage')}
          </span>
          <span className="hidden md:inline-block ml-auto text-emerald-200 text-xs font-mono">
            Bole • Gerji • Bulbula • Megenagna • CMC • Ayat
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div
            id="brand-logo"
            onClick={() => setActiveTab('browse')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-stone-900 dark:text-white font-sans">
                  {t.appTitle}
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300/60 dark:border-emerald-700/60">
                  {currentLang === 'am' ? 'ቤት • መኪና • ማሽነሪ' : 'Home • Car • Machinery'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              id="nav-browse"
              onClick={() => setActiveTab('browse')}
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
              onClick={() => setActiveTab('post')}
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
              onClick={() => setActiveTab('owner')}
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
              onClick={() => setActiveTab('my-requests')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'my-requests'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Receipt className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              <span>{t.myRequests}</span>
            </button>

            <button
              id="nav-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-stone-900 dark:bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.adminPanel}</span>
              {pendingApprovalsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-bounce">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action Tools: Language Switcher, Theme Toggle, Data Saver & Post CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Manual Refresh Button */}
            {onManualRefresh && (
              <button
                id="btn-refresh-listings"
                onClick={onManualRefresh}
                disabled={isSyncing}
                className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center transition-colors cursor-pointer border border-stone-200 dark:border-stone-700 disabled:opacity-50"
                title={isSyncing ? t.syncing : t.refreshListings}
                aria-label="Refresh Listings"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Data Saver Mode Toggle Button */}
            {onToggleDataSaver && (
              <button
                id="btn-data-saver"
                onClick={onToggleDataSaver}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  dataSaverMode
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                    : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 hover:text-stone-800'
                }`}
                title={dataSaverMode ? t.dataSaverOn : t.dataSaverOff}
                aria-label="Toggle Data Saver"
              >
                <Zap className={`w-3.5 h-3.5 ${dataSaverMode ? 'text-emerald-600 dark:text-emerald-400 fill-emerald-500' : 'text-stone-400'}`} />
                <span className="hidden sm:inline">
                  {t.dataSaver}
                </span>
                {dataSaverMode && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
              </button>
            )}

            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                id="btn-theme-toggle"
                onClick={onToggleTheme}
                className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
                title={theme === 'dark' ? t.lightMode : t.darkMode}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Moon className="w-4 h-4 text-stone-600" />
                )}
              </button>
            )}

            {/* Language Toggle Button */}
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold">
              <button
                id="lang-am"
                onClick={() => onLanguageChange('am')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  currentLang === 'am'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
                title="አማርኛ"
              >
                <span>አማርኛ</span>
              </button>
              <button
                id="lang-en"
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  currentLang === 'en'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
                title="English"
              >
                <span>EN</span>
              </button>
            </div>

            {/* User Account / Login Button */}
            {onOpenUserAuthModal && (
              <button
                id="btn-user-auth"
                onClick={onOpenUserAuthModal}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  currentUser
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 shadow-2xs'
                    : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                }`}
                title={currentUser ? currentUser.name : (currentLang === 'am' ? 'ግባ / ተመዝገብ' : 'Login / Register')}
              >
                <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline max-w-24 truncate">
                  {currentUser ? currentUser.name : (currentLang === 'am' ? 'ግባ' : 'Login')}
                </span>
                {currentUser?.packages && currentUser.packages.length > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    {currentUser.packages.reduce((sum, p) => sum + p.remainingUnlocks, 0)}
                  </span>
                )}
              </button>
            )}

            {/* Post Listing Call To Action Button (Mobile/Tablet Highlight) */}
            <button
              id="cta-post-mobile"
              onClick={() => setActiveTab('post')}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{currentLang === 'am' ? 'ለጥፍ' : 'Post'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row (All fit seamlessly in one row) */}
        <div className="lg:hidden grid grid-cols-4 gap-1 py-2 border-t border-stone-100 dark:border-stone-800 text-[11px] font-medium">
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-1.5 px-1 rounded-lg text-center truncate cursor-pointer ${
              activeTab === 'browse'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            {currentLang === 'am' ? 'ዝርዝሮች' : 'Browse'}
          </button>
          <button
            onClick={() => setActiveTab('owner')}
            className={`py-1.5 px-1 rounded-lg text-center truncate cursor-pointer ${
              activeTab === 'owner'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            {currentLang === 'am' ? 'ባለቤት' : 'Owner'}
          </button>
          <button
            onClick={() => setActiveTab('my-requests')}
            className={`py-1.5 px-1 rounded-lg text-center truncate cursor-pointer ${
              activeTab === 'my-requests'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            {currentLang === 'am' ? 'የእኔ ጥያቄ' : 'Requests'}
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-1.5 px-1 rounded-lg text-center flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-stone-900 dark:bg-emerald-600 text-white font-bold'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            <span className="truncate">{currentLang === 'am' ? 'አድሚን' : 'Admin'}</span>
            {pendingApprovalsCount > 0 && (
              <span className="px-1 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
