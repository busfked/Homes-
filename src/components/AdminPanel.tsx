import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Eye, 
  EyeOff,
  DollarSign, 
  Clock, 
  Building, 
  Trash2, 
  RefreshCw, 
  Settings, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Database, 
  ExternalLink,
  Lock,
  Sparkles,
  Search,
  ShieldAlert,
  Ban,
  UserX,
  Phone,
  Users,
  UserCheck,
  Plus,
  LogOut,
  ZoomIn,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Property, UnlockRequest, PaymentSettings, Language, ReportedBroker, UserAccount, Review } from '../types';
import { translations } from '../data/translations';
import { ErrorBoundary } from './ErrorBoundary';
import { 
  SUPABASE_SQL_SCHEMA, 
  cleanupExpiredListings, 
  getDaysRemaining, 
  getStoredUsers, 
  deleteUserAccount, 
  cleanInactiveUsers,
  getSupabaseConfig,
  saveSupabaseConfig,
  updateAdminPin
} from '../utils/storage';
import { 
  testSupabaseConnection, 
  resetSupabaseClient, 
  savePropertyToSupabase, 
  saveUnlockRequestToSupabase, 
  saveUserToSupabase,
  fetchUnlockRequestScreenshot
} from '../utils/supabaseClient';
import { formatFileSize } from '../utils/imageCompressor';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  properties: Property[];
  unlockRequests: UnlockRequest[];
  paymentSettings: PaymentSettings;
  reportedBrokers?: ReportedBroker[];
  bannedPhones?: string[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string, note?: string) => void;
  onSaveSettings: (settings: PaymentSettings) => void;
  onAutoCleanExpired: () => void;
  onDeleteProperty: (propertyId: string) => void;
  onMarkOccupied: (propertyId: string) => void;
  onTogglePropertyStatus?: (propertyId: string, targetStatus: 'active' | 'occupied' | 'pending') => void;
  onApproveProperty?: (propertyId: string) => void;
  onRejectProperty?: (propertyId: string) => void;
  onApproveAllPendingProperties?: () => void;
  onDeleteRequest?: (requestId: string) => void;
  onWipeAllTestData?: () => Promise<void>;
  onBanPhone?: (phone: string) => void;
  onUnbanPhone?: (phone: string) => void;
  onResolveReport?: (reportId: string, action: 'ban' | 'dismiss') => void;
  onManualSync?: () => Promise<void>;
  onOpenPostPropertyAsAdmin?: () => void;
  reviews?: Review[];
  onToggleReviewApproval?: (reviewId: string) => void;
  onDeleteReview?: (reviewId: string) => void;
  onDeleteAllReviews?: () => Promise<void> | void;
  initialTab?: 'pending' | 'inventory' | 'users' | 'reviews' | 'antifraud' | 'settings' | 'deploy';
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  currentLang,
  properties,
  unlockRequests,
  paymentSettings,
  reportedBrokers = [],
  bannedPhones = [],
  onApproveRequest,
  onRejectRequest,
  onSaveSettings,
  onAutoCleanExpired,
  onDeleteProperty,
  onMarkOccupied,
  onTogglePropertyStatus,
  onApproveProperty,
  onRejectProperty,
  onApproveAllPendingProperties,
  onDeleteRequest,
  onWipeAllTestData,
  onBanPhone,
  onUnbanPhone,
  onResolveReport,
  onManualSync,
  onOpenPostPropertyAsAdmin,
  reviews = [],
  onToggleReviewApproval,
  onDeleteReview,
  onDeleteAllReviews,
  initialTab,
}) => {
  if (!isOpen) return null;

  const t = translations[currentLang];
  const [isSyncingLive, setIsSyncingLive] = useState(false);

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Admin Sub-Tab & 3-Dot Navigation
  const [activeAdminTab, setActiveAdminTab] = useState<'pending' | 'inventory' | 'users' | 'reviews' | 'antifraud' | 'settings' | 'deploy'>(initialTab || 'pending');
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isMetricsCompact, setIsMetricsCompact] = useState(true);
  const [depositFilter, setDepositFilter] = useState<'all' | 'owners' | 'users'>('all');
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [spaceNotice, setSpaceNotice] = useState<string | null>(null);

  // Reviews deletion state
  const [deleteConfirmReviewId, setDeleteConfirmReviewId] = useState<string | null>(null);
  const [showDeleteAllReviewsModal, setShowDeleteAllReviewsModal] = useState(false);
  const [isDeletingReviews, setIsDeletingReviews] = useState(false);

  // Deletion and wipe state
  const [deleteConfirmUserPhone, setDeleteConfirmUserPhone] = useState<string | null>(null);
  const [deleteConfirmRequestId, setDeleteConfirmRequestId] = useState<string | null>(null);
  const [deleteConfirmPropertyId, setDeleteConfirmPropertyId] = useState<string | null>(null);
  const [showWipeDataModal, setShowWipeDataModal] = useState(false);
  const [isWipingData, setIsWipingData] = useState(false);
  const [wipeDataSuccessMsg, setWipeDataSuccessMsg] = useState('');

  // Hide/Show balance toggle with localStorage persistence
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('betdelala_hide_admin_balance') === 'true';
    } catch {
      return false;
    }
  });

  const toggleHideBalance = () => {
    setIsBalanceHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('betdelala_hide_admin_balance', String(next));
      } catch {}
      return next;
    });
  };

  // Owner ID verification modal state
  const [viewingOwnerId, setViewingOwnerId] = useState<{
    idUrl: string;
    ownerName: string;
    ownerPhone: string;
    title: string;
  } | null>(null);

  // Manual ban input
  const [manualBanPhone, setManualBanPhone] = useState('');
  const [banSuccessMsg, setBanSuccessMsg] = useState('');

  // Screenshot viewer modal
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);
  const [loadingScreenshotId, setLoadingScreenshotId] = useState<string | null>(null);

  const handleOpenScreenshot = async (req: UnlockRequest) => {
    if (req.screenshotUrl) {
      setViewingScreenshot(req.screenshotUrl);
      return;
    }
    setLoadingScreenshotId(req.id);
    try {
      const url = await fetchUnlockRequestScreenshot(req.id);
      if (url) {
        setViewingScreenshot(url);
      } else {
        alert(currentLang === 'am' ? 'ደረሰኝ አልተገኘም ወይም አልተጫነም' : 'Receipt image not found or not uploaded');
      }
    } catch {
      alert(currentLang === 'am' ? 'ደረሰኙን ማምጣት አልተቻለም' : 'Failed to fetch receipt');
    } finally {
      setLoadingScreenshotId(null);
    }
  };

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<PaymentSettings>({ ...paymentSettings });
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Dedicated Change Password state
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Keep settings form synced if paymentSettings props change
  React.useEffect(() => {
    setSettingsForm({ ...paymentSettings });
  }, [paymentSettings]);

  // Keep registered users synced
  const refreshUserList = () => {
    setRegisteredUsers(getStoredUsers());
  };

  React.useEffect(() => {
    if (initialTab) {
      setActiveAdminTab(initialTab);
    }
  }, [initialTab]);

  React.useEffect(() => {
    refreshUserList();
  }, [isAdminLoggedIn, activeAdminTab]);

  const handleExecuteDeleteAllReviews = async () => {
    if (!onDeleteAllReviews) return;
    try {
      setIsDeletingReviews(true);
      await onDeleteAllReviews();
      setShowDeleteAllReviewsModal(false);
    } catch (err) {
      console.error('Error executing delete all reviews:', err);
    } finally {
      setIsDeletingReviews(false);
    }
  };

  const handleDeleteUser = (userIdOrPhone: string, userName: string) => {
    if (deleteConfirmUserPhone === userIdOrPhone) {
      deleteUserAccount(userIdOrPhone);
      refreshUserList();
      setDeleteConfirmUserPhone(null);
      setSpaceNotice(
        currentLang === 'am'
          ? `✓ ተጠቃሚ "${userName}" ተሰርዟል። የማከማቻ ቦታ ተቆጥቧል!`
          : `✓ User "${userName}" deleted. Database storage space saved!`
      );
      setTimeout(() => setSpaceNotice(null), 4000);
    } else {
      setDeleteConfirmUserPhone(userIdOrPhone);
      setTimeout(() => setDeleteConfirmUserPhone(null), 6000);
    }
  };

  const handleExecuteWipeData = async () => {
    setIsWipingData(true);
    try {
      if (onWipeAllTestData) {
        await onWipeAllTestData();
      }
      refreshUserList();
      setIsWipingData(false);
      setShowWipeDataModal(false);
      setWipeDataSuccessMsg(
        currentLang === 'am'
          ? '✓ ሁሉም የሙከራ ዳታዎች (ቤቶች፣ ተጠቃሚዎችና ክፍያዎች) በሙሉ ተሰርዘዋል! ለአዲሱ ፕሮሞ ዝግጁ ነው።'
          : '✓ All test data (listings, users, payments) wiped clean! Ready for promo launch.'
      );
      setTimeout(() => setWipeDataSuccessMsg(''), 8000);
    } catch (err) {
      console.warn('Wipe data failed:', err);
      setIsWipingData(false);
    }
  };

  const handleCleanInactiveUsers = () => {
    const res = cleanInactiveUsers();
    refreshUserList();
    setSpaceNotice(
      currentLang === 'am'
        ? `✓ ${res.removedCount} ንቁ ያልሆኑ ተጠቃሚዎች ተሰርዘዋል። የማከማቻ ቦታ ተቆጥቧል!`
        : `✓ Cleaned ${res.removedCount} inactive users from database. Supabase space saved!`
    );
    setTimeout(() => setSpaceNotice(null), 4000);
  };

  // Supabase SQL copy state
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedTruncateSql, setCopiedTruncateSql] = useState(false);
  const TRUNCATE_SQL = `-- Run this in your Supabase SQL Editor to wipe all test/demo records & reset earnings to 0:
TRUNCATE TABLE unlock_requests, properties, users, user_unlocked_properties, user_packages CASCADE;`;

  const handleCopyTruncateSql = () => {
    navigator.clipboard.writeText(TRUNCATE_SQL);
    setCopiedTruncateSql(true);
    setTimeout(() => setCopiedTruncateSql(false), 3000);
  };
  const [searchFilter, setSearchFilter] = useState('');

  // Supabase live connection testing states
  const initialSupabaseConfig = getSupabaseConfig();
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(initialSupabaseConfig.url || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(initialSupabaseConfig.anonKey || '');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
    hasTables: boolean;
  } | null>(null);
  const [isPushingData, setIsPushingData] = useState(false);
  const [pushStatusMsg, setPushStatusMsg] = useState<string | null>(null);

  // Metrics
  const pendingRequests = unlockRequests.filter((r) => r.status === 'pending');
  const approvedRequests = unlockRequests.filter((r) => r.status === 'approved');
  const totalRevenueEtb = approvedRequests.reduce((sum, r) => sum + (r.amountBirr || 50), 0);
  const activeHouses = properties.filter((p) => p.status === 'active');
  const pendingHouses = properties.filter((p) => p.status === 'pending' || p.status === 'pending_approval');
  const occupiedHouses = properties.filter((p) => p.status === 'occupied');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'all' | 'pending' | 'active' | 'occupied'>('all');
  const expiredHouses = properties.filter((p) => {
    const { isExpired } = getDaysRemaining(p.expiresAt);
    return isExpired || p.status === 'expired';
  });
  const pendingReports = reportedBrokers.filter((r) => r.status === 'pending_review');

  // Separated deposits
  const ownerRequests = unlockRequests.filter((r) => r.type === 'owner_listing_fee');
  const userRequests = unlockRequests.filter((r) => r.type !== 'owner_listing_fee');
  const ownerPending = ownerRequests.filter((r) => r.status === 'pending');
  const userPending = userRequests.filter((r) => r.status === 'pending');

  const displayedRequests = unlockRequests.filter((r) => {
    if (depositFilter === 'owners') return r.type === 'owner_listing_fee';
    if (depositFilter === 'users') return r.type !== 'owner_listing_fee';
    return true;
  });

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEntered = enteredPin.trim();
    const activeConfiguredPin = (paymentSettings?.adminPin || settingsForm?.adminPin || '6121921b').trim();

    // Strict authentication: Only accepts the active admin password or default '6121921b'.
    // Old temporary fallback '1234' and 'admin123' have been completely removed.
    if (cleanEntered === activeConfiguredPin || cleanEntered === '6121921b') {
      setIsAdminLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError(
        currentLang === 'am'
          ? 'የተሳሳተ የአድሚን ሚስጥር ቃል/PIN። እባክዎ ትክክለኛውን ፓስወርድ ያስገቡ።'
          : 'Invalid admin password. Please enter the correct password.'
      );
    }
  };

  const handleChangePasswordDirectly = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMsg('');
    setPasswordChangeError('');

    if (!newAdminPassword.trim()) {
      setPasswordChangeError(
        currentLang === 'am' ? 'እባክዎ አዲሱን ሚስጥር ቁጥር ያስገቡ።' : 'Please enter a new password/PIN.'
      );
      return;
    }

    if (newAdminPassword.trim().length < 4) {
      setPasswordChangeError(
        currentLang === 'am'
          ? 'ሚስጥር ቁጥሩ ቢያንስ 4 ፊደላት ወይም ቁጥሮች መሆን አለበት።'
          : 'Password must be at least 4 characters long.'
      );
      return;
    }

    if (newAdminPassword.trim() !== confirmAdminPassword.trim()) {
      setPasswordChangeError(
        currentLang === 'am'
          ? 'የተደገመው ሚስጥር ቁጥር አይመሳሰልም። እባክዎ ያረጋግጡ።'
          : 'Passwords do not match. Please re-check.'
      );
      return;
    }

    const cleanNewPass = newAdminPassword.trim();
    const updatedSettings: PaymentSettings = {
      ...paymentSettings,
      ...settingsForm,
      adminPin: cleanNewPass,
    };

    setSettingsForm(updatedSettings);
    onSaveSettings(updatedSettings);
    updateAdminPin(cleanNewPass);

    setPasswordChangeMsg(
      currentLang === 'am'
        ? '✓ የአድሚን ሚስጥር ቁጥር በተሳካ ሁኔታ ተቀይሯል!'
        : '✓ Admin password changed successfully!'
    );
    setNewAdminPassword('');
    setConfirmAdminPassword('');

    setTimeout(() => {
      setPasswordChangeMsg('');
    }, 4000);
  };

  const handleManualBanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBanPhone.trim()) return;
    if (onBanPhone) {
      onBanPhone(manualBanPhone.trim());
      setBanSuccessMsg(
        currentLang === 'am'
          ? `${manualBanPhone} በቋሚነት ታግዷል!`
          : `${manualBanPhone} successfully blacklisted!`
      );
      setManualBanPhone('');
      setTimeout(() => setBanSuccessMsg(''), 3000);
    }
  };


  const handleApproveWithCelebration = (requestId: string) => {
    onApproveRequest(requestId);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  const handleTestAndSaveSupabase = async () => {
    const cleanUrl = supabaseUrlInput.trim();
    const cleanKey = supabaseKeyInput.trim();
    if (!cleanUrl || !cleanKey) {
      setConnectionStatus({
        success: false,
        message: currentLang === 'am' ? 'እባክዎ ሁለቱንም የ Supabase URL እና Anon Key ያስገቡ።' : 'Please provide both your Supabase Project URL and Anon Key.',
        hasTables: false,
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus(null);
    try {
      saveSupabaseConfig({ url: cleanUrl, anonKey: cleanKey, isEnabled: true });
      resetSupabaseClient();
      const res = await testSupabaseConnection();
      setConnectionStatus(res);
      if (res.success && onManualSync) {
        onManualSync();
      }
    } catch (err: any) {
      setConnectionStatus({
        success: false,
        message: `Connection failed: ${err?.message || 'Network error'}`,
        hasTables: false,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handlePushLocalDataToSupabase = async () => {
    setIsPushingData(true);
    setPushStatusMsg(null);
    try {
      let savedProps = 0;
      for (const prop of properties) {
        const ok = await savePropertyToSupabase(prop);
        if (ok) savedProps++;
      }
      for (const req of unlockRequests) {
        await saveUnlockRequestToSupabase(req);
      }
      for (const user of registeredUsers) {
        await saveUserToSupabase(user);
      }
      setPushStatusMsg(
        currentLang === 'am'
          ? `✓ ${savedProps} ቤቶች፣ የክፍያ ጥያቄዎች እና ተጠቃሚዎች ወደ Supabase ዳታቤዝዎ ተልከዋል!`
          : `✓ Successfully synced ${savedProps} listings, unlock requests & users directly to your Supabase database!`
      );
    } catch (err: any) {
      setPushStatusMsg(`Push failed: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsPushingData(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(settingsForm);
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        id="admin-panel-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col h-[94vh] sm:h-[90vh]"
      >
        {/* Admin Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-950 text-white gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 truncate">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight truncate">{t.adminTitle}</h2>
                <span className="hidden sm:inline-block bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                  Live Direct Deals Ops
                </span>
              </div>
              <p className="text-[11px] text-stone-400 truncate">{t.adminSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && onManualSync && (
              <button
                onClick={async () => {
                  setIsSyncingLive(true);
                  try {
                    await onManualSync();
                  } finally {
                    setTimeout(() => setIsSyncingLive(false), 800);
                  }
                }}
                disabled={isSyncingLive}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
                title="Sync live from Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLive ? 'animate-spin' : ''}`} />
                <span>{isSyncingLive ? 'Syncing...' : '🔄 Supabase Sync'}</span>
              </button>
            )}

            {isAdminLoggedIn && (
              <button
                onClick={() => setIsAdminLoggedIn(false)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title={t.logoutAdmin}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{currentLang === 'am' ? 'ውጣ (Logout)' : 'Log Out'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-stone-850 hover:bg-stone-800 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isAdminLoggedIn ? (
          /* LOGIN SCREEN */
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto my-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-stone-900 dark:text-stone-100">{t.adminTitle}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{t.enterAdminPin}</p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input
                type="password"
                required
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-sm shadow-md transition-all cursor-pointer"
              >
                {t.loginAdmin}
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Screen-Fitting Compact Metrics Bar (with toggle for full cards) */}
            <div className="px-4 py-2.5 sm:px-6 bg-stone-50 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold flex-wrap">
                  {/* Revenue pill */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-2xs">
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-semibold">{t.totalRevenue}:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {isBalanceHidden ? '•••• ETB' : `${totalRevenueEtb.toLocaleString()} ETB`}
                    </span>
                    <button
                      type="button"
                      onClick={toggleHideBalance}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 ml-0.5 cursor-pointer"
                      title={isBalanceHidden ? 'Show' : 'Hide'}
                    >
                      {isBalanceHidden ? <EyeOff className="w-3 h-3 text-amber-500" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Pending Payments pill */}
                  <button
                    type="button"
                    onClick={() => setActiveAdminTab('pending')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-colors cursor-pointer text-xs font-bold ${
                      activeAdminTab === 'pending'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-emerald-400'
                    }`}
                  >
                    <span className="text-[10px] text-stone-400">{t.pendingApprovals}:</span>
                    <span className={`font-mono font-black ${pendingRequests.length > 0 ? 'text-emerald-600 animate-pulse' : 'text-stone-600'}`}>
                      {pendingRequests.length}
                    </span>
                  </button>

                  {/* Active listings pill */}
                  <button
                    type="button"
                    onClick={() => setActiveAdminTab('inventory')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-colors cursor-pointer text-xs font-bold ${
                      activeAdminTab === 'inventory'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-emerald-400'
                    }`}
                  >
                    <span className="text-[10px] text-stone-400">{t.activeHousesCount}:</span>
                    <span className="font-mono font-black text-stone-900 dark:text-stone-100">
                      {activeHouses.length}
                    </span>
                    {pendingHouses.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black animate-pulse">
                        {pendingHouses.length} {currentLang === 'am' ? 'ይጽደቁ' : 'pending'}
                      </span>
                    )}
                  </button>

                  {/* Occupied listings pill */}
                  <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
                    <span className="text-[10px] text-stone-400">{t.occupiedHousesCount}:</span>
                    <span className="font-mono font-black text-stone-700 dark:text-stone-300">
                      {occupiedHouses.length}
                    </span>
                  </div>
                </div>

                {/* Toggle full details view if needed */}
                <button
                  type="button"
                  onClick={() => setIsMetricsCompact(!isMetricsCompact)}
                  className="text-[11px] font-bold text-stone-500 hover:text-emerald-600 dark:text-stone-400 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer ml-auto"
                >
                  <span>{isMetricsCompact ? (currentLang === 'am' ? 'ካርዶችን አሳይ' : 'Expand') : (currentLang === 'am' ? 'አሳጥር' : 'Compact')}</span>
                  {isMetricsCompact ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded Detailed 4-Card View (shown only when expanded) */}
              {!isMetricsCompact && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 mt-2 border-t border-stone-200/60 dark:border-stone-800/60 animate-in fade-in">
                  <div className="bg-white dark:bg-stone-800 p-3 rounded-xl border border-stone-200 dark:border-stone-700 shadow-2xs">
                    <span className="text-[10px] text-stone-400 font-semibold block">{t.totalRevenue}</span>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-sans mt-0.5">
                      {isBalanceHidden ? '•••••• ETB' : `${totalRevenueEtb.toLocaleString()} ETB`}
                    </div>
                    <span className="text-[9px] text-stone-400">{approvedRequests.length} approvals</span>
                  </div>

                  <div className="bg-white dark:bg-stone-800 p-3 rounded-xl border border-stone-200 dark:border-stone-700 shadow-2xs">
                    <span className="text-[10px] text-stone-400 font-semibold block">{t.pendingApprovals}</span>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-sans mt-0.5">
                      {pendingRequests.length}
                    </div>
                    <span className="text-[9px] text-emerald-600">Pending screenshot verification</span>
                  </div>

                  <div className="bg-white dark:bg-stone-800 p-3 rounded-xl border border-stone-200 dark:border-stone-700 shadow-2xs">
                    <span className="text-[10px] text-stone-400 font-semibold block">{t.activeHousesCount}</span>
                    <div className="text-lg font-black text-stone-900 dark:text-stone-100 font-sans mt-0.5">
                      {activeHouses.length}
                    </div>
                    <span className="text-[9px] text-stone-400">Within 7-day window</span>
                  </div>

                  <div className="bg-white dark:bg-stone-800 p-3 rounded-xl border border-stone-200 dark:border-stone-700 shadow-2xs">
                    <span className="text-[10px] text-stone-400 font-semibold block">{t.occupiedHousesCount}</span>
                    <div className="text-lg font-black text-stone-800 dark:text-stone-200 font-sans mt-0.5">
                      {occupiedHouses.length}
                    </div>
                    <span className="text-[9px] text-stone-400">Deals closed</span>
                  </div>
                </div>
              )}
            </div>

            {/* Clean Responsive Navigation Bar with 3-Dot Selector */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 gap-2">
              {/* Left: Active Section Indicator & Quick Tabs */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
                {/* Active Section Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-black text-xs shrink-0 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {activeAdminTab === 'pending'
                      ? (currentLang === 'am' ? '💳 የክፍያ ማረጋገጫዎች' : '💳 Payment Approvals')
                      : activeAdminTab === 'inventory'
                      ? (currentLang === 'am' ? '🏠 የቤቶች ዝርዝር' : '🏠 Listings')
                      : activeAdminTab === 'users'
                      ? (currentLang === 'am' ? '👥 ተጠቃሚዎች እና ቦታ' : '👥 Users & Space')
                      : activeAdminTab === 'reviews'
                      ? (currentLang === 'am' ? '⭐ የደንበኞች አስተያየት' : '⭐ Customer Reviews')
                      : activeAdminTab === 'antifraud'
                      ? (currentLang === 'am' ? '🚨 ማጭበርበር መከላከያ' : '🚨 Anti-Fraud')
                      : activeAdminTab === 'settings'
                      ? (currentLang === 'am' ? '⚙️ ክፍያ ቁጥሮች' : '⚙️ Payment Settings')
                      : (currentLang === 'am' ? '🗄️ ሱፓቤዝ ዳታቤዝ' : '🗄️ Supabase DB')}
                  </span>
                </div>

                {/* Direct quick button: Payments */}
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeAdminTab === 'pending'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span>{t.pendingPaymentsTab}</span>
                  {pendingRequests.length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeAdminTab === 'pending' ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'}`}>
                      {pendingRequests.length}
                    </span>
                  )}
                </button>

                {/* Direct quick button: Inventory */}
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('inventory')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeAdminTab === 'inventory'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>{t.allListingsTab}</span>
                  {pendingHouses.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                      {pendingHouses.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Right: The Requested 3-DOT MENU BUTTON to Choose What You Want */}
              <div className="relative shrink-0">
                <button
                  id="btn-admin-nav-three-dots"
                  type="button"
                  onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                    isNavMenuOpen
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700'
                  }`}
                  title={currentLang === 'am' ? 'ክፍል ይምረጡ (3-Dot Menu)' : 'Choose section (3-Dot Menu)'}
                  aria-label="Choose admin section"
                >
                  <MoreVertical className="w-4 h-4 text-emerald-500" />
                  <span className="font-extrabold">{currentLang === 'am' ? 'ክፍል ምረጥ' : 'Sections'}</span>
                  {pendingReports.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>

                {/* Floating 3-Dot Menu Popover */}
                {isNavMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsNavMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500 border-b border-stone-100 dark:border-stone-800 mb-1 flex items-center justify-between">
                        <span>{currentLang === 'am' ? 'የአድሚን ክፍል ይምረጡ' : 'Choose Admin Section'}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">7 {currentLang === 'am' ? 'ክፍሎች' : 'Sections'}</span>
                      </div>
                      <div className="space-y-1">
                        {/* 1. Pending Payments */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAdminTab('pending');
                            setIsNavMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                            activeAdminTab === 'pending'
                              ? 'bg-emerald-600 text-white shadow-xs font-black'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <DollarSign className={`w-4 h-4 ${activeAdminTab === 'pending' ? 'text-white' : 'text-emerald-600'}`} />
                            <span className="truncate">{t.pendingPaymentsTab}</span>
                          </div>
                          {pendingRequests.length > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${activeAdminTab === 'pending' ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'}`}>
                              {pendingRequests.length}
                            </span>
                          )}
                        </button>

                        {/* 2. Listings & Approvals */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAdminTab('inventory');
                            setIsNavMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                            activeAdminTab === 'inventory'
                              ? 'bg-emerald-600 text-white shadow-xs font-black'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Building className={`w-4 h-4 ${activeAdminTab === 'inventory' ? 'text-white' : 'text-emerald-600'}`} />
                            <span className="truncate">{t.allListingsTab}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {pendingHouses.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                                {pendingHouses.length} {currentLang === 'am' ? 'ይጽደቁ' : 'pending'}
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeAdminTab === 'inventory' ? 'bg-white/30 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'}`}>
                              {properties.length}
                            </span>
                          </div>
                        </button>

                        {/* 3. Users & Space Saver */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAdminTab('users');
                            setIsNavMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                            activeAdminTab === 'users'
                              ? 'bg-emerald-600 text-white shadow-xs font-black'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Users className={`w-4 h-4 ${activeAdminTab === 'users' ? 'text-white' : 'text-emerald-600'}`} />
                            <span className="truncate">{currentLang === 'am' ? 'ተጠቃሚዎች እና ቦታ ቆጣቢ' : 'Users & Space Saver'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${activeAdminTab === 'users' ? 'bg-white text-emerald-700' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'}`}>
                            {registeredUsers.length}
                          </span>
                        </button>

                        {/* 4. Customer Reviews & Ratings */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAdminTab('reviews');
                            setIsNavMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                            activeAdminTab === 'reviews'
                              ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Star className={`w-4 h-4 ${activeAdminTab === 'reviews' ? 'text-stone-950 fill-stone-950' : 'text-amber-500 fill-amber-400'}`} />
                            <span className="truncate">{currentLang === 'am' ? 'የደንበኞች አስተያየት (Reviews)' : 'Customer Reviews'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${activeAdminTab === 'reviews' ? 'bg-stone-950 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'}`}>
                            {reviews.length}
                          </span>
                        </button>

                        {/* 5. Anti-Fraud */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAdminTab('antifraud');
                            setIsNavMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                            activeAdminTab === 'antifraud'
                              ? 'bg-rose-600 text-white shadow-xs font-black'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <ShieldAlert className={`w-4 h-4 ${activeAdminTab === 'antifraud' ? 'text-white' : 'text-rose-600'}`} />
                            <span className="truncate">{t.antiFraudTab}</span>
                          </div>
                          {pendingReports.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black shrink-0">
                              {pendingReports.length}
                            </span>
                          )}
                        </button>

                        {/* 5. Payment Settings */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAdminTab('settings');
                            setIsNavMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                            activeAdminTab === 'settings'
                              ? 'bg-emerald-600 text-white shadow-xs font-black'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Settings className={`w-4 h-4 ${activeAdminTab === 'settings' ? 'text-white' : 'text-stone-400'}`} />
                            <span className="truncate">{t.settingsTab}</span>
                          </div>
                        </button>

                        {/* 6. Deploy & Database */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAdminTab('deploy');
                            setIsNavMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                            activeAdminTab === 'deploy'
                              ? 'bg-emerald-600 text-white shadow-xs font-black'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Database className={`w-4 h-4 ${activeAdminTab === 'deploy' ? 'text-white' : 'text-emerald-600'}`} />
                            <span className="truncate">{t.deployTab}</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sub-Tab Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white dark:bg-stone-900">
              {/* TAB 1: PENDING PAYMENT SCREENSHOTS (100 / 500 ETB) */}
              {activeAdminTab === 'pending' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                        {currentLang === 'am' ? 'የሚገመገሙ የክፍያ ስክሪንሽቶች' : 'Payment Screenshots to Review'}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {currentLang === 'am'
                          ? 'የቤቱ ባለቤቶችና የተጠቃሚዎች ክፍያዎች ተለይተዋል'
                          : 'Owners listing deposits & users unlock deposits are separated'}
                      </p>
                    </div>

                    {/* Deposit Filter Buttons */}
                    <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold shrink-0">
                      <button
                        onClick={() => setDepositFilter('all')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          depositFilter === 'all'
                            ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                        }`}
                      >
                        {currentLang === 'am' ? 'ሁሉም ክፍያዎች' : 'All Deposits'} ({unlockRequests.length})
                      </button>

                      <button
                        onClick={() => setDepositFilter('owners')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          depositFilter === 'owners'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                        }`}
                      >
                        <span>🏠 {currentLang === 'am' ? 'የባለቤቶች ተቀማጭ' : 'Owner Deposits'}</span>
                        <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">
                          {ownerPending.length}
                        </span>
                      </button>

                      <button
                        onClick={() => setDepositFilter('users')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          depositFilter === 'users'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                        }`}
                      >
                        <span>👥 {currentLang === 'am' ? 'የተጠቃሚዎች ክፍያ' : 'User Deposits'}</span>
                        <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">
                          {userPending.length}
                        </span>
                      </button>
                    </div>
                  </div>

                  {spaceNotice && (
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{spaceNotice}</span>
                    </div>
                  )}

                  {displayedRequests.length === 0 ? (
                    <div className="text-center py-10 text-stone-500 dark:text-stone-400 text-xs sm:text-sm bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-800">
                      {depositFilter === 'owners'
                        ? (currentLang === 'am' ? 'ምንም የባለቤት ምዝገባ ተቀማጭ የለም።' : 'No owner listing deposits found.')
                        : depositFilter === 'users'
                        ? (currentLang === 'am' ? 'ምንም የተጠቃሚ ፓኬጅ ወይም ቁልፍ ክፍያ የለም።' : 'No user unlock deposits found.')
                        : (currentLang === 'am' ? 'ምንም የክፍያ ጥያቄ አልተገኘም።' : 'No unlock requests yet.')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayedRequests.map((req) => {
                        const targetProp = properties.find((p) => p.id === req.propertyId);

                        return (
                          <div
                            key={req.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              req.status === 'pending'
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/80 shadow-xs'
                                : req.status === 'approved'
                                ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 opacity-90'
                                : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 opacity-75'
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              {/* Left details */}
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-stone-900 dark:text-white text-sm sm:text-base">
                                    {req.buyerName}
                                  </span>
                                  <span className="font-mono font-bold text-emerald-900 dark:text-emerald-300 text-xs bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                                    📞 {req.buyerPhone}
                                  </span>
                                  {req.type === 'package_purchase' ? (
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                                      🎁 5-House Package ({req.packageTierId || 'Standard'})
                                    </span>
                                  ) : req.type === 'owner_listing_fee' ? (
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                      🏠 Owner Listing Fee
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                      🔑 Single Unlock
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                      req.status === 'pending'
                                        ? 'bg-emerald-600 text-white'
                                        : req.status === 'approved'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-rose-600 text-white'
                                    }`}
                                  >
                                    {req.status}
                                  </span>
                                </div>

                                <div className="text-xs text-stone-600 dark:text-stone-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                                  <span>
                                    <strong>Listing:</strong> {req.propertyTitle} ({req.propertyArea})
                                  </span>
                                  <span>
                                    <strong>Bank:</strong> {(req.paymentMethod || 'TELEBIRR').toUpperCase()}
                                  </span>
                                  <span>
                                    <strong>Ref:</strong> {req.transactionRef || 'N/A'}
                                  </span>
                                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                    <strong>Amount:</strong> {req.amountBirr || (targetProp?.listingType === 'sale' ? 500 : 100)} ETB
                                  </span>
                                </div>

                                {targetProp && (
                                  <div className="text-[11px] text-stone-500 dark:text-stone-400 bg-white/70 dark:bg-stone-800 p-2 rounded-lg border border-stone-200 dark:border-stone-700 flex flex-wrap items-center gap-2">
                                    <span>Owner: <strong>{targetProp.ownerName}</strong> • Phone: <strong>{targetProp.ownerPhone}</strong> (PIN: {targetProp.ownerPin})</span>
                                    {targetProp.nationalIdFrontUrl && (
                                      <button
                                        onClick={() => setViewingOwnerId({
                                          idUrl: targetProp.nationalIdFrontUrl!,
                                          ownerName: targetProp.ownerName,
                                          ownerPhone: targetProp.ownerPhone,
                                          title: targetProp.title
                                        })}
                                        className="py-0.5 px-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                      >
                                        <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                        <span>{currentLang === 'am' ? 'የባለቤት መታወቂያ መርምር' : 'Verify Owner ID'}</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Right: Screenshot preview & actions */}
                              <div className="flex items-center gap-3 shrink-0">
                                {/* Screenshot Thumbnail / On-Demand View */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenScreenshot(req)}
                                  disabled={loadingScreenshotId === req.id}
                                  className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 border border-stone-200 dark:border-stone-700 cursor-pointer shadow-2xs transition-colors shrink-0 disabled:opacity-50"
                                  title={t.viewReceipt}
                                >
                                  {loadingScreenshotId === req.id ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  )}
                                  <span>{t.viewReceipt || 'View Receipt'}</span>
                                </button>

                                {/* Action Buttons */}
                                {req.status === 'pending' ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleApproveWithCelebration(req.id)}
                                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                    >
                                      <Check className="w-4 h-4" />
                                      <span>{t.approveBtn}</span>
                                    </button>

                                    <button
                                      onClick={() => onRejectRequest(req.id, 'Invalid screenshot or amount')}
                                      className="py-2.5 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                      <span>{t.rejectBtn}</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-end gap-1.5 text-xs font-bold text-stone-500 dark:text-stone-400">
                                    {req.status === 'approved' ? (
                                      <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" /> Approved
                                      </span>
                                    ) : (
                                      <span className="text-rose-600 dark:text-rose-400">Rejected</span>
                                    )}

                                    <div className="flex items-center gap-1.5">
                                      {/* Delete User to Free Space after approval */}
                                      {req.type !== 'owner_listing_fee' && (
                                        <button
                                          onClick={() => handleDeleteUser(req.buyerPhone, req.buyerName)}
                                          className="py-1 px-2 bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-stone-600 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-300 border border-stone-200 dark:border-stone-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                          title="Delete this user from database to save space on Supabase"
                                        >
                                          <Trash2 className="w-3 h-3 text-rose-500" />
                                          <span>
                                            {deleteConfirmUserPhone === req.buyerPhone
                                              ? (currentLang === 'am' ? 'እርግጠኛ ነዎት?' : 'Confirm?')
                                              : (currentLang === 'am' ? 'ተጠቃሚ አጥፋ' : 'Delete user')}
                                          </span>
                                        </button>
                                      )}

                                      {/* Delete Request record */}
                                      {onDeleteRequest && (
                                        <button
                                          onClick={() => {
                                            if (deleteConfirmRequestId === req.id) {
                                              onDeleteRequest(req.id);
                                              setDeleteConfirmRequestId(null);
                                            } else {
                                              setDeleteConfirmRequestId(req.id);
                                              setTimeout(() => setDeleteConfirmRequestId(null), 5000);
                                            }
                                          }}
                                          className={`py-1 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                            deleteConfirmRequestId === req.id
                                              ? 'bg-rose-600 text-white'
                                              : 'bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 text-stone-500 hover:text-rose-600 border border-stone-200 dark:border-stone-700'
                                          }`}
                                          title="Delete this payment request record"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span>
                                            {deleteConfirmRequestId === req.id
                                              ? (currentLang === 'am' ? 'ይጥፋ?' : 'Confirm?')
                                              : (currentLang === 'am' ? 'ጥያቄውን ሰርዝ' : 'Delete Req')}
                                          </span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: REGISTERED USERS & FREE TIER SPACE CLEANUP */}
              {activeAdminTab === 'users' && (
                <div className="space-y-4">
                  {/* Space Optimization Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/60 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
                    <div>
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>{currentLang === 'am' ? 'የተመዘገቡ ተጠቃሚዎች እና የቦታ ቆጣቢ' : 'Registered Users & Free Tier Space Saver'}</span>
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {currentLang === 'am'
                          ? 'ተጠቃሚዎች አገልግሎት ከጨረሱ በኋላ ወይም ካልተንቀሳቀሱ በማጥፋት የ Supabase ነፃ ማከማቻ ቦታ ይቆጥቡ።'
                          : 'Delete users when no longer active or after deal completion to conserve your Supabase free tier space.'}
                      </p>
                    </div>

                    <button
                      onClick={handleCleanInactiveUsers}
                      className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{currentLang === 'am' ? 'ቦታ ቆጣቢ፦ ንቁ ያልሆኑትን አጽዳ' : 'Clean Inactive Users (Free Space)'}</span>
                    </button>
                  </div>

                  {spaceNotice && (
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{spaceNotice}</span>
                    </div>
                  )}

                  {/* Search Box */}
                  <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-850 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700">
                    <Search className="w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder={currentLang === 'am' ? 'ተጠቃሚ በስም ወይም በስልክ ቁጥር ፈልግ...' : 'Search user by name or phone...'}
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="bg-transparent text-xs sm:text-sm text-stone-900 dark:text-stone-100 w-full outline-hidden"
                    />
                    {userSearchTerm && (
                      <button onClick={() => setUserSearchTerm('')} className="text-xs text-stone-400 hover:text-stone-600 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Users List */}
                  {registeredUsers.length === 0 ? (
                    <div className="text-center py-10 text-stone-500 dark:text-stone-400 text-xs sm:text-sm bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-700">
                      {currentLang === 'am' ? 'ምንም የተመዘገበ ተጠቃሚ የለም።' : 'No registered users found in storage.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {registeredUsers
                        .filter(
                          (u) =>
                            u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                            u.phone.includes(userSearchTerm)
                        )
                        .map((u) => {
                          const totalRemaining = (u.packages || []).reduce(
                            (sum, p) => sum + (p.remainingUnlocks || 0),
                            0
                          );
                          const unlockedHousesCount = (u.unlockedPropertyIds || []).length;
                          const isInactive = totalRemaining === 0 && unlockedHousesCount === 0;

                          return (
                            <div
                              key={u.id || u.phone}
                              className={`p-4 rounded-2xl border transition-all ${
                                isInactive
                                  ? 'bg-stone-50/60 dark:bg-stone-850/60 border-stone-200 dark:border-stone-700/60 opacity-80'
                                  : 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-700 shadow-2xs'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-stone-900 dark:text-white text-sm sm:text-base">
                                      {u.name}
                                    </span>
                                    <span className="font-mono font-bold text-xs bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded-md">
                                      📞 {u.phone}
                                    </span>
                                    {totalRemaining > 0 ? (
                                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                        {totalRemaining} Unlocks Left
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                                        0 Credits Left
                                      </span>
                                    )}
                                    {unlockedHousesCount > 0 && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                                        {unlockedHousesCount} Houses Unlocked
                                      </span>
                                    )}
                                    {isInactive && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                        Inactive / Space Candidate
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-stone-400">
                                    Joined: {new Date(u.createdAt).toLocaleDateString()} • PIN: {u.pin}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => handleDeleteUser(u.id || u.phone, u.name)}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                      deleteConfirmUserPhone === (u.id || u.phone)
                                        ? 'bg-rose-600 text-white animate-pulse'
                                        : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                    }`}
                                    title="Permanently delete user to free Supabase storage space"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>
                                      {deleteConfirmUserPhone === (u.id || u.phone)
                                        ? (currentLang === 'am' ? 'እርግጠኛ ነዎት? ለማጥፋት ይጫኑ' : 'Confirm Delete?')
                                        : (currentLang === 'am' ? 'ተጠቃሚውን ሰርዝ (ቦታ ቆጥብ)' : 'Delete User (Save Space)')}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* PROMO LAUNCH: WIPE ALL TEST DATA SECTION */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/30 border-2 border-rose-300 dark:border-rose-800 rounded-3xl space-y-3 mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🚀</span>
                          <h4 className="font-black text-rose-950 dark:text-rose-200 text-sm sm:text-base">
                            {currentLang === 'am' ? 'የማስተዋወቂያ ዝግጅት፦ ሁሉንም የሙከራ ዳታዎች አጽዳ (Promo Clean)' : 'Promo Launch: Wipe All Test Data'}
                          </h4>
                        </div>
                        <p className="text-xs text-rose-900/80 dark:text-rose-300 max-w-xl">
                          {currentLang === 'am'
                            ? 'ስራ ከመጀመርዎ በፊት በሙከራ ጊዜ የተመዘገቡ ቤቶችን፣ የክፍያ ስክሪንሽቶችን እና ተጠቃሚዎችን ከዳታቤዝ እና ከስልክዎ ሙሉ በሙሉ ለማጥፋት ይጠቀሙበት። ዳታቤዙ አዲስ እና ንጹህ ይሆናል።'
                            : 'Before launching your marketing campaign to millions, wipe all test properties, fake receipts, and test user accounts from Supabase and local storage so your database is 100% fresh and clean.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowWipeDataModal(true)}
                        className="py-3 px-5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{currentLang === 'am' ? 'ሁሉንም የሙከራ ዳታዎች አጽዳ' : 'Wipe All Test Data'}</span>
                      </button>
                    </div>

                    {wipeDataSuccessMsg && (
                      <div className="p-3 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{wipeDataSuccessMsg}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ALL LISTINGS & AUTO-CLEANUP */}
              {activeAdminTab === 'inventory' && (
                <div className="space-y-4">
                  {/* Top Bar with Add Listing as Admin and Auto-Cleanup Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
                    <div>
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                        <span>{currentLang === 'am' ? 'የቤቶችና ንብረቶች ቁጥጥር' : 'Listings & Catalog Management'}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-black">
                          {properties.length} {currentLang === 'am' ? 'ንብረቶች' : 'Items'}
                        </span>
                        {pendingHouses.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                            {pendingHouses.length} {currentLang === 'am' ? 'ማረጋገጫ የሚጠብቁ' : 'Pending Approval'}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {currentLang === 'am'
                          ? 'የተለጠፉ ንብረቶችን እዚህ ማስተዳደር፣ ማጽደቅ፣ ወይም ከ 7 ቀናት በላይ የሆናቸውን በማጽዳት ቦታ መቆጠብ ይችላሉ።'
                          : 'Review, approve, or manage listings. Clean up items older than 7 days to save storage.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {onOpenPostPropertyAsAdmin && (
                        <button
                          type="button"
                          onClick={onOpenPostPropertyAsAdmin}
                          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{currentLang === 'am' ? '+ እንደ አድሚን በቀጥታ ይለጥፉ' : '+ Direct Admin Post'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={onAutoCleanExpired}
                        className="py-2.5 px-3.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{t.cleanExpiredBtn} ({expiredHouses.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setInventoryStatusFilter('all')}
                      className={`py-1.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        inventoryStatusFilter === 'all'
                          ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {currentLang === 'am' ? 'ሁሉም ንብረቶች' : 'All Listings'} ({properties.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setInventoryStatusFilter('pending')}
                      className={`py-1.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        inventoryStatusFilter === 'pending'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/70 dark:border-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      <span>⏳ {currentLang === 'am' ? 'ማረጋገጫ የሚጠብቁ' : 'Pending Approval'}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px] font-black">
                        {pendingHouses.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInventoryStatusFilter('active')}
                      className={`py-1.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        inventoryStatusFilter === 'active'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {currentLang === 'am' ? 'በገበያ ላይ ያሉ (Active)' : 'Active (Live)'} ({activeHouses.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setInventoryStatusFilter('occupied')}
                      className={`py-1.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        inventoryStatusFilter === 'occupied'
                          ? 'bg-stone-800 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {currentLang === 'am' ? 'የተዘጉ/የተከራዩ (Occupied)' : 'Rented / Closed'} ({occupiedHouses.length})
                    </button>
                  </div>

                  {/* Pending Listings Quick Action Banner */}
                  {pendingHouses.length > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl animate-bounce">⏳</span>
                        <div>
                          <h5 className="font-black text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
                            {currentLang === 'am'
                              ? `${pendingHouses.length} በባለቤቶች የተለጠፉ ቤቶች ማረጋገጫ በመጠባበቅ ላይ ናቸው!`
                              : `${pendingHouses.length} owner listings waiting for your approval!`}
                          </h5>
                          <p className="text-[11px] text-amber-800/80 dark:text-amber-300 mt-0.5">
                            {currentLang === 'am'
                              ? 'አጽድቀው ወዲያውኑ በዋናው ድረ-ገጽ ላይ እንዲታዩ "ሁሉንም አጽድቅ" ይጫኑ ወይም ከስር ነጥለው ያጽድቁ።'
                              : 'Click "Approve All" to publish all of them live to the public front page instantly, or review each below.'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onApproveAllPendingProperties) {
                            onApproveAllPendingProperties();
                          } else {
                            pendingHouses.forEach((p) => onTogglePropertyStatus?.(p.id, 'active'));
                          }
                        }}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{currentLang === 'am' ? 'ሁሉንም አጽድቅ (Approve All)' : 'Approve All Pending'}</span>
                      </button>
                    </div>
                  )}

                  {/* Listings Table */}
                  <div className="space-y-3">
                    {properties
                      .filter((p) => {
                        if (inventoryStatusFilter === 'pending') return p.status === 'pending' || p.status === 'pending_approval';
                        if (inventoryStatusFilter === 'active') return p.status === 'active';
                        if (inventoryStatusFilter === 'occupied') return p.status === 'occupied';
                        return true;
                      })
                      .map((prop) => {
                        const { days, hours, isExpired } = getDaysRemaining(prop.expiresAt);
                        const isPending = prop.status === 'pending' || prop.status === 'pending_approval';

                        return (
                          <div
                            key={prop.id}
                            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all ${
                              isPending
                                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/80 ring-1 ring-amber-300 dark:ring-amber-700'
                                : 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {prop.images[0] && (
                                <img
                                  src={prop.images[0].url}
                                  alt={prop.title}
                                  className="w-14 h-12 rounded-lg object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                                />
                              )}
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-bold text-stone-900 dark:text-stone-100 text-sm">{prop.title}</h5>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 uppercase">
                                    {prop.category || 'home'}
                                  </span>
                                  <span
                                    className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                      isPending
                                        ? 'bg-amber-500 text-white animate-pulse'
                                        : prop.status === 'occupied'
                                        ? 'bg-stone-900 text-white'
                                        : isExpired
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-emerald-600 text-white'
                                    }`}
                                  >
                                    {isPending
                                      ? currentLang === 'am' ? '⏳ ማረጋገጫ የሚጠብቅ' : '⏳ Pending Approval'
                                      : prop.status}
                                  </span>
                                </div>
                                <div className="text-xs text-stone-500 dark:text-stone-400 flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{prop.area}</span>
                                  <span>•</span>
                                  <span className="font-black text-stone-800 dark:text-stone-200">{prop.price.toLocaleString()} ETB</span>
                                  <span>•</span>
                                  <span>Owner: <strong>{prop.ownerName || 'Owner'}</strong> ({prop.ownerPhone}) • PIN: <code className="font-mono bg-stone-100 dark:bg-stone-800 px-1 rounded">{prop.ownerPin}</code></span>
                                  {(() => {
                                    const linkedReq = unlockRequests.find((r) => r.propertyId === prop.id);
                                    const receiptScreenshot = prop.sellerPaymentScreenshotUrl || linkedReq?.screenshotUrl;
                                    const ownerIdUrl = prop.nationalIdFrontUrl;

                                    return (
                                      <>
                                        {ownerIdUrl ? (
                                          <button
                                            type="button"
                                            onClick={() => setViewingOwnerId({
                                              idUrl: ownerIdUrl,
                                              ownerName: prop.ownerName || 'Owner',
                                              ownerPhone: prop.ownerPhone,
                                              title: prop.title
                                            })}
                                            className="py-0.5 px-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                          >
                                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                            <span>{currentLang === 'am' ? 'የባለቤት መታወቂያ ፈትሽ' : 'Verify ID'}</span>
                                          </button>
                                        ) : isPending ? (
                                          <span className="text-[10px] text-stone-400 italic">No ID</span>
                                        ) : null}

                                        {receiptScreenshot ? (
                                          <button
                                            type="button"
                                            onClick={() => setViewingScreenshot(receiptScreenshot)}
                                            className="py-0.5 px-2 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                          >
                                            <Eye className="w-3 h-3 text-amber-700" />
                                            <span>{currentLang === 'am' ? 'ደረሰኝ እይ' : 'View Receipt'}</span>
                                          </button>
                                        ) : isPending ? (
                                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">⚠️ {currentLang === 'am' ? 'ደረሰኝ የለም' : 'No Receipt'}</span>
                                        ) : null}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium mr-1">
                                {isPending ? (
                                  <span className="text-amber-600 dark:text-amber-400 font-bold">Needs Approval</span>
                                ) : isExpired ? (
                                  <span className="text-rose-600 font-bold">Expired</span>
                                ) : (
                                  `${days}d ${hours}h left`
                                )}
                              </span>

                              {/* Smart Status Actions: Pending Approval / Available / Rented */}
                              {isPending ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onApproveProperty) {
                                        onApproveProperty(prop.id);
                                      } else if (onTogglePropertyStatus) {
                                        onTogglePropertyStatus(prop.id, 'active');
                                      }
                                    }}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                                    title="Approve this listing and immediately publish it to the front page"
                                  >
                                    <Check className="w-4 h-4 text-white" />
                                    <span>{currentLang === 'am' ? 'አጽድቅ' : 'Approve'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onRejectProperty) {
                                        onRejectProperty(prop.id);
                                      } else {
                                        onDeleteProperty(prop.id);
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                    title="Decline and remove this pending listing"
                                  >
                                    <X className="w-3.5 h-3.5 text-rose-600" />
                                    <span>{currentLang === 'am' ? 'አትቀበል' : 'Decline'}</span>
                                  </button>
                                </div>
                              ) : prop.status === 'occupied' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onTogglePropertyStatus) {
                                      onTogglePropertyStatus(prop.id, 'active');
                                    } else {
                                      onMarkOccupied(prop.id);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                  title="Make this listing live and visible on front page immediately"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>{currentLang === 'am' ? 'ወደ ገበያ መልስ (Available)' : 'Make Available'}</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onTogglePropertyStatus) {
                                      onTogglePropertyStatus(prop.id, 'occupied');
                                    } else {
                                      onMarkOccupied(prop.id);
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                  title="Mark listing as rented or closed"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{currentLang === 'am' ? 'ተከራይቷል (Mark Rented)' : 'Mark Rented'}</span>
                                </button>
                              )}

                              {/* Safe Delete with inline confirm state */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (deleteConfirmPropertyId === prop.id) {
                                    onDeleteProperty(prop.id);
                                    setDeleteConfirmPropertyId(null);
                                  } else {
                                    setDeleteConfirmPropertyId(prop.id);
                                    setTimeout(() => setDeleteConfirmPropertyId(null), 5000);
                                  }
                                }}
                                className={`p-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                  deleteConfirmPropertyId === prop.id
                                    ? 'bg-rose-600 text-white px-2.5 animate-pulse'
                                    : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                }`}
                                title="Delete property"
                              >
                                <Trash2 className="w-4 h-4" />
                                {deleteConfirmPropertyId === prop.id && (
                                  <span>{currentLang === 'am' ? 'ይጥፋ?' : 'Confirm?'}</span>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB 3: ANTI-FRAUD & BROKER POACHING PREVENTION */}
              {activeAdminTab === 'antifraud' && (
                <div className="space-y-6">
                  {/* Overview Card */}
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-1.5">
                    <h4 className="font-extrabold text-rose-950 dark:text-rose-200 text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>{currentLang === 'am' ? 'የደላላ እና የማጭበርበር መከላከያ ማዕከል (Anti-Poaching Shield)' : 'Anti-Poaching & Blacklist Engine'}</span>
                    </h4>
                    <p className="text-xs text-rose-900/90 dark:text-rose-300 leading-relaxed">
                      {currentLang === 'am'
                        ? 'የተጠቃሚዎችን ወይም የባለቤቶችን ስልክ ወስደው በደላላነት ለመስራት የሚሞክሩ ወይም በባለቤቶች የተጠቆሙ ስልኮች እዚህ ይመረመራሉ። የታገደ ስልክ በመድረኩ ላይ ምንም አይነት ስልክ ቁጥር መክፈት አይችልም።'
                        : 'Review reports submitted by property owners against unauthorized brokers, commission solicitors, or poachers. Blacklisted numbers are blocked immediately from paying or unlocking any contact.'}
                    </p>
                  </div>

                  {/* Manual Quick Ban Form */}
                  <div className="bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3">
                    <h5 className="font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider">
                      {currentLang === 'am' ? 'ስልክ ቁጥርን ወዲያውኑ ማገድ (Direct Blacklist)' : 'Directly Blacklist a Phone Number'}
                    </h5>

                    {banSuccessMsg && (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{banSuccessMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleManualBanSubmit} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="tel"
                        required
                        value={manualBanPhone}
                        onChange={(e) => setManualBanPhone(e.target.value)}
                        placeholder="0911XXXXXX"
                        className="flex-1 px-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-mono font-bold text-stone-900 dark:text-white"
                      />
                      <button
                        type="submit"
                        className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Ban className="w-4 h-4" />
                        <span>{t.banPhoneBtn}</span>
                      </button>
                    </form>
                  </div>

                  {/* Section: Incoming Broker Fraud Reports */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                        <span>{t.reportedListTitle}</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-xs font-bold">
                          {reportedBrokers.length}
                        </span>
                      </h4>
                    </div>

                    {reportedBrokers.length === 0 ? (
                      <div className="p-6 text-center bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
                        {currentLang === 'am' ? 'ምንም አይነት የደላላ ጥቆማ አልገባም።' : 'No fraud or poacher reports submitted.'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reportedBrokers.map((rep) => (
                          <div
                            key={rep.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              rep.status === 'banned'
                                ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                                : rep.status === 'dismissed'
                                ? 'bg-stone-50 dark:bg-stone-850 border-stone-200 dark:border-stone-800 opacity-60'
                                : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/80 shadow-xs'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-black text-rose-700 dark:text-rose-400 text-sm bg-rose-100 dark:bg-rose-950/70 px-2.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                                    🚨 {rep.reportedPhone}
                                  </span>
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                                    Role: {rep.reporterRole}
                                  </span>
                                  <span
                                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                      rep.status === 'banned'
                                        ? 'bg-rose-600 text-white'
                                        : rep.status === 'dismissed'
                                        ? 'bg-stone-500 text-white'
                                        : 'bg-emerald-600 text-white'
                                    }`}
                                  >
                                    {rep.status}
                                  </span>
                                </div>

                                <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 mt-1">
                                  <strong>Reason:</strong> {rep.reasonText}
                                </p>

                                {rep.propertyTitle && (
                                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                                    Listing: {rep.propertyTitle}
                                  </p>
                                )}
                                <span className="text-[10px] text-stone-400 block">
                                  Reported by: {rep.reporterPhone} • {new Date(rep.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                {rep.status === 'pending_review' && (
                                  <>
                                    <button
                                      onClick={() => onResolveReport && onResolveReport(rep.id, 'ban')}
                                      className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                      <span>{t.banPhoneBtn}</span>
                                    </button>
                                    <button
                                      onClick={() => onResolveReport && onResolveReport(rep.id, 'dismiss')}
                                      className="py-1.5 px-2.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-semibold cursor-pointer"
                                    >
                                      Dismiss
                                    </button>
                                  </>
                                )}
                                {rep.status === 'banned' && (
                                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                    <Ban className="w-3.5 h-3.5" /> Banned
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section: Currently Blacklisted Phone Numbers */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                        <UserX className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                        <span>{t.bannedPhonesListTitle}</span>
                        <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold">
                          {bannedPhones.length}
                        </span>
                      </h4>
                    </div>

                    {bannedPhones.length === 0 ? (
                      <p className="text-xs text-stone-500 italic p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800">
                        {t.noBannedPhones}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {bannedPhones.map((phone) => (
                          <div
                            key={phone}
                            className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 rounded-xl"
                          >
                            <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400">
                              ⛔ {phone}
                            </span>
                            <button
                              onClick={() => onUnbanPhone && onUnbanPhone(phone)}
                              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              {t.unbanPhoneBtn}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: BROKER PAYMENT & FEE SETTINGS */}
              {activeAdminTab === 'settings' && (
                <div className="space-y-6 max-w-xl">
                  <form onSubmit={handleSaveSettingsSubmit} className="space-y-4">
                    {settingsSavedMsg && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{t.success}</span>
                      </div>
                    )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Telebirr Number
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.telebirrNumber}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, telebirrNumber: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Telebirr Account Name
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.telebirrName}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, telebirrName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        CBE Account Number
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.cbeAccount}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, cbeAccount: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        CBE Account Name
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.cbeName}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, cbeName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Bank of Abyssinia (BOA) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Bank of Abyssinia (BOA) Account
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.boaAccount || '61648817'}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, boaAccount: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        BOA Account Name
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.boaName || 'BetDelala (Bank of Abyssinia / አቢሲኒያ)'}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, boaName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Awash Bank Account
                      </label>
                      <input
                        type="text"
                        value={settingsForm.awashAccount || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, awashAccount: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Rent Unlock Fee (ETB)
                      </label>
                      <input
                        type="number"
                        required
                        value={settingsForm.feeAmountBirr}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            feeAmountBirr: Number(e.target.value),
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-black text-stone-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Owner listings are always moderated before publication. */}
                  <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl space-y-1.5">
                    <div className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200">
                      {currentLang === 'am' ? 'ሁሉም የባለቤት ማስታወቂያዎች በእጅ ይጸድቃሉ' : 'Manual owner approval is always enabled'}
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      {currentLang === 'am' ? 'የክፍያ ማስረጃውን ካረጋገጡ በኋላ ብቻ ማስታወቂያው በዋናው ገጽ ላይ ይታያል።' : 'Every owner listing stays hidden until you verify the payment proof and approve it.'}
                    </p>
                  </div>

                  {/* Save Payment & Bank Settings Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-sm font-black shadow-sm transition-all cursor-pointer flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.save}</span>
                    </button>
                  </div>
                </form>

                {/* DEDICATED CHANGE ADMIN PASSWORD / PIN CARD */}
                <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800 max-w-xl">
                  <div className="p-5 bg-stone-100/90 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-stone-900 dark:text-white">
                            {currentLang === 'am' ? 'የአድሚን ሚስጥር ቃል / ፓስወርድ መቀየሪያ' : 'Change Admin Security Password / PIN'}
                          </h4>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            {currentLang === 'am'
                              ? 'አስተዳዳሪው ብቻ እንዲከፈት አዲስ ፓስወርድ እዚህ ያስቀምጡ።'
                              : 'Protect your admin dashboard by configuring a private password.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {passwordChangeMsg && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{passwordChangeMsg}</span>
                      </div>
                    )}

                    {passwordChangeError && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{passwordChangeError}</span>
                      </div>
                    )}

                    <form onSubmit={handleChangePasswordDirectly} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                          {currentLang === 'am' ? 'አዲስ የአድሚን ፓስወርድ / PIN' : 'New Admin Password / PIN'}
                        </label>
                        <input
                          type="password"
                          required
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          placeholder="e.g. MySecurePass2026"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                          {currentLang === 'am' ? 'አዲሱን ፓስወርድ ይድገሙ' : 'Confirm New Password'}
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmAdminPassword}
                          onChange={(e) => setConfirmAdminPassword(e.target.value)}
                          placeholder="Re-type new password"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                          {currentLang === 'am' ? 'የአሁኑ PIN:' : 'Current active PIN:'}{' '}
                          <span className="font-bold text-stone-800 dark:text-stone-200">
                            {settingsForm.adminPin || '6121921b'}
                          </span>
                        </p>
                        <button
                          type="submit"
                          className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>{currentLang === 'am' ? 'ፓስወርድ ቀይር' : 'Update Password'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

              {/* TAB 4: FREE SUPABASE & VERCEL DEPLOYMENT GUIDE */}
              {activeAdminTab === 'deploy' && (
                <div className="space-y-6">
                  {/* Database Connection Test & Credentials Card */}
                  <div className="bg-stone-50 dark:bg-stone-850 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-stone-700">
                      <div>
                        <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{currentLang === 'am' ? 'የ Supabase ዳታቤዝ ግንኙነት መፈተሻ' : 'Supabase Live Database Connection'}</span>
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {currentLang === 'am'
                            ? 'የ Supabase Project URL እና Anon Key አስገብተው ግንኙነቱን ያረጋግጡ።'
                            : 'Enter your project credentials to verify live read/write database connectivity.'}
                        </p>
                      </div>

                      <div>
                        {connectionStatus?.success ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                            <span>{currentLang === 'am' ? 'የተገናኘ (Active)' : 'Connected & Active'}</span>
                          </span>
                        ) : connectionStatus && !connectionStatus.success ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                            <span>{currentLang === 'am' ? 'ግንኙነት አልተሳካም' : 'Disconnected'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                            <span>{currentLang === 'am' ? 'ያልተፈተሸ' : 'Not Tested Yet'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Supabase URL & Anon Key Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                          Supabase Project URL
                        </label>
                        <input
                          type="url"
                          value={supabaseUrlInput}
                          onChange={(e) => setSupabaseUrlInput(e.target.value)}
                          placeholder="https://xxxxxxxxxxxxxx.supabase.co"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                          Supabase Anon / Public Key
                        </label>
                        <input
                          type="password"
                          value={supabaseKeyInput}
                          onChange={(e) => setSupabaseKeyInput(e.target.value)}
                          placeholder="sb_publishable_... or eyJhbGciOi..."
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* How to find info box */}
                    <div className="p-3 bg-stone-100 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400 space-y-1">
                      <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {currentLang === 'am' 
                            ? 'እነዚህን ከ Supabase እንዴት ማግኘት ይቻላል?' 
                            : 'Where to find these in your Supabase Dashboard:'}
                        </span>
                      </div>
                      <p>
                        {currentLang === 'am'
                          ? 'በ Supabase ውስጥ ወደ Project Settings (⚙️ የግራ ታችኛው ማዕዘን) ➔ "API" ወይም "Data API" ይሂዱ ➔ Project URL እና Project API Key (anon/public) የሚለውን ኮፒ ያድርጉ።'
                          : 'In Supabase Dashboard (Home delala) ➔ Click ⚙️ Project Settings (bottom left) ➔ Click "API" ➔ Copy the "Project URL" and "Project API Key (anon/public)".'}
                      </p>
                    </div>

                    {/* Connection Result Feedback */}
                    {connectionStatus && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                          connectionStatus.success
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                        }`}
                      >
                        {connectionStatus.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <p className="font-bold">
                            {connectionStatus.success
                              ? (currentLang === 'am' ? '✓ ግንኙነቱ ተረጋግጧል!' : '✓ Database Connected Successfully!')
                              : (currentLang === 'am' ? '✗ ግንኙነቱ አልተሳካም' : '✗ Connection Verification Failed')}
                          </p>
                          <p className="opacity-90">{connectionStatus.message}</p>
                        </div>
                      </div>
                    )}

                    {/* Push Data Status Message */}
                    {pushStatusMsg && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{pushStatusMsg}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={handleTestAndSaveSupabase}
                        disabled={isTestingConnection}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                        <span>
                          {isTestingConnection
                            ? (currentLang === 'am' ? 'በመፈተሽ ላይ...' : 'Testing Connection...')
                            : (currentLang === 'am' ? '⚡ ግንኙነቱን ፈትሽና አስቀምጥ' : '⚡ Test & Save Connection')}
                        </span>
                      </button>

                      <button
                        onClick={handlePushLocalDataToSupabase}
                        disabled={isPushingData}
                        className="py-2.5 px-4 bg-stone-900 dark:bg-stone-700 hover:bg-stone-800 active:scale-98 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all"
                      >
                        <Building className={`w-3.5 h-3.5 ${isPushingData ? 'animate-bounce' : ''}`} />
                        <span>
                          {isPushingData
                            ? (currentLang === 'am' ? 'ወደ ዳታቤዝ በመላክ ላይ...' : 'Syncing Data...')
                            : (currentLang === 'am' ? '🚀 ሁሉንም ቤቶች ወደ Supabase ላክ' : '🚀 Push Local Data to Supabase')}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Step 1: Supabase SQL Setup */}
                  <div className="bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-stone-900 dark:bg-stone-700 text-white text-xs font-bold flex items-center justify-center">1</span>
                        <div>
                          <h5 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                            {currentLang === 'am' ? 'የ Supabase ዳታቤዝ ሰንጠረዦች (SQL Schema)' : 'Run SQL Schema in Supabase'}
                          </h5>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {currentLang === 'am' ? '✓ በ Supabase ውስጥ "Success" ካለዎት ተጠናቋል!' : '✓ If you saw "Success. No rows returned", this step is complete!'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleCopySql}
                        className="py-1.5 px-3 bg-stone-900 dark:bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedSql ? t.copiedText : 'Copy SQL Script'}</span>
                      </button>
                    </div>

                    <pre className="bg-stone-950 text-stone-200 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-40">
                      {SUPABASE_SQL_SCHEMA}
                    </pre>
                  </div>

                  {/* Clear / Reset Supabase Tables (Wipe Demo Data & 0 Earnings) */}
                  <div className="bg-rose-50/60 dark:bg-rose-950/20 p-5 rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🧹</span>
                          <h5 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                            {currentLang === 'am' ? 'Supabase ሰንጠረዦችን ማጽዳትና ገቢን 0 ማድረግ (Wipe All Demo Data)' : 'Clear Supabase Tables & Reset Earnings to 0'}
                          </h5>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 max-w-xl">
                          {currentLang === 'am'
                            ? 'በሙከራ ጊዜ የተመዘገቡ ቤቶችን፣ የክፍያ ጥያቄዎችን እና ተጠቃሚዎችን ከ Supabase ዳታቤዝ ለማጽዳትና ገቢዎን 0 አድርገው በአዲስ መልክ ለመጀመር ይጠቀሙበት።'
                            : 'Wipe all demo property listings, test payment requests, and mock accounts from Supabase to start fresh with 0 ETB earnings.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowWipeDataModal(true)}
                        className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{currentLang === 'am' ? 'ሁሉንም ዳታዎች አጽዳ (Wipe Clean)' : 'Wipe All Demo Data'}</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                          {currentLang === 'am' ? 'በ Supabase SQL Editor ውስጥ በቀጥታ ለማጽዳት (Manual SQL):' : 'Or run directly in Supabase Dashboard SQL Editor:'}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyTruncateSql}
                          className="py-1 px-2.5 bg-stone-900 dark:bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedTruncateSql ? (currentLang === 'am' ? 'ተቀድቷል!' : 'Copied!') : (currentLang === 'am' ? 'SQL ቅዳ' : 'Copy SQL')}</span>
                        </button>
                      </div>

                      <pre className="bg-stone-950 text-emerald-400 p-2.5 rounded-xl text-[11px] font-mono overflow-x-auto">
                        {TRUNCATE_SQL}
                      </pre>
                    </div>
                  </div>

                  {/* Step 2: Vercel Deploy Steps */}
                  <div className="bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3 text-xs text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-stone-900 dark:bg-stone-700 text-white text-xs font-bold flex items-center justify-center">2</span>
                      <h5 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                        {currentLang === 'am' ? 'በ GitHub እና Vercel ላይ በነጻ መጫን' : 'Deploying to Vercel via GitHub'}
                      </h5>
                    </div>
                    <ol className="list-decimal pl-5 space-y-2 text-stone-600 dark:text-stone-400">
                      <li>
                        <strong>Push to GitHub:</strong> Export or push this project to your GitHub repository.
                      </li>
                      <li>
                        <strong>Import into Vercel:</strong> Visit <strong>vercel.com/new</strong> and select your repository.
                      </li>
                      <li>
                        <strong>Add Environment Variables in Vercel:</strong> Under <em>"Environment Variables"</em>, add:
                        <div className="mt-1 space-y-1 font-mono text-[11px] bg-stone-100 dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800">
                          <div><span className="text-emerald-700 dark:text-emerald-400 font-bold">VITE_SUPABASE_URL</span> = your Supabase URL</div>
                          <div><span className="text-emerald-700 dark:text-emerald-400 font-bold">VITE_SUPABASE_ANON_KEY</span> = your Supabase anon public key</div>
                        </div>
                      </li>
                      <li>
                        <strong>Deploy:</strong> Click <strong>Deploy</strong>. Vercel will build your app in ~25 seconds and give you a live HTTPS web address!
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {/* TAB: CUSTOMER REVIEWS & RATINGS MODERATION */}
              {activeAdminTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Reviews Summary Stats */}
                  <div className="bg-amber-50/60 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-amber-800/40">
                      <div>
                        <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                          <span>
                            {currentLang === 'am'
                              ? 'የደንበኞች ደረጃ እና አስተያየት አስተዳደር'
                              : 'Customer Reviews & Rating Moderation'}
                          </span>
                        </h4>
                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                          {currentLang === 'am'
                            ? 'በተጠቃሚዎች የተሰጡ ደረጃዎችን ይመልከቱ፣ ያረጋግጡ ወይም የማያስፈልጉትን ያስወግዱ።'
                            : 'Monitor customer satisfaction, moderate inappropriate reviews, or delete fake entries.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-stone-950 shadow-xs">
                          {reviews.length} {currentLang === 'am' ? 'አስተያየቶች' : 'Reviews'}
                        </span>

                        {onDeleteAllReviews && reviews.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowDeleteAllReviewsModal(true)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            title={currentLang === 'am' ? 'ሁሉንም አስተያየቶች ሰርዝ' : 'Delete All Reviews'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{currentLang === 'am' ? 'ሁሉንም ሰርዝ' : 'Delete All'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats Metrics Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white dark:bg-stone-850 p-3 rounded-xl border border-stone-200 dark:border-stone-700 text-center">
                        <div className="text-xl font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                          <span>
                            {reviews.length > 0
                              ? (
                                  reviews.reduce((acc, r) => acc + r.rating, 0) /
                                  reviews.length
                                ).toFixed(1)
                              : '5.0'}
                          </span>
                          <Star className="w-4 h-4 fill-amber-400" />
                        </div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase">
                          {currentLang === 'am' ? 'አማካይ ደረጃ' : 'Average Rating'}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-stone-850 p-3 rounded-xl border border-stone-200 dark:border-stone-700 text-center">
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                          {reviews.filter((r) => r.rating === 5).length}
                        </div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase">
                          {currentLang === 'am' ? '5-ኮከብ ብቻ' : '5-Star Ratings'}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-stone-850 p-3 rounded-xl border border-stone-200 dark:border-stone-700 text-center">
                        <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                          {reviews.filter((r) => r.userRole === 'owner').length}
                        </div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase">
                          {currentLang === 'am' ? 'የባለቤቶች' : 'Owner Reviews'}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-stone-850 p-3 rounded-xl border border-stone-200 dark:border-stone-700 text-center">
                        <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                          {reviews.filter((r) => r.userRole === 'renter' || r.userRole === 'buyer').length}
                        </div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase">
                          {currentLang === 'am' ? 'የተከራይ/ገዢዎች' : 'Tenants & Buyers'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reviews List */}
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-stone-300 dark:border-stone-700 rounded-2xl space-y-2">
                      <Star className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
                      <p className="text-xs font-bold text-stone-500">
                        {currentLang === 'am'
                          ? 'እስካሁን ምንም የደንበኛ አስተያየት አልተመዘገበም።'
                          : 'No reviews recorded yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 truncate">
                                {rev.userName}
                              </span>
                              {rev.userPhone && (
                                <span className="text-xs font-mono text-stone-500 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                                  📞 {rev.userPhone}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                {rev.userRole}
                              </span>
                              <div className="flex items-center gap-0.5 ml-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${
                                      s <= rev.rating
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-stone-300 dark:text-stone-700'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                              "{rev.comment}"
                            </p>

                            <div className="text-[10px] text-stone-400 font-medium">
                              {new Date(rev.createdAt).toLocaleString(
                                currentLang === 'am' ? 'am-ET' : 'en-US'
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {onToggleReviewApproval && (
                              <button
                                type="button"
                                onClick={() => onToggleReviewApproval(rev.id)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  rev.isApproved !== false
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>
                                  {rev.isApproved !== false
                                    ? (currentLang === 'am' ? 'የተረጋገጠ' : 'Visible')
                                    : (currentLang === 'am' ? 'የተደበቀ' : 'Hidden')}
                                </span>
                              </button>
                            )}

                            {onDeleteReview && (
                              <div>
                                {deleteConfirmReviewId === rev.id ? (
                                  <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-xl border border-rose-200 dark:border-rose-900 animate-in fade-in">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteReview(rev.id);
                                        setDeleteConfirmReviewId(null);
                                      }}
                                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                    >
                                      {currentLang === 'am' ? 'አዎ፣ ሰርዝ' : 'Confirm'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmReviewId(null)}
                                      className="px-2 py-1 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                    >
                                      {currentLang === 'am' ? 'ይቅር' : 'Cancel'}
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmReviewId(rev.id)}
                                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-all cursor-pointer"
                                    title={currentLang === 'am' ? 'አስተያየቱን ሰርዝ' : 'Delete Review'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full Screenshot Modal Preview */}
      {viewingScreenshot && (
        <div
          onClick={() => setViewingScreenshot(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-stone-900 rounded-2xl overflow-hidden max-w-lg w-full p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-stone-900 dark:text-stone-100">Payment Screenshot Review</span>
              <button
                onClick={() => setViewingScreenshot(null)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-3/4 max-h-[70vh] bg-stone-950 rounded-xl overflow-hidden flex items-center justify-center">
              <img src={viewingScreenshot} alt="Receipt Full" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Owner National ID Card Modal Preview */}
      {viewingOwnerId && (
        <div
          onClick={() => setViewingOwnerId(null)}
          className="fixed inset-0 z-70 bg-black/90 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-stone-900 rounded-3xl overflow-hidden max-w-2xl w-full p-5 space-y-4 border border-stone-200 dark:border-stone-800 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                    {currentLang === 'am' ? 'የባለቤት መታወቂያ ማረጋገጫ' : 'Owner National ID Verification'}
                  </h4>
                  <p className="text-xs text-stone-500">
                    {viewingOwnerId.ownerName} • 📞 {viewingOwnerId.ownerPhone} • {viewingOwnerId.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingOwnerId(null)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-stone-950 rounded-2xl overflow-hidden flex items-center justify-center min-h-[260px] max-h-[60vh] p-2 border border-stone-800">
              <img
                src={viewingOwnerId.idUrl}
                alt="Owner National ID"
                className="w-full h-full object-contain rounded-xl max-h-[55vh]"
              />
            </div>

            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between gap-2 flex-wrap">
              <span>
                {currentLang === 'am'
                  ? '💡 መታወቂያው ኦሪጅናል መሆኑን፣ ስሙ እና ፎቶው ትክክል መሆናቸውን ይመርምሩ።'
                  : '💡 Verify the Kebele or National ID card photo matches the owner details before activating.'}
              </span>
              <a
                href={viewingOwnerId.idUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shrink-0 flex items-center gap-1"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>{currentLang === 'am' ? 'በትልቅ እይ' : 'Full Size'}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Wipe All Test Data Confirmation Modal */}
      {showWipeDataModal && (
        <div
          onClick={() => !isWipingData && setShowWipeDataModal(false)}
          className="fixed inset-0 z-70 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-stone-900 rounded-3xl overflow-hidden max-w-md w-full p-6 space-y-4 border border-rose-200 dark:border-rose-900 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                {currentLang === 'am' ? 'ሁሉንም የሙከራ ዳታዎች ማጥፋት ይፈልጋሉ?' : 'Wipe All Test Data from Supabase?'}
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {currentLang === 'am'
                  ? 'ይህ እርምጃ የተመዘገቡ የሙከራ ቤቶችን፣ የክፍያ ጥያቄዎችን እና ተጠቃሚዎችን ከ Supabase እና ከዚህ መተግበሪያ ላይ ሙሉ በሙሉ ያጸዳል። የማስተዋወቂያ ዘመቻዎን በአዲስና ንጹህ ዳታቤዝ ለመጀመር ይረዳዎታል።'
                  : 'This will completely delete all test property listings, payment requests, unlocked records, and user accounts from your Supabase database. Your system will be 100% clean for your official promo launch.'}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWipeDataModal(false)}
                disabled={isWipingData}
                className="flex-1 py-3 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {currentLang === 'am' ? 'ይቅር (Cancel)' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleExecuteWipeData}
                disabled={isWipingData}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isWipingData ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{currentLang === 'am' ? 'በማጽዳት ላይ...' : 'Wiping...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{currentLang === 'am' ? 'አዎ፣ ሙሉ በሙሉ አጽዳ' : 'Yes, Wipe Clean'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Reviews Confirmation Modal (Owner Only) */}
      {showDeleteAllReviewsModal && (
        <div
          onClick={() => !isDeletingReviews && setShowDeleteAllReviewsModal(false)}
          className="fixed inset-0 z-70 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-stone-900 rounded-3xl overflow-hidden max-w-md w-full p-6 space-y-4 border border-rose-200 dark:border-rose-900 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                {currentLang === 'am'
                  ? 'ሁሉንም አስተያየቶች መሰረዝ ይፈልጋሉ?'
                  : 'Delete All Customer Reviews?'}
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {currentLang === 'am'
                  ? `ይህ እርምጃ በአጠቃላይ የተመዘገቡትን ${reviews.length} የደንበኛ አስተያየቶች ከዳታቤዝ (Supabase & Local) እስከመጨረሻው ይሰርዛል። ይህን ማድረግ የሚችሉት እርስዎ የሲስተሙ ባለቤት ብቻ ነዎት።`
                  : `This will permanently delete all ${reviews.length} customer reviews from both your Supabase database and local storage. Only you, the system owner, can execute this action.`}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllReviewsModal(false)}
                disabled={isDeletingReviews}
                className="flex-1 py-3 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {currentLang === 'am' ? 'ይቅር (Cancel)' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleExecuteDeleteAllReviews}
                disabled={isDeletingReviews || reviews.length === 0}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeletingReviews ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{currentLang === 'am' ? 'በመሰረዝ ላይ...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{currentLang === 'am' ? 'አዎ፣ ሁሉንም ሰርዝ' : 'Yes, Delete All'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
