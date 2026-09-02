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
  { id: 'bulbula', nameEn: 'Bole Bulbula', nameAm: 'ቦሌ ቡልቡላ', subCityEn: 'Bole', subCityAm: 'ቦሌ' },
  { id: 'arabsa', nameEn: 'Bole Arabsa', nameAm: 'ቦሌ አረብሳ', subCityEn: 'Bole', subCityAm: 'ቦሌ' },
  { id: 'summit', nameEn: 'Summit / Semit', nameAm: 'ሰሚት', subCityEn: 'Bole', subCityAm: 'ቦሌ' },
  { id: 'cmc', nameEn: 'CMC', nameAm: 'ሲ ኤም ሲ', subCityEn: 'Yeka', subCityAm: 'የካ' },
  { id: 'ayat', nameEn: 'Ayat', nameAm: 'አያት', subCityEn: 'Yeka / Bole', subCityAm: 'የካ / ቦሌ' },
  { id: 'megenagna', nameEn: 'Megenagna', nameAm: 'መገናኛ', subCityEn: 'Yeka', subCityAm: 'የካ' },
  { id: 'kotebe', nameEn: 'Kotebe 02', nameAm: 'ኮተቤ 02', subCityEn: 'Yeka', subCityAm: 'የካ' },
  { id: 'shola', nameEn: 'Shola', nameAm: 'ሾላ', subCityEn: 'Yeka', subCityAm: 'የካ' },
  { id: 'ferensay', nameEn: 'Ferensay Legasion', nameAm: 'ፈረንሳይ ለጋሲዮን', subCityEn: 'Yeka', subCityAm: 'የካ' },
  { id: 'shiromeda', nameEn: 'Shiromeda', nameAm: 'ሽሮሜዳ', subCityEn: 'Gullele', subCityAm: 'ጉለሌ' },
  { id: 'shegole', nameEn: 'Shegole', nameAm: 'ሸጎሌ', subCityEn: 'Gullele', subCityAm: 'ጉለሌ' },
  { id: 'atenatera', nameEn: 'Atenatera', nameAm: 'አጠና ተራ', subCityEn: 'Addis Ketema', subCityAm: 'አዲስ ከተማ' },
  { id: 'welete', nameEn: 'Welete / Alert', nameAm: 'ወለተ / አለርት', subCityEn: 'Kolfe Keranio', subCityAm: 'ኮልፌ ቀራኒዮ' },
  { id: 'abuare', nameEn: 'Abuare / Basha Wolde', nameAm: 'አቡአሬ', subCityEn: 'Yeka', subCityAm: 'የካ' },
  { id: 'ayer_tena', nameEn: 'Ayer Tena', nameAm: 'አየር ጤና', subCityEn: 'Kolfe Keranio', subCityAm: 'ኮልፌ ቀራኒዮ' },
  { id: 'torhailoch', nameEn: 'Torhailoch / Total', nameAm: 'ጦር ኃይሎች / ቶታል', subCityEn: 'Kolfe / Lideta', subCityAm: 'ኮልፌ / ልደታ' },
  { id: 'bethel', nameEn: 'Bethel', nameAm: 'ቤቴል', subCityEn: 'Kolfe Keranio', subCityAm: 'ኮልፌ ቀራኒዮ' },
  { id: 'asko', nameEn: 'Asko', nameAm: 'አስኮ', subCityEn: 'Kolfe Keranio', subCityAm: 'ኮልፌ ቀራኒዮ' },
  { id: 'winget', nameEn: 'Winget', nameAm: 'ዊንጌት', subCityEn: 'Kolfe Keranio', subCityAm: 'ኮልፌ ቀራኒዮ' },
  { id: 'lebu', nameEn: 'Lebu', nameAm: 'ለቡ', subCityEn: 'Nifas Silk-Lafto', subCityAm: 'ንፋስ ስልክ ላፍቶ' },
  { id: 'jemo', nameEn: 'Jemo 1-3', nameAm: 'ጀምኦ 1-3', subCityEn: 'Nifas Silk-Lafto', subCityAm: 'ንፋስ ስልክ ላፍቶ' },
  { id: 'gofa', nameEn: 'Gofa Camp / Mebrat Hail', nameAm: 'ጎፋ ካምፕ / መብራት ኃይል', subCityEn: 'Nifas Silk', subCityAm: 'ንፋስ ስልክ' },
  { id: 'saris', nameEn: 'Saris / Abo', nameAm: 'ሳሪስ / አቦ', subCityEn: 'Nifas Silk', subCityAm: 'ንፋስ ስልክ' },
  { id: 'hana_mariam', nameEn: 'Hana Mariam', nameAm: 'ሀና ማሪያም', subCityEn: 'Nifas Silk', subCityAm: 'ንፋስ ስልክ' },
  { id: 'kality', nameEn: 'Kality', nameAm: 'ቃሊቲ', subCityEn: 'Akaki Kality', subCityAm: 'አቃቂ ቃሊቲ' },
  { id: 'akaki', nameEn: 'Akaki', nameAm: 'አቃቂ', subCityEn: 'Akaki Kality', subCityAm: 'አቃቂ ቃሊቲ' },
  { id: 'sarbet', nameEn: 'Sarbet', nameAm: 'ሳርቤት', subCityEn: 'Kirkos', subCityAm: 'ቂርቆስ' },
  { id: 'kazanchis', nameEn: 'Kazanchis / Bambis', nameAm: 'ካዛንቺስ / ባምቢስ', subCityEn: 'Kirkos', subCityAm: 'ቂርቆስ' },
  { id: 'mexico', nameEn: 'Mexico', nameAm: 'ሜክሲኮ', subCityEn: 'Kirkos', subCityAm: 'ቂርቆስ' },
  { id: 'gotera', nameEn: 'Gotera', nameAm: 'ጎተራ', subCityEn: 'Kirkos', subCityAm: 'ቂርቆስ' },
  { id: '22_mazoria', nameEn: '22 Mazoria', nameAm: 'ሃያ ሁለት ማዞሪያ', subCityEn: 'Yeka', subCityAm: 'የካ' },
  { id: 'piassa', nameEn: 'Piassa', nameAm: 'ፒያሳ', subCityEn: 'Arada', subCityAm: 'አራዳ' },
  { id: '4_kilo', nameEn: '4 Kilo', nameAm: '4 ኪሎ', subCityEn: 'Arada', subCityAm: 'አራዳ' },
  { id: '6_kilo', nameEn: '6 Kilo', nameAm: '6 ኪሎ', subCityEn: 'Arada', subCityAm: 'አራዳ' },
  { id: 'old_airport', nameEn: 'Old Airport', nameAm: 'ኦልድ ኤርፖርት', subCityEn: 'Lideta', subCityAm: 'ልደታ' },
  { id: 'mercato', nameEn: 'Mercato', nameAm: 'መርካቶ', subCityEn: 'Addis Ketema', subCityAm: 'አዲስ ከተማ' },
  { id: 'addisu_gebeya', nameEn: 'Addisu Gebeya', nameAm: 'አዲሱ ገበያ', subCityEn: 'Gullele', subCityAm: 'ጉለሌ' },
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
