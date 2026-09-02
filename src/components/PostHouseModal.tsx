import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Building2,
  Car,
  Tractor,
  KeyRound,
  Clock,
  CreditCard,
  Copy,
  CheckCircle2,
  FileCheck,
  Camera,
  Trash2,
} from 'lucide-react';
import {
  Property,
  Language,
  CategoryType,
  PropertyType,
  ListingType,
  PropertyImage,
  PaymentMethod,
} from '../types';
import {
  ADDIS_AREAS,
  PROPERTY_TYPES,
  CAR_TYPES,
  MACHINERY_TYPES,
} from '../data/addisAreas';
import { translations } from '../data/translations';
import { compressImage, formatFileSize } from '../utils/imageCompressor';
import { getStoredSettings } from '../utils/storage';
import { calculateOwnerListingFee, formatEtbPrice } from '../utils/pricing';

interface PostHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  onAddProperty: (newProp: Property) => void;
}

export const PostHouseModal: React.FC<PostHouseModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onAddProperty,
}) => {
  if (!isOpen) return null;

  const t = translations[currentLang];
  const adminSettings = getStoredSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sellerReceiptInputRef = useRef<HTMLInputElement>(null);
  const nationalIdInputRef = useRef<HTMLInputElement>(null);

  // Category & Listing Type
  const [category, setCategory] = useState<CategoryType>('home');
  const [listingType, setListingType] = useState<ListingType>('rent');

  // Common Form states
  const [title, setTitle] = useState('');
  const [titleAm, setTitleAm] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAm, setDescriptionAm] = useState('');
  const [area, setArea] = useState('Bole');
  const [isCustomArea, setIsCustomArea] = useState(false);
  const [customAreaText, setCustomAreaText] = useState('');
  const [exactLandmark, setExactLandmark] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [pricePeriod, setPricePeriod] = useState<'month' | 'day' | 'total'>('month');

  // Home-specific specs
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(1);
  const [areaSqMeters, setAreaSqMeters] = useState<number | ''>('');

  // Car-specific specs
  const [carType, setCarType] = useState('suv');
  const [carMake, setCarMake] = useState('Toyota');
  const [carModel, setCarModel] = useState('RAV4');
  const [carYear, setCarYear] = useState<number | ''>(2021);
  const [carTransmission, setCarTransmission] = useState<'automatic' | 'manual'>('automatic');
  const [carFuel, setCarFuel] = useState<'petrol' | 'diesel' | 'hybrid' | 'electric'>('petrol');
  const [carMileage, setCarMileage] = useState<number | ''>('');

  // Machinery-specific specs
  const [machineryType, setMachineryType] = useState('excavator');
  const [machineryBrand, setMachineryBrand] = useState('Caterpillar');
  const [machineryModel, setMachineryModel] = useState('320D');
  const [machineryCapacity, setMachineryCapacity] = useState('20 Tons');
  const [machineryHours, setMachineryHours] = useState<number | ''>('');

  // Owner details
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [nationalIdImage, setNationalIdImage] = useState<string | null>(null);
  const [nationalIdSizeKb, setNationalIdSizeKb] = useState<number>(0);

  // Seller listing fee payment
  const [sellerPaymentMethod, setSellerPaymentMethod] = useState<PaymentMethod>('telebirr');
  const [sellerReceiptImage, setSellerReceiptImage] = useState<string | null>(null);
  const [sellerReceiptRef, setSellerReceiptRef] = useState('');
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // Photos & Compression tracking
  const [uploadedImages, setUploadedImages] = useState<PropertyImage[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionReports, setCompressionReports] = useState<
    { originalSizeKb: number; compressedSizeKb: number; savingsPercent: number }[]
  >([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Copy bank details helper
  const handleCopyAccount = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(type);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  // Handle Photo Upload & Canvas Compression
  const handlePhotoSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ ቢበዛ ከ 2 እስከ 4 ፎቶዎችን ብቻ ያስገቡ።'
          : 'Please select 2 to 3 photos (maximum 4 photos).'
      );
      return;
    }

    setIsCompressing(true);
    setErrorMsg('');

    try {
      const newImages: PropertyImage[] = [];
      const newReports: typeof compressionReports = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        // Fast canvas compression down to ~40-75KB
        const result = await compressImage(file, 1200, 900, 0.72);

        newImages.push({
          url: result.dataUrl,
          originalSizeKb: result.originalSizeKb,
          compressedSizeKb: result.compressedSizeKb,
        });

        newReports.push({
          originalSizeKb: result.originalSizeKb,
          compressedSizeKb: result.compressedSizeKb,
          savingsPercent: result.savingsPercent,
        });
      }

      setUploadedImages((prev) => [...prev, ...newImages]);
      setCompressionReports((prev) => [...prev, ...newReports]);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        currentLang === 'am'
          ? 'ፎቶዎቹን በማዘጋጀት ላይ ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።'
          : 'Error compressing images. Please try again.'
      );
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle Seller 500 ETB Listing Receipt
  const handleSellerReceiptSelect = async (file: File | null) => {
    if (!file) return;
    try {
      const result = await compressImage(file, 1000, 1000, 0.7);
      setSellerReceiptImage(result.dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle National ID Front Photo (Mandatory for owner safety & anti-fraud)
  const handleNationalIdSelect = async (file: File | null) => {
    if (!file) return;
    try {
      setIsCompressing(true);
      const result = await compressImage(file, 1000, 800, 0.72);
      setNationalIdImage(result.dataUrl);
      setNationalIdSizeKb(result.compressedSizeKb);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        currentLang === 'am'
          ? 'የመታወቂያ ፎቶውን በማዘጋጀት ላይ ስህተት ተፈጥሯል።'
          : 'Error compressing National ID photo.'
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhoto = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setCompressionReports((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadedImages.length < 2) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ ቢያንስ 2 ፎቶዎችን ያስገቡ።'
          : 'Please upload at least 2 photos (2-3 recommended).'
      );
      return;
    }

    if (!nationalIdImage) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ የባለቤትነት ማረጋገጫ የመታወቂያ ፊት ፎቶ (National ID Front Photo) ያስገቡ።'
          : 'Please upload your National ID front photo for safety & owner verification.'
      );
      return;
    }

    if (!price || Number(price) <= 0) {
      setErrorMsg(
        currentLang === 'am' ? 'እባክዎ ትክክለኛ ዋጋ ያስገቡ።' : 'Please provide a valid price.'
      );
      return;
    }

    if (!ownerPhone.trim() || ownerPhone.trim().length < 9) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ።'
          : 'Please enter a valid owner phone number.'
      );
      return;
    }

    if (!ownerPin.trim() || ownerPin.trim().length < 4) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ 4 አሃዝ ሚስጥር ቁጥር (PIN) ያስገቡ።'
          : 'Please provide a 4-digit PIN for future deal management.'
      );
      return;
    }

    if (!exactLandmark.trim()) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ ዝርዝር ምልክት እና ትክክለኛ አድራሻ ያስገቡ።'
          : 'Please provide exact landmark details.'
      );
      return;
    }

    // Tiered Listing Fee calculation
    const calculatedListingFee = calculateOwnerListingFee(Number(price) || 0, listingType, category);

    // Validate listing fee payment screenshot or reference
    if (!sellerReceiptImage && !sellerReceiptRef.trim()) {
      setErrorMsg(
        currentLang === 'am'
          ? `እባክዎ የ ${calculatedListingFee} ብር የማስመዝገቢያ ክፍያ ስክሪንሽት ወይም የግብይት ቁጥር ያስገቡ።`
          : `Please attach your ${calculatedListingFee} ETB listing fee payment screenshot or reference number.`
      );
      return;
    }

    // Validate custom area if enabled
    const finalArea = isCustomArea ? customAreaText.trim() : area.trim();
    if (!finalArea) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ የሰፈሩን ወይም የአካባቢውን ስም ያስገቡ (ለምሳሌ፦ አጠና ተራ፣ ሸጎሌ፣ ወለተ...)።'
          : 'Please enter the neighborhood/area name (e.g. Atenatera, Shegole, Welete...).'
      );
      return;
    }

    const areaObj = ADDIS_AREAS.find(
      (a) => a.nameEn.toLowerCase() === finalArea.toLowerCase() || a.nameAm === finalArea
    );
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days lifecycle

    // Generate smart title if not provided
    let autoTitle = title.trim();
    let autoTitleAm = titleAm.trim();

    if (!autoTitle) {
      if (category === 'home') {
        autoTitle = `${bedrooms} Bedroom ${propertyType} in ${finalArea}`;
        autoTitleAm = `ባለ ${bedrooms} መኝታ ${propertyType} ${areaObj?.nameAm || finalArea}`;
      } else if (category === 'car') {
        autoTitle = `${carYear || ''} ${carMake} ${carModel} (${carTransmission}) in ${finalArea}`.trim();
        autoTitleAm = `${carYear || ''} ${carMake} ${carModel} ${areaObj?.nameAm || finalArea}`.trim();
      } else {
        autoTitle = `${machineryBrand} ${machineryModel} ${machineryType} in ${finalArea}`;
        autoTitleAm = `${machineryBrand} ${machineryModel} ${machineryType} ${areaObj?.nameAm || finalArea}`;
      }
    }

    const newProperty: Property = {
      id: `prop-${Date.now().toString(36)}`,
      category: category,
      title: autoTitle,
      titleAm: autoTitleAm || autoTitle,
      description: description.trim() || `Available in ${finalArea} area.`,
      descriptionAm: descriptionAm.trim() || `${areaObj?.nameAm || finalArea} ውስጥ የሚገኝ ንብረት።`,
      area: finalArea,
      areaAm: areaObj?.nameAm || finalArea,
      subCity: areaObj?.subCityEn || 'Addis Ababa',
      exactLandmark: exactLandmark.trim(),
      listingType: listingType,
      price: Number(price),
      pricePeriod: listingType === 'rent' ? pricePeriod : 'total',
      sellerListingFeeBirr: calculatedListingFee,
      sellerPaymentScreenshotUrl: sellerReceiptImage || undefined,
      sellerPaymentMethod: sellerPaymentMethod,
      sellerTransactionRef: sellerReceiptRef.trim() || undefined,
      status: 'pending', // Sent to admin for screenshot verification
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      viewCount: 0,
      unlockCount: 0,
      images: uploadedImages.length > 0 ? uploadedImages : [],
      nationalIdFrontUrl: nationalIdImage || undefined,
      nationalIdSizeKb: nationalIdSizeKb || undefined,
      ownerName: ownerName.trim() || 'Owner',
      ownerPhone: ownerPhone.trim(),
      ownerPin: ownerPin.trim(),
      // Home
      propertyType: category === 'home' ? propertyType : undefined,
      bedrooms: category === 'home' ? Number(bedrooms) : undefined,
      bathrooms: category === 'home' ? Number(bathrooms) : undefined,
      areaSqMeters: category === 'home' && areaSqMeters ? Number(areaSqMeters) : undefined,

      // Car
      carType: category === 'car' ? (carType as any) : undefined,
      carMake: category === 'car' ? carMake : undefined,
      carModel: category === 'car' ? carModel : undefined,
      carYear: category === 'car' && carYear ? Number(carYear) : undefined,
      transmission: category === 'car' ? carTransmission : undefined,
      fuelType: category === 'car' ? (carFuel === 'petrol' ? 'benzine' : carFuel) : undefined,
      mileageKm: category === 'car' && carMileage ? Number(carMileage) : undefined,

      // Machinery
      machineryType: category === 'machinery' ? (machineryType as any) : undefined,
      machineryBrand: category === 'machinery' ? machineryBrand : undefined,
      capacity: category === 'machinery' ? machineryCapacity : undefined,
      operatingHours: category === 'machinery' && machineryHours ? Number(machineryHours) : undefined,
    };

    onAddProperty(newProperty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div
        id="post-house-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[94vh]"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-850">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.postTitle}</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">{t.postSubtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-7 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. CATEGORY SELECTION: HOME / CAR / MACHINERY */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-200">
              {t.selectCategory} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setCategory('home')}
                className={`py-3 px-3 rounded-2xl border text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer ${
                  category === 'home'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.01]'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-emerald-400'
                }`}
              >
                <Building2 className="w-5 h-5 shrink-0" />
                <span>{t.catHome}</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('car')}
                className={`py-3 px-3 rounded-2xl border text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer ${
                  category === 'car'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.01]'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-emerald-400'
                }`}
              >
                <Car className="w-5 h-5 shrink-0" />
                <span>{t.catCar}</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('machinery')}
                className={`py-3 px-3 rounded-2xl border text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer ${
                  category === 'machinery'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.01]'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-emerald-400'
                }`}
              >
                <Tractor className="w-5 h-5 shrink-0" />
                <span>{t.catMachinery}</span>
              </button>
            </div>
          </div>

          {/* 7-Day Auto-Expiry & Free Tier Storage Notice */}
          <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <p className="font-bold">{t.autoExpiryWarning}</p>
              <p className="text-emerald-800/90 dark:text-emerald-300 text-[11px]">
                {currentLang === 'am'
                  ? 'ከ 5 ወይም 6 ቀናት በኋላ በባለቤት ማኔጀር ውስጥ "አሁንም አለ" የሚለውን በመጫን ለተጨማሪ 7 ቀናት ማደስ ይችላሉ።'
                  : 'On day 5 or 6, visit the Owner Portal and click "Still Available" to renew for 7 more days.'}
              </p>
            </div>
          </div>

          {/* 2. PHOTO UPLOADER (2-3 Photos with Canvas Compression) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-stone-900 dark:text-stone-100">
                {t.housePhotos} <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                {uploadedImages.length} / 4 {t.photosCount}
              </span>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handlePhotoSelect(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-emerald-300 dark:border-emerald-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/60 rounded-2xl p-6 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handlePhotoSelect(e.target.files)}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
                {currentLang === 'am' ? '2 ወይም 3 ፎቶዎችን ይምረጡ' : 'Select 2 or 3 photos'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{t.uploadPhotosDesc}</p>
            </div>

            {/* Compressing Progress */}
            {isCompressing && (
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2 animate-pulse">
                <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400 animate-spin" />
                <span>{t.compressingStatus}</span>
              </div>
            )}

            {/* Uploaded & Compressed Photos Thumbnails with stats */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {uploadedImages.map((img, idx) => {
                  const rep = compressionReports[idx];
                  return (
                    <div
                      key={idx}
                      className="relative bg-stone-100 dark:bg-stone-800 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 p-1.5 flex flex-col justify-between"
                    >
                      <div className="aspect-4/3 rounded-lg overflow-hidden relative">
                        <img src={img.url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-xs hover:bg-rose-700 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>

                      {rep && (
                        <div className="mt-1.5 text-[10px] text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 p-1 rounded-md border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                          <span className="text-stone-400 line-through">
                            {formatFileSize(rep.originalSizeKb)}
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ➔ {formatFileSize(rep.compressedSizeKb)}
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            (-{rep.savingsPercent}%)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. AREA & LISTING TYPE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                  {isCustomArea ? t.customAreaLabel : t.selectArea}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomArea(!isCustomArea);
                    if (!isCustomArea && !customAreaText) {
                      setCustomAreaText(area);
                    }
                  }}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  {isCustomArea ? t.selectFromListToggle : t.customAreaToggle}
                </button>
              </div>

              {isCustomArea ? (
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <input
                    type="text"
                    required
                    value={customAreaText}
                    onChange={(e) => setCustomAreaText(e.target.value)}
                    placeholder={t.customAreaPlaceholder}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 dark:bg-stone-800 border-2 border-emerald-500/60 dark:border-emerald-500/60 rounded-xl text-sm font-semibold text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-stone-400 placeholder:text-xs"
                  />
                  <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">
                    {currentLang === 'am' ? '💡 ማንኛውንም የአዲስ አበባ ሰፈር ወይም መንደር እዚህ መጻፍ ይችላሉ' : '💡 You can write any Addis neighborhood or local sefer here'}
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <select
                    value={area}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomArea(true);
                      } else {
                        setArea(e.target.value);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {ADDIS_AREAS.map((a) => (
                      <option key={a.id} value={a.nameEn}>
                        {currentLang === 'am' ? a.nameAm : a.nameEn} ({a.subCityEn})
                      </option>
                    ))}
                    <option value="__custom__">✍️ {t.customAreaToggle}...</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                {t.filterListingType}
              </label>
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value as ListingType)}
                className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="rent">{t.rent} (Free Listing)</option>
                <option value="sale">{t.sale} (500 ETB Listing Fee)</option>
              </select>
            </div>
          </div>

          {/* 4. DYNAMIC SPECIFICATION FIELDS PER CATEGORY */}
          {category === 'home' && (
            <div className="p-4 bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-4">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>House Specifications</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.houseType}
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-900 dark:text-white"
                  >
                    {PROPERTY_TYPES.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {currentLang === 'am' ? pt.nameAm : pt.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                      {t.beds}
                    </label>
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(Number(e.target.value))}
                      className="w-full px-2 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-900 dark:text-white"
                    >
                      <option value={0}>Studio (0)</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                      {t.baths}
                    </label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      className="w-full px-2 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-900 dark:text-white"
                    >
                      <option value={0}>0 ({t.zeroBathrooms || 'Shared / None'})</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                      m²
                    </label>
                    <input
                      type="number"
                      value={areaSqMeters}
                      onChange={(e) => setAreaSqMeters(e.target.value ? Number(e.target.value) : '')}
                      placeholder="120"
                      className="w-full px-2 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {category === 'car' && (
            <div className="p-4 bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-4">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-4 h-4 text-emerald-600" />
                <span>Vehicle Specifications</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.carType}
                  </label>
                  <select
                    value={carType}
                    onChange={(e) => setCarType(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-white"
                  >
                    {CAR_TYPES.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {currentLang === 'am' ? ct.nameAm : ct.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.carMake}
                  </label>
                  <input
                    type="text"
                    required
                    value={carMake}
                    onChange={(e) => setCarMake(e.target.value)}
                    placeholder="e.g. Toyota / Hyundai"
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.carModel}
                  </label>
                  <input
                    type="text"
                    required
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    placeholder="e.g. RAV4 / Tucson"
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.carYear}
                  </label>
                  <input
                    type="number"
                    value={carYear}
                    onChange={(e) => setCarYear(e.target.value ? Number(e.target.value) : '')}
                    placeholder="2022"
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.carTransmission}
                  </label>
                  <select
                    value={carTransmission}
                    onChange={(e) => setCarTransmission(e.target.value as 'automatic' | 'manual')}
                    className="w-full px-2.5 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-white"
                  >
                    <option value="automatic">{t.transmissionAuto}</option>
                    <option value="manual">{t.transmissionManual}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.carFuel}
                  </label>
                  <select
                    value={carFuel}
                    onChange={(e) =>
                      setCarFuel(e.target.value as 'petrol' | 'diesel' | 'hybrid' | 'electric')
                    }
                    className="w-full px-2.5 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-white"
                  >
                    <option value="petrol">{t.fuelPetrol}</option>
                    <option value="diesel">{t.fuelDiesel}</option>
                    <option value="hybrid">{t.fuelHybrid}</option>
                    <option value="electric">{t.fuelElectric}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.carMileage}
                  </label>
                  <input
                    type="number"
                    value={carMileage}
                    onChange={(e) => setCarMileage(e.target.value ? Number(e.target.value) : '')}
                    placeholder="35000 km"
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'machinery' && (
            <div className="p-4 bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-4">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                <Tractor className="w-4 h-4 text-emerald-600" />
                <span>Heavy Machinery Specifications</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.machineryType}
                  </label>
                  <select
                    value={machineryType}
                    onChange={(e) => setMachineryType(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-white"
                  >
                    {MACHINERY_TYPES.map((mt) => (
                      <option key={mt.id} value={mt.id}>
                        {currentLang === 'am' ? mt.nameAm : mt.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.machineryBrand}
                  </label>
                  <input
                    type="text"
                    required
                    value={machineryBrand}
                    onChange={(e) => setMachineryBrand(e.target.value)}
                    placeholder="e.g. Caterpillar / Komatsu"
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.machineryModel}
                  </label>
                  <input
                    type="text"
                    value={machineryModel}
                    onChange={(e) => setMachineryModel(e.target.value)}
                    placeholder="e.g. 320D / PC200"
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.machineryCapacity}
                  </label>
                  <input
                    type="text"
                    value={machineryCapacity}
                    onChange={(e) => setMachineryCapacity(e.target.value)}
                    placeholder="e.g. 20 Tons / 3.0 m³"
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="number"
                    value={machineryHours}
                    onChange={(e) => setMachineryHours(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 4500 hrs"
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. PRICE FIELD */}
          <div>
            <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
              {t.priceInBirr} <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 35000"
                className="flex-1 px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-black text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
              <span className="px-3 py-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 rounded-xl text-xs font-extrabold shrink-0">
                {t.etb} {listingType === 'rent' ? t.perMonth : ''}
              </span>
            </div>
          </div>

          {/* 6. OPTIONAL TITLE & DESCRIPTION */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                {currentLang === 'am' ? 'ርዕስ (አማርኛ ወይም እንግሊዝኛ - አውቶማቲክ ይሞላል)' : 'Listing Title (Optional - Auto Generated)'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Auto generated based on selected specs"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                {t.descriptionLabel}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descPlaceholder}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 7. TIERED OWNER LISTING FEE NOTICE */}
          {(() => {
            const calculatedFee = calculateOwnerListingFee(Number(price) || 0, listingType, category);
            return (
              <div className="p-4 sm:p-5 bg-emerald-500/10 dark:bg-emerald-950/40 border-2 border-emerald-500/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                      {t.sellerListingFeeTitle || 'Owner Listing Fee (Tiered Schedule)'}
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black shadow-xs">
                    {calculatedFee} ETB
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 text-xs space-y-1">
                  <p className="font-bold text-stone-900 dark:text-white">
                    {currentLang === 'am' ? 'የክፍያ ተመን ሰንጠረዥ (Tier Schedule):' : 'Tiered Pricing Breakdown:'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] text-stone-600 dark:text-stone-300 pt-1">
                    <span className={`p-1 rounded ${calculatedFee === 150 ? 'bg-emerald-100 dark:bg-emerald-900/60 font-black text-emerald-800 dark:text-emerald-200 border border-emerald-500' : ''}`}>
                      ≤ 15k ➔ <b>150 ብር</b>
                    </span>
                    <span className={`p-1 rounded ${calculatedFee === 250 ? 'bg-emerald-100 dark:bg-emerald-900/60 font-black text-emerald-800 dark:text-emerald-200 border border-emerald-500' : ''}`}>
                      15k - 35k ➔ <b>250 ብር</b>
                    </span>
                    <span className={`p-1 rounded ${calculatedFee === 350 ? 'bg-emerald-100 dark:bg-emerald-900/60 font-black text-emerald-800 dark:text-emerald-200 border border-emerald-500' : ''}`}>
                      35k - 75k ➔ <b>350 ብር</b>
                    </span>
                    <span className={`p-1 rounded ${calculatedFee === 500 ? 'bg-emerald-100 dark:bg-emerald-900/60 font-black text-emerald-800 dark:text-emerald-200 border border-emerald-500' : ''}`}>
                      &gt; 75k / Sale ➔ <b>500 ብር</b>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {currentLang === 'am'
                    ? `ለዚህ ንብረት (${Number(price) > 0 ? Number(price).toLocaleString() + ' ብር' : 'የተመረጠው ዋጋ'}) የማስመዝገቢያ ክፍያ ${calculatedFee} ብር ነው። ክፍያውን ፈጽመው ስክሪንሽት ያስገቡ። አድሚኑ እንዳረጋገጠ ወዲያውኑ ይለጠፋል።`
                    : `Listing fee for this price (${Number(price) > 0 ? Number(price).toLocaleString() + ' ETB' : 'entered price'}) is ${calculatedFee} ETB. Please upload transfer screenshot.`}
                </p>

                {/* Bank Accounts Mini Box with Telebirr, CBE, and Bank of Abyssinia (BOA) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-bold">Telebirr (ቴሌብር)</span>
                      <span className="font-mono font-black text-stone-900 dark:text-white text-xs">
                        {adminSettings.telebirrNumber || '0991154337'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(adminSettings.telebirrNumber || '0991154337', 'telebirr')}
                      className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-lg text-stone-700 dark:text-stone-300 cursor-pointer"
                      title="Copy"
                    >
                      {copiedBank === 'telebirr' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-bold">CBE (ንግድ ባንክ)</span>
                      <span className="font-mono font-black text-stone-900 dark:text-white text-xs">
                        {adminSettings.cbeAccount || '1000131638128'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(adminSettings.cbeAccount || '1000131638128', 'cbe')}
                      className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-lg text-stone-700 dark:text-stone-300 cursor-pointer"
                      title="Copy"
                    >
                      {copiedBank === 'cbe' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-bold">BOA (አቢሲኒያ ባንክ)</span>
                      <span className="font-mono font-black text-stone-900 dark:text-white text-xs">
                        {adminSettings.boaAccount || '61648817'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(adminSettings.boaAccount || '61648817', 'boa')}
                      className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-lg text-stone-700 dark:text-stone-300 cursor-pointer"
                      title="Copy"
                    >
                      {copiedBank === 'boa' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Receipt Upload / Ref */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                      {t.sellerReceiptUpload || 'Upload Payment Screenshot *'}
                    </label>
                    <input
                      ref={sellerReceiptInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSellerReceiptSelect(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => sellerReceiptInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{sellerReceiptImage ? '✓ Receipt Attached' : t.uploadReceiptBtn}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                      {t.refOptional}
                    </label>
                    <input
                      type="text"
                      value={sellerReceiptRef}
                      onChange={(e) => setSellerReceiptRef(e.target.value)}
                      placeholder="e.g. FT260812345"
                      className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 8. OWNER CONTACT & NATIONAL ID VERIFICATION & SECRET PIN */}
          <div className="p-4 sm:p-5 bg-stone-100/80 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t.protectedOwnerInfoTitle}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {t.ownerNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Ato Abebe / ወ/ሮ አልማዝ"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-xl text-sm font-semibold text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {t.ownerPhoneLabel}
                </label>
                <input
                  type="tel"
                  required
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="0911223344"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                {t.exactLandmarkLabel}
              </label>
              <input
                type="text"
                required
                value={exactLandmark}
                onChange={(e) => setExactLandmark(e.target.value)}
                placeholder={t.landmarkPlaceholder}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-xl text-xs sm:text-sm font-medium text-stone-900 dark:text-white"
              />
            </div>

            {/* MANDATORY NATIONAL ID FRONT PHOTO UPLOAD */}
            <div className="p-3.5 bg-white dark:bg-stone-900 rounded-xl border-2 border-emerald-500/30 dark:border-emerald-700/40 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <label className="block text-xs font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.nationalIdLabel || 'National ID Front Photo *'}</span>
                  </label>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {t.nationalIdDesc || 'Upload a clear photo of the front of your National ID (Kebele / Fayda / Passport) for owner verification.'}
                  </p>
                </div>
                {nationalIdImage && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                    {nationalIdSizeKb} KB
                  </span>
                )}
              </div>

              <input
                ref={nationalIdInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleNationalIdSelect(e.target.files?.[0] || null)}
                className="hidden"
              />

              {nationalIdImage ? (
                <div className="flex items-center gap-3 p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                  <img
                    src={nationalIdImage}
                    alt="National ID Front"
                    className="w-16 h-12 object-cover rounded-lg border border-stone-300 dark:border-stone-600 shadow-2xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">
                      {t.nationalIdAttached || '✓ National ID Front Photo Attached'}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {currentLang === 'am' ? 'ባለቤትነት ተረጋግጧል' : 'Ready for admin verification'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNationalIdImage(null);
                      setNationalIdSizeKb(0);
                    }}
                    className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => nationalIdInputRef.current?.click()}
                  className="w-full py-3 px-4 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-750 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.uploadNationalIdBtn || 'Upload National ID Front Photo (የመታወቂያ ፊት ፎቶ)'}</span>
                </button>
              )}
            </div>

            {/* 4-Digit Management PIN */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
              <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.ownerPinLabel}</span>
              </label>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-2">{t.ownerPinDesc}</p>
              <input
                type="password"
                maxLength={6}
                required
                value={ownerPin}
                onChange={(e) => setOwnerPin(e.target.value)}
                placeholder="e.g. 1234"
                className="w-40 px-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-xl text-sm font-mono font-bold tracking-widest text-center text-stone-900 dark:text-white"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="submit-property-btn"
              type="submit"
              disabled={isCompressing}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl text-base font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              <span>{t.submitListingBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
