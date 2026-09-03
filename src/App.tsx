import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  PlusCircle, 
  KeyRound, 
  Receipt, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  MapPin, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { 
  Property, 
  UnlockRequest, 
  PaymentSettings, 
  Language, 
  Theme,
  CategoryType,
  PropertyType, 
  ListingType,
  ReportedBroker,
  UserAccount
} from './types';
import { 
  getStoredProperties, 
  saveProperties, 
  getStoredUnlockRequests, 
  saveUnlockRequests, 
  getStoredSettings, 
  saveSettings, 
  getStoredUserPhone, 
  saveUserPhone, 
  isPropertyUnlockedForBuyer, 
  cleanupExpiredListings,
  getDaysRemaining,
  getStoredBannedPhones,
  saveBannedPhones,
  banPhoneNumber,
  unbanPhoneNumber,
  getStoredReportedBrokers,
  saveReportedBrokers,
  getActiveUserSession,
  saveActiveUserSession,
  clearActiveUserSession,
  unlockPropertyWithCredit,
  creditPackageToUserPhone,
  creditSinglePropertyUnlockToUser,
  getStoredUsers,
  saveUsers
} from './utils/storage';
import {
  fetchPropertiesFromSupabase,
  savePropertyToSupabase,
  deletePropertyFromSupabase,
  fetchUnlockRequestsFromSupabase,
  saveUnlockRequestToSupabase,
  fetchUsersFromSupabase,
  saveUserToSupabase,
  saveUserUnlockedPropertyToSupabase
} from './utils/supabaseClient';
import { getTierForProperty, PRICE_TIERS } from './utils/pricing';
import { translations } from './data/translations';
import { Navbar } from './components/Navbar';
import { WelcomeDashboard } from './components/WelcomeDashboard';
import { HouseCard } from './components/HouseCard';
import { HouseDetailModal } from './components/HouseDetailModal';
import { PostHouseModal } from './components/PostHouseModal';
import { UnlockPaymentModal } from './components/UnlockPaymentModal';
import { OwnerManageModal } from './components/OwnerManageModal';
import { AdminPanel } from './components/AdminPanel';
import { MyRequestsModal } from './components/MyRequestsModal';
import { ReportBrokerModal } from './components/ReportBrokerModal';
import { UserAuthModal } from './components/UserAuthModal';

