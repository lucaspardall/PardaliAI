
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

export async function createStripeProducts() {
  try {
    console.log('Criando produtos no Stripe...');

    // Criar produto Starter
    const starterProduct = await stripe.products.create({
      name: 'Starter Plan',
      description: 'Plano Starter - Até 3 lojas e 100 créditos de IA/mês'
    });

    const starterMonthly = await stripe.prices.create({
      unit_amount: 2900, // R$ 29,00
      currency: 'brl',
      recurring: { interval: 'month' },
      product: starterProduct.id,
    });

    const starterYearly = await stripe.prices.create({
      unit_amount: 29000, // R$ 290,00 (10 meses)
      currency: 'brl',
      recurring: { interval: 'year' },
      product: starterProduct.id,
    });

    // Criar produto Pro
    const proProduct = await stripe.products.create({
      name: 'Pro Plan',
      description: 'Plano Pro - Até 10 lojas e créditos ilimitados'
    });

    const proMonthly = await stripe.prices.create({
      unit_amount: 7900, // R$ 79,00
      currency: 'brl',
      recurring: { interval: 'month' },
      product: proProduct.id,
    });

    const proYearly = await stripe.prices.create({
      unit_amount: 79000, // R$ 790,00 (10 meses)
      currency: 'brl',
      recurring: { interval: 'year' },
      product: proProduct.id,
    });

    // Criar produto Enterprise
    const enterpriseProduct = await stripe.products.create({
      name: 'Enterprise Plan',
      description: 'Plano Enterprise - Lojas e créditos ilimitados'
    });

    const enterpriseMonthly = await stripe.prices.create({
      unit_amount: 19900, // R$ 199,00
      currency: 'brl',
      recurring: { interval: 'month' },
      product: enterpriseProduct.id,
    });

    const enterpriseYearly = await stripe.prices.create({
      unit_amount: 199000, // R$ 1990,00 (10 meses)
      currency: 'brl',
      recurring: { interval: 'year' },
      product: enterpriseProduct.id,
    });

    console.log('Produtos criados com sucesso!');
    console.log('Adicione os seguintes Price IDs ao arquivo .env:');
    console.log(`STRIPE_STARTER_MONTHLY_PRICE_ID=${starterMonthly.id}`);
    console.log(`STRIPE_STARTER_YEARLY_PRICE_ID=${starterYearly.id}`);
    console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${proMonthly.id}`);
    console.log(`STRIPE_PRO_YEARLY_PRICE_ID=${proYearly.id}`);
    console.log(`STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=${enterpriseMonthly.id}`);
    console.log(`STRIPE_ENTERPRISE_YEARLY_PRICE_ID=${enterpriseYearly.id}`);

    return {
      starter: { monthly: starterMonthly.id, yearly: starterYearly.id },
      pro: { monthly: proMonthly.id, yearly: proYearly.id },
      enterprise: { monthly: enterpriseMonthly.id, yearly: enterpriseYearly.id }
    };
  } catch (error) {
    console.error('Erro ao criar produtos no Stripe:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createStripeProducts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
