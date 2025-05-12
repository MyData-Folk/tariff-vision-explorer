
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
// Export the rest individually (ES module compatible way)
Object.keys(otherPartnerExports).forEach(key => {
  // Use dynamic re-export pattern with named exports
  export { [key]: otherPartnerExports[key] }[key];
});

export * from './rateService';
export * from './yieldService';