export default function App() {
  // Localization state (Amharic default as requested)
  const [currentLang, setCurrentLang] = useState<Language>('am');
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('bese_theme') as Theme) || 'light';
  });
  const t = translations[currentLang];

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('bese_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Core Data State
  const [properties, setProperties] = useState<Property[]>([]);
  const [unlockRequests, setUnlockRequests] = useState<UnlockRequest[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(getStoredSettings());
  const [userPhone, setUserPhone] = useState<string>(getStoredUserPhone());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getActiveUserSession());
  const [bannedPhones, setBannedPhones] = useState<string[]>([]);
  const [reportedBrokers, setReportedBrokers] = useState<ReportedBroker[]>([]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'browse' | 'post' | 'owner' | 'my-requests' | 'admin'>('browse');

  // Category & Filter States
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('home');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedListingType, setSelectedListingType] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);

  // Modal States
  const [selectedPropertyForDetails, setSelectedPropertyForDetails] = useState<Property | null>(null);
  const [selectedPropertyForUnlock, setSelectedPropertyForUnlock] = useState<Property | null>(null);
  const [selectedPropertyForOwnerManage, setSelectedPropertyForOwnerManage] = useState<Property | null>(null);
  const [selectedPropertyForReport, setSelectedPropertyForReport] = useState<Property | null>(null);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isOwnerManageModalOpen, setIsOwnerManageModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isMyRequestsModalOpen, setIsMyRequestsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isUserAuthModalOpen, setIsUserAuthModalOpen] = useState(false);

  // Admin direct posting & Owner pre-fill state
  const [isAdminPosting, setIsAdminPosting] = useState(false);
  const [prefilledOwnerPhone, setPrefilledOwnerPhone] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 2-Way Live Supabase Synchronization
  const syncFromSupabase = async () => {
    try {
      setIsSyncing(true);
      const [remoteProps, remoteReqs, remoteUsers] = await Promise.all([
        fetchPropertiesFromSupabase(),
        fetchUnlockRequestsFromSupabase(),
        fetchUsersFromSupabase()
      ]);

      if (remoteProps && Array.isArray(remoteProps) && remoteProps.length > 0) {
        setProperties((prev) => {
          const remoteMap = new Map(remoteProps.map((p) => [p.id, p]));
          const merged = [...remoteProps];
          for (const localP of prev) {
            if (!remoteMap.has(localP.id)) {
              merged.push(localP);
              // push this local property to Supabase in background
              savePropertyToSupabase(localP).catch(console.warn);
            }
          }
          saveProperties(merged);
          return merged;
        });
      }

      if (remoteReqs && Array.isArray(remoteReqs)) {
        setUnlockRequests((prev) => {
          const remoteMap = new Map(remoteReqs.map((r) => [r.id, r]));
          const merged = [...remoteReqs];
          for (const localR of prev) {
            if (!remoteMap.has(localR.id)) {
              merged.push(localR);
              saveUnlockRequestToSupabase(localR).catch(console.warn);
            }
          }
          saveUnlockRequests(merged);
          return merged;
        });
      }

      if (remoteUsers && Array.isArray(remoteUsers) && remoteUsers.length > 0) {
        const localUsers = getStoredUsers();
        const remoteUserMap = new Map(remoteUsers.map((u) => [u.phone.replace(/[\s-]/g, ''), u]));
        const mergedUsers = [...remoteUsers];
        for (const lu of localUsers) {
          const clean = lu.phone.replace(/[\s-]/g, '');
          if (!remoteUserMap.has(clean)) {
            mergedUsers.push(lu);
            saveUserToSupabase(lu).catch(console.warn);
          }
        }
        saveUsers(mergedUsers);

        // Update active session if credentials match
        const active = getActiveUserSession();
        if (active) {
          const found = mergedUsers.find(
            (u) => u.phone.replace(/[\s-]/g, '') === active.phone.replace(/[\s-]/g, '')
          );
          if (found) {
            saveActiveUserSession(found);
            setCurrentUser(found);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load Data on Mount, initial sync & start background poll interval
  useEffect(() => {
    const loadedProps = getStoredProperties();
    const loadedRequests = getStoredUnlockRequests();
    const loadedBanned = getStoredBannedPhones();
    const loadedReports = getStoredReportedBrokers();
    setProperties(loadedProps);
    setUnlockRequests(loadedRequests);
    setBannedPhones(loadedBanned);
    setReportedBrokers(loadedReports);

    // Initial Live Sync from Supabase
    syncFromSupabase();

    // Regular polling every 10 seconds so new submissions/payments from any device appear immediately
    const interval = setInterval(() => {
      syncFromSupabase();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Save changes to localStorage
  const updatePropertiesState = (newProps: Property[]) => {
    setProperties(newProps);
    saveProperties(newProps);
  };

  const updateRequestsState = (newRequests: UnlockRequest[]) => {
    setUnlockRequests(newRequests);
    saveUnlockRequests(newRequests);
  };

  const handleBanPhone = (phone: string) => {
    const updated = banPhoneNumber(phone);
    setBannedPhones(updated);
    showToast(currentLang === 'am' ? `${phone} ታግዷል` : `${phone} has been blacklisted`);
  };

  const handleUnbanPhone = (phone: string) => {
    const updated = unbanPhoneNumber(phone);
    setBannedPhones(updated);
    showToast(currentLang === 'am' ? `${phone} እገዳው ተነስቷል` : `${phone} unbanned`);
  };

  const handleResolveReport = (reportId: string, action: 'ban' | 'dismiss') => {
    const existing = getStoredReportedBrokers();
    const target = existing.find((r) => r.id === reportId);
    if (!target) return;

    if (action === 'ban') {
      target.status = 'banned';
      handleBanPhone(target.reportedPhone);
    } else {
      target.status = 'dismissed';
    }

    saveReportedBrokers(existing);
    setReportedBrokers([...existing]);
  };

  // Handle Tab Switch Actions
  useEffect(() => {
    if (activeTab === 'post') {
      setIsPostModalOpen(true);
    } else if (activeTab === 'owner') {
      setIsOwnerManageModalOpen(true);
    } else if (activeTab === 'admin') {
      setIsAdminPanelOpen(true);
    } else if (activeTab === 'my-requests') {
      setIsMyRequestsModalOpen(true);
    }
  }, [activeTab]);

  // Add New Property (from PostHouseModal)
  const handleAddProperty = (newProp: Property) => {
    // If admin is posting, bypass pending status directly to active
    const finalProp: Property = {
      ...newProp,
      status: isAdminPosting || newProp.status === 'active' ? 'active' : 'pending',
    };

    const updated = [finalProp, ...properties.filter((p) => p.id !== finalProp.id)];
    updatePropertiesState(updated);

    // Save directly to Supabase
    savePropertyToSupabase(finalProp).catch((err) => {
      console.warn('Could not save property to Supabase:', err);
    });

    // If owner submitted with listing fee screenshot, create an unlock request for admin verification
    if (finalProp.status === 'pending' && finalProp.sellerPaymentScreenshotUrl) {
      const ownerListingReq: UnlockRequest = {
        id: `req-owner-${finalProp.id}`,
        type: 'owner_listing_fee',
        requestType: 'owner_listing_fee',
        propertyId: finalProp.id,
        propertyTitle: finalProp.title,
        propertyArea: finalProp.area,
        buyerName: finalProp.ownerName,
        buyerPhone: finalProp.ownerPhone,
        paymentMethod: 'telebirr',
        transactionRef: `OWNER-${finalProp.id.slice(-5)}`,
        screenshotUrl: finalProp.sellerPaymentScreenshotUrl,
        screenshotSizeKb: 80,
        status: 'pending',
        amountBirr: finalProp.sellerListingFeeBirr || 150,
        remainingUnlocks: 0,
        createdAt: new Date().toISOString(),
      };
      const updatedReqs = [ownerListingReq, ...unlockRequests.filter((r) => r.id !== ownerListingReq.id)];
      updateRequestsState(updatedReqs);
      saveUnlockRequestToSupabase(ownerListingReq).catch(console.warn);
    }

    showToast(
      currentLang === 'am'
        ? (finalProp.status === 'active'
            ? 'ቤቱ በቀጥታ ወደ ዝርዝሩ ተለጥፏል!'
            : 'የቤቱ መረጃ እና ክፍያ ተልኳል! አድሚኑ ሲፈትሸው ወደ ዝርዝር ይገባል።')
        : (finalProp.status === 'active'
            ? 'Property posted directly to live listings!'
            : 'House listing submitted! Will be live once admin verifies payment.')
    );
    setIsAdminPosting(false);
    setPrefilledOwnerPhone('');
    setActiveTab('browse');
  };

  // Submit Unlock or Package Request
  const handleSubmitUnlockRequest = (newReq: UnlockRequest) => {
    const updated = [newReq, ...unlockRequests.filter((r) => r.id !== newReq.id)];
    updateRequestsState(updated);
    if (newReq.buyerPhone) {
      setUserPhone(newReq.buyerPhone);
      saveUserPhone(newReq.buyerPhone);
    }

    // Save to Supabase immediately so admin panel on ANY device sees it!
    saveUnlockRequestToSupabase(newReq).catch((err) => {
      console.warn('Could not save unlock request to Supabase:', err);
    });

    showToast(
      currentLang === 'am'
        ? `${newReq.amountBirr || 150} ብር የከፈሉበት ስክሪንሽት ለአድሚኑ ተልኳል! እንደጸደቀ ይሰራልዎታል።`
        : `${newReq.amountBirr || 150} ETB receipt submitted! Activated once admin verifies.`
    );
  };

  // Admin Approve Request
  const handleApproveRequest = (requestId: string) => {
    const targetReq = unlockRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    const approvedReq: UnlockRequest = {
      ...targetReq,
      status: 'approved' as const,
      approvedAt: new Date().toISOString(),
    };

    const updated = unlockRequests.map((r) =>
      r.id === requestId ? approvedReq : r
    );
    updateRequestsState(updated);
    saveUnlockRequestToSupabase(approvedReq).catch(console.warn);

    // Process based on request type
    if (targetReq.type === 'owner_listing_fee' && targetReq.propertyId) {
      // Activate pending owner property
      const updatedProps = properties.map((p) =>
        p.id === targetReq.propertyId ? { ...p, status: 'active' as const } : p
      );
      updatePropertiesState(updatedProps);
      const approvedProp = updatedProps.find((p) => p.id === targetReq.propertyId);
      if (approvedProp) {
        savePropertyToSupabase(approvedProp).catch(console.warn);
      }
    } else {
      // User unlock request (5 homes in similar price range)
      // 1. Directly unlock the requested property if present
      if (targetReq.propertyId) {
        creditSinglePropertyUnlockToUser(targetReq.buyerPhone, targetReq.propertyId);
      }

      // 2. Identify the pricing tier and max price for this range
      const targetProp = properties.find((p) => p.id === targetReq.propertyId);
      const tier = targetProp
        ? getTierForProperty(targetProp.price, targetProp.listingType, targetProp.category)
        : PRICE_TIERS.find((t) => t.id === targetReq.packageTierId) || PRICE_TIERS[0];

      // 3. Grant the remaining 4 unlocks in this similar price tier
      const remainingCredits = targetReq.propertyId ? 4 : (targetReq.remainingUnlocks || 5);
      const result = creditPackageToUserPhone(
        targetReq.buyerPhone,
        (targetReq.packageTierId || tier.id) as any,
        remainingCredits,
        tier.maxPrice,
        tier.nameEn
      );

      const cleanBuyerPhone = targetReq.buyerPhone.replace(/[\s-]/g, '');
      if (
        result.updatedUser &&
        currentUser &&
        currentUser.phone.replace(/[\s-]/g, '') === cleanBuyerPhone
      ) {
        setCurrentUser(result.updatedUser);
      }

      if (result.updatedUser) {
        saveUserToSupabase(result.updatedUser).catch(console.warn);
      }
    }

    showToast(
      currentLang === 'am'
        ? 'ክፍያው ጸድቋል! ለተጠቃሚው አገልግሎቱ ተከፍቷል።'
        : 'Payment approved! Access granted to user.'
    );
  };

  // 1-Click unlock using an existing package credit
  const handleUseCreditToUnlock = (property: Property) => {
    if (!currentUser) {
      setIsUserAuthModalOpen(true);
      return;
    }
    const res = unlockPropertyWithCredit(currentUser.id, property.id, property.price);
    if (res.success && res.updatedUser) {
      setCurrentUser(res.updatedUser);
      saveUserToSupabase(res.updatedUser).catch(console.warn);
      saveUserUnlockedPropertyToSupabase(currentUser.phone, property.id).catch(console.warn);
      showToast(
        currentLang === 'am'
          ? `ተሳክቷል! የባለቤቱ ስልክ ተከፍቷል (${res.updatedUser.packages.reduce((sum, p) => sum + p.remainingUnlocks, 0)} ቀሪ ክሬዲት አለዎት)`
          : `Unlocked! Owner contact is now visible.`
      );
    } else {
      showToast(res.message);
      if (!res.success) {
        // Offer to buy package or unlock
        setSelectedPropertyForDetails(null);
        setSelectedPropertyForUnlock(property);
      }
    }
  };

  // Admin Reject Request
  const handleRejectRequest = (requestId: string, note?: string) => {
    const targetReq = unlockRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    const rejectedReq: UnlockRequest = {
      ...targetReq,
      status: 'rejected' as const,
      adminNote: note,
    };

    const updated = unlockRequests.map((r) =>
      r.id === requestId ? rejectedReq : r
    );
    updateRequestsState(updated);
    saveUnlockRequestToSupabase(rejectedReq).catch(console.warn);

    showToast(
      currentLang === 'am' ? 'ስክሪንሽቱ ውድቅ ተደርጓል።' : 'Screenshot rejected.'
    );
  };

  // Owner "Occupied" deal button
  const handleMarkOccupied = (propertyId: string) => {
    const updated = properties.map((p) =>
      p.id === propertyId ? { ...p, status: 'occupied' as const } : p
    );
    updatePropertiesState(updated);
    const prop = updated.find((p) => p.id === propertyId);
    if (prop) savePropertyToSupabase(prop).catch(console.warn);

    showToast(
      currentLang === 'am'
        ? 'የቤቱ ሁኔታ "ተከራይቷል/ተሽጧል" ተብሎ ተቀይሯል።'
        : 'House status changed to Occupied / Closed.'
    );
  };

  // Owner "Still Available (Renew 7 Days)" button
  const handleRenewProperty = (propertyId: string) => {
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const updated = properties.map((p) =>
      p.id === propertyId
        ? { ...p, status: 'active' as const, expiresAt: newExpiresAt, lastRenewedAt: new Date().toISOString() }
        : p
    );
    updatePropertiesState(updated);
    const prop = updated.find((p) => p.id === propertyId);
    if (prop) savePropertyToSupabase(prop).catch(console.warn);

    showToast(
      currentLang === 'am'
        ? 'ቤቱ ለተጨማሪ 7 ቀናት ታድሷል!'
        : 'House successfully renewed for another 7 days!'
    );
  };

  // Delete Property
  const handleDeleteProperty = (propertyId: string) => {
    const updated = properties.filter((p) => p.id !== propertyId);
    updatePropertiesState(updated);
    deletePropertyFromSupabase(propertyId).catch(console.warn);
    showToast(
      currentLang === 'am' ? 'ቤቱ ከዳታቤዝ ተሰርዟል።' : 'Property deleted from database.'
    );
  };

  // Auto-Cleanup of expired listings (>7 days)
  const handleAutoCleanExpired = () => {
    const { cleanedListings, removedCount } = cleanupExpiredListings(properties);
    updatePropertiesState(cleanedListings);
    showToast(
      currentLang === 'am'
        ? `የ 7 ቀን ገደብ የጨረሱ ${removedCount} ቤቶች ቦታ ለመቆጠብ ተሰርዘዋል።`
        : `Cleaned up ${removedCount} expired listings to save storage space.`
    );
  };

  // Save Settings
  const handleSaveSettings = (newSettings: PaymentSettings) => {
    setPaymentSettings(newSettings);
    saveSettings(newSettings);
    showToast(
      currentLang === 'am' ? 'የክፍያ ቅንብሮች ተቀምጠዋል!' : 'Payment settings updated!'
    );
  };

  // Filtered Properties Computation
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // Category filter (if property has category, match selectedCategory, default 'home')
      const propCategory = p.category || 'home';
      if (propCategory !== selectedCategory) {
        return false;
      }

      // Area filter
      if (selectedArea !== 'all') {
        const matchArea =
          p.area.toLowerCase() === selectedArea.toLowerCase() ||
          (p.areaAm && p.areaAm === selectedArea);
        if (!matchArea) return false;
      }

      // Property type filter
      if (selectedType !== 'all' && p.propertyType !== selectedType) {
        return false;
      }

      // Listing type filter (Rent vs Sale)
      if (selectedListingType !== 'all' && p.listingType !== selectedListingType) {
        return false;
      }

      // Max price filter
      if (maxPrice > 0 && p.price > maxPrice) {
        return false;
      }

      // Bedrooms filter
      if (selectedBedrooms !== 'all') {
        const bedNum = Number(selectedBedrooms);
        if (selectedBedrooms === '0' && p.bedrooms !== 0) return false;
        if (selectedBedrooms === '4' && (!p.bedrooms || p.bedrooms < 4)) return false;
        if (selectedBedrooms !== '4' && selectedBedrooms !== '0' && p.bedrooms !== bedNum) return false;
      }

      // Available only filter
      if (onlyAvailable && p.status !== 'active') {
        return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(query);
        const matchTitleAm = p.titleAm?.toLowerCase().includes(query);
        const matchArea = p.area.toLowerCase().includes(query);
        const matchAreaAm = p.areaAm?.toLowerCase().includes(query);
        const matchDesc = p.description.toLowerCase().includes(query);
        const matchDescAm = p.descriptionAm?.toLowerCase().includes(query);
        const matchExact = p.exactLandmark?.toLowerCase().includes(query);

        if (!matchTitle && !matchTitleAm && !matchArea && !matchAreaAm && !matchDesc && !matchDescAm && !matchExact) {
          return false;
        }
      }

      return true;
    });
  }, [
    properties,
    selectedCategory,
    selectedArea,
    selectedType,
    selectedListingType,
    maxPrice,
    selectedBedrooms,
    onlyAvailable,
    searchQuery,
  ]);

  const resetFilters = () => {
    setSelectedArea('all');
    setSelectedType('all');
    setSelectedListingType('all');
    setMaxPrice(0);
    setSelectedBedrooms('all');
    setSearchQuery('');
    setOnlyAvailable(true);
  };

  const pendingApprovalsCount = unlockRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 transition-colors">
      {/* Top Navbar */}
      <Navbar
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        theme={theme}
        onToggleTheme={toggleTheme}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={pendingApprovalsCount}
        userPhone={userPhone}
        currentUser={currentUser}
        onOpenUserPhoneModal={() => setIsMyRequestsModalOpen(true)}
        onOpenUserAuthModal={() => setIsUserAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Welcome Dashboard & Filter Header */}
        <WelcomeDashboard
          currentLang={currentLang}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedArea={selectedArea}
          setSelectedArea={setSelectedArea}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedListingType={selectedListingType}
          setSelectedListingType={setSelectedListingType}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          selectedBedrooms={selectedBedrooms}
          setSelectedBedrooms={setSelectedBedrooms}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onlyAvailable={onlyAvailable}
          setOnlyAvailable={setOnlyAvailable}
          onResetFilters={resetFilters}
          totalListingsCount={filteredProperties.length}
          onPostHouseClick={() => setIsPostModalOpen(true)}
          onOpenOwnerManage={() => setIsOwnerManageModalOpen(true)}
          currentUser={currentUser}
          onOpenUserAuthModal={() => setIsUserAuthModalOpen(true)}
          onViewRequestsClick={() => setIsUserAuthModalOpen(true)}
        />

        {/* Listings Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
                <span>{t.browseHouses}</span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300/40 dark:border-emerald-800">
                  {filteredProperties.length}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                {currentLang === 'am'
                  ? 'ቦሌ፣ ገርጂ፣ ቡልቡላ፣ መገናኛ፣ ሲኤምሲ እና ሌሎች አካባቢዎች'
                  : 'Bole, Gerji, Bulbula, Megenagna, CMC and other neighborhoods'}
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs font-bold"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{currentLang === 'am' ? '+ ቤት ያስመዝግቡ' : '+ Post House'}</span>
              </button>
              <button
                onClick={() => setIsOwnerManageModalOpen(true)}
                className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
              >
                <KeyRound className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                <span>{currentLang === 'am' ? 'የተከራዩ ቤቶችን ማስተካከል' : 'Manage Owner Deals'}</span>
              </button>
            </div>
          </div>

          {/* Properties Grid / Clean Empty State */}
          {filteredProperties.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 sm:p-12 text-center border border-stone-200 dark:border-stone-800 shadow-sm max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 mb-2">
                {properties.length === 0
                  ? currentLang === 'am'
                    ? 'እስካሁን የተመዘገበ ቤት የለም'
                    : 'No Houses Listed Yet'
                  : t.noHousesFound}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
                {properties.length === 0
                  ? currentLang === 'am'
                    ? 'የመጀመሪያውን ቤት ወይም አፓርታማ አሁኑኑ ያስመዝግቡ! ፎቶዎች በትንሽ ዳታ ወዲያውኑ ይጫናሉ።'
                    : 'Be the first to list a house or apartment! Compressed photos load instantly.'
                  : currentLang === 'am'
                  ? 'የተመረጠውን አካባቢ ወይም የቤት አይነት በመቀየር እንደገና ይሞክሩ።'
                  : 'Try adjusting your area or bedroom filters.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {properties.length === 0 ? (
                  <button
                    onClick={() => setIsPostModalOpen(true)}
                    className="w-full sm:w-auto py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{currentLang === 'am' ? '+ የመጀመሪያውን ቤት ያስመዝግቡ' : '+ Post First House'}</span>
                  </button>
                ) : (
                  <button
                    onClick={resetFilters}
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {t.clearFilters}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {filteredProperties.map((property) => {
                const isUnlocked = isPropertyUnlockedForBuyer(
                  property.id,
                  userPhone,
                  unlockRequests
                );

                return (
                  <HouseCard
                    key={property.id}
                    property={property}
                    currentLang={currentLang}
                    isUnlocked={isUnlocked}
                    onOpenDetails={(p) => setSelectedPropertyForDetails(p)}
                    onOpenUnlockModal={(p) => setSelectedPropertyForUnlock(p)}
                    onOpenOwnerManageForProperty={(p) => {
                      setSelectedPropertyForOwnerManage(p);
                      setIsOwnerManageModalOpen(true);
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-300 py-10 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-lg text-white block">{t.appTitle}</span>
                <span className="text-xs text-stone-400">{t.tagline}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-stone-400">
              <span>Bole (ቦሌ)</span>
              <span>•</span>
              <span>Gerji (ገርጂ)</span>
              <span>•</span>
              <span>Bulbula (ቡልቡላ)</span>
              <span>•</span>
              <span>Megenagna (መገናኛ)</span>
              <span>•</span>
              <span>CMC (ሲኤምሲ)</span>
              <span>•</span>
              <span>Ayat (አያት)</span>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
            <p>© 2026 BetDelala. {currentLang === 'am' ? 'የኢትዮጵያ ቤት ደላላ መተግበሪያ።' : 'Addis Ababa House Brokerage.'}</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setIsAdminPanelOpen(true);
                }}
                className="hover:text-emerald-400 cursor-pointer flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.adminPanel}</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Button for Mobile Post */}
      <div className="fixed bottom-5 right-5 z-30 sm:hidden">
        <button
          onClick={() => {
            setActiveTab('post');
            setIsPostModalOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl flex items-center justify-center active:scale-95 transition-all"
        >
          <PlusCircle className="w-7 h-7" />
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODALS */}
      {/* 1. House Detail Modal */}
      <HouseDetailModal
        property={selectedPropertyForDetails}
        isOpen={!!selectedPropertyForDetails}
        onClose={() => setSelectedPropertyForDetails(null)}
        currentLang={currentLang}
        currentUser={currentUser}
        onUseCreditToUnlock={handleUseCreditToUnlock}
        isUnlocked={
          selectedPropertyForDetails
            ? Boolean(
                currentUser?.unlockedPropertyIds?.includes(selectedPropertyForDetails.id) ||
                isPropertyUnlockedForBuyer(
                  selectedPropertyForDetails.id,
                  userPhone,
                  unlockRequests
                )
              )
            : false
        }
        onOpenUnlockModal={(prop) => {
          setSelectedPropertyForDetails(null);
          setSelectedPropertyForUnlock(prop);
        }}
        onOpenOwnerPortalForThisHouse={(prop) => {
          setSelectedPropertyForDetails(null);
          setSelectedPropertyForOwnerManage(prop);
          setIsOwnerManageModalOpen(true);
        }}
        onOpenReportModal={(prop) => {
          setSelectedPropertyForReport(prop);
          setIsReportModalOpen(true);
        }}
      />

      {/* 2. Post House Modal (Owner & Admin Direct) */}
      <PostHouseModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setIsAdminPosting(false);
          setPrefilledOwnerPhone('');
          if (activeTab === 'post') setActiveTab('browse');
        }}
        currentLang={currentLang}
        onAddProperty={handleAddProperty}
        isAdminMode={isAdminPosting}
        initialOwnerPhone={prefilledOwnerPhone}
      />

      {/* 3. Unlock Payment & Package Purchase Modal */}
      <UnlockPaymentModal
        property={selectedPropertyForUnlock}
        isOpen={!!selectedPropertyForUnlock}
        onClose={() => setSelectedPropertyForUnlock(null)}
        currentLang={currentLang}
        paymentSettings={paymentSettings}
        userPhone={userPhone}
        currentUser={currentUser}
        onOpenUserAuthModal={() => setIsUserAuthModalOpen(true)}
        onSubmitUnlockRequest={handleSubmitUnlockRequest}
      />

      {/* 4. Owner Management Modal (Occupied deal & 7-day renewal & Add New Home) */}
      <OwnerManageModal
        isOpen={isOwnerManageModalOpen}
        onClose={() => {
          setIsOwnerManageModalOpen(false);
          setSelectedPropertyForOwnerManage(null);
          if (activeTab === 'owner') setActiveTab('browse');
        }}
        currentLang={currentLang}
        properties={properties}
        onMarkOccupied={handleMarkOccupied}
        onRenewProperty={handleRenewProperty}
        onDeleteProperty={handleDeleteProperty}
        initialProperty={selectedPropertyForOwnerManage}
        onAddNewHome={(ownerPhone) => {
          setIsOwnerManageModalOpen(false);
          setPrefilledOwnerPhone(ownerPhone || '');
          setIsAdminPosting(false);
          setIsPostModalOpen(true);
        }}
      />

      {/* 5. Admin Panel Modal */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => {
          setIsAdminPanelOpen(false);
          if (activeTab === 'admin') setActiveTab('browse');
        }}
        currentLang={currentLang}
        properties={properties}
        unlockRequests={unlockRequests}
        paymentSettings={paymentSettings}
        reportedBrokers={reportedBrokers}
        bannedPhones={bannedPhones}
        onApproveRequest={handleApproveRequest}
        onRejectRequest={handleRejectRequest}
        onSaveSettings={handleSaveSettings}
        onAutoCleanExpired={handleAutoCleanExpired}
        onDeleteProperty={handleDeleteProperty}
        onMarkOccupied={handleMarkOccupied}
        onBanPhone={handleBanPhone}
        onUnbanPhone={handleUnbanPhone}
        onResolveReport={handleResolveReport}
        onManualSync={syncFromSupabase}
        onOpenPostPropertyAsAdmin={() => {
          setIsAdminPanelOpen(false);
          setIsAdminPosting(true);
          setIsPostModalOpen(true);
        }}
      />

      {/* 6. My Requests & Unlocked Contacts Modal */}
      <MyRequestsModal
        isOpen={isMyRequestsModalOpen}
        onClose={() => {
          setIsMyRequestsModalOpen(false);
          if (activeTab === 'my-requests') setActiveTab('browse');
        }}
        currentLang={currentLang}
        userPhone={userPhone}
        onUpdateUserPhone={(phone) => {
          setUserPhone(phone);
          saveUserPhone(phone);
          showToast(currentLang === 'am' ? 'ስልክ ቁጥር ተቀምጧል' : 'Phone number saved');
        }}
        unlockRequests={unlockRequests}
        properties={properties}
        onOpenHouseDetail={(prop) => setSelectedPropertyForDetails(prop)}
      />

      {/* 7. Anti-Delala Report Modal */}
      <ReportBrokerModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedPropertyForReport(null);
        }}
        currentLang={currentLang}
        targetProperty={selectedPropertyForReport}
        onReportSubmitted={() => {
          setReportedBrokers(getStoredReportedBrokers());
          showToast(
            currentLang === 'am'
              ? 'ጥቆማዎ ደርሶናል! ጥፋተኛው በአስተዳዳሪው ወዲያውኑ ይታገዳል።'
              : 'Report submitted! The offender will be reviewed and blacklisted.'
          );
        }}
      />

      {/* 8. User Account & Package Management Modal */}
      <UserAuthModal
        isOpen={isUserAuthModalOpen}
        onClose={() => setIsUserAuthModalOpen(false)}
        currentLang={currentLang}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setUserPhone(user.phone);
          saveUserPhone(user.phone);
          showToast(currentLang === 'am' ? `እንኳን ደህና መጡ ${user.name}!` : `Welcome ${user.name}!`);
        }}
        onLogout={() => {
          clearActiveUserSession();
          setCurrentUser(null);
          showToast(currentLang === 'am' ? 'በተሳካ ሁኔታ ወጥተዋል' : 'Logged out successfully');
        }}
        unlockedProperties={properties.filter((p) => currentUser?.unlockedPropertyIds?.includes(p.id))}
        onOpenPropertyDetails={(prop) => {
          setIsUserAuthModalOpen(false);
          setSelectedPropertyForDetails(prop);
        }}
        onOpenBuyPackageModal={() => {
          setIsUserAuthModalOpen(false);
          setSelectedPropertyForUnlock(properties[0] || null);
        }}
      />
    </div>
  );
}
