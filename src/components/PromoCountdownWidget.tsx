import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Clock, 
  Home, 
  KeyRound, 
  ShieldCheck, 
  IdCard, 
  Sparkles, 
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Language, Property, UnlockRequest, PromoConfig } from '../types';
import { calculatePromoStats, PromoStats, getStoredPromoConfig } from '../utils/promo';

interface PromoCountdownWidgetProps {
  currentLang: Language;
  properties?: Property[];
  unlockRequests?: UnlockRequest[];
  promoConfig?: PromoConfig;
  onPostClick?: () => void;
  onBrowseClick?: () => void;
  compact?: boolean;
}

export const PromoCountdownWidget: React.FC<PromoCountdownWidgetProps> = ({
  currentLang,
  properties = [],
  unlockRequests = [],
  promoConfig,
  onPostClick,
  onBrowseClick,
  compact = false,
}) => {
  const [stats, setStats] = useState<PromoStats>(() => 
    calculatePromoStats(properties, unlockRequests, promoConfig)
  );

  // Live real-time ticking every second
  useEffect(() => {
    const updateStats = () => {
      setStats(calculatePromoStats(properties, unlockRequests, promoConfig));
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [properties, unlockRequests, promoConfig]);

  const ownerPercent = Math.min(100, Math.round((stats.claimedOwners / stats.maxOwners) * 100));
  const userPercent = Math.min(100, Math.round((stats.claimedUsers / stats.maxUsers) * 100));

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className={`rounded-2xl border transition-all ${
      compact
        ? 'bg-gradient-to-b from-stone-900 to-stone-950 text-white border-emerald-500/40 p-3.5 shadow-xl'
        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 p-4 sm:p-6 shadow-sm'
    }`}>
      {/* Header Banner */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-amber-400 tracking-tight flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {currentLang === 'am' ? 'የ100 ባለቤቶች እና 100 ተጠቃሚዎች ነፃ ዕድል' : '100 Owners & 100 Users Launch Promo'}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {stats.isExpired ? (currentLang === 'am' ? 'አብቅቷል' : 'Ended') : (currentLang === 'am' ? 'ቀጥታ ንቁ' : 'Live')}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-400 mt-0.5">
              {currentLang === 'am' 
                ? 'የመጀመሪያዎቹ 100 ባለቤቶች እና 100 ተከራይ/ገዢዎች በነፃ ይጠቀማሉ!' 
                : 'First 100 property owners & 100 buyers get 100% free access!'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Digital Countdown Clock */}
      <div className="bg-stone-800/80 dark:bg-stone-950 p-2.5 rounded-xl border border-stone-700/60 mb-3.5">
        <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-1.5">
          <span className="flex items-center gap-1 text-amber-300">
            <Clock className="w-3 h-3 text-amber-400" />
            {currentLang === 'am' ? 'ለማስተዋወቂያው የቀረው ጊዜ (Count Down)' : 'Promo Time Remaining'}
          </span>
          <span className="font-mono text-[10px] text-stone-400">3 {currentLang === 'am' ? 'ወራት' : 'Months'} Launch</span>
        </div>
        
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="bg-stone-900/90 dark:bg-stone-900 p-1.5 rounded-lg border border-stone-700/50">
            <span className="block text-base sm:text-lg font-black font-mono text-emerald-400 leading-none">
              {pad(stats.daysLeft)}
            </span>
            <span className="text-[9px] text-stone-400 font-semibold uppercase">{currentLang === 'am' ? 'ቀናት' : 'Days'}</span>
          </div>
          <div className="bg-stone-900/90 dark:bg-stone-900 p-1.5 rounded-lg border border-stone-700/50">
            <span className="block text-base sm:text-lg font-black font-mono text-amber-400 leading-none">
              {pad(stats.hoursLeft)}
            </span>
            <span className="text-[9px] text-stone-400 font-semibold uppercase">{currentLang === 'am' ? 'ሰዓታት' : 'Hours'}</span>
          </div>
          <div className="bg-stone-900/90 dark:bg-stone-900 p-1.5 rounded-lg border border-stone-700/50">
            <span className="block text-base sm:text-lg font-black font-mono text-sky-400 leading-none">
              {pad(stats.minutesLeft)}
            </span>
            <span className="text-[9px] text-stone-400 font-semibold uppercase">{currentLang === 'am' ? 'ደቂቃ' : 'Mins'}</span>
          </div>
          <div className="bg-stone-900/90 dark:bg-stone-900 p-1.5 rounded-lg border border-stone-700/50">
            <span className="block text-base sm:text-lg font-black font-mono text-rose-400 leading-none animate-pulse">
              {pad(stats.secondsLeft)}
            </span>
            <span className="text-[9px] text-stone-400 font-semibold uppercase">{currentLang === 'am' ? 'ሰከንድ' : 'Secs'}</span>
          </div>
        </div>
      </div>

      {/* Two Progress Cards */}
      <div className="space-y-2.5">
        {/* 1. Owners Promo Card */}
        <div className="p-2.5 rounded-xl bg-stone-800/60 dark:bg-stone-850 border border-emerald-500/30 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-extrabold text-stone-100">
                {currentLang === 'am' ? 'የባለቤቶች ነፃ ምዝገባ (Owners)' : 'Owners Free Listings'}
              </span>
            </div>
            <span className="font-mono font-black text-emerald-400 text-xs">
              {stats.remainingOwners} / {stats.maxOwners} {currentLang === 'am' ? 'ቀረ' : 'left'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-stone-700 overflow-hidden mb-1.5">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${ownerPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-stone-400">
            <span className="flex items-center gap-1 text-emerald-300">
              <IdCard className="w-3 h-3 text-emerald-400" />
              {currentLang === 'am' ? 'ብሔራዊ መታወቂያ (ID) ግዴታ • 1 ጊዜ ብቻ' : 'National ID required • 1-time use'}
            </span>
            <span className="text-emerald-400 font-bold">0 ETB</span>
          </div>
        </div>

        {/* 2. Renters & Buyers Promo Card */}
        <div className="p-2.5 rounded-xl bg-stone-800/60 dark:bg-stone-850 border border-amber-500/30 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-extrabold text-stone-100">
                {currentLang === 'am' ? 'የተከራይና ገዢ 5 ቤቶች ነፃ (0 ብር)' : 'Renters/Buyers 5 Homes Free'}
              </span>
            </div>
            <span className="font-mono font-black text-amber-400 text-xs">
              {stats.remainingUsers} / {stats.maxUsers} {currentLang === 'am' ? 'ቀረ' : 'left'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-stone-700 overflow-hidden mb-1.5">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
              style={{ width: `${userPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-stone-400">
            <span className="flex items-center gap-1 text-amber-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {currentLang === 'am' ? 'ስልክና ፓስወርድ ብቻ • ምንም ፍቃድ አያስፈልግም • 1 ጊዜ' : 'Phone & Password only • Instant Access • 1-time'}
            </span>
            <span className="text-amber-400 font-bold">0 ETB</span>
          </div>
        </div>
      </div>

      {/* Action Shortcut Buttons */}
      {(onPostClick || onBrowseClick) && (
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-800">
          {onPostClick && (
            <button
              type="button"
              onClick={onPostClick}
              disabled={!stats.isOwnerPromoAvailable}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{currentLang === 'am' ? 'ቤት በነፃ ለጥፍ' : 'Post Free'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}

          {onBrowseClick && (
            <button
              type="button"
              onClick={onBrowseClick}
              className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer border border-stone-700"
            >
              <span>{currentLang === 'am' ? 'ቤቶችን እይ' : 'Browse'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
