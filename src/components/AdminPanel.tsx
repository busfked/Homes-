import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Eye, 
  DollarSign, 
  Clock, 
  Building, 
  Trash2, 
  RefreshCw, 
  Settings, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  ExternalLink,
  Lock,
  Sparkles,
  Search,
  ShieldAlert,
  Ban,
  UserX,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Property, UnlockRequest, PaymentSettings, Language, ReportedBroker } from '../types';
import { translations } from '../data/translations';
import { SUPABASE_SQL_SCHEMA, cleanupExpiredListings, getDaysRemaining } from '../utils/storage';
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
  onBanPhone?: (phone: string) => void;
  onUnbanPhone?: (phone: string) => void;
  onResolveReport?: (reportId: string, action: 'ban' | 'dismiss') => void;
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
  onBanPhone,
  onUnbanPhone,
  onResolveReport,
}) => {
  if (!isOpen) return null;

  const t = translations[currentLang];

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Admin Sub-Tab
  const [activeAdminTab, setActiveAdminTab] = useState<'pending' | 'inventory' | 'antifraud' | 'settings' | 'deploy'>('pending');

  // Manual ban input
  const [manualBanPhone, setManualBanPhone] = useState('');
  const [banSuccessMsg, setBanSuccessMsg] = useState('');

  // Screenshot viewer modal
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<PaymentSettings>({ ...paymentSettings });
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Supabase SQL copy state
  const [copiedSql, setCopiedSql] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Metrics
  const pendingRequests = unlockRequests.filter((r) => r.status === 'pending');
  const approvedRequests = unlockRequests.filter((r) => r.status === 'approved');
  const totalRevenueEtb = approvedRequests.reduce((sum, r) => sum + (r.amountBirr || 50), 0);
  const activeHouses = properties.filter((p) => p.status === 'active');
  const occupiedHouses = properties.filter((p) => p.status === 'occupied');
  const expiredHouses = properties.filter((p) => {
    const { isExpired } = getDaysRemaining(p.expiresAt);
    return isExpired || p.status === 'expired';
  });
  const pendingReports = reportedBrokers.filter((r) => r.status === 'pending_review');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === paymentSettings.adminPin || enteredPin === 'admin123' || enteredPin === '1234') {
      setIsAdminLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError(
        currentLang === 'am'
          ? 'የተሳሳተ የአድሚን ሚስጥር ቁጥር። እባክዎ እንደገና ይሞክሩ።'
          : 'Invalid admin password/PIN. Try "admin123".'
      );
    }
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
        className="bg-white dark:bg-stone-900 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[95vh]"
      >
        {/* Admin Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">{t.adminTitle}</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Live Direct Deals Ops
                </span>
              </div>
              <p className="text-xs text-stone-400">{t.adminSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={() => setIsAdminLoggedIn(false)}
                className="px-3 py-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer"
              >
                {t.logoutAdmin}
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
                placeholder="PIN (admin123)"
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-stone-400">{t.defaultPinHint}</p>

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
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 bg-stone-50 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800">
              <div className="bg-white dark:bg-stone-800 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xs">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold block">{t.totalRevenue}</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-sans mt-0.5">
                  {totalRevenueEtb.toLocaleString()} <span className="text-xs">{t.etb}</span>
                </div>
                <span className="text-[10px] text-stone-400">{approvedRequests.length} approvals</span>
              </div>

              <div className="bg-white dark:bg-stone-800 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xs">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold block">{t.pendingApprovals}</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-sans mt-0.5">
                  {pendingRequests.length}
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Needs Screenshot Check</span>
              </div>

              <div className="bg-white dark:bg-stone-800 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xs">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold block">{t.activeHousesCount}</span>
                <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 font-sans mt-0.5">
                  {activeHouses.length}
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Within 7-Day Window</span>
              </div>

              <div className="bg-white dark:bg-stone-800 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xs">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold block">{t.occupiedHousesCount}</span>
                <div className="text-xl sm:text-2xl font-black text-stone-800 dark:text-stone-200 font-sans mt-0.5">
                  {occupiedHouses.length}
                </div>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">Deals Closed</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveAdminTab('pending')}
                className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeAdminTab === 'pending'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <span>{t.pendingPaymentsTab}</span>
                {pendingRequests.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px]">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveAdminTab('inventory')}
                className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeAdminTab === 'inventory'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>{t.allListingsTab} ({properties.length})</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('antifraud')}
                className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeAdminTab === 'antifraud'
                    ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>{t.antiFraudTab}</span>
                {pendingReports.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px]">
                    {pendingReports.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveAdminTab('settings')}
                className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeAdminTab === 'settings'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>{t.settingsTab}</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('deploy')}
                className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeAdminTab === 'deploy'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-600" />
                <span>{t.deployTab}</span>
              </button>
            </div>

            {/* Sub-Tab Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white dark:bg-stone-900">
              {/* TAB 1: PENDING PAYMENT SCREENSHOTS (100 / 500 ETB) */}
              {activeAdminTab === 'pending' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                      {currentLang === 'am' ? 'የሚገመገሙ የክፍያ ስክሪንሽቶች' : 'Payment Screenshots to Review'}
                    </h3>
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                      {pendingRequests.length} pending
                    </span>
                  </div>

                  {unlockRequests.length === 0 ? (
                    <div className="text-center py-10 text-stone-500 dark:text-stone-400 text-xs sm:text-sm">
                      {currentLang === 'am' ? 'ምንም የክፍያ ጥያቄ አልተገኘም።' : 'No unlock requests yet.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {unlockRequests.map((req) => {
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
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-stone-900 dark:text-white text-sm sm:text-base">
                                    {req.buyerName}
                                  </span>
                                  <span className="font-mono font-bold text-emerald-900 dark:text-emerald-300 text-xs bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                                    📞 {req.buyerPhone}
                                  </span>
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
                                    <strong>Bank:</strong> {req.paymentMethod.toUpperCase()}
                                  </span>
                                  <span>
                                    <strong>Ref:</strong> {req.transactionRef || 'N/A'}
                                  </span>
                                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                    <strong>Amount:</strong> {req.amountBirr || (targetProp?.listingType === 'sale' ? 500 : 100)} ETB
                                  </span>
                                </div>

                                {targetProp && (
                                  <div className="text-[11px] text-stone-500 dark:text-stone-400 bg-white/70 dark:bg-stone-800 p-2 rounded-lg border border-stone-200 dark:border-stone-700 inline-block">
                                    <span>Owner: {targetProp.ownerName} • Phone: {targetProp.ownerPhone}</span>
                                  </div>
                                )}
                              </div>

                              {/* Right: Screenshot preview & actions */}
                              <div className="flex items-center gap-3 shrink-0">
                                {/* Screenshot Thumbnail */}
                                {req.screenshotUrl && (
                                  <div
                                    onClick={() => setViewingScreenshot(req.screenshotUrl)}
                                    className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-stone-300 dark:border-stone-700 hover:border-emerald-600 cursor-pointer shadow-xs group shrink-0"
                                    title={t.viewReceipt}
                                  >
                                    <img
                                      src={req.screenshotUrl}
                                      alt="Payment Screenshot"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center text-white">
                                      <Eye className="w-4 h-4" />
                                    </div>
                                  </div>
                                )}

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
                                  <div className="text-xs font-bold text-stone-500 dark:text-stone-400">
                                    {req.status === 'approved' ? (
                                      <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" /> Approved
                                      </span>
                                    ) : (
                                      <span className="text-rose-600 dark:text-rose-400">Rejected</span>
                                    )}
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

              {/* TAB 2: ALL LISTINGS & AUTO-CLEANUP */}
              {activeAdminTab === 'inventory' && (
                <div className="space-y-4">
                  {/* Top Bar with Auto-Cleanup Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
                    <div>
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                        {currentLang === 'am' ? 'የ 7 ቀን የዳታ ማጽጃ (Free Tier Optimizer)' : '7-Day Auto-Cleanup Engine'}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {currentLang === 'am'
                          ? 'ከ 7 ቀናት በላይ የሆናቸውን እና በ 5/6ኛው ቀን ያልታደሱትን ንብረቶች በማጥፋት የ Supabase ማከማቻ ቦታን ይቆጥቡ።'
                          : 'Deletes listings older than 7 days that were not renewed by owners on day 5/6.'}
                      </p>
                    </div>

                    <button
                      onClick={onAutoCleanExpired}
                      className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t.cleanExpiredBtn} ({expiredHouses.length})</span>
                    </button>
                  </div>

                  {/* Listings Table */}
                  <div className="space-y-3">
                    {properties.map((prop) => {
                      const { days, hours, isExpired } = getDaysRemaining(prop.expiresAt);

                      return (
                        <div
                          key={prop.id}
                          className="bg-white dark:bg-stone-850 p-3.5 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
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
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-stone-900 dark:text-stone-100 text-sm">{prop.title}</h5>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 uppercase">
                                  {prop.category || 'home'}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    prop.status === 'occupied'
                                      ? 'bg-stone-900 text-white'
                                      : isExpired
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-emerald-600 text-white'
                                  }`}
                                >
                                  {prop.status}
                                </span>
                              </div>
                              <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{prop.area}</span>
                                <span>•</span>
                                <span>Owner: {prop.ownerPhone} (PIN: {prop.ownerPin})</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium mr-2">
                              {isExpired ? 'Expired' : `${days}d ${hours}h left`}
                            </span>

                            <button
                              onClick={() => onMarkOccupied(prop.id)}
                              className="px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              {prop.status === 'occupied' ? 'Occupied' : 'Set Occupied'}
                            </button>

                            <button
                              onClick={() => onDeleteProperty(prop.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
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
                <form onSubmit={handleSaveSettingsSubmit} className="space-y-4 max-w-xl">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Awash Bank Account
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.awashAccount}
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

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-sm font-black shadow-sm transition-all cursor-pointer"
                    >
                      {t.save}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: FREE SUPABASE & VERCEL DEPLOYMENT GUIDE */}
              {activeAdminTab === 'deploy' && (
                <div className="space-y-6">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                    <h4 className="font-extrabold text-emerald-950 dark:text-emerald-200 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{currentLang === 'am' ? 'በነጻ Vercel እና Supabase ላይ የማሰራጨት መመሪያ' : 'Free 100% Vercel & Supabase Deployment Guide'}</span>
                    </h4>
                    <p className="text-xs text-emerald-900/90 dark:text-emerald-300 mt-1 leading-relaxed">
                      {currentLang === 'am'
                        ? 'ይህ መተግበሪያ በ GitHub እና Vercel ላይ በነጻ ለመጫን ተዘጋጅቷል። ፎቶዎች በስልኩ ላይ በትንሽ ኪሎባይት ስለሚጨመቁ የ Supabase ነፃ ኮታ (Free Tier) ሳይሞላ ለረጅም ጊዜ ያገለግላል።'
                        : 'This app is pre-architected for instant free Vercel + GitHub deployment with client-side canvas compression to maximize Supabase free storage.'}
                    </p>
                  </div>

                  {/* Step 1: Supabase SQL Setup */}
                  <div className="bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-stone-900 dark:bg-stone-700 text-white text-xs font-bold flex items-center justify-center">1</span>
                        <h5 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                          {currentLang === 'am' ? 'የ Supabase ዳታቤዝ ሰንጠረዦችን መፍጠር (SQL Schema)' : 'Run SQL Schema in Supabase'}
                        </h5>
                      </div>
                      <button
                        onClick={handleCopySql}
                        className="py-1.5 px-3 bg-stone-900 dark:bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedSql ? t.copiedText : 'Copy SQL Script'}</span>
                      </button>
                    </div>

                    <pre className="bg-stone-950 text-stone-200 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48">
                      {SUPABASE_SQL_SCHEMA}
                    </pre>
                  </div>

                  {/* Step 2: Vercel Deploy Steps */}
                  <div className="bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2 text-xs text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-stone-900 dark:bg-stone-700 text-white text-xs font-bold flex items-center justify-center">2</span>
                      <h5 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                        {currentLang === 'am' ? 'በ GitHub እና Vercel ላይ በነጻ መጫን' : 'Deploy to Vercel via GitHub'}
                      </h5>
                    </div>
                    <ol className="list-decimal pl-5 space-y-1 text-stone-600 dark:text-stone-400">
                      <li>Push this repository to your GitHub account.</li>
                      <li>Go to <strong>vercel.com/new</strong> and import the GitHub repository.</li>
                      <li>Vercel automatically detects Vite + React and builds in ~20 seconds for free!</li>
                    </ol>
                  </div>
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
    </div>
  );
};
