import React, { useState } from 'react';
import { Star, X, CheckCircle, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Language, Review, ReviewUserRole, UserAccount } from '../types';
import { translations } from '../data/translations';

interface AddReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  currentUser?: UserAccount | null;
  onAddReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  currentUser,
  onAddReview,
}) => {
  const t = translations[currentLang];

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userName, setUserName] = useState<string>(currentUser?.name || '');
  const [userPhone, setUserPhone] = useState<string>(currentUser?.phone || '');
  const [userRole, setUserRole] = useState<ReviewUserRole>('buyer');
  const [comment, setComment] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const starLabels: Record<number, { am: string; en: string }> = {
    5: { am: 'እጅግ በጣም ምርጥ (Excellent)', en: 'Excellent experience' },
    4: { am: 'በጣም ጥሩ (Very Good)', en: 'Very good' },
    3: { am: 'ጥሩ (Good)', en: 'Good' },
    2: { am: 'አጥጋቢ (Fair)', en: 'Fair' },
    1: { am: 'መሻሻል አለበት (Needs improvement)', en: 'Needs improvement' },
  };

  const currentDisplayRating = hoverRating || rating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!userName.trim()) {
      setErrorMsg(currentLang === 'am' ? 'እባክዎ ሙሉ ስምዎን ያስገቡ።' : 'Please enter your full name.');
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      setErrorMsg(
        currentLang === 'am'
          ? 'እባክዎ ቢያንስ ጥቂት ቃላት አስተያየትዎን ይጻፉ።'
          : 'Please write at least a brief comment (minimum 5 characters).'
      );
      return;
    }

    onAddReview({
      userName: userName.trim(),
      userPhone: userPhone.trim() || undefined,
      userRole,
      rating,
      comment: comment.trim(),
      isApproved: true,
      status: 'active',
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setComment('');
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        id="add-review-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-950 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs shrink-0">
              <Star className="w-5 h-5 fill-white" />
            </div>
            <div className="min-w-0 truncate">
              <h3 className="text-base sm:text-lg font-black tracking-tight truncate">
                {t.leaveReview}
              </h3>
              <p className="text-xs text-stone-400 truncate">
                {currentLang === 'am'
                  ? 'የእርስዎን ተሞክሮ በማጋራት ሌሎችን ይርዱ'
                  : 'Help the community with your direct deal feedback'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-add-review"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {isSubmitted ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-black text-stone-900 dark:text-white">
                {t.success}
              </h4>
              <p className="text-sm text-stone-600 dark:text-stone-300 max-w-xs mx-auto">
                {t.reviewSubmittedSuccess}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating Selector */}
              <div className="bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200/60 dark:border-amber-800/40 text-center space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  {t.yourRating}
                </label>
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isLit = starVal <= currentDisplayRating;
                    return (
                      <button
                        type="button"
                        key={starVal}
                        id={`star-btn-${starVal}`}
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-120 active:scale-95 transition-transform cursor-pointer focus:outline-none"
                        title={`${starVal} Star`}
                      >
                        <Star
                          className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                            isLit
                              ? 'text-amber-500 fill-amber-400'
                              : 'text-stone-300 dark:text-stone-700'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs font-bold text-amber-800 dark:text-amber-200 h-4">
                  {starLabels[currentDisplayRating]?.[currentLang]}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                  {t.yourRole}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'buyer', label: t.roleBuyer },
                    { id: 'renter', label: t.roleRenter },
                    { id: 'owner', label: t.roleOwner },
                    { id: 'client', label: t.roleClient },
                  ].map((role) => (
                    <button
                      type="button"
                      key={role.id}
                      id={`btn-role-${role.id}`}
                      onClick={() => setUserRole(role.id as ReviewUserRole)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                        userRole === role.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-stone-50 dark:bg-stone-850 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {t.yourName} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-review-user-name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder={currentLang === 'am' ? 'ምሳሌ፡ ዳዊት ተክለ' : 'e.g. Dawit T.'}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {t.yourPhone}
                  </label>
                  <input
                    type="tel"
                    id="input-review-user-phone"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="09... / 07..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Comment Textarea */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {t.reviewComment} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="textarea-review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder={t.reviewPlaceholder}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
                  <span>{currentLang === 'am' ? 'የደላላ ኮሚሽን ሳያስከፍሉ ቀጥታ መገናኘትዎን ይጥቀሱ' : 'Mention direct owner interaction without commission'}</span>
                  <span>{comment.length} chars</span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                  {errorMsg}
                </div>
              )}

              {/* Trust Badge Note */}
              <div className="flex items-center gap-2 p-2.5 bg-stone-100 dark:bg-stone-800/60 rounded-xl text-[11px] text-stone-600 dark:text-stone-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {currentLang === 'am'
                    ? 'አስተያየትዎ እውነተኛ የደንበኞችን ተሞክሮ ለማሳወቅ ወዲያውኑ በገጹ ላይ ይታያል።'
                    : 'Your review will be shown to help future renters and direct buyers.'}
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-submit-review"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>{t.submitReview}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
