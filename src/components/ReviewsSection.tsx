import React, { useState, useMemo } from 'react';
import { Star, MessageSquarePlus, ShieldCheck, ThumbsUp, CheckCircle, Award } from 'lucide-react';
import { Language, Review, ReviewUserRole } from '../types';
import { translations } from '../data/translations';

interface ReviewsSectionProps {
  currentLang: Language;
  reviews: Review[];
  onOpenAddReviewModal: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  currentLang,
  reviews,
  onOpenAddReviewModal,
}) => {
  const t = translations[currentLang];
  const [selectedFilter, setSelectedFilter] = useState<'all' | '5star' | '4plus' | 'renter_buyer' | 'owner'>('all');

  // Filter only active / approved reviews
  const activeReviews = useMemo(() => {
    return reviews.filter((r) => r.status !== 'hidden' && r.isApproved !== false);
  }, [reviews]);

  // Calculate rating stats
  const { averageRating, totalReviews, ratingCounts } = useMemo(() => {
    if (activeReviews.length === 0) {
      return { averageRating: 5.0, totalReviews: 0, ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    activeReviews.forEach((r) => {
      const star = Math.max(1, Math.min(5, Math.round(r.rating)));
      counts[star] = (counts[star] || 0) + 1;
      sum += r.rating;
    });
    const avg = Number((sum / activeReviews.length).toFixed(1));
    return { averageRating: avg, totalReviews: activeReviews.length, ratingCounts: counts };
  }, [activeReviews]);

  // Filtered reviews
  const displayedReviews = useMemo(() => {
    return activeReviews.filter((r) => {
      if (selectedFilter === '5star') return r.rating === 5;
      if (selectedFilter === '4plus') return r.rating >= 4;
      if (selectedFilter === 'renter_buyer') return r.userRole === 'buyer' || r.userRole === 'renter';
      if (selectedFilter === 'owner') return r.userRole === 'owner';
      return true;
    });
  }, [activeReviews, selectedFilter]);

  const getRoleLabel = (role: ReviewUserRole) => {
    switch (role) {
      case 'buyer':
        return currentLang === 'am' ? 'ገዢ (Buyer)' : 'Buyer';
      case 'renter':
        return currentLang === 'am' ? 'ተከራይ (Tenant)' : 'Tenant';
      case 'owner':
        return currentLang === 'am' ? 'ባለቤት (Owner)' : 'Property Owner';
      default:
        return currentLang === 'am' ? 'ተጠቃሚ (Client)' : 'Client';
    }
  };

  const formatReviewDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return currentLang === 'am' ? 'ዛሬ' : 'Today';
      if (diffDays === 1) return currentLang === 'am' ? 'ትናንት' : 'Yesterday';
      if (diffDays < 7) return currentLang === 'am' ? `ከ ${diffDays} ቀናት በፊት` : `${diffDays} days ago`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return currentLang === 'am' ? `ከ ${weeks} ሳምንት በፊት` : `${weeks}w ago`;
      }
      return date.toLocaleDateString(currentLang === 'am' ? 'am-ET' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <section id="customer-reviews-section" className="py-10 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-300/60 dark:border-amber-700/60">
              <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{t.reviewsBadge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
              {t.reviewsTitle}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
              {t.reviewsSubtitle}
            </p>
          </div>

          <button
            id="btn-open-add-review-modal"
            onClick={onOpenAddReviewModal}
            className="self-start sm:self-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{t.writeReview}</span>
          </button>
        </div>

        {/* Rating Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-sm">
          {/* Big Score Box */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-stone-200 dark:border-stone-800 space-y-2">
            <div className="text-4xl sm:text-5xl font-black text-stone-900 dark:text-white tracking-tight">
              {averageRating}
              <span className="text-lg text-stone-400 font-medium"> / 5</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= Math.round(averageRating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-stone-300 dark:text-stone-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              {totalReviews} {t.basedOnReviews}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                {currentLang === 'am' ? '100% እውነተኛ የደንበኞች ደረጃ' : '100% Verified Community'}
              </span>
            </div>
          </div>

          {/* Star Distribution Breakdown */}
          <div className="md:col-span-8 flex flex-col justify-center space-y-2 px-1 sm:px-4">
            {[5, 4, 3, 2, 1].map((starVal) => {
              const count = ratingCounts[starVal] || 0;
              const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              return (
                <div key={starVal} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-14 shrink-0 font-bold text-stone-700 dark:text-stone-300">
                    <span>{starVal}</span>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-1 h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="w-16 text-right font-medium text-stone-500 dark:text-stone-400 shrink-0">
                    {count} ({percent}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: `${t.filterAllReviews} (${activeReviews.length})` },
            { id: '5star', label: `⭐⭐⭐⭐⭐ ${t.filter5Stars}` },
            { id: '4plus', label: t.filter4PlusStars },
            { id: 'renter_buyer', label: t.filterTenantsBuyers },
            { id: 'owner', label: t.filterOwners },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`filter-review-${tab.id}`}
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                selectedFilter === tab.id
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-stone-900 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-stone-850 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reviews Grid */}
        {displayedReviews.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
              <Star className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              {t.noReviewsYet}
            </p>
            <button
              onClick={onOpenAddReviewModal}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer"
            >
              + {t.leaveReview}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedReviews.map((rev) => (
              <div
                key={rev.id}
                id={`review-card-${rev.id}`}
                className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-3 hover:border-amber-300 dark:hover:border-amber-800/80 transition-all"
              >
                <div className="space-y-2.5">
                  {/* Card Header: Rating stars & Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= rev.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-stone-200 dark:text-stone-800'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-stone-400 font-medium">
                      {formatReviewDate(rev.createdAt)}
                    </span>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
                    "{rev.comment}"
                  </p>
                </div>

                {/* Card Footer: User info & verification badge */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900 dark:text-white truncate">
                        {rev.userName}
                      </span>
                      <span title={t.statusApproved}>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block truncate">
                      {getRoleLabel(rev.userRole)}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                    Direct Deal
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
