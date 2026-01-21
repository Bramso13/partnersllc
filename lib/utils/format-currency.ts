/**
 * Formate un montant en centimes en euros avec le format français
 * @param amountInCents Montant en centimes
 * @returns Montant formaté (ex: "1 234,56 €")
 */
export function formatCurrency(amountInCents: number): string {
  const amountInEuros = amountInCents / 100;

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountInEuros);
}
