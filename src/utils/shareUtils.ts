import { Property, CategoryType } from '../types';

export interface SearchFilterState {
  category?: CategoryType;
  area?: string;
  type?: string;
  listingType?: string;
  maxPrice?: number;
  bedrooms?: string;
  searchQuery?: string;
  onlyAvailable?: boolean;
  propertyId?: string;
}

/**
 * Builds a clean, fully-qualified URL for the current application
 * and query parameters.
 */
export const getBaseUrl = (): string => {
  if (typeof window === 'undefined') return '';
  return window.location.origin + window.location.pathname;
};

/**
 * Generates a direct URL for a specific property.
 * Includes property ID query parameter: ?prop=ID
 */
export const generatePropertyDirectUrl = (propertyId: string, currentFilters?: Partial<SearchFilterState>): string => {
  const baseUrl = getBaseUrl();
  const url = new URL(baseUrl);
  url.searchParams.set('prop', propertyId);

  if (currentFilters?.category && currentFilters.category !== 'home') {
    url.searchParams.set('cat', currentFilters.category);
  }
  if (currentFilters?.area && currentFilters.area !== 'all') {
    url.searchParams.set('area', currentFilters.area);
  }

  return url.toString();
};

/**
 * Generates a direct URL for the current search & filters.
 */
export const generateSearchDirectUrl = (filters: SearchFilterState): string => {
  const baseUrl = getBaseUrl();
  const url = new URL(baseUrl);

  if (filters.category && filters.category !== 'home') {
    url.searchParams.set('cat', filters.category);
  }
  if (filters.area && filters.area !== 'all') {
    url.searchParams.set('area', filters.area);
  }
  if (filters.type && filters.type !== 'all') {
    url.searchParams.set('type', filters.type);
  }
  if (filters.listingType && filters.listingType !== 'all') {
    url.searchParams.set('lt', filters.listingType);
  }
  if (filters.maxPrice && filters.maxPrice > 0) {
    url.searchParams.set('max', filters.maxPrice.toString());
  }
  if (filters.bedrooms && filters.bedrooms !== 'all') {
    url.searchParams.set('beds', filters.bedrooms);
  }
  if (filters.searchQuery && filters.searchQuery.trim()) {
    url.searchParams.set('q', filters.searchQuery.trim());
  }
  if (filters.propertyId) {
    url.searchParams.set('prop', filters.propertyId);
  }

  return url.toString();
};

/**
 * Parse URL search params from the current window location on page load.
 */
export const parseSearchFiltersFromUrl = (): {
  filters: Partial<SearchFilterState>;
  targetPropertyId: string | null;
} => {
  if (typeof window === 'undefined') {
    return { filters: {}, targetPropertyId: null };
  }

  const params = new URLSearchParams(window.location.search);
  const filters: Partial<SearchFilterState> = {};

  const prop = params.get('prop');
  const cat = params.get('cat') as CategoryType | null;
  const area = params.get('area');
  const type = params.get('type');
  const lt = params.get('lt');
  const max = params.get('max');
  const beds = params.get('beds');
  const q = params.get('q') || params.get('search');

  if (cat) filters.category = cat;
  if (area) filters.area = area;
  if (type) filters.type = type;
  if (lt) filters.listingType = lt;
  if (max) filters.maxPrice = Number(max);
  if (beds) filters.bedrooms = beds;
  if (q) filters.searchQuery = q;
  if (prop) filters.propertyId = prop;

  return {
    filters,
    targetPropertyId: prop || null,
  };
};

/**
 * Update browser URL bar without triggering page refresh so the user
 * can also copy the URL directly from the address bar.
 */
export const updateBrowserUrlWithFilters = (filters: SearchFilterState) => {
  if (typeof window === 'undefined' || !window.history) return;
  const url = generateSearchDirectUrl(filters);
  window.history.replaceState({ path: url }, '', url);
};

/**
 * Construct social media share links
 */
export const getWhatsAppShareUrl = (text: string, directUrl: string): string => {
  const fullMessage = `${text}\n\n👉 ${directUrl}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
};

export const getTelegramShareUrl = (text: string, directUrl: string): string => {
  return `https://t.me/share/url?url=${encodeURIComponent(directUrl)}&text=${encodeURIComponent(text)}`;
};

/**
 * Copy text with fallback for non-secure / iframe contexts
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback to execCommand
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};
