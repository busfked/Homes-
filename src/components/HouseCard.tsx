import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Bed, 
  Bath, 
  Clock, 
  Lock, 
  CheckCircle, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck,
  Building2,
  Car,
  Tractor,
  Fuel,
  Gauge,
  Calendar,
  Layers,
  Share2,
  Phone
} from 'lucide-react';
import { Property, Language, UserAccount } from '../types';
import { translations } from '../data/translations';
import { getDaysRemaining, getEligiblePackageForPrice, getPackageChoiceInfo } from '../utils/storage';
import { formatEtbPrice } from '../utils/pricing';
import { PROPERTY_TYPES, CAR_TYPES, MACHINERY_TYPES } from '../data/addisAreas';

interface HouseCardProps {
  property: Property;
  currentLang: Language;
  isUnlocked: boolean;
  currentUser?: UserAccount | null;
  onOpenDetails: (property: Property) => void;
  onOpenUnlockModal: (property: Property) => void;
  onUseCreditToUnlock?: (property: Property) => void;
  onOpenOwnerManageForProperty?: (property: Property) => void;
  onShare?: (property: Property) => void;
}

export const HouseCard: React.FC<HouseCardProps> = ({
  property,
  currentLang,
  isUnlocked,
  currentUser,
  onOpenDetails,
  onOpenUnlockModal,
  onUseCreditToUnlock,
  onShare,
}) => {
  const t = translations[currentLang];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Check if user has an active package covering this property's price range
  const eligiblePackage = !isUnlocked
    ? getEligiblePackageForPrice(currentUser, property.price, property.listingType)
    : null;
  const choiceInfo = eligiblePackage
    ? getPackageChoiceInfo(eligiblePackage.remainingUnlocks, eligiblePackage.totalPurchased || 5, currentLang)
    : null;

  const images = property.images && property.images.length > 0 ? property.images : [
    {
      url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80',
      originalSizeKb: 2000,
      compressedSizeKb: 60,
    },
  ];

  const totalCompressedSizeKb = images.reduce((acc, img) => acc + (img.compressedSizeKb || 50), 0);
  const { days, hours, isExpired, isWarningPeriod } = getDaysRemaining(property.expiresAt);

  const category = property.category || 'home';

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

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      id={`house-card-${property.id}`}
      onClick={() => onOpenDetails(property)}
      className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer relative"
    >
      {/* Top Media Container */}
      <div className="relative aspect-4/3 sm:aspect-16/10 bg-stone-100 dark:bg-stone-800 overflow-hidden">
        <img
          src={images[currentImageIndex]?.url}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          loading="lazy"
        />

        {/* Status & Category Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {/* Category Tag (Home / Car / Machinery) */}
          <span className="px-2.5 py-0.5 rounded-md bg-stone-950/85 text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-1 shadow-xs w-fit">
            {category === 'car' ? (
              <>
                <Car className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.carCategory}</span>
              </>
            ) : category === 'machinery' ? (
              <>
                <Tractor className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.machineryCategory}</span>
              </>
            ) : (
              <>
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.homeCategory}</span>
              </>
            )}
          </span>

          {/* Listing Type Tag (Rent / Sale) */}
          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold backdrop-blur-xs shadow-xs w-fit ${
            property.listingType === 'sale'
              ? 'bg-emerald-500 text-stone-950 font-black'
              : 'bg-blue-600 text-white'
          }`}>
            {property.listingType === 'sale' ? t.sale : t.rent}
          </span>

          {/* Status Badge */}
          {property.status === 'occupied' ? (
            <span className="px-2.5 py-0.8 rounded-md bg-stone-900/90 text-stone-100 text-xs font-bold backdrop-blur-xs flex items-center gap-1 shadow-xs w-fit">
              <CheckCircle className="w-3.5 h-3.5 text-stone-300" />
              <span>{t.occupiedStatus}</span>
            </span>
          ) : isExpired ? (
            <span className="px-2.5 py-0.8 rounded-md bg-rose-600/90 text-white text-xs font-bold backdrop-blur-xs flex items-center gap-1 shadow-xs w-fit">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t.expiredStatus}</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.8 rounded-md bg-emerald-600/90 text-white text-xs font-bold backdrop-blur-xs flex items-center gap-1 shadow-xs w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse"></span>
              <span>{t.activeStatus}</span>
            </span>
          )}

          {/* 5th or 6th Day Warning Badge for 7-Day Auto-Expiration */}
          {property.status === 'active' && isWarningPeriod && (
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-stone-950 text-[11px] font-extrabold backdrop-blur-xs flex items-center gap-1 shadow-xs animate-pulse w-fit">
              <Clock className="w-3 h-3" />
              <span>{currentLang === 'am' ? `ቀን ${7 - days} (ለማደስ ይጠበቃል)` : `Day ${7 - days} (Needs Renewal)`}</span>
            </span>
          )}
        </div>

        {/* Compression / Photo Count Badge & Quick Share */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          <span className="px-2 py-0.8 rounded-md bg-stone-900/80 text-white text-[11px] font-semibold backdrop-blur-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>{images.length} {t.photosCount} • {totalCompressedSizeKb} KB</span>
          </span>
          {onShare && (
            <button
              type="button"
              id={`share-btn-top-${property.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onShare(property);
              }}
              title={t.share || 'Share'}
              aria-label={t.share || 'Share'}
              className="p-1.5 rounded-md bg-stone-900/80 hover:bg-emerald-600 active:scale-95 text-white backdrop-blur-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-300" />
            </button>
          )}
        </div>

        {/* Photo Navigation Arrows if multiple photos */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              aria-label="Previous Photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs opacity-80 hover:opacity-100 transition-opacity z-10 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              aria-label="Next Photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs opacity-80 hover:opacity-100 transition-opacity z-10 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Carousel Dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-xs">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentImageIndex ? 'w-4 bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Area & Sub-Type Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>
                {currentLang === 'am' ? property.areaAm || property.area : property.area}
                {property.subCity && ` (${property.subCity})`}
              </span>
            </div>
            <span className="text-stone-600 dark:text-stone-300 text-xs font-medium bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
              {typeLabel}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base line-clamp-1 mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {currentLang === 'am' && property.titleAm ? property.titleAm : property.title}
          </h3>

          {/* Description snippet */}
          <p className="text-stone-600 dark:text-stone-400 text-xs line-clamp-2 mb-3 leading-relaxed">
            {currentLang === 'am' && property.descriptionAm ? property.descriptionAm : property.description}
          </p>

          {/* Price display row (visible to everyone) */}
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
                {currentLang === 'am' ? 'ዋጋ' : 'Price'}
              </span>
              <span className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
                {formatEtbPrice(property.price, property.pricePeriod, currentLang)}
              </span>
            </div>
            {property.listingType === 'sale' && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold">
                {currentLang === 'am' ? 'የሽያጭ ዋጋ' : 'For Sale'}
              </span>
            )}
          </div>

          {/* Specifications Bar (Dynamic by Category) */}
          <div className="flex items-center gap-3 text-xs font-semibold text-stone-600 dark:text-stone-300 mb-4 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800">
            {category === 'car' ? (
              <>
                {property.carYear && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{property.carYear}</span>
                  </div>
                )}
                {property.transmission && (
                  <>
                    <div className="w-px h-3.5 bg-stone-200 dark:bg-stone-700" />
                    <span className="capitalize">{property.transmission}</span>
                  </>
                )}
                {property.fuelType && (
                  <>
                    <div className="w-px h-3.5 bg-stone-200 dark:bg-stone-700" />
                    <div className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="capitalize">{property.fuelType}</span>
                    </div>
                  </>
                )}
              </>
            ) : category === 'machinery' ? (
              <>
                {property.machineryBrand && (
                  <div className="flex items-center gap-1 truncate max-w-[140px]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{property.machineryBrand}</span>
                  </div>
                )}
                {property.capacity && (
                  <>
                    <div className="w-px h-3.5 bg-stone-200 dark:bg-stone-700" />
                    <span>{property.capacity}</span>
                  </>
                )}
              </>
            ) : (
              // Homes
              <>
                <div className="flex items-center gap-1">
                  <Bed className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {property.bedrooms} {t.beds}
                  </span>
                </div>
                <div className="w-px h-3.5 bg-stone-200 dark:bg-stone-700" />
                <div className="flex items-center gap-1">
                  <Bath className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {property.bathrooms} {t.baths}
                  </span>
                </div>
                {property.areaSqMeters && (
                  <>
                    <div className="w-px h-3.5 bg-stone-200 dark:bg-stone-700" />
                    <span className="text-stone-700 dark:text-stone-300">
                      {property.areaSqMeters} m²
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer: Freshness Notice & Unlock CTA (Price hidden on dashboard as requested) */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.verifiedListing}</span>
            </div>

            {/* Remaining Days Counter */}
            <div className="text-right">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3 text-stone-400" />
                <span>
                  {isExpired
                    ? t.expiredStatus
                    : `${days}d ${hours}h ${currentLang === 'am' ? 'ይቀራል' : 'left'}`}
                </span>
              </span>
            </div>
          </div>

          {/* Action CTA Button with dynamic fee & Social Share */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              {isUnlocked ? (
                <a
                  href={`tel:${property.ownerPhone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  title="Call Owner directly"
                >
                  <Phone className="w-4 h-4 text-emerald-100 shrink-0" />
                  <span className="truncate">
                    {currentLang === 'am' ? 'ባለቤቱን ይደውሉ፦' : 'Call Owner:'} {property.ownerPhone}
                  </span>
                </a>
              ) : property.status === 'occupied' ? (
                <div className="w-full py-2.5 px-3 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-500 dark:text-stone-400 text-xs font-bold flex items-center justify-center gap-1.5">
                  <span>{t.occupiedStatus}</span>
                </div>
              ) : eligiblePackage && choiceInfo ? (
                <button
                  id={`credit-unlock-btn-${property.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onUseCreditToUnlock) {
                      onUseCreditToUnlock(property);
                    } else {
                      onOpenDetails(property);
                    }
                  }}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer border border-emerald-300 dark:border-emerald-500 animate-in fade-in"
                  title={choiceInfo.buttonLabel}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse shrink-0" />
                  <span className="truncate">{choiceInfo.buttonLabel}</span>
                </button>
              ) : (
                <button
                  id={`unlock-btn-${property.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenUnlockModal(property);
                  }}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-200" />
                  <span>
                    {property.listingType === 'sale'
                      ? t.unlockSaleContactBtn
                      : t.unlockRentContactBtn}
                  </span>
                </button>
              )}
            </div>

            {onShare && (
              <button
                type="button"
                id={`share-btn-bottom-${property.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(property);
                }}
                className="p-2.5 bg-stone-100 hover:bg-emerald-50 dark:bg-stone-800 dark:hover:bg-emerald-950/60 text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-xl border border-stone-200 dark:border-stone-700 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
                title={t.share || 'Share'}
                aria-label={t.share || 'Share'}
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

