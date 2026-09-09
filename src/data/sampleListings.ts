import { Property, PaymentSettings, UnlockRequest, Review } from '../types';

export const DEFAULT_SETTINGS: PaymentSettings = {
  telebirrNumber: '0991154337',
  telebirrName: 'BetDelala (0991154337)',
  cbeAccount: '1000131638128',
  cbeName: 'BetDelala (CBE)',
  boaAccount: '61648817',
  boaName: 'BetDelala (Bank of Abyssinia / አቢሲኒያ)',
  awashAccount: '0132087654321',
  awashName: 'BetDelala Agency',
  feeAmountRentBirr: 100, // 100 Birr for unlocking rent properties
  feeAmountSaleBirr: 500, // 500 Birr for unlocking sale properties
  sellerListingFeeBirr: 500, // 500 Birr for owners posting a sale listing (rent is 0 / free)
  feeAmountBirr: 100,
  adminPin: '6121921b',
  autoDeleteDays: 7,
  autoApproveListings: false, // Default to false: all owner listings require admin receipt/screenshot approval before going live!
};

// Clean real platform state: No demo accounts, ready for real listings
export const SAMPLE_PROPERTIES: Property[] = [];

export const SAMPLE_UNLOCK_REQUESTS: UnlockRequest[] = [];

export const SAMPLE_REVIEWS: Review[] = [
  {
    id: 'rev-sample-1',
    userName: 'ዳዊት ተክለሃይማኖት (Dawit T.)',
    userRole: 'renter',
    rating: 5,
    comment: 'በጣም አሪፍ ሲስተም ነው! ቦሌ ላይ የ 2 መኝታ ቤት በ 18,000 ብር በቀጥታ ከባለቤቱ ጋር ተነጋግሬ ተከራይቻለሁ። ምንም የደላላ ተጨማሪ ኮሚሽን አላስከፈሉኝም። እናመሰግናለን!',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    isApproved: true,
    status: 'active'
  },
  {
    id: 'rev-sample-2',
    userName: 'ወ/ሮ ፀሐይ አስፋው (Tsehay A.)',
    userRole: 'owner',
    rating: 5,
    comment: 'ቤቴን ገርጂ ላይ አስመዝግቤ በ 3 ቀናት ውስጥ አስተማማኝ ተከራይ አገኘሁ። መታወቂያ ጠይቃችሁ ማረጋገጣችሁ ህገወጥ ደላሎችን ለመከላከል ትልቅ እርምጃ ነው።',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    isApproved: true,
    status: 'active'
  },
  {
    id: 'rev-sample-3',
    userName: 'Samuel Bekele',
    userRole: 'buyer',
    rating: 5,
    comment: 'The 5-house package is a real lifesaver! I was able to unlock and compare genuine direct owner listings in CMC and Ayat without endless broker runarounds. 10/10 service.',
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    isApproved: true,
    status: 'active'
  },
  {
    id: 'rev-sample-4',
    userName: 'አቶ አሸናፊ መንግስቱ (Ashenafi M.)',
    userRole: 'owner',
    rating: 4,
    comment: 'የመኪናዬን ሽያጭ በቤሴ አስመዝግቤ በቀጥታ ከገዢው ጋር ተገናኘሁ። ስልኬን ሚስጥራዊ አድርጋችሁ ማቆየታችሁ እና ፍቃድ ብቻ መስጠታችሁ ደህንነቱ የተጠበቀ እንዲሆን አድርጎታል።',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    isApproved: true,
    status: 'active'
  }
];
