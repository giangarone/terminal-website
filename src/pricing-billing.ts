export function initPricingBilling() {
  const period = document.querySelector<HTMLFieldSetElement>('#pricing .billing-period');
  const yearly = period?.querySelector<HTMLInputElement>('input[value="yearly"]');
  if (!period || !yearly) return;

  const cards = document.querySelectorAll<HTMLElement>('#pricing .pricing-card');
  const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const updatePrices = () => {
    for (const card of cards) {
      const amount = card.querySelector<HTMLElement>('[data-monthly-cents]');
      const billing = card.querySelector<HTMLElement>('.plan-billing');
      if (!amount || !billing) continue;

      const monthlyCents = Number(amount.dataset.monthlyCents);
      const yearlyCents = Math.round(monthlyCents * 12 * 0.8);
      const displayCents = yearly.checked ? Math.round(yearlyCents / 12) : monthlyCents;

      amount.textContent = dollars.format(displayCents / 100);
      billing.textContent = yearly.checked
        ? `${dollars.format(yearlyCents / 100)} paid yearly`
        : 'USD · Billed monthly';
    }
  };

  period.addEventListener('change', updatePrices);
  updatePrices();
  period.hidden = false;
}
