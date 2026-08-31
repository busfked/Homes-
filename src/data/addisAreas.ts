export interface AreaInfo {
  id: string;
  nameEn: string;
  nameAm: string;
  subCityEn: string;
  subCityAm: string;
}

export const ADDIS_AREAS: AreaInfo[] = [
  { id: 'bole', nameEn: 'Bole', nameAm: 'ቦሌ', subCityEn: 'Bole', subCityAm: 'ቦሌ' },
  { id: 'gerji', nameEn: 'Gerji', nameAm: 'ገርጂ', subCityEn: 'Bole', subCityAm: 'ቦሌ' },
  { id: 'bulbula', nameEn: 'Bulbula', nameAm: 'ቡልቡላ', subCityEn: 'Bole', subCityAm: 'ቦሌ' },
  { id: 'megenagna', nameEn: 'Megenagna', nameAm: 'መገናኛ', subCityEn: 'Yeka', subCityAm: 'የካ' },
  { id: 'cmc', nameEn: 'CMC', nameAm: 'ሲ ኤም ሲ', subCityEn: 'Yeka', subCityAm: 'የካ' },
  { id: 'ayat', nameEn: 'Ayat', nameAm: 'አያት', subCityEn: 'Yeka / Bole', subCityAm: 'የካ / ቦሌ' },
  { id: 'summit', nameEn: 'Summit', nameAm: 'ሰሚት', subCityEn: 'Bole', subCityAm: 'ቦሌ' },
  { id: 'sarbet', nameEn: 'Sarbet', nameAm: 'ሳርቤት', subCityEn: 'Kirkos', subCityAm: 'ቂርቆስ' },
  { id: 'kazanchis', nameEn: 'Kazanchis', nameAm: 'ካዛንቺስ', subCityEn: 'Kirkos', subCityAm: 'ቂርቆስ' },
  { id: 'piassa', nameEn: 'Piassa', nameAm: 'ፒያሳ', subCityEn: 'Arada', subCityAm: 'አራዳ' },
  { id: 'lebu', nameEn: 'Lebu', nameAm: 'ለቡ', subCityEn: 'Nifas Silk-Lafto', subCityAm: 'ንፋስ ስልክ ላፍቶ' },
  { id: 'gofa', nameEn: 'Gofa Camp', nameAm: 'ጎፋ ካምፕ', subCityEn: 'Nifas Silk', subCityAm: 'ንፋስ ስልክ' },
  { id: 'jemo', nameEn: 'Jemo 1-3', nameAm: 'ጀምኦ 1-3', subCityEn: 'Nifas Silk-Lafto', subCityAm: 'ንፋስ ስልክ ላፍቶ' },
  { id: 'mexico', nameEn: 'Mexico', nameAm: 'ሜክሲኮ', subCityEn: 'Kirkos', subCityAm: 'ቂርቆስ' },
  { id: '22_mazoria', nameEn: '22 Mazoria', nameAm: 'ሃያ ሁለት ማዞሪያ', subCityEn: 'Yeka', subCityAm: 'የካ' },
  { id: 'gotera', nameEn: 'Gotera', nameAm: 'ጎተራ', subCityEn: 'Kirkos', subCityAm: 'ቂርቆስ' },
  { id: 'torhailoch', nameEn: 'Torhailoch', nameAm: 'ጦር ኃይሎች', subCityEn: 'Kolfe Keranio', subCityAm: 'ኮልፌ ቀራኒዮ' },
  { id: 'bethel', nameEn: 'Bethel', nameAm: 'ቤቴል', subCityEn: 'Kolfe', subCityAm: 'ኮልፌ' },
  { id: 'kality', nameEn: 'Kality', nameAm: 'ቃሊቲ', subCityEn: 'Akaki Kality', subCityAm: 'አቃቂ ቃሊቲ' },
  { id: 'old_airport', nameEn: 'Old Airport', nameAm: 'ኦልድ ኤርፖርት', subCityEn: 'Lideta', subCityAm: 'ልደታ' },
];

export const PROPERTY_TYPES = [
  { id: 'apartment', nameEn: 'Apartment', nameAm: 'አፓርታማ' },
  { id: 'condominium', nameEn: 'Condominium (ኮንዶሚኒየም)', nameAm: 'ኮንዶሚኒየም' },
  { id: 'villa', nameEn: 'Villa House', nameAm: 'ቪላ ቤት' },
  { id: 'g_plus_1', nameEn: 'G+1 House', nameAm: 'ጂ+1 ቤት' },
  { id: 'g_plus_2', nameEn: 'G+2 / G+3', nameAm: 'ጂ+2 / ጂ+3' },
  { id: 'studio', nameEn: 'Studio / Service', nameAm: 'ስቱዲዮ / ሰርቪስ ቤት' },
  { id: 'commercial', nameEn: 'Commercial / Shop', nameAm: 'የንግድ / ሱቅ' },
];

export const CAR_TYPES = [
  { id: 'sedan', nameEn: 'Sedan', nameAm: 'ሴዳን' },
  { id: 'suv', nameEn: 'SUV / 4WD', nameAm: 'ኤስ.ዩ.ቪ / ፎር ዊል' },
  { id: 'compact', nameEn: 'Compact / Vitz', nameAm: 'ኮምፓክት / ቪትዝ' },
  { id: 'pickup', nameEn: 'Pickup / Double Cab', nameAm: 'ፒክአፕ / ደብል ካብ' },
  { id: 'van', nameEn: 'Van / Minibus', nameAm: 'ቫን / ሚኒባስ' },
  { id: 'truck', nameEn: 'Commercial Truck', nameAm: 'የጭነት መኪና' },
];

export const MACHINERY_TYPES = [
  { id: 'excavator', nameEn: 'Excavator', nameAm: 'ኤክስካቫተር' },
  { id: 'loader', nameEn: 'Wheel Loader', nameAm: 'ሎደር' },
  { id: 'bulldozer', nameEn: 'Bulldozer', nameAm: 'ቡልዶዘር' },
  { id: 'crane', nameEn: 'Crane', nameAm: 'ክሬን' },
  { id: 'forklift', nameEn: 'Forklift', nameAm: 'ፎርክሊፍት' },
  { id: 'generator', nameEn: 'Heavy Generator', nameAm: 'ትልቅ ጀነሬተር' },
  { id: 'mixer', nameEn: 'Concrete Mixer', nameAm: 'ኮንክሪት ሚክሰር' },
  { id: 'tractor', nameEn: 'Agricultural Tractor', nameAm: 'ትራክተር' },
];
