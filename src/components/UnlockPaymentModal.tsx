import React, { useState, useRef } from 'react';
import { X, Copy, Check, Upload, ShieldCheck, AlertCircle, Sparkles, Building2, Phone, CreditCard, ShieldAlert, Ban, Layers, UserCheck, KeyRound } from 'lucide-react';
import { Property, Language, PaymentMethod, UnlockRequest, PaymentSettings, UserAccount } from '../types';
import { translations } from '../data/translations';
import { compressImage } from '../utils/imageCompressor';
import { isPhoneBanned } from '../utils/storage';
import { USER_PACKAGE_TIERS, getUserPackageTierForHousePrice } from '../utils/pricing';

interface UnlockPaymentModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  paymentSettings: PaymentSettings;
  userPhone: string;
  currentUser?: UserAccount | null;
  onOpenUserAuthModal?: () => void;
  onUseCredit?: (property: Property) => void;
  onSubmitUnlockRequest: (request: UnlockRequest) => void;
}

export const UnlockPaymentModal: React.FC<UnlockPaymentModalProps> = ({
  property,
  isOpen,
  onClose,
  currentLang,
  paymentSettings,
  userPhone,
  currentUser,
  onOpenUserAuthModal,
  onUseCredit,
  onSubmitUnlockRequest,
}) => {
  if (!isOpen || !property) return null;

  const t = translations[currentLang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggested tier for this house's price
  const suggestedTier = getUserPackageTierForHousePrice(property.price);

  // Single unlock base fee
  const singleUnlockFee =
    property.listingType === 'sale'
      ? paymentSettings.feeAmountSaleBirr || 500
      : paymentSettings.feeAmountRentBirr || 100;

  const [unlockMode, setUnlockMode] = useState<'package' | 'single'>('package');
  const [selectedTierId, setSelectedTierId] = useState<string>(suggestedTier.id);

  const selectedTier = USER_PACKAGE_TIERS.find((tier) => tier.id === selectedTierId) || suggestedTier;
  const effectiveFee = unlockMode === 'package' ? selectedTier.packagePriceBirr : singleUnlockFee;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('telebirr');
  const [buyerName, setBuyerName] = useState(currentUser?.name || '');
  const [buyerPhone, setBuyerPhone] = useState(currentUser?.phone || userPhone || '');
  const [buyerPin, setBuyerPin] = useState(currentUser?.pin || '');
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState('');
  const [screenshotSizeKb, setScreenshotSizeKb] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hasAgreedAntiDelala, setHasAgreedAntiDelala] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false);

  // Check if current phone is banned
  const isBanned = isPhoneBanned(buyerPhone);

  // Copy helper
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle Screenshot Upload with Instant Canvas Compression
  const handleScreenshotUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ ትክክለኛ የፎቶ ፋይል ይምረጡ።'
          : 'Please select a valid image file.'
      );
      return;
    }

    setIsCompressing(true);
    setErrorMsg('');

    try {
      // Compress screenshot to ~35-65KB
      const result = await compressImage(file, 900, 1200, 0.7);
      setScreenshotDataUrl(result.dataUrl);
      setScreenshotSizeKb(result.compressedSizeKb);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process screenshot image');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerPhone.trim() || buyerPhone.trim().length < 9) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ ትክክለኛ ስልክ ቁጥርዎን ያስገቡ።'
          : 'Please enter your valid phone number.'
      );
      return;
    }

    if (isPhoneBanned(buyerPhone)) {
      setErrorMsg(t.bannedAccountAlert);
      return;
    }

    if (!hasAgreedAntiDelala) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ የደላላ እና የማጭበርበር መከላከያ ደንቡን በማንበብ መስማማትዎን ያረጋግጡ።'
          : 'Please accept the Anti-Broker & Anti-Poaching terms to continue.'
      );
      return;
    }

    if (!screenshotDataUrl) {
      setErrorMsg(
        currentLang === 'am'
          ? `እባክዎ የ ${effectiveFee} ብር የክፍያ ስክሪንሽት ያስገቡ።`
          : `Please upload your ${effectiveFee} ETB payment screenshot.`
      );
      return;
    }

    const newRequest: UnlockRequest = {
      id: `req-${Date.now().toString(36)}`,
      type: unlockMode === 'package' ? 'package_purchase' : 'single_unlock',
      packageTierId: unlockMode === 'package' ? selectedTier.id : undefined,
      maxHousePrice: unlockMode === 'package' ? selectedTier.maxPrice : property.price,
      remainingUnlocks: unlockMode === 'package' ? selectedTier.totalUnlocks : 1,
      propertyId: property.id,
      propertyTitle: property.title,
      propertyArea: property.area,
      buyerName: buyerName.trim() || 'Buyer / Renter',
      buyerPhone: buyerPhone.trim(),
      paymentMethod: paymentMethod,
      transactionRef: transactionRef.trim() || `TXN-${Date.now().toString().slice(-6)}`,
      screenshotUrl: screenshotDataUrl,
      screenshotSizeKb: screenshotSizeKb,
      status: 'pending',
      amountBirr: effectiveFee,
      createdAt: new Date().toISOString(),
    };

    onSubmitUnlockRequest(newRequest);
    setIsSuccessSubmitted(true);
  };


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div
        id="unlock-payment-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[94vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
                {unlockMode === 'package' ? (currentLang === 'am' ? 'የ 5 ቤቶች ጥቅል መግዣ' : '5-House Package Purchase') : t.unlockModalTitle} ({effectiveFee} {t.etb})
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {unlockMode === 'package'
                  ? (currentLang === 'am'
                      ? `በ ${effectiveFee} ብር 5 የተለያዩ ቤቶች ሙሉ አድራሻ እና ስልክ ይክፈቱ (ለስልክዎ ብቻ)`
                      : `Get direct owner contact info for 5 houses for ${effectiveFee} ETB (tied to your login)`)
                  : (currentLang === 'am'
                      ? `የ ${effectiveFee} ብር ክፍያ በቴሌብር ወይም በባንክ ፈጽመው ስክሪንሽት ያስገቡ።`
                      : `Transfer ${effectiveFee} ETB via Telebirr or Bank & upload receipt.`)}
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

        {isSuccessSubmitted ? (
          /* SUCCESS STATE */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100">
              {currentLang === 'am' ? 'ስክሪንሽቱ በተሳካ ሁኔታ ተልኳል!' : 'Screenshot Submitted!'}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
              {unlockMode === 'package'
                ? (currentLang === 'am'
                    ? `የ ${effectiveFee} ብር የ 5 ቤቶች ጥቅል ክፍያዎ ለአድሚን ተልኳል። አድሚኑ እንደፈተሸው 5 የቤት መክፈቻ ክሬዲት ለስልክዎ (${buyerPhone}) ይገባል።`
                    : `Your ${effectiveFee} ETB payment for 5 house unlocks was sent. Once approved, 5 house unlock credits will be added to your account (${buyerPhone}).`)
                : (currentLang === 'am'
                    ? `የ ${effectiveFee} ብር ክፍያዎ ለአድሚን ተልኳል። አድሚኑ እንደፈተሸው (በጥቂት ደቂቃዎች ውስጥ) የባለቤቱ ስልክ ቁጥር ለስልክዎ (${buyerPhone}) ይከፈታል።`
                    : `Your ${effectiveFee} ETB receipt is sent to the admin. Once approved, the owner contact unlocks instantly for your phone (${buyerPhone}).`)}
            </p>

            <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-4 rounded-2xl max-w-sm mx-auto text-xs text-stone-600 dark:text-stone-300">
              <span>{currentLang === 'am' ? 'የተጠየቀው ንብረት:' : 'Target Property:'}</span>
              <p className="font-bold text-stone-900 dark:text-white mt-0.5">{property.title}</p>
            </div>

            <button
              onClick={onClose}
              className="py-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        ) : (
          /* PAYMENT FORM */
          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-7 space-y-6">
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ACTIVE CREDIT PACKAGE FAST UNLOCK CARD IF USER HAS VALID CREDITS */}
            {(() => {
              const matchingPackage = currentUser?.packages?.find(
                (p) => p.remainingUnlocks > 0 && p.maxHousePrice >= property.price
              );
              const totalCredits =
                currentUser?.packages?.reduce((sum, p) => sum + p.remainingUnlocks, 0) || 0;

              if (matchingPackage) {
                return (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white shadow-xl space-y-3 border-2 border-emerald-400/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                        <span className="font-black text-sm sm:text-base">
                          {currentLang === 'am' ? 'የ 5 ቤቶች ጥቅል አለዎት!' : '5-House Package Credit Available!'}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black tracking-wider">
                        {matchingPackage.remainingUnlocks} / 5 {currentLang === 'am' ? 'ይቀራል' : 'Remaining'}
                      </span>
                    </div>

                    <p className="text-xs text-emerald-100 leading-relaxed">
                      {currentLang === 'am'
                        ? `በአካውንትዎ (${currentUser?.phone}) ውስጥ ለዚህ ዋጋ የሚሆን ንቁ ጥቅል አለዎት። አሁን ያለ ምንም ተጨማሪ ክፍያ ወዲያውኑ የባለቤቱን ስልክ መክፈት ይችላሉ።`
                        : `You have active unlock credits for properties up to ${matchingPackage.maxHousePrice.toLocaleString()} ETB. Unlock this property immediately without waiting for payment verification.`}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        if (onUseCredit) {
                          onUseCredit(property);
                          onClose();
                        }
                      }}
                      className="w-full py-3.5 px-4 bg-white hover:bg-emerald-50 text-emerald-950 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span>
                        {currentLang === 'am'
                          ? `⚡ በ 1 ክሬዲት ወዲያውኑ ክፈት (${matchingPackage.remainingUnlocks} ከ 5 ቀሪ)`
                          : `⚡ Unlock Instantly with 1 Credit (${matchingPackage.remainingUnlocks}/5 left)`}
                      </span>
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {/* UNLOCK MODE SWITCHER: 5-House Package vs Single Unlock */}
            <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl grid grid-cols-2 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setUnlockMode('package')}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  unlockMode === 'package'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{currentLang === 'am' ? 'የ 5 ቤቶች ጥቅል (አዋጭ)' : '5 Houses Package (Best Value)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setUnlockMode('single')}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  unlockMode === 'single'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{currentLang === 'am' ? 'ለ 1 ቤት ብቻ' : 'Single House Unlock'}</span>
              </button>
            </div>

            {/* PACKAGE SELECTION TIERS IF IN PACKAGE MODE */}
            {unlockMode === 'package' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                  {currentLang === 'am' ? 'የ 5 ቤቶች ጥቅል ዋጋ ይምረጡ (5 ቤቶች ይከፈቱልዎታል)' : 'Select 5-House Package Tier (Unlocks 5 Houses):'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {USER_PACKAGE_TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedTierId(tier.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        selectedTier.id === tier.id
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 ring-2 ring-emerald-500/30'
                          : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-stone-900 dark:text-white text-xs">
                          {currentLang === 'am' ? tier.nameAm : tier.nameEn}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-xs">
                          {tier.packagePriceBirr} ETB
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">
                        {currentLang === 'am' ? tier.descriptionAm : tier.descriptionEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Targeted Property summary */}
            <div className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="truncate">
                <span className="text-stone-400 dark:text-stone-500 block font-medium">
                  {currentLang === 'am' ? 'የተመረጠው ቤት' : 'Target House'}
                </span>
                <p className="font-bold text-stone-900 dark:text-stone-100 truncate">
                  {currentLang === 'am' && property.titleAm ? property.titleAm : property.title}
                </p>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {property.area} • {property.listingType === 'sale' ? t.sale : t.rent}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-stone-500 dark:text-stone-400 block">{currentLang === 'am' ? 'የሚከፈለው ክፍያ' : 'Payment Amount'}</span>
                <span className="text-lg font-black text-stone-950 dark:text-white font-sans">
                  {effectiveFee} <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t.etb}</span>
                </span>
              </div>
            </div>

            {/* STEP 1: PAYMENT METHOD SELECTOR & BANK DETAILS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center">1</span>
                <span>{currentLang === 'am' ? `ደረጃ 1፡ ${effectiveFee} ብር ይክፈሉ` : `Step 1: Transfer ${effectiveFee} ETB`}</span>
              </div>

              {/* Payment Method Tabs (Telebirr, CBE, BOA) */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('telebirr')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'telebirr'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-300 shadow-xs'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                  }`}
                >
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Telebirr</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cbe')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'cbe'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-300 shadow-xs'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>CBE (ንግድ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('boa')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'boa'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-300 shadow-xs'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>BOA (አቢሲኒያ)</span>
                </button>
              </div>

              {/* Selected Bank Information Card with Copy Buttons */}
              <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 space-y-2.5 text-xs">
                {paymentMethod === 'telebirr' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-stone-400">Telebirr ቁጥር:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-stone-900 dark:text-white text-sm">
                          {paymentSettings.telebirrNumber || '0991154337'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(paymentSettings.telebirrNumber || '0991154337', 'tb')}
                          className="px-2.5 py-1 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded text-[10px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 cursor-pointer"
                        >
                          {copiedField === 'tb' ? t.copiedText : t.copyBtn}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-stone-400">{t.accountName}</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">{paymentSettings.telebirrName || 'E-Gojo Admin'}</span>
                    </div>
                  </>
                )}

                {paymentMethod === 'cbe' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-stone-400">CBE (የኢትዮጵያ ንግድ ባንክ):</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-stone-900 dark:text-white text-sm">
                          {paymentSettings.cbeAccount || '1000131638128'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(paymentSettings.cbeAccount || '1000131638128', 'cbe')}
                          className="px-2.5 py-1 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded text-[10px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 cursor-pointer"
                        >
                          {copiedField === 'cbe' ? t.copiedText : t.copyBtn}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-stone-400">{t.accountName}</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">{paymentSettings.cbeName || 'E-Gojo Verified'}</span>
                    </div>
                  </>
                )}

                {paymentMethod === 'boa' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-stone-400">Bank of Abyssinia (አቢሲኒያ):</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-stone-900 dark:text-white text-sm">
                          {paymentSettings.boaAccount || '61648817'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(paymentSettings.boaAccount || '61648817', 'boa')}
                          className="px-2.5 py-1 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded text-[10px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 cursor-pointer"
                        >
                          {copiedField === 'boa' ? t.copiedText : t.copyBtn}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-stone-400">{t.accountName}</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">{paymentSettings.boaName || 'E-Gojo Official'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* STEP 2: BUYER DETAILS & SCREENSHOT UPLOAD */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center">2</span>
                <span>{t.step2Title}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.buyerPhoneLabel}
                  </label>
                  <input
                    type="tel"
                    required
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="0911223344"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white"
                  />
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {currentLang === 'am' ? 'ይህ ስልክ ባለቤቱ እንዲከፈትለት ይፈቀዳል' : 'Owner contact will unlock for this phone'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.buyerNameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Abebe / ሰላም"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {t.txnRefLabel}
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. FT24089... or Telebirr Txn ID"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-mono text-stone-900 dark:text-white"
                />
              </div>

              {/* Screenshot Uploader */}
              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {t.uploadReceipt}
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-emerald-500 bg-stone-50 dark:bg-stone-800/50 hover:bg-emerald-50/40 rounded-2xl p-4 text-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleScreenshotUpload(e.target.files)}
                    className="hidden"
                  />

                  {screenshotDataUrl ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={screenshotDataUrl}
                        alt="Screenshot Preview"
                        className="w-16 h-16 object-cover rounded-lg border border-stone-300 dark:border-stone-600"
                      />
                      <div className="text-left text-xs">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                          ✓ {currentLang === 'am' ? 'ስክሪንሽቱ ተዘጋጅቷል' : 'Screenshot compressed'}
                        </span>
                        <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                          {screenshotSizeKb} KB • {currentLang === 'am' ? 'ለመቀየር እዚህ ይጫኑ' : 'Click to change'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mb-1" />
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        {currentLang === 'am' ? `የ ${effectiveFee} ብር ክፍያ ስክሪንሽት እዚህ ይጫኑ` : `Upload ${effectiveFee} ETB Receipt Screenshot`}
                      </span>
                      <span className="text-[11px] text-stone-400 mt-0.5">
                        {currentLang === 'am' ? 'በራስ-ሰር ይቀነሳል (Low KB)' : 'Auto-compressed on device'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

              {/* BANNED PHONE WARNING */}
              {isBanned && (
                <div className="p-4 bg-rose-500/15 border-2 border-rose-600 rounded-2xl text-rose-900 dark:text-rose-200 text-xs space-y-1.5 animate-in shake">
                  <div className="flex items-center gap-2 font-black text-rose-700 dark:text-rose-400 text-sm">
                    <Ban className="w-5 h-5 shrink-0" />
                    <span>{t.bannedAccountAlert}</span>
                  </div>
                  <p className="leading-relaxed font-medium">
                    {t.bannedAccountDesc}
                  </p>
                </div>
              )}

              {/* ANTI-DELALA & POACHING LEGAL WARNING BOX */}
              <div className="bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/70 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-extrabold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{t.antiDelalaWarningTitle}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  {t.antiDelalaWarningText}
                </p>

                {/* Agreement Checkbox */}
                <label className="flex items-start gap-2.5 pt-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={hasAgreedAntiDelala}
                    onChange={(e) => setHasAgreedAntiDelala(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] sm:text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight">
                    {t.antiDelalaAgreementCheckbox}
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  id="submit-receipt-btn"
                  type="submit"
                  disabled={isCompressing || isBanned || !hasAgreedAntiDelala}
                  className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl text-sm sm:text-base font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-5 h-5" />
                  <span>{t.submitReceiptBtn} ({effectiveFee} {t.etb})</span>
                </button>
              </div>
          </form>
        )}
      </div>
    </div>
  );
};
