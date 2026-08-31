import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Phone, FileText } from 'lucide-react';
import { Language, Property, ReportedBroker } from '../types';
import { translations } from '../data/translations';
import { addReportedBroker } from '../utils/storage';

interface ReportBrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  targetProperty?: Property | null;
  reporterPhone?: string;
  reporterRole?: 'owner' | 'buyer' | 'user';
  onReportSubmitted?: () => void;
}

export const ReportBrokerModal: React.FC<ReportBrokerModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  targetProperty,
  reporterPhone = '',
  reporterRole = 'user',
  onReportSubmitted,
}) => {
  if (!isOpen) return null;

  const t = translations[currentLang];

  const [offenderPhone, setOffenderPhone] = useState('');
  const [reporterPhoneInput, setReporterPhoneInput] = useState(reporterPhone);
  const [reason, setReason] = useState<ReportedBroker['reason']>('broker_middleman_activity');
  const [reasonDetails, setReasonDetails] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!offenderPhone.trim() || offenderPhone.trim().length < 9) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ ትክክለኛ የደላላውን/አጭበርባሪውን ስልክ ቁጥር ያስገቡ።'
          : 'Please enter a valid phone number for the offender.'
      );
      return;
    }

    const newReport: ReportedBroker = {
      id: `rep-${Date.now().toString(36)}`,
      reporterPhone: reporterPhoneInput.trim() || 'Anonymous Reporter',
      reporterRole: (reporterRole || 'user') as 'owner' | 'buyer' | 'user',
      reportedPhone: offenderPhone.trim(),
      propertyId: targetProperty?.id,
      propertyTitle: targetProperty?.title,
      reason: reason,
      reasonText: reasonDetails.trim() || 'Reported through anti-broker protection modal',
      createdAt: new Date().toISOString(),
      status: 'pending_review',
    };

    addReportedBroker(newReport);
    setIsSuccess(true);
    if (onReportSubmitted) {
      onReportSubmitted();
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div
        id="report-broker-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-rose-950/60 bg-rose-50/70 dark:bg-rose-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-rose-950 dark:text-rose-100">
                {t.reportBrokerModalTitle}
              </h3>
              <p className="text-xs text-rose-800/80 dark:text-rose-300">
                {currentLang === 'am' ? 'ያልተፈቀደ የደላላ ወይም የማጭበርበር ጥቆማ' : 'Security & Anti-Poaching Enforcement'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          /* SUCCESS STATE */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-stone-900 dark:text-stone-100">
              {currentLang === 'am' ? 'ጥቆማው ደርሶናል!' : 'Report Received!'}
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-sm mx-auto">
              {t.reportSubmittedSuccess}
            </p>
            <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
              Target Phone: {offenderPhone}
            </div>
            <button
              onClick={onClose}
              className="py-2.5 px-6 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        ) : (
          /* REPORT FORM */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
              {t.reportBrokerDesc}
            </p>

            {targetProperty && (
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl text-xs">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{currentLang === 'am' ? 'የተያያዘው ንብረት:' : 'Related Listing:'}</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">{targetProperty.title} ({targetProperty.area})</span>
              </div>
            )}

            {/* Offender Phone */}
            <div>
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                {t.reportedPhoneLabel}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={offenderPhone}
                  onChange={(e) => setOffenderPhone(e.target.value)}
                  placeholder="0911XXXXXX"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Reason selector */}
            <div>
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                {t.reportReasonLabel}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportedBroker['reason'])}
                className="w-full py-2.5 px-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              >
                <option value="broker_middleman_activity">{t.reasonBrokerActivity}</option>
                <option value="reselling_info">{t.reasonReselling}</option>
                <option value="harassment">{t.reasonHarassment}</option>
                <option value="fraud_scam">{t.reasonFraud}</option>
                <option value="other">{currentLang === 'am' ? 'ሌላ ምክንያት' : 'Other violation'}</option>
              </select>
            </div>

            {/* Additional comments */}
            <div>
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                {t.reportDetailsLabel}
              </label>
              <textarea
                rows={3}
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                placeholder={
                  currentLang === 'am'
                    ? 'ምሳሌ፡ ደውሎ 1 ወር ኮሚሽን ከእኔ ጠየቀ፣ ወይም በቴሌግራም ቻናሉ ላይ ያለእኔ ፈቃድ ለጥፎታል...'
                    : 'e.g. Called asking for 1 month broker commission, reposted my photos on Telegram...'
                }
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Reporter phone (optional verification) */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
                {currentLang === 'am' ? 'የእርስዎ ስልክ (ካስፈለገ አድሚን ለማረጋገጥ):' : 'Your Phone Number (optional for admin verification):'}
              </label>
              <input
                type="tel"
                value={reporterPhoneInput}
                onChange={(e) => setReporterPhoneInput(e.target.value)}
                placeholder="0911XXXXXX"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-white"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{t.submitReportBtn}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
