
// Re-export all services for convenient importing

// Types
export * from './types';

// Base services
export * from './baseService';

// Domain-specific services
export * from './categoryService';
// We need to use named exports to avoid the fetchPartners conflict
import { fetchPlans, fetchPartners } from './partnerService';
export { fetchPlans, fetchPartners };
// Re-export everything else from partnerService
import * as PartnerServiceExports from './partnerService';
// Filter out the functions we've already explicitly exported
const { fetchPlans: _, fetchPartners: __, ...otherPartnerExports } = PartnerServiceExports;
// Export the rest - using individual exports instead of spread syntax
Object.keys(otherPartnerExports).forEach(key => {
  // @ts-ignore - Dynamic exports
  exports[key] = otherPartnerExports[key];
});

export * from './rateService';
export * from './yieldService';
