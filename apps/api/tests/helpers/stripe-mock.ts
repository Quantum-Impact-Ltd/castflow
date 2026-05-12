import { mock } from 'bun:test'

interface IntentRow {
  id: string
  status: 'requires_payment_method' | 'requires_capture' | 'succeeded' | 'canceled'
  amount: number
  amountCaptured: number
  metadata: Record<string, string>
}

interface TransferCall {
  id: string
  amount: number
  destination: string
  source_transaction?: string
  metadata: Record<string, string>
  idempotencyKey?: string
}

interface AccountRow {
  id: string
  payouts_enabled: boolean
  details_submitted: boolean
  requirements: { currently_due: string[] }
}

interface AccountLinkRow {
  url: string
  expires_at: number
}

interface RefundRow {
  id: string
  payment_intent: string
  amount: number
}

interface ConstructEventStub {
  type: string
  data: { object: unknown }
  id: string
}

interface StripeMockState {
  intents: Map<string, IntentRow>
  transfers: TransferCall[]
  accounts: Map<string, AccountRow>
  refunds: RefundRow[]
  accountLinks: AccountLinkRow[]
  nextAccountLink: AccountLinkRow
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
  intents: new Map(),
  transfers: [],
  accounts: new Map(),
  refunds: [],
  accountLinks: [],
  nextAccountLink: { url: 'https://stripe.test/onboard', expires_at: Math.floor(Date.now() / 1000) + 3600 },
  nextEvent: null,
  constructEventThrows: null,
}

export function resetStripeMockState(): void {
  stripeMockState.intents.clear()
  stripeMockState.transfers.length = 0
  stripeMockState.accounts.clear()
  stripeMockState.refunds.length = 0
  stripeMockState.accountLinks.length = 0
  stripeMockState.nextAccountLink = {
    url: 'https://stripe.test/onboard',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  }
  stripeMockState.nextEvent = null
  stripeMockState.constructEventThrows = null
}

/**
 * Seed an artist Connect account into the mock so `stripe.accounts.retrieve`
 * and downstream gating return the desired state. Callers can flip
 * `payouts_enabled` per-test.
 */
export function seedConnectAccount(args: {
  id: string
  payoutsEnabled: boolean
  detailsSubmitted?: boolean
  requirementsDue?: string[]
}): void {
  stripeMockState.accounts.set(args.id, {
    id: args.id,
    payouts_enabled: args.payoutsEnabled,
    details_submitted: args.detailsSubmitted ?? true,
    requirements: { currently_due: args.requirementsDue ?? [] },
  })
}

/**
 * Pre-register a PaymentIntent in the mock so a subsequent capture/cancel
 * finds it. Tests that build Payment rows directly (skipping the Stripe-side
 * creation) call this to keep the mock state coherent.
 */
export function seedPaymentIntent(args: {
  id: string
  amount: number
  status?: 'requires_capture' | 'succeeded' | 'canceled'
}): void {
  stripeMockState.intents.set(args.id, {
    id: args.id,
    status: args.status ?? 'requires_capture',
    amount: args.amount,
    amountCaptured: 0,
    metadata: {},
  })
}

/**
 * Build the mocked `stripe` singleton. Each method is a `mock(...)` so tests
 * can assert call counts and args via `stripe.paymentIntents.capture.mock.calls`.
 */
