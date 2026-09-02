import { Property, PaymentSettings, UnlockRequest } from '../types';

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
  adminPin: 'admin123',
  autoDeleteDays: 7,
};

// Clean real platform state: No demo accounts, ready for real listings
export const SAMPLE_PROPERTIES: Property[] = [];

export const SAMPLE_UNLOCK_REQUESTS: UnlockRequest[] = [];
