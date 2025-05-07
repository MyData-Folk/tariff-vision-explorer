
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Fonction pour fusionner les classes CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fonction de formatage des prix
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

// Fonction pour formater les dates
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// Fonction pour calculer le prix total
export function calculateTotalPrice(pricePerNight: number, nights: number): number {
  return pricePerNight * nights;
}

// Fonction pour calculer la différence entre deux prix en pourcentage
export function calculatePercentageDifference(price1: number, price2: number): number {
  if (price1 === 0) return 0;
  return Math.round(((price2 - price1) / price1) * 100);
}