export function buildStripeMock() {
  const paymentIntents = {
    create: mock(
      async (
        params: { amount: number; currency: string; metadata?: Record<string, string> },
        _opts?: { idempotencyKey?: string }
      ) => {
        const id = uid('pi')
        const row: IntentRow = {
          id,
          status: 'requires_capture',
          amount: params.amount,
          amountCaptured: 0,
          metadata: params.metadata ?? {},
        }
        stripeMockState.intents.set(id, row)
        return {
          id,
          status: row.status,
          amount: row.amount,
          client_secret: `cs_${id}_secret`,
          latest_charge: `ch_${id}`,
        }
      }
    ),
    capture: mock(
      async (
        intentId: string,
        params?: { amount_to_capture?: number },
        _opts?: { idempotencyKey?: string }
      ) => {
        const row = stripeMockState.intents.get(intentId)
        if (!row) throw new Error(`Mock Stripe: paymentIntent ${intentId} not found`)
        if (row.status === 'succeeded') throw new Error('intent already captured')
        if (row.status === 'canceled') throw new Error('intent canceled')
        const captureAmount = params?.amount_to_capture ?? row.amount
        row.amountCaptured = captureAmount
        row.status = 'succeeded'
        return { id: row.id, status: 'succeeded', amount_captured: captureAmount }
      }
    ),
    cancel: mock(async (intentId: string, _params?: { cancellation_reason?: string }) => {
      const row = stripeMockState.intents.get(intentId)
      if (!row) throw new Error(`Mock Stripe: paymentIntent ${intentId} not found`)
      row.status = 'canceled'
      return { id: row.id, status: 'canceled' }
    }),
  }

  const transfers = {
    create: mock(
      async (
        params: {
          amount: number
          currency: string
          destination: string
          source_transaction?: string
          metadata?: Record<string, string>
        },
        opts?: { idempotencyKey?: string }
      ) => {
        const id = uid('tr')
        const call: TransferCall = {
          id,
          amount: params.amount,
          destination: params.destination,
          ...(params.source_transaction ? { source_transaction: params.source_transaction } : {}),
          metadata: params.metadata ?? {},
          ...(opts?.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}),
        }
        stripeMockState.transfers.push(call)
        return { id, amount: params.amount, destination: params.destination }
      }
    ),
  }

  const accounts = {
    create: mock(
      async (params: { type: string; email?: string; metadata?: Record<string, string> }) => {
        const id = uid('acct')
        const row: AccountRow = {
          id,
          payouts_enabled: false,
          details_submitted: false,
          requirements: { currently_due: ['external_account'] },
        }
        stripeMockState.accounts.set(id, row)
        return { id, ...row, type: params.type, email: params.email }
      }
    ),
    retrieve: mock(async (accountId: string) => {
      const row = stripeMockState.accounts.get(accountId)
      if (!row) {
        return {
          id: accountId,
          payouts_enabled: false,
          details_submitted: false,
          requirements: { currently_due: ['external_account'] },
        }
      }
      return row
    }),
  }

  const accountLinks = {
    create: mock(async (_params: { account: string; type: string }) => {
      const link = { ...stripeMockState.nextAccountLink }
      stripeMockState.accountLinks.push(link)
      return link
    }),
  }

  const refunds = {
    create: mock(async (params: { payment_intent: string; amount?: number }) => {
      const id = uid('re')
      const row: RefundRow = {
        id,
        payment_intent: params.payment_intent,
        amount: params.amount ?? 0,
      }
      stripeMockState.refunds.push(row)
      return row
    }),
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
    paymentIntents,
    transfers,
    accounts,
    accountLinks,
    refunds,
    webhooks,
  }
}

// Singleton — Bun's mock.module needs a stable export reference so that the
// service-side `import { stripe } from ...` returns the same shape across the
// whole test run. Mock functions persist call records across tests; suites
// that care reset via `resetStripeMockCalls()` in `beforeEach`.
export const stripeMock = buildStripeMock()

export function resetStripeMockCalls(): void {
  stripeMock.paymentIntents.create.mockClear()
  stripeMock.paymentIntents.capture.mockClear()
  stripeMock.paymentIntents.cancel.mockClear()
  stripeMock.transfers.create.mockClear()
  stripeMock.accounts.create.mockClear()
  stripeMock.accounts.retrieve.mockClear()
  stripeMock.accountLinks.create.mockClear()
  stripeMock.refunds.create.mockClear()
  stripeMock.webhooks.constructEvent.mockClear()
}
