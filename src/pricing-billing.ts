export function initPricingBilling() {
  const period = document.querySelector<HTMLFieldSetElement>('#pricing .billing-period');
  const yearly = period?.querySelector<HTMLInputElement>('input[value="yearly"]');
  const savings = period?.querySelector('small');
  if (!period || !yearly || !savings) return;

  const cards = document.querySelectorAll<HTMLElement>('#pricing .pricing-card[data-yearly-discount]');
  const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const priceDetails = (paidCents: number, discount: number, months: number) => {
    const comparisonCents = Math.round(paidCents * 100 / (100 - discount));
    return {
      amount: dollars.format(Math.round(paidCents / months) / 100),
      comparison: dollars.format(Math.round(comparisonCents / months) / 100),
      discount,
    };
  };

  const plans = [...cards].flatMap(card => {
    const amount = card.querySelector<HTMLElement>('[data-monthly-cents]');
    const billing = card.querySelector<HTMLElement>('.plan-billing');
    const comparison = card.querySelector<HTMLElement>('.plan-price-comparison');
    const comparisonPrice = comparison?.querySelector('s');
    const badge = card.querySelector<HTMLElement>('.plan-badge--discount');
    if (!amount || !billing || !comparison || !comparisonPrice || !badge) return [];

    const monthlyCents = Number(amount.dataset.monthlyCents);
    const yearlyCents = Number(amount.dataset.yearlyCents);
    const monthly = priceDetails(monthlyCents, Number(card.dataset.monthlyDiscount), 1);
    const annual = priceDetails(yearlyCents, Number(card.dataset.yearlyDiscount), 12);
    const annualBill = `${dollars.format(yearlyCents / 100)} paid yearly`;

    return [{ amount, billing, comparison, comparisonPrice, badge, monthly, annual, annualBill }];
  });
  if (!plans.length) return;

  const updatePrices = () => {
    for (const plan of plans) {
      const price = yearly.checked ? plan.annual : plan.monthly;
      plan.amount.textContent = price.amount;
      plan.billing.textContent = yearly.checked ? plan.annualBill : 'USD · Billed monthly';
      plan.comparisonPrice.textContent = price.comparison;
      plan.badge.textContent = `${price.discount}% off`;
      plan.comparison.hidden = false;
      plan.badge.hidden = false;
    }
  };

  const maxDiscount = Math.max(...plans.map(plan => plan.annual.discount));
  savings.textContent = `Save ${maxDiscount}%`;
  period.addEventListener('change', updatePrices);
  updatePrices();
  period.hidden = false;
}
