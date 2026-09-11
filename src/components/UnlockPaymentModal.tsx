import React, { useState, useRef } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Upload, 
  ShieldCheck, 
  AlertCircle, 
  Building2, 
  Phone, 
  CreditCard, 
  ShieldAlert, 
  Ban, 
  User, 
  Lock,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Gift,
  PhoneCall,
} from 'lucide-react';
import { Property, Language, PaymentMethod, UnlockRequest, PaymentSettings, UserAccount } from '../types';
import { translations } from '../data/translations';
import { compressImage } from '../utils/imageCompressor';
import { 
  isPhoneBanned, 
  loginOrRegisterUser, 
  getEligiblePackageForPrice, 
  getPackageChoiceInfo,
  getStoredUsers,
  getStoredUnlockRequests,
  getStoredProperties,
  claimUserPromo5Homes,
} from '../utils/storage';
import { calculateHouseUnlockFee, formatEtbPrice, getTierForProperty } from '../utils/pricing';
import { hasUserUsedPromo, calculatePromoStats } from '../utils/promo';

interface UnlockPaymentModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  paymentSettings: PaymentSettings;
  userPhone: string;
  currentUser?: UserAccount | null;
  onOpenUserAuthModal?: () => void;
  onSubmitUnlockRequest: (request: UnlockRequest) => void;
  onUseCreditToUnlock?: (property: Property) => void;
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
  onSubmitUnlockRequest,
  onUseCreditToUnlock,
}) => {
  if (!isOpen || !property) return null;

  const t = translations[currentLang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exact tier unlock fee: 150, 250, 350, or 500 ETB (matching the home tier)
  const unlockFee = calculateHouseUnlockFee(property.price, property.listingType, property.category);

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

  // 1-Time 100 Launch Promo state (Instant unlock for first 100 users, 5 homes free)
  const [promoUnlockedOwner, setPromoUnlockedOwner] = useState<{
    ownerName: string;
    ownerPhone: string;
    remainingCredits: number;
  } | null>(null);

  // Promo eligibility checks
  const allUsers = getStoredUsers();
  const allRequests = getStoredUnlockRequests();
  const allProps = getStoredProperties();
  const promoStats = calculatePromoStats(allProps, allRequests);

  const cleanPhone = (buyerPhone || currentUser?.phone || userPhone || '').trim().replace(/[\s-]/g, '');
  const userHasUsedPromoOnce = cleanPhone ? hasUserUsedPromo(cleanPhone, allUsers, allRequests) : false;
  const isEligibleForUserPromo = promoStats.isUserPromoAvailable && !userHasUsedPromoOnce;
  const eligiblePackage = getEligiblePackageForPrice(currentUser, property.price, property.listingType);

  const handleClaimPromoUnlock = () => {
    setErrorMsg('');
    const targetPhone = buyerPhone.trim().replace(/[\s-]/g, '');
    if (!targetPhone || targetPhone.length < 9) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ ትክክለኛ ስልክ ቁጥርዎን ያስገቡ (ለምሳሌ፦ 0911223344)።'
          : 'Please enter your valid phone number (e.g. 0911223344).'
      );
      return;
    }

    if (isPhoneBanned(targetPhone)) {
      setErrorMsg(t.bannedAccountAlert);
      return;
    }

    const targetPin = buyerPin.trim() || '1234';

    const result = claimUserPromo5Homes(
      targetPhone,
      targetPin,
      property.id,
      property.price,
      property.listingType
    );

    if (!result.success) {
      setErrorMsg(result.message);
      return;
    }

    setPromoUnlockedOwner({
      ownerName: property.ownerName || (currentLang === 'am' ? 'የቤቱ ባለቤት' : 'Property Owner'),
      ownerPhone: property.ownerPhone || '0911000000',
      remainingCredits: 4,
    });

    if (onUseCreditToUnlock) {
      onUseCreditToUnlock(property);
    }
  };

  // Check if current phone is banned
  const isBanned = isPhoneBanned(buyerPhone);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

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

    const cleanPhone = buyerPhone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ ትክክለኛ ስልክ ቁጥርዎን ያስገቡ።'
          : 'Please enter your valid phone number.'
      );
      return;
    }

    if (isPhoneBanned(cleanPhone)) {
      setErrorMsg(t.bannedAccountAlert);
      return;
    }

    const cleanPin = buyerPin.trim() || '1234';
    const cleanName = buyerName.trim() || 'Buyer';

    // Auto register or login user with this phone & PIN
    loginOrRegisterUser(cleanName, cleanPhone, cleanPin);

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
          ? `እባክዎ የ ${unlockFee} ብር የክፍያ ስክሪንሽት ያስገቡ።`
          : `Please upload your ${unlockFee} ETB payment screenshot.`
      );
      return;
    }

    const tier = getTierForProperty(property.price, property.listingType, property.category);

    const newRequest: UnlockRequest = {
      id: `req-${Date.now().toString(36)}`,
      type: 'single_unlock',
      requestType: 'single_unlock',
      propertyId: property.id,
      propertyTitle: property.title,
      propertyArea: property.area,
      packageTierId: tier.id,
      packageTierName: tier.nameEn,
      buyerName: cleanName,
      buyerPhone: cleanPhone,
      paymentMethod: paymentMethod,
      transactionRef: transactionRef.trim() || `TXN-${Date.now().toString().slice(-6)}`,
      screenshotUrl: screenshotDataUrl,
      screenshotSizeKb: screenshotSizeKb,
      status: 'pending',
      amountBirr: unlockFee,
      remainingUnlocks: 5,
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
        className="bg-white dark:bg-stone-900 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[94vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
                {currentLang === 'am' ? 'የ 5 ቤቶች መክፈቻ ጥቅል' : '5-Home Unlock Package'} ({unlockFee} {t.etb})
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {currentLang === 'am'
                  ? `አንዴ ${unlockFee} ብር ከፍለው ይህንን ቤት ጨምሮ 5 ቤቶችን ይክፈቱ!`
                  : `Pay ${unlockFee} ETB once to unlock this home + 4 more in this similar range!`}
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

        {promoUnlockedOwner ? (
          /* INSTANT PROMO UNLOCKED CELEBRATION (NO APPROVAL NEEDED) */
          <div className="p-6 sm:p-8 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-8 h-8 animate-pulse text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-black">
              <Gift className="w-4 h-4" />
              <span>{currentLang === 'am' ? 'የ100 ነፃ ማስተዋወቂያ ተከፍቷል (0 ብር)' : '100 Promo: 5 Homes Free (0 ETB)'}</span>
            </div>

            <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100">
              {currentLang === 'am' ? '🎉 የቤቱ ባለቤት ስልክ ወዲያውኑ ተከፍቷል!' : '🎉 Owner Direct Contact Unlocked!'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
              {currentLang === 'am'
                ? 'ምንም የአድሚን ፍቃድ ሳያስፈልግዎት ይህ ቤት ወዲያውኑ ተከፍቷል። በተጨማሪም 4 ተጨማሪ ቤቶችን በነፃ መክፈት ይችላሉ!'
                : 'No admin approval required! This house is unlocked right now, plus you have 4 remaining free home unlocks!'}
            </p>

            {/* Owner Direct Contact Card with 1-click phone call */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-600 p-5 rounded-2xl max-w-md mx-auto text-left space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                    {currentLang === 'am' ? 'የባለቤቱ ስም' : 'Owner Name'}
                  </span>
                  <p className="text-base font-black text-stone-900 dark:text-white">
                    {promoUnlockedOwner.ownerName}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-black font-mono">
                  {promoUnlockedOwner.remainingCredits} {currentLang === 'am' ? 'ቀሪ ነፃ ቤቶች' : 'free unlocks left'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                  {currentLang === 'am' ? 'የባለቤቱ ስልክ ቁጥር' : 'Direct Phone Number'}
                </span>
                <a
                  href={`tel:${promoUnlockedOwner.ownerPhone}`}
                  className="mt-1 flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-mono font-black text-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-xs"
                >
                  <span>{promoUnlockedOwner.ownerPhone}</span>
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-sans font-bold flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5" />
                    {currentLang === 'am' ? 'ይደውሉ' : 'Call'}
                  </span>
                </a>
              </div>
            </div>

            <button
              onClick={onClose}
              className="py-3 px-8 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl font-black text-sm shadow-md cursor-pointer transition-all"
            >
              {t.close}
            </button>
          </div>
        ) : isSuccessSubmitted ? (
          /* SUCCESS STATE */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100">
              {currentLang === 'am' ? 'ስክሪንሽቱ በተሳካ ሁኔታ ተልኳል!' : 'Screenshot Submitted!'}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
              {currentLang === 'am'
                ? `የ ${unlockFee} ብር ክፍያ ስክሪንሽትዎ ለአስተዳዳሪው ደርሷል። አስተዳዳሪው እንደፈተሸው (በጥቂት ደቂቃዎች ውስጥ) የባለቤቱ ስልክ ቁጥር ለስልክዎ (${buyerPhone}) ይከፈታል!`
                : `Your ${unlockFee} ETB screenshot has been sent to the admin. Once verified, the owner's direct contact will unlock for your phone (${buyerPhone})!`}
            </p>

            <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-4 rounded-2xl max-w-sm mx-auto text-xs text-stone-600 dark:text-stone-300">
              <span>{currentLang === 'am' ? 'የተጠየቀው ንብረት:' : 'Target Property:'}</span>
              <p className="font-bold text-stone-900 dark:text-white mt-0.5">{property.title}</p>
              <p className="text-emerald-600 font-bold mt-1">{property.area} • {unlockFee} ETB</p>
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
          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-7 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 100 Promo: 5 Homes Free (0 ETB) Card - Instant Unlock, No Admin Approval Required! */}
            {isEligibleForUserPromo && !eligiblePackage && (
              <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 dark:from-emerald-950/60 dark:via-teal-950/50 dark:to-amber-950/40 border-2 border-emerald-500 rounded-2xl space-y-3.5 shadow-md animate-in zoom-in-95">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                          {currentLang === 'am' ? 'የ100 ደንበኞች ነፃ ዕድል' : '100 Launch Promo'}
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-bold font-mono">
                          ({promoStats.remainingUsers} {currentLang === 'am' ? 'ቦታዎች ቀሩ' : 'spots left'})
                        </span>
                      </div>
                      <h4 className="font-black text-stone-900 dark:text-white text-sm sm:text-base mt-0.5">
                        {currentLang === 'am' ? '5 ቤቶችን በነፃ ይክፈቱ (0 ብር)' : 'Unlock 5 Homes Free (0 ETB)'}
                      </h4>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black shadow-xs font-mono shrink-0">
                    0 ETB
                  </span>
                </div>

                <div className="p-3 bg-white/90 dark:bg-stone-900/90 rounded-xl border border-emerald-300 dark:border-emerald-800 text-xs space-y-1 text-stone-700 dark:text-stone-300">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    {currentLang === 'am'
                      ? 'ምንም የአድሚን ፍቃድ ወይም የገንዘብ ስክሪንሽት አያስፈልግም! ወዲያውኑ ይከፈታል።'
                      : 'No admin approval or payment screenshot required! Instant access.'}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    {currentLang === 'am'
                      ? 'ስልክዎን እና የይለፍ ቃልዎን (Password) ብቻ በማስገባት ይህንን ቤት ጨምሮ 5 ቤቶችን በነፃ ይክፈቱ (1 ጊዜ ብቻ የሚሰራ)።'
                      : 'Enter only your Phone & Password to instantly unlock this home + 4 more free unlocks (1-time use only).'}
                  </p>
                </div>

                {/* Only Phone and Password for promo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                      {t.buyerPhoneLabel} *
                    </label>
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="0911223344"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-900 border border-emerald-400 dark:border-emerald-700 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                      {currentLang === 'am' ? 'የይለፍ ቃል / Password (PIN) *' : 'Password / PIN *'}
                    </label>
                    <input
                      type="password"
                      value={buyerPin}
                      onChange={(e) => setBuyerPin(e.target.value)}
                      placeholder="4+ digits PIN"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-900 border border-emerald-400 dark:border-emerald-700 rounded-xl text-sm font-mono text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClaimPromoUnlock}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {currentLang === 'am'
                      ? '✨ 5 ቤቶችን በነፃ ክፈት (0 ብር - ወዲያውኑ ይከፈታል)'
                      : '✨ Claim 5 Homes Free (0 ETB - Instant Access)'}
                  </span>
                </button>
              </div>
            )}

            {/* Post-Promo 1-Time Used Alert */}
            {userHasUsedPromoOnce && !eligiblePackage && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-1.5 text-xs animate-in fade-in">
                <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{currentLang === 'am' ? 'የ 1 ጊዜ ነፃ ማስተዋወቂያዎ ጥቅም ላይ ውሏል' : '1-Time Free Promo Already Used'}</span>
                </div>
                <p className="text-amber-800 dark:text-amber-300 text-[11px] sm:text-xs leading-relaxed">
                  {currentLang === 'am'
                    ? `የ 1 ጊዜ የ 5 ቤቶች ነፃ ዕድልዎ ጥቅም ላይ ውሏል። ለዚህ እና ለቀጣይ ቤቶች መክፈቻ እባክዎ ከታች የ ${unlockFee} ብር ክፍያ በመፈፀም ስክሪንሽት ያያይዙ።`
                    : `Your 1-time 5-home free promo has been used on this phone. For this and future unlocks, please complete the ${unlockFee} ETB fee and upload your receipt screenshot below.`}
                </p>
              </div>
            )}

            {/* If user already has an active package covering this property, let them unlock instantly for free! */}
            {(() => {
              const eligiblePackage = getEligiblePackageForPrice(currentUser, property.price, property.listingType);
              if (!eligiblePackage) return null;
              const choiceInfo = getPackageChoiceInfo(
                eligiblePackage.remainingUnlocks,
                eligiblePackage.totalPurchased || 5,
                currentLang
              );

              return (
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/50 border-2 border-emerald-400 dark:border-emerald-600 rounded-2xl space-y-3 shadow-sm animate-in zoom-in-95">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-black">
                        <span>{currentLang === 'am' ? 'የተከፈለ ንቁ ጥቅል አለዎት!' : 'You Have an Active Package!'}</span>
                      </div>
                      <h4 className="font-extrabold text-stone-900 dark:text-white text-sm mt-1">
                        {choiceInfo.chooseLabel}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                        {currentLang === 'am'
                          ? `በዚህ የዋጋ ደረጃ ውስጥ ${eligiblePackage.remainingUnlocks} የቀሩ ቤቶች አሉዎት። ገንዘብ መክፈል አያስፈልግዎትም!`
                          : `You have ${eligiblePackage.remainingUnlocks} remaining unlock credits for this price range. No payment required!`}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-mono text-xs font-black">
                      {eligiblePackage.remainingUnlocks} {currentLang === 'am' ? 'ቀረ' : 'left'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onUseCreditToUnlock) {
                        onUseCreditToUnlock(property);
                      }
                      onClose();
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-md cursor-pointer border border-emerald-400"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>{choiceInfo.buttonLabel}</span>
                  </button>
                </div>
              );
            })()}

            {/* Targeted Property & Direct Unlock Fee Banner */}
            <div className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="truncate">
                <span className="text-stone-400 dark:text-stone-500 block font-medium">
                  {currentLang === 'am' ? 'የተመረጠው ቤት' : 'Target House'}
                </span>
                <p className="font-extrabold text-stone-900 dark:text-stone-100 text-sm truncate">
                  {currentLang === 'am' && property.titleAm ? property.titleAm : property.title}
                </p>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {property.area} • {formatEtbPrice(property.price, property.pricePeriod, currentLang)}
                </span>
              </div>
              <div className="text-right shrink-0 bg-white dark:bg-stone-900 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-bold uppercase tracking-wider">
                  {currentLang === 'am' ? 'የ 5 ቤቶች ዋጋ' : '5-Home Price'}
                </span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {unlockFee} <span className="text-xs font-bold text-stone-700 dark:text-stone-300">{t.etb}</span>
                </span>
              </div>
            </div>

            {/* 5-Home Bundle Value Proposition */}
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-emerald-950 dark:text-emerald-200 block text-xs sm:text-sm">
                    {currentLang === 'am' ? '5 ቤቶችን የመክፈት እድል ተካቷል!' : 'Includes 5 Home Unlocks!'}
                  </span>
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    {currentLang === 'am'
                      ? `ይህን ቤት ወዲያውኑ ይከፍታል + በተመሳሳይ የዋጋ ደረጃ ውስጥ 4 ተጨማሪ ቤቶች በነፃ ይከፈቱልዎታል!`
                      : `Unlocks this house + gives you 4 more unlocks in this similar price range!`}
                  </span>
                </div>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-black text-xs font-mono shadow-xs">
                5 {currentLang === 'am' ? 'ቤቶች' : 'Homes'}
              </span>
            </div>

            {/* STEP 1: PAYMENT METHOD SELECTOR & OFFICIAL ACCOUNTS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center">1</span>
                <span>{currentLang === 'am' ? `ደረጃ 1፡ ${unlockFee} ብር ይክፈሉ` : `Step 1: Transfer ${unlockFee} ETB`}</span>
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

              {/* Selected Bank Information Card with 1-Click Copy */}
              <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 space-y-2 text-xs">
                {paymentMethod === 'telebirr' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-stone-400 font-medium">Telebirr ቁጥር:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-stone-900 dark:text-white text-base">
                          {paymentSettings.telebirrNumber || '0991154337'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(paymentSettings.telebirrNumber || '0991154337', 'tb')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          {copiedField === 'tb' ? t.copiedText : t.copyBtn}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                      <span>{t.accountName}:</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">{paymentSettings.telebirrName || 'BetDelala (0991154337)'}</span>
                    </div>
                  </>
                )}

                {paymentMethod === 'cbe' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-stone-400 font-medium">CBE (ንግድ ባንክ):</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-stone-900 dark:text-white text-base">
                          {paymentSettings.cbeAccount || '1000131638128'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(paymentSettings.cbeAccount || '1000131638128', 'cbe')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          {copiedField === 'cbe' ? t.copiedText : t.copyBtn}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                      <span>{t.accountName}:</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">{paymentSettings.cbeName || 'BetDelala (CBE)'}</span>
                    </div>
                  </>
                )}

                {paymentMethod === 'boa' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-stone-400 font-medium">Bank of Abyssinia:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-stone-900 dark:text-white text-base">
                          {paymentSettings.boaAccount || '61648817'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(paymentSettings.boaAccount || '61648817', 'boa')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          {copiedField === 'boa' ? t.copiedText : t.copyBtn}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                      <span>{t.accountName}:</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">{paymentSettings.boaName || 'BetDelala (Abyssinia)'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* STEP 2: USER REGISTRY (PHONE & PASSWORD) & SCREENSHOT */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center">2</span>
                <span>{currentLang === 'am' ? 'ደረጃ 2፡ ስልክዎ፣ ፓስወርድ እና ስክሪንሽት' : 'Step 2: Phone, Password & Screenshot'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.buyerPhoneLabel} *
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
                    {currentLang === 'am' ? 'ይህ ቤት የሚከፈተው ለዚህ ስልክ ብቻ ነው' : 'Owner contact unlocks for this phone'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {currentLang === 'am' ? 'የይለፍ ቃል / Password (PIN) *' : 'Account Password / PIN *'}
                  </label>
                  <input
                    type="password"
                    required
                    value={buyerPin}
                    onChange={(e) => setBuyerPin(e.target.value)}
                    placeholder="4+ digits password"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono text-stone-900 dark:text-white"
                  />
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {currentLang === 'am' ? 'በኋላ ተመልሰው ለመግባት ይጠቅምዎታል' : 'Used to log in and view your unlocked houses'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.buyerNameLabel}
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Abebe / ሰላም"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t.txnRefLabel}
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. FT24089... / Telebirr Txn"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-mono text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Screenshot Uploader */}
              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {t.uploadReceipt} ({unlockFee} {t.etb}) *
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
                        {currentLang === 'am' ? `የ ${unlockFee} ብር ክፍያ ስክሪንሽት እዚህ ይጫኑ` : `Upload ${unlockFee} ETB Receipt Screenshot`}
                      </span>
                      <span className="text-[11px] text-stone-400 mt-0.5">
                        {currentLang === 'am' ? 'በስልክዎ ወዲያው ይቀነሳል (Low KB)' : 'Auto-compressed to low KB'}
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
            <div className="bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/70 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-extrabold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{t.antiDelalaWarningTitle}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {t.antiDelalaWarningText}
              </p>

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
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
            <div className="pt-1">
              <button
                id="submit-receipt-btn"
                type="submit"
                disabled={isCompressing || isBanned || !hasAgreedAntiDelala}
                className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl text-sm sm:text-base font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5" />
                <span>{t.submitReceiptBtn} ({unlockFee} {t.etb})</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
