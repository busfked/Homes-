import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  Send, 
  MapPin, 
  Building2, 
  Car, 
  Tractor,
  Sparkles,
  Filter
} from 'lucide-react';
import { Property, Language } from '../types';
import { translations } from '../data/translations';
import { formatEtbPrice } from '../utils/pricing';
import { 
  copyToClipboard, 
  getWhatsAppShareUrl, 
  getTelegramShareUrl, 
  generatePropertyDirectUrl, 
  generateSearchDirectUrl, 
  SearchFilterState 
} from '../utils/shareUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  property?: Property | null;
  searchFilters?: SearchFilterState;
  totalResultsCount?: number;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  property,
  searchFilters,
  totalResultsCount = 0,
}) => {
  const [copied, setCopied] = useState(false);
  const t = translations[currentLang];

  if (!isOpen) return null;

  const isSharingProperty = !!property;

  // Generate appropriate direct URL
  const directUrl = isSharingProperty
    ? generatePropertyDirectUrl(property.id, searchFilters)
    : generateSearchDirectUrl(searchFilters || {});

  // Compose share message text
  let shareTitle = '';
  let shareSummary = '';

  if (isSharingProperty) {
    const title = currentLang === 'am' && property.titleAm ? property.titleAm : property.title;
    const area = currentLang === 'am' && property.areaAm ? property.areaAm : property.area;
    const priceText = formatEtbPrice(property.price);
    const listingType = property.listingType === 'sale' 
      ? (currentLang === 'am' ? 'ለሽያጭ' : 'For Sale') 
      : (currentLang === 'am' ? 'ለኪራይ' : 'For Rent');

    shareTitle = `${title} (${area})`;
    shareSummary = currentLang === 'am'
      ? `🏠 በ ${area} ${listingType} የወጣ ንብረት፦ ${title}\n💰 ዋጋ፦ ${priceText}\n📞 የባለቤት ስልክ ለማግኘት እና ሙሉ መረጃውን ለማየት ቀጥታ ሊንኩን ይክፈቱ፦`
      : `🏠 Property ${listingType} in ${area}: ${title}\n💰 Price: ${priceText}\n👉 View photos, details and contact the owner on BetDelala:`;
  } else {
    // Sharing search results
    const filterDescParts: string[] = [];
    if (searchFilters?.area && searchFilters.area !== 'all') {
      filterDescParts.push(`${searchFilters.area}`);
    }
    if (searchFilters?.listingType && searchFilters.listingType !== 'all') {
      filterDescParts.push(searchFilters.listingType === 'sale' ? 'For Sale' : 'For Rent');
    }
    if (searchFilters?.category && searchFilters.category !== 'home') {
      filterDescParts.push(searchFilters.category);
    }
    if (searchFilters?.searchQuery) {
      filterDescParts.push(`"${searchFilters.searchQuery}"`);
    }

    const filtersText = filterDescParts.length > 0 ? filterDescParts.join(' • ') : 'All Listings';

    shareTitle = currentLang === 'am' 
      ? `የንብረት ፍለጋ ውጤቶች (${totalResultsCount})` 
      : `Property Search Results (${totalResultsCount})`;

    shareSummary = currentLang === 'am'
      ? `🔍 በቤተ-ደላላ የተገኙ የቤትና ንብረት ፍለጋ ውጤቶች (${filtersText})፦\n👉 ሁሉንም የተዘረዘሩ ቤቶች ለማየት ይህንን ሊንክ ይክፈቱ፦`
      : `🔍 Explore verified property listings on BetDelala (${filtersText}):\n👉 Click the direct link to browse matches:`;
  }

  const handleCopyLink = async () => {
    const success = await copyToClipboard(directUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleWhatsAppShare = () => {
    const url = getWhatsAppShareUrl(shareSummary, directUrl);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const url = getTelegramShareUrl(shareSummary, directUrl);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator?.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareSummary,
          url: directUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        console.debug('Native share cancelled or not completed', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const primaryImage = property?.images && property.images.length > 0
    ? property.images[0].url
    : null;

  return (
    <div 
      className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 rounded-3xl overflow-hidden max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100">
                {isSharingProperty
                  ? (currentLang === 'am' ? 'ንብረቱን ለጓደኛ ያጋሩ' : 'Share Property Listing')
                  : (currentLang === 'am' ? 'የፍለጋ ውጤቱን ያጋሩ' : 'Share Search Results')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {currentLang === 'am'
                  ? 'በዋትስአፕ፣ በቴሌግራም ወይም በቀጥታ ሊንክ'
                  : 'Send via WhatsApp, Telegram or copy direct link'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview Card */}
        {isSharingProperty && property ? (
          <div className="p-3.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 rounded-2xl flex gap-3.5 items-center">
            {primaryImage ? (
              <img 
                src={primaryImage} 
                alt={property.title} 
                className="w-18 h-18 rounded-xl object-cover shrink-0 border border-stone-200 dark:border-stone-700" 
              />
            ) : (
              <div className="w-18 h-18 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7" />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {property.listingType === 'sale' ? (currentLang === 'am' ? 'ሽያጭ' : 'For Sale') : (currentLang === 'am' ? 'ኪራይ' : 'For Rent')}
              </span>
              <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm truncate">
                {property.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  {property.area}
                </span>
                <span>•</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatEtbPrice(property.price)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                {currentLang === 'am' ? 'የተመረጡ የፍለጋ መመዘኛዎች' : 'Active Search Filters'}
              </span>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                {totalResultsCount} {currentLang === 'am' ? 'ውጤቶች' : 'listings'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px] pt-1">
              {searchFilters?.area && searchFilters.area !== 'all' && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  📍 {searchFilters.area}
                </span>
              )}
              {searchFilters?.category && searchFilters.category !== 'home' && (
                <span className="px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-stone-700 font-bold capitalize">
                  {searchFilters.category}
                </span>
              )}
              {searchFilters?.listingType && searchFilters.listingType !== 'all' && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold">
                  {searchFilters.listingType === 'sale' ? 'Sale' : 'Rent'}
                </span>
              )}
              {searchFilters?.searchQuery && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                  "{searchFilters.searchQuery}"
                </span>
              )}
              {(!searchFilters?.area || searchFilters.area === 'all') && !searchFilters?.searchQuery && (
                <span className="px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
                  {currentLang === 'am' ? 'ሁሉም የቅርብ ጊዜ ቤቶች' : 'All Recent Listings in Addis Ababa'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Social Share Buttons (WhatsApp & Telegram) */}
        <div className="space-y-2.5">
          <label className="text-xs font-extrabold text-stone-700 dark:text-stone-300 block">
            {currentLang === 'am' ? 'በማህበራዊ ሚዲያ ላክ (Send via Social Media):' : 'Share to Chat Apps:'}
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-98 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {/* WhatsApp SVG Icon */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.587 1.961.954 2.805.955l.004-.001c3.181 0 5.767-2.587 5.768-5.766.001-3.181-2.585-5.768-5.781-5.741zm8.397 5.767c-.002 4.646-3.78 8.423-8.428 8.423-1.488 0-2.923-.393-4.184-1.139l-4.639 1.217 1.239-4.521c-.818-1.312-1.252-2.83-1.252-4.398.002-4.646 3.78-8.424 8.428-8.424 4.647 0 8.427 3.778 8.836 8.842z"/>
              </svg>
              <span>WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={handleTelegramShare}
              className="py-3 px-4 rounded-2xl bg-[#229ED9] hover:bg-[#1e8ec3] active:scale-98 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {/* Telegram SVG Icon */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              <span>Telegram</span>
            </button>
          </div>
        </div>

        {/* Direct Link Box with Copy Button */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-stone-700 dark:text-stone-300 block">
            {currentLang === 'am' ? 'ቀጥታ ሊንክ (Direct Share Link):' : 'Direct URL:'}
          </label>
          <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-850 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-700">
            <input
              type="text"
              readOnly
              value={directUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-stone-700 dark:text-stone-300 font-mono focus:outline-hidden truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`py-2 px-3.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{currentLang === 'am' ? 'ተቀድቷል!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{currentLang === 'am' ? 'ሊንክ ቅዳ' : 'Copy Link'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Optional Native Share Sheet Trigger (Mobile) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentLang === 'am' ? 'ተጨማሪ የማጋሪያ አማራጮች (More Options)' : 'More Share Options'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
