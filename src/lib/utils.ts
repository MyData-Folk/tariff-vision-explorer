
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

// Fonction pour générer des dates entre deux dates
export function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

// Fonction pour formater une date au format ISO (YYYY-MM-DD)
export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Fonction pour convertir une chaîne de date ISO en objet Date
export function parseISODate(dateStr: string): Date {
  return new Date(dateStr);
}

// Fonction pour télécharger des données au format CSV
export function downloadCSV(data: any[], filename: string): void {
  // Convertir les données en format CSV
  const headers = Object.keys(data[0]).join(',');
  const csv = [
    headers,
    ...data.map(row => 
      Object.values(row)
        .map(value => typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value)
        .join(',')
    )
  ].join('\n');
  
  // Créer un blob et un lien de téléchargement
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
