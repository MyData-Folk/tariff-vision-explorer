
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

// Create individual named exports for the remaining exports
// For explicitly named exports approach - no dynamic exports
export const createPartner = otherPartnerExports.createPartner;
export const updatePartner = otherPartnerExports.updatePartner;
export const deletePartner = otherPartnerExports.deletePartner;
// Add any other exports from partnerService that need to be re-exported

export * from './rateService';
export * from './yieldService';
