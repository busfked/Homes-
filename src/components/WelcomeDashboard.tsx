import React from 'react';
import { 
  Search, 
  MapPin, 
  Building2, 
  Car, 
  Tractor, 
  Layers, 
  Filter, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ShieldCheck,
  ArrowRight,
  Bell,
  Home,
  Phone,
  PlusCircle,
  KeyRound,
  Headphones
} from 'lucide-react';
import { Language, CategoryType, PropertyType, ListingType } from '../types';
import { ADDIS_AREAS, PROPERTY_TYPES } from '../data/addisAreas';
import { translations } from '../data/translations';

interface WelcomeDashboardProps {
  currentLang: Language;
  selectedCategory: CategoryType;
  setSelectedCategory: (category: CategoryType) => void;
  selectedArea: string;
  setSelectedArea: (area: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedListingType: string;
  setSelectedListingType: (type: string) => void;
  maxPrice: number;
  setMaxPrice: (price: number) => void;
  selectedBedrooms: string;
  setSelectedBedrooms: (beds: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onlyAvailable: boolean;
  setOnlyAvailable: (avail: boolean) => void;
  onResetFilters: () => void;
  totalListingsCount: number;
  onPostHouseClick: () => void;
  onOpenOwnerManage?: () => void;
}

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({
  currentLang,
  selectedCategory,
  setSelectedCategory,
  selectedArea,
  setSelectedArea,
  selectedType,
  setSelectedType,
  selectedListingType,
  setSelectedListingType,
  maxPrice,
  setMaxPrice,
  selectedBedrooms,
  setSelectedBedrooms,
  searchQuery,
  setSearchQuery,
  onlyAvailable,
  setOnlyAvailable,
  onResetFilters,
  totalListingsCount,
  onPostHouseClick,
  onOpenOwnerManage,
}) => {
  const t = translations[currentLang];

  // Quick areas for hero pills
  const featuredAreas = [
    'all',
    'bole',
    'gerji',
    'bulbula',
    'megenagna',
    'cmc',
    'ayat',
    'summit',
    'sarbet',
    'kazanchis',
    'piassa',
    'lebu',
    'jemo',
    'gotera',
  ];

  return (
    <section className="bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent pb-6 pt-4 sm:pt-8 border-b border-stone-200/80 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 text-xs font-bold mb-3 border border-emerald-300/60 dark:border-emerald-700 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{currentLang === 'am' ? 'ቤሴ የቤት መፍትሄ • አዲስ አበባ' : 'Bese Home Solutions • Addis Ababa'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
            {currentLang === 'am' ? 'በአዲስ አበባ ጥራት ያላቸውን ቤቶች ይከራዩ ወይም ይግዙ' : 'Rent or Buy Quality Homes in Addis Ababa'}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed">
            {t.welcomeDesc}
          </p>

          {/* Quick Value Props Pills & Support Contact */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium text-stone-700 dark:text-stone-300">
            <div className="flex items-center justify-center gap-1.5 bg-white dark:bg-stone-850 py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{currentLang === 'am' ? 'የተጣሩ 2-3 ፎቶዎች' : '2-3 Verified Photos'}</span>
            </div>
            
            {/* Direct Official Support Numbers (Replaces the 100/500 text) */}
            <a 
              href="tel:0991154337"
              className="flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 py-2 px-3 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-2xs font-bold transition-all"
              title="Call Support"
            >
              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-mono text-[11px] sm:text-xs">0991154337 / 0983150749</span>
            </a>

            <div className="flex items-center justify-center gap-1.5 bg-white dark:bg-stone-850 py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{currentLang === 'am' ? 'የ 7 ቀን ወቅታዊ መረጃ' : '7-Day Fresh Listings'}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 bg-white dark:bg-stone-850 py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{currentLang === 'am' ? 'ፈጣን የፎቶ ቅነሳ (Low KB)' : 'Compressed Low-KB'}</span>
            </div>
          </div>
        </div>

        {/* OWNER DIRECT ALL-IN-ONE CARD (No extra hidden tabs or pulling right) */}
        <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-stone-900 text-white rounded-3xl shadow-lg border border-emerald-400/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-xs">
                {currentLang === 'am' ? 'ለባለቤቶች • For Owners' : 'For Owners'}
              </span>
              <h3 className="font-black text-base sm:text-lg text-white">
                {t.ownerPostBannerTitle}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
              {t.ownerPostBannerDesc}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              id="owner-quick-post-btn"
              onClick={onPostHouseClick}
              className="flex-1 sm:flex-initial py-2.5 px-5 bg-white hover:bg-stone-100 text-emerald-900 font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>{t.ownerPostBannerBtn}</span>
            </button>

            {onOpenOwnerManage && (
              <button
                id="owner-quick-manage-btn"
                onClick={onOpenOwnerManage}
                className="py-2.5 px-4 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{t.ownerManageBannerBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Selector Tabs with Coming Soon badges on Cars and Machineries */}
        <div className="mb-5 flex items-center justify-center">
          <div className="inline-flex p-1.5 bg-stone-200/90 dark:bg-stone-800/90 backdrop-blur-sm rounded-2xl border border-stone-300/80 dark:border-stone-700 shadow-xs max-w-full overflow-x-auto no-scrollbar gap-1.5">
            {/* Homes (Active Primary Service) */}
            <button
              id="cat-tab-home"
              onClick={() => setSelectedCategory('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'home'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-white/60 dark:bg-stone-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{currentLang === 'am' ? '🏠 ቤቶች (Homes)' : '🏠 Homes'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">
                {currentLang === 'am' ? 'ንቁ' : 'Active'}
              </span>
            </button>

            {/* Cars (Teased Coming Soon) */}
            <button
              id="cat-tab-car"
              onClick={() => setSelectedCategory('car')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'car'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Car className="w-4 h-4 text-emerald-500" />
              <span>{currentLang === 'am' ? 'መኪኖች (Cars)' : 'Cars'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold">
                {currentLang === 'am' ? 'በቅርብ ቀን' : 'Coming Soon'}
              </span>
            </button>

            {/* Machineries (Teased Coming Soon) */}
            <button
              id="cat-tab-machinery"
              onClick={() => setSelectedCategory('machinery')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'machinery'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Tractor className="w-4 h-4 text-emerald-500" />
              <span>{currentLang === 'am' ? 'ማሽነሪዎች (Machinery)' : 'Machinery'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold">
                {currentLang === 'am' ? 'በቅርብ ቀን' : 'Coming Soon'}
              </span>
            </button>
          </div>
        </div>

        {/* If Cars or Machineries are selected, show dedicated Coming Soon Showcase Card */}
        {selectedCategory !== 'home' ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-10 shadow-lg border border-stone-200 dark:border-stone-800 max-w-2xl mx-auto text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              {selectedCategory === 'car' ? <Car className="w-8 h-8" /> : <Tractor className="w-8 h-8" />}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentLang === 'am' ? 'በቅርብ ቀን ይጀምራል' : 'Coming Soon'}</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 mb-2">
              {selectedCategory === 'car'
                ? currentLang === 'am'
                  ? 'የመኪና ደላላ አገልግሎት በቅርብ ቀን ይጀምራል!'
                  : 'Car & Vehicle Brokerage is Launching Soon!'
                : currentLang === 'am'
                ? 'የከባድ ማሽነሪ ደላላ አገልግሎት በቅርብ ቀን ይጀምራል!'
                : 'Heavy Machinery Brokerage is Launching Soon!'}
            </h3>

            <p className="text-sm text-stone-600 dark:text-stone-300 mb-6 leading-relaxed max-w-md mx-auto">
              {selectedCategory === 'car'
                ? currentLang === 'am'
                  ? 'በአሁኑ ሰዓት በአዲስ አበባ የተረጋገጡ የመኪና ባለቤቶችን እና ጋራዦችን በማስመዝገብ ላይ ነን። አሁን ላይ የቤት ደላላ አገልግሎታችን ሙሉ በሙሉ በስራ ላይ ይገኛል።'
                  : 'We are currently onboarding verified vehicle sellers and dealerships across Addis Ababa. Our home and property brokerage is fully operational today.'
                : currentLang === 'am'
                ? 'ኤክስካቫተር፣ ሎደር፣ ክሬን እና ትራክተር የመሳሰሉ ከባድ ማሽነሪዎችን በቀጥታ ከባለቤቱ ጋር የሚያገናኝ አገልግሎት በቅርብ ቀን ይጀመራል።'
                : 'Excavator, wheel loader, crane, and agricultural tractor direct brokerage is launching shortly.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setSelectedCategory('home')}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span>{currentLang === 'am' ? 'ያሉትን ቤቶች ይመልከቱ' : 'Browse Available Homes'}</span>
              </button>
              
              <button
                onClick={onPostHouseClick}
                className="w-full sm:w-auto px-6 py-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{currentLang === 'am' ? 'ቤት ያስመዝግቡ' : 'Post a House'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Detailed User Finding Search & Filter Menu for Homes */
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 shadow-md border border-stone-200 dark:border-stone-800">
            {/* Primary Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  currentLang === 'am'
                    ? 'በአካባቢ፣ ምልክት ወይም ርዕስ ይፈልጉ (ቦሌ፣ ገርጂ፣ ኮንዶሚኒየም፣ ቪላ፣ አፓርታማ...)...'
                    : 'Search by neighborhood, landmark, or keyword (Bole, Gerji, Condo, Villa, Apartment...)...'
                }
                className="w-full pl-12 pr-4 py-3.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm sm:text-base text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 px-2 py-1 bg-stone-200/60 dark:bg-stone-700 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Area Filter Pills */}
            <div className="mb-5">
              <div className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.filterArea}</span>
                </div>
                <span className="text-[11px] text-stone-400 font-normal">Addis Ababa</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar text-xs font-semibold">
                {featuredAreas.map((areaId) => {
                  const areaObj = ADDIS_AREAS.find((a) => a.id === areaId);
                  const label =
                    areaId === 'all'
                      ? t.filterAllAreas
                      : currentLang === 'am'
                      ? areaObj?.nameAm || areaId
                      : areaObj?.nameEn || areaId;

                  const isSelected =
                    (areaId === 'all' && selectedArea === 'all') ||
                    (areaObj && selectedArea.toLowerCase() === areaObj.nameEn.toLowerCase());

                  return (
                    <button
                      key={areaId}
                      onClick={() => setSelectedArea(areaId === 'all' ? 'all' : areaObj?.nameEn || areaId)}
                      className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed 6-Column Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-4 border-t border-stone-100 dark:border-stone-800 text-xs">
              {/* 1. All Addis Areas & Sub-cities Dropdown */}
              <div className="lg:col-span-1">
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {currentLang === 'am' ? 'አካባቢ / ክፍለ ከተማ' : 'Neighborhood'}
                </label>
                <select
                  id="filter-area-dropdown"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full py-2.5 px-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="all">{t.filterAllAreas}</option>
                  {ADDIS_AREAS.map((a) => (
                    <option key={a.id} value={a.nameEn}>
                      {currentLang === 'am' ? a.nameAm : a.nameEn} ({a.subCityEn})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Property Type */}
              <div className="lg:col-span-1">
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {t.filterType}
                </label>
                <select
                  id="filter-type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full py-2.5 px-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="all">{t.filterAllTypes}</option>
                  {PROPERTY_TYPES.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {currentLang === 'am' ? pt.nameAm : pt.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Listing Type (Rent vs Sale) */}
              <div className="lg:col-span-1">
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {t.filterListingType}
                </label>
                <select
                  id="filter-listing-type"
                  value={selectedListingType}
                  onChange={(e) => setSelectedListingType(e.target.value)}
                  className="w-full py-2.5 px-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="all">{t.allListings}</option>
                  <option value="rent">{t.rent}</option>
                  <option value="sale">{t.sale}</option>
                </select>
              </div>

              {/* 4. Bedrooms Filter */}
              <div className="lg:col-span-1">
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {t.filterBedrooms}
                </label>
                <select
                  id="filter-bedrooms"
                  value={selectedBedrooms}
                  onChange={(e) => setSelectedBedrooms(e.target.value)}
                  className="w-full py-2.5 px-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="all">{t.filterAllBeds}</option>
                  <option value="0">Studio (0 {t.beds})</option>
                  <option value="1">1 {t.beds}</option>
                  <option value="2">2 {t.beds}</option>
                  <option value="3">3 {t.beds}</option>
                  <option value="4">4+ {t.beds}</option>
                </select>
              </div>

              {/* 5. Max Budget / Price Range Filter */}
              <div className="lg:col-span-1">
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {currentLang === 'am' ? 'ከፍተኛ በጀት (ብር)' : 'Max Budget (ETB)'}
                </label>
                <select
                  id="filter-max-price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full py-2.5 px-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value={0}>{currentLang === 'am' ? 'ማንኛውም ዋጋ' : 'Any Budget'}</option>
                  <option value={20000}>≤ 20,000 ETB</option>
                  <option value={40000}>≤ 40,000 ETB</option>
                  <option value={80000}>≤ 80,000 ETB</option>
                  <option value={150000}>≤ 150,000 ETB</option>
                  <option value={500000}>≤ 500,000 ETB</option>
                  <option value={5000000}>≤ 5,000,000 ETB</option>
                </select>
              </div>

              {/* 6. Active Only Switch */}
              <div className="lg:col-span-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 py-2.5 px-3 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl border border-stone-200 dark:border-stone-700 cursor-pointer select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="font-bold text-stone-800 dark:text-stone-200 truncate">{t.availableOnly}</span>
                </label>
              </div>
            </div>

            {/* Active Filters Summary Bar */}
            <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-stone-500 dark:text-stone-400 font-medium">
                  {currentLang === 'am' ? 'የተገኙ ቤቶች:' : 'Matching Houses:'}{' '}
                  <strong className="text-stone-900 dark:text-white font-extrabold text-sm">{totalListingsCount}</strong>
                </span>
                {selectedArea !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                    {selectedArea}
                  </span>
                )}
                {selectedListingType !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold">
                    {selectedListingType === 'rent' ? t.rent : t.sale}
                  </span>
                )}
              </div>

              {(selectedArea !== 'all' ||
                selectedType !== 'all' ||
                selectedListingType !== 'all' ||
                selectedBedrooms !== 'all' ||
                maxPrice > 0 ||
                searchQuery ||
                !onlyAvailable) && (
                <button
                  onClick={onResetFilters}
                  className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>{t.clearFilters}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
