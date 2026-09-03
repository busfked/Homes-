import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  Send, 
  MapPin, 
  Bed, 
  Bath, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  KeyRound, 
  Building2,
  Car,
  Tractor,
  Fuel,
  Gauge,
  Calendar,
  Layers,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Property, Language, UserAccount } from '../types';
import { translations } from '../data/translations';
import { getDaysRemaining } from '../utils/storage';
import { formatEtbPrice, calculateHouseUnlockFee } from '../utils/pricing';
import { PROPERTY_TYPES, CAR_TYPES, MACHINERY_TYPES } from '../data/addisAreas';

interface HouseDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  isUnlocked: boolean;
  currentUser?: UserAccount | null;
  onUseCreditToUnlock?: (property: Property) => void;
  onOpenUnlockModal: (property: Property) => void;
  onOpenOwnerPortalForThisHouse: (property: Property) => void;
  onOpenReportModal?: (property: Property) => void;
}

export const HouseDetailModal: React.FC<HouseDetailModalProps> = ({
  property,
  isOpen,
  onClose,
  currentLang,
  isUnlocked,
  currentUser,
  onUseCreditToUnlock,
  onOpenUnlockModal,
  onOpenOwnerPortalForThisHouse,
  onOpenReportModal,
}) => {
  if (!isOpen || !property) return null;

  const t = translations[currentLang];
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const images = property.images && property.images.length > 0 ? property.images : [];
  const { days, hours, isExpired } = getDaysRemaining(property.expiresAt);

  const category = property.category || 'home';

  // Direct tier unlock fee: 150, 250, 350, or 500 ETB
  const houseUnlockFee = calculateHouseUnlockFee(property.price, property.listingType, property.category);

  // Determine sub-type label
  let typeLabel = '';
  if (category === 'car') {
    const carObj = CAR_TYPES.find((c) => c.id === property.carType);
    typeLabel = currentLang === 'am' ? carObj?.nameAm || property.carType || 'መኪና' : carObj?.nameEn || property.carType || 'Car';
  } else if (category === 'machinery') {
    const machObj = MACHINERY_TYPES.find((m) => m.id === property.machineryType);
    typeLabel = currentLang === 'am' ? machObj?.nameAm || property.machineryType || 'ማሽነሪ' : machObj?.nameEn || property.machineryType || 'Machinery';
  } else {
    const propTypeObj = PROPERTY_TYPES.find((pt) => pt.id === property.propertyType);
    typeLabel = currentLang === 'am' ? propTypeObj?.nameAm || property.propertyType || 'ቤት' : propTypeObj?.nameEn || property.propertyType || 'Home';
  }

  // Clean phone number for links
  const rawPhone = property.ownerPhone.replace(/\D/g, '');
  const telegramPhone = rawPhone.startsWith('0') ? '251' + rawPhone.slice(1) : rawPhone;

  const handleNextPhoto = () => {
    if (images.length === 0) return;
    setSelectedPhotoIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevPhoto = () => {
    if (images.length === 0) return;
    setSelectedPhotoIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const isLastImage = images.length > 0 && selectedPhotoIndex === images.length - 1;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div
        id="house-detail-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/80">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              {category === 'car' ? (
                <Car className="w-3.5 h-3.5" />
              ) : category === 'machinery' ? (
                <Tractor className="w-3.5 h-3.5" />
              ) : (
                <Building2 className="w-3.5 h-3.5" />
              )}
              <span>{typeLabel} • {property.listingType === 'sale' ? t.sale : t.rent}</span>
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              ID: #{property.id}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Main Photo Gallery with Carousel Controls */}
          <div className="space-y-3">
            <div className="relative aspect-16/10 sm:aspect-21/9 bg-stone-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center group">
              <img
                src={images[selectedPhotoIndex]?.url || images[0]?.url}
                alt={property.title}
                className="w-full h-full object-contain sm:object-cover"
              />

              {/* Prev / Next Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Photo Count badge */}
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-lg backdrop-blur-xs font-bold flex items-center gap-1.5">
                <span>{selectedPhotoIndex + 1} / {images.length} {t.photosCount}</span>
                {isLastImage && (
                  <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black">
                    {currentLang === 'am' ? 'የመጨረሻ ፎቶ' : 'Last Photo'}
                  </span>
                )}
              </div>
            </div>

            {/* Photo Thumbnails */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedPhotoIndex === idx
                        ? 'border-emerald-600 scale-102 ring-2 ring-emerald-600/30'
                        : 'border-stone-200 dark:border-stone-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 bg-stone-900/80 text-[10px] text-white px-1 rounded-tl">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Indicator after Last Photo */}
          {isLastImage && !isUnlocked && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                {currentLang === 'am'
                  ? 'ሁሉንም ፎቶዎች አይተዋል! የባለቤቱን ስልክ ቁጥር ከታች ይክፈቱ።'
                  : 'All photos viewed! Owner contact details can now be unlocked below.'}
              </span>
              <span className="font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-stone-900 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700">
                {houseUnlockFee} {t.etb}
              </span>
            </div>
          )}

          {/* Title & Area Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-1">
                <MapPin className="w-4 h-4" />
                <span>
                  {currentLang === 'am' ? property.areaAm || property.area : property.area}
                  {property.subCity && ` (${property.subCity})`}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                {currentLang === 'am' && property.titleAm ? property.titleAm : property.title}
              </h2>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 p-3.5 sm:p-4 rounded-2xl sm:text-right shrink-0">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block">
                {property.listingType === 'sale' ? t.salePrice : t.rentPrice}
              </span>
              <div className="text-xl sm:text-2xl font-black text-stone-950 dark:text-stone-100 font-sans">
                {formatEtbPrice(property.price, property.pricePeriod, currentLang)}
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                {typeLabel}
              </span>
            </div>
          </div>

          {/* Specifications Grid based on Category */}
          {category === 'car' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {property.carMake && (
                <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 p-3 rounded-xl">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{t.carMake} / {t.carModel}</span>
                  <span className="font-bold text-stone-900 dark:text-white text-sm">{property.carMake} {property.carModel}</span>
                </div>
              )}
              {property.carYear && (
                <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 p-3 rounded-xl">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{t.carYear}</span>
                  <span className="font-bold text-stone-900 dark:text-white text-sm">{property.carYear}</span>
                </div>
              )}
              {property.transmission && (
                <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 p-3 rounded-xl">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{t.transmission}</span>
                  <span className="font-bold text-stone-900 dark:text-white text-sm capitalize">{property.transmission}</span>
                </div>
              )}
              {property.fuelType && (
                <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 p-3 rounded-xl">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{t.fuelType}</span>
                  <span className="font-bold text-stone-900 dark:text-white text-sm capitalize">{property.fuelType}</span>
                </div>
              )}
            </div>
          ) : category === 'machinery' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {property.machineryBrand && (
                <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 p-3 rounded-xl">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{t.machineryBrand}</span>
                  <span className="font-bold text-stone-900 dark:text-white text-sm">{property.machineryBrand}</span>
                </div>
              )}
              {property.capacity && (
                <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 p-3 rounded-xl">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{t.capacity}</span>
                  <span className="font-bold text-stone-900 dark:text-white text-sm">{property.capacity}</span>
                </div>
              )}
              {property.machineryCondition && (
                <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 p-3 rounded-xl">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{t.condition}</span>
                  <span className="font-bold text-stone-900 dark:text-white text-sm capitalize">{property.machineryCondition}</span>
                </div>
              )}
              <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 p-3 rounded-xl">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{t.expiresInDays}</span>
                <span className="font-bold text-stone-900 dark:text-white text-sm">{isExpired ? t.expiredStatus : `${days}d ${hours}h`}</span>
              </div>
            </div>
          ) : (
            // Homes
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 p-3 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{t.beds}</span>
                  <span className="font-bold text-stone-900 dark:text-white text-sm">{property.bedrooms} {t.beds}</span>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 p-3 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Bath className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{t.baths}</span>
                  <span className="font-bold text-stone-900 dark:text-white text-sm">{property.bathrooms} {t.baths}</span>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 p-3 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{t.expiresInDays}</span>
                  <span className="font-bold text-stone-900 dark:text-white text-sm">
                    {isExpired ? t.expiredStatus : `${days}d ${hours}h`}
                  </span>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 p-3 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{currentLang === 'am' ? 'የፎቶ መጠን' : 'Image Weight'}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {images.reduce((sum, img) => sum + (img.compressedSizeKb || 50), 0)} KB (⚡ Low)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider mb-2">
              {currentLang === 'am' ? 'ዝርዝር መግለጫ' : 'Description & Details'}
            </h3>
            <p className="text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-200 dark:border-stone-700">
              {currentLang === 'am' && property.descriptionAm ? property.descriptionAm : property.description}
            </p>
          </div>

          {/* UNLOCKED vs LOCKED CONTACT BOX */}
          {isUnlocked ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400/80 dark:border-emerald-700 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-extrabold text-base sm:text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t.ownerContactUnlocked}</span>
                </div>

                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black">
                  ✓ {currentLang === 'am' ? 'የተረጋገጠ ባለቤት' : 'Verified Direct Contact'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-white dark:bg-stone-800 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div>
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-medium block">{t.ownerName}</span>
                  <span className="font-bold text-stone-900 dark:text-white text-base">{property.ownerName}</span>
                </div>
                <div>
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-medium block">{t.ownerPhone}</span>
                  <span className="font-black text-emerald-700 dark:text-emerald-400 text-lg tracking-wider font-mono">{property.ownerPhone}</span>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-stone-100 dark:border-stone-700">
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-medium block">{t.exactLocation}</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200 text-sm">{property.exactLandmark}</span>
                </div>
              </div>

              {/* Direct Communication Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href={`tel:${property.ownerPhone}`}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t.callOwner}</span>
                </a>
                <a
                  href={`sms:${property.ownerPhone}`}
                  className="py-3 px-4 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t.smsOwner}</span>
                </a>
                <a
                  href={`https://t.me/+${telegramPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.telegramOwner}</span>
                </a>
              </div>
            </div>
          ) : (() => {
            // Check if user has an active package that covers this property's price range
            const matchingPackage = currentUser?.packages?.find(
              (p) =>
                p.remainingUnlocks > 0 &&
                (p.tierId === 'tier_unlimited' ||
                  (property.listingType === 'sale'
                    ? p.tierId === 'tier_sale' || p.maxPrice >= 500000
                    : property.price <= p.maxPrice))
            );

            if (matchingPackage) {
              return (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-600 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm sm:text-base">
                          {currentLang === 'am' ? 'የተከፈለ ንቁ ጥቅል አለዎት!' : 'Active Range Unlock Package!'}
                        </h4>
                        <p className="text-xs text-stone-600 dark:text-stone-300">
                          {currentLang === 'am'
                            ? `በዚህ የዋጋ ደረጃ ውስጥ ተጨማሪ ${matchingPackage.remainingUnlocks} ቤቶችን ያለተጨማሪ ክፍያ መክፈት ይችላሉ።`
                            : `You have ${matchingPackage.remainingUnlocks} remaining unlock credits for this similar price range.`}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs font-mono shadow-xs">
                      {matchingPackage.remainingUnlocks} {currentLang === 'am' ? 'ቀረ' : 'left'}
                    </div>
                  </div>

                  <button
                    id="btn-use-credit-unlock"
                    onClick={() => {
                      if (onUseCreditToUnlock) {
                        onUseCreditToUnlock(property);
                      }
                    }}
                    className="w-full py-4 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-base font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                    <span>
                      {currentLang === 'am'
                        ? `በ 1 ክሬዲት የባለቤቱን ስልክ ይክፈቱ (${matchingPackage.remainingUnlocks} ይቀራል)`
                        : `Use 1 Credit to Unlock Owner Contact (${matchingPackage.remainingUnlocks} remaining)`}
                    </span>
                  </button>
                </div>
              );
            }

            return (
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-stone-850 dark:to-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700/80 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                        {currentLang === 'am' ? 'የባለቤቱ ስልክ ቁጥር እና ትክክለኛ መገኛ ተቆልፏል' : 'Owner Phone & Exact Address are Locked'}
                      </h4>
                      <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm mt-1 leading-relaxed">
                        {currentLang === 'am'
                          ? `አንዴ ${houseUnlockFee} ብር በመክፈል ይህን ቤት ጨምሮ በተመሳሳይ የዋጋ ደረጃ ውስጥ ያሉ 5 ቤቶችን ይክፈቱ!`
                          : `Pay ${houseUnlockFee} ETB once to unlock 5 homes in this similar price range (this house + 4 more)!`}
                      </p>
                    </div>
                  </div>

                  {/* Direct Unlock Fee Badge */}
                  <div className="shrink-0 text-right">
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-sm font-black font-mono shadow-xs block">
                      {houseUnlockFee} {t.etb}
                    </span>
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block mt-0.5">
                      {currentLang === 'am' ? 'የ 5 ቤቶች ጥቅል' : '5 Homes Pack'}
                    </span>
                  </div>
                </div>

                {property.status === 'occupied' ? (
                  <div className="py-3 px-4 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold text-center">
                    {t.occupiedStatus} - {currentLang === 'am' ? 'ይህ ንብረት ተይዟል' : 'This listing is already taken'}
                  </div>
                ) : (
                  <button
                    id="btn-unlock-owner-contact"
                    onClick={() => {
                      onClose();
                      onOpenUnlockModal(property);
                    }}
                    className="w-full py-4 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-base font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-200" />
                    <span>
                      {currentLang === 'am'
                        ? `ይህን ቤት ይክፈቱ (በ ${houseUnlockFee} ብር 5 ቤቶችን የማየት ጥቅል)`
                        : `Unlock (5 Homes in this Range for ${houseUnlockFee} ETB)`}
                    </span>
                  </button>
                )}
              </div>
            );
          })()}

          {/* Anti-Poaching Notice & Report Broker CTA */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span>{currentLang === 'am' ? 'የዚህ ንብረት ባለቤት ነዎት?' : 'Are you the owner of this listing?'}</span>
              <button
                onClick={() => {
                  onClose();
                  onOpenOwnerPortalForThisHouse(property);
                }}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{currentLang === 'am' ? 'ተይዟል ይበሉ / ያድሱ' : 'Mark Occupied / Renew'}</span>
              </button>
            </div>

            {onOpenReportModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReportModal(property);
                }}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                title={t.reportBrokerBtn}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{t.reportBrokerBtn}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
