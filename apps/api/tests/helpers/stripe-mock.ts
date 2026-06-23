import { mock } from 'bun:test'

/**
 * Stripe mock for the subscription-only money model. The platform's sole
 * Stripe surface is caster Billing: Checkout, the customer portal, customer
 * creation, subscription retrieval, and the webhook `constructEvent` verifier.
 * There is no escrow / Connect / payout flow, so none of that is mocked.
 */

interface SubscriptionRow {
  id: string
  customer: string
  status: string
  current_period_end: number
  cancel_at_period_end: boolean
  priceId: string
}

interface ConstructEventStub {
  type: string
  data: { object: unknown }
  id: string
}

interface StripeMockState {
  customers: Map<string, { id: string; email?: string; name?: string }>
  subscriptions: Map<string, SubscriptionRow>
  checkoutUrl: string
  portalUrl: string
  // For webhooks/constructEvent
  nextEvent: ConstructEventStub | null
  constructEventThrows: Error | null
}

let counter = 0
function uid(prefix: string): string {
  counter += 1
  return `${prefix}_${Date.now()}_${counter}`
}

export const stripeMockState: StripeMockState = {
  customers: new Map(),
  subscriptions: new Map(),
  checkoutUrl: 'https://stripe.test/checkout',
  portalUrl: 'https://stripe.test/portal',
  nextEvent: null,
  constructEventThrows: null,
}

export function resetStripeMockState(): void {
  stripeMockState.customers.clear()
  stripeMockState.subscriptions.clear()
  stripeMockState.checkoutUrl = 'https://stripe.test/checkout'
  stripeMockState.portalUrl = 'https://stripe.test/portal'
  stripeMockState.nextEvent = null
  stripeMockState.constructEventThrows = null
}

/**
 * Pre-register a Stripe Subscription in the mock so a subsequent
 * `stripe.subscriptions.retrieve` (used by `handleCheckoutCompleted`) finds it.
 */
export function seedSubscription(args: {
  id: string
  customer: string
  status?: string
  currentPeriodEnd?: number
  cancelAtPeriodEnd?: boolean
  priceId?: string
}): SubscriptionRow {
  const row: SubscriptionRow = {
    id: args.id,
    customer: args.customer,
    status: args.status ?? 'active',
    current_period_end: args.currentPeriodEnd ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    cancel_at_period_end: args.cancelAtPeriodEnd ?? false,
    priceId: args.priceId ?? 'price_test',
  }
  stripeMockState.subscriptions.set(args.id, row)
  return row
}

function shapeSubscription(row: SubscriptionRow) {
  return {
    id: row.id,
    customer: row.customer,
    status: row.status,
    current_period_end: row.current_period_end,
    cancel_at_period_end: row.cancel_at_period_end,
    items: { data: [{ price: { id: row.priceId } }] },
  }
}

/**
 * Build the mocked `stripe` singleton. Each method is a `mock(...)` so tests
 * can assert call counts and args via `stripe.<ns>.<fn>.mock.calls`.
 */
export function buildStripeMock() {
  const customers = {
    create: mock(async (params: { email?: string; name?: string; metadata?: Record<string, string> }) => {
      const id = uid('cus')
      stripeMockState.customers.set(id, { id, email: params.email, name: params.name })
      return { id, email: params.email, name: params.name }
    }),
  }

  const subscriptions = {
    retrieve: mock(async (subscriptionId: string) => {
      const row = stripeMockState.subscriptions.get(subscriptionId)
      if (!row) {
        // Default-shaped active subscription so callers don't blow up.
        return shapeSubscription(
          seedSubscription({ id: subscriptionId, customer: uid('cus') })
        )
      }
      return shapeSubscription(row)
    }),
  }

  const checkout = {
    sessions: {
      create: mock(
        async (_params: {
          mode: string
          customer: string
          line_items: unknown[]
          success_url: string
          cancel_url: string
        }) => {
          const id = uid('cs')
          return { id, url: stripeMockState.checkoutUrl }
        }
      ),
    },
  }

  const billingPortal = {
    sessions: {
      create: mock(async (_params: { customer: string; return_url: string }) => {
        const id = uid('bps')
        return { id, url: stripeMockState.portalUrl }
      }),
    },
  }

  const webhooks = {
    constructEvent: mock((_rawBody: string, _sig: string, _secret: string) => {
      if (stripeMockState.constructEventThrows) throw stripeMockState.constructEventThrows
      if (!stripeMockState.nextEvent) {
        throw new Error('Mock Stripe: no nextEvent set — call setNextWebhookEvent(...) first')
      }
      return stripeMockState.nextEvent
    }),
  }

  return {
    customers,
    subscriptions,
    checkout,
    billingPortal,
    webhooks,
  }
}

// Singleton — Bun's mock.module needs a stable export reference so that the
// service-side `import { stripe } from ...` returns the same shape across the
// whole test run. Mock functions persist call records across tests; suites
// that care reset via `resetStripeMockCalls()` in `beforeEach`.
export const stripeMock = buildStripeMock()

export function resetStripeMockCalls(): void {
  stripeMock.customers.create.mockClear()
  stripeMock.subscriptions.retrieve.mockClear()
  stripeMock.checkout.sessions.create.mockClear()
  stripeMock.billingPortal.sessions.create.mockClear()
  stripeMock.webhooks.constructEvent.mockClear()
}
