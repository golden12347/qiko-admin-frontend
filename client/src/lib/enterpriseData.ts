// ============================================================
// Enterprise Customers — Mock data for UI-only admin flow
// ============================================================

export type EnterpriseStatus = "Active" | "Pending payment";

export interface EnterpriseCustomer {
  id: string;
  slug: string;
  name: string;
  email: string;
  status: EnterpriseStatus;
  subscriptionAmount: number | null;
  workersCount: number;
  conversationsTotal: number;
  revenue: number;
  joinedDate: string;
  /** Set when the one-time payment link is sent; prevents sending again */
  lastPaymentLinkSent: string | null;
  /** Next billing date for active subscriptions */
  nextPaymentDate: string | null;
}

/** Payment link can only be sent once, before the customer is paying */
export function canSendPaymentLink(customer: EnterpriseCustomer): boolean {
  return customer.lastPaymentLinkSent === null && customer.status !== "Active";
}

export function getEnterpriseStatusLabel(customer: EnterpriseCustomer): string {
  if (customer.status === "Active") return "Active";
  if (customer.lastPaymentLinkSent) return "Awaiting payment";
  return "Pending payment";
}

export interface EnterpriseTeamMember {
  id: string;
  customerId: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Invited" | "Inactive";
  joinedDate: string;
}

export interface EnterpriseWorker {
  id: string;
  customerId: string;
  name: string;
  type: string;
  status: "live" | "training";
  conversationsTotal: number;
}

export interface EnterpriseConversation {
  id: string;
  customerId: string;
  userName: string;
  workerName: string;
  channel: string;
  timestamp: string;
}

export const ENTERPRISE_CUSTOMERS_SEED: EnterpriseCustomer[] = [
  {
    id: "ent-001",
    slug: "acme-corp",
    name: "Acme Corp",
    email: "ops@acmecorp.com",
    status: "Active",
    subscriptionAmount: 2499,
    workersCount: 24,
    conversationsTotal: 284_102,
    revenue: 47_481,
    joinedDate: "2024-08-15",
    lastPaymentLinkSent: "2024-08-10",
    nextPaymentDate: "2026-06-15",
  },
  {
    id: "ent-002",
    slug: "globalhealth",
    name: "GlobalHealth Inc",
    email: "it@globalhealth.com",
    status: "Active",
    subscriptionAmount: 4999,
    workersCount: 31,
    conversationsTotal: 412_093,
    revenue: 104_979,
    joinedDate: "2024-06-20",
    lastPaymentLinkSent: "2024-06-15",
    nextPaymentDate: "2026-06-20",
  },
  {
    id: "ent-003",
    slug: "autodrive",
    name: "AutoDrive Systems",
    email: "platform@autodrive.io",
    status: "Active",
    subscriptionAmount: 2499,
    workersCount: 18,
    conversationsTotal: 287_491,
    revenue: 49_980,
    joinedDate: "2024-07-22",
    lastPaymentLinkSent: "2024-07-18",
    nextPaymentDate: "2026-06-22",
  },
  {
    id: "ent-004",
    slug: "insuretech",
    name: "InsureTech Global",
    email: "it@insuretech.global",
    status: "Active",
    subscriptionAmount: 4999,
    workersCount: 22,
    conversationsTotal: 324_182,
    revenue: 109_978,
    joinedDate: "2024-05-10",
    lastPaymentLinkSent: "2024-05-05",
    nextPaymentDate: "2026-06-10",
  },
  {
    id: "ent-005",
    slug: "nexus-dynamics",
    name: "Nexus Dynamics",
    email: "billing@nexusdynamics.com",
    status: "Pending payment",
    subscriptionAmount: 3500,
    workersCount: 0,
    conversationsTotal: 0,
    revenue: 0,
    joinedDate: "2026-05-01",
    lastPaymentLinkSent: "2026-05-02",
    nextPaymentDate: null,
  },
  {
    id: "ent-006",
    slug: "horizon-analytics",
    name: "Horizon Analytics",
    email: "finance@horizonanalytics.io",
    status: "Pending payment",
    subscriptionAmount: null,
    workersCount: 0,
    conversationsTotal: 0,
    revenue: 0,
    joinedDate: "2026-05-12",
    lastPaymentLinkSent: null,
    nextPaymentDate: null,
  },
];

const TEAM_MEMBERS: EnterpriseTeamMember[] = [
  { id: "tm-001", customerId: "ent-001", name: "Sarah Chen", email: "sarah.chen@acmecorp.com", role: "Admin", status: "Active", joinedDate: "2024-08-15" },
  { id: "tm-002", customerId: "ent-001", name: "Marcus Webb", email: "marcus.webb@acmecorp.com", role: "Member", status: "Active", joinedDate: "2024-09-02" },
  { id: "tm-003", customerId: "ent-001", name: "Elena Rossi", email: "elena.rossi@acmecorp.com", role: "Member", status: "Invited", joinedDate: "2025-11-10" },
  { id: "tm-004", customerId: "ent-002", name: "Dr. James Holt", email: "james.holt@globalhealth.com", role: "Admin", status: "Active", joinedDate: "2024-06-20" },
  { id: "tm-005", customerId: "ent-002", name: "Priya Nair", email: "priya.nair@globalhealth.com", role: "Member", status: "Active", joinedDate: "2024-07-01" },
  { id: "tm-006", customerId: "ent-003", name: "Kenji Tanaka", email: "kenji.tanaka@autodrive.io", role: "Admin", status: "Active", joinedDate: "2024-07-22" },
  { id: "tm-007", customerId: "ent-004", name: "Lisa Morrison", email: "lisa.morrison@insuretech.global", role: "Admin", status: "Active", joinedDate: "2024-05-10" },
  { id: "tm-008", customerId: "ent-004", name: "David Park", email: "david.park@insuretech.global", role: "Member", status: "Inactive", joinedDate: "2024-08-22" },
];

const WORKERS: EnterpriseWorker[] = [
  { id: "ew-001", customerId: "ent-001", name: "Luna Sales Bot", type: "sales", status: "live", conversationsTotal: 84_291 },
  { id: "ew-002", customerId: "ent-001", name: "Orion Support", type: "support", status: "live", conversationsTotal: 62_104 },
  { id: "ew-003", customerId: "ent-001", name: "Nova Onboarding", type: "onboarding", status: "training", conversationsTotal: 12_847 },
  { id: "ew-004", customerId: "ent-002", name: "Helix Qualifier", type: "sales", status: "live", conversationsTotal: 128_492 },
  { id: "ew-005", customerId: "ent-002", name: "Pulse Support", type: "support", status: "live", conversationsTotal: 98_291 },
  { id: "ew-006", customerId: "ent-003", name: "Drive Sales AI", type: "sales", status: "live", conversationsTotal: 142_183 },
  { id: "ew-007", customerId: "ent-004", name: "Vega Sales Pro", type: "sales", status: "live", conversationsTotal: 156_291 },
  { id: "ew-008", customerId: "ent-004", name: "Shield Support", type: "support", status: "training", conversationsTotal: 48_291 },
];

const CONVERSATIONS: EnterpriseConversation[] = [
  { id: "ec-001", customerId: "ent-001", userName: "Sarah Mitchell", workerName: "Luna Sales Bot", channel: "Web", timestamp: "2026-05-18T09:42:00" },
  { id: "ec-002", customerId: "ent-001", userName: "Mark Johnson", workerName: "Luna Sales Bot", channel: "Web", timestamp: "2026-05-18T08:55:00" },
  { id: "ec-003", customerId: "ent-001", userName: "Emily Davis", workerName: "Orion Support", channel: "Web", timestamp: "2026-05-17T16:20:00" },
  { id: "ec-004", customerId: "ent-002", userName: "Robert Kim", workerName: "Helix Qualifier", channel: "Voice", timestamp: "2026-05-18T10:15:00" },
  { id: "ec-005", customerId: "ent-002", userName: "Anna Lee", workerName: "Pulse Support", channel: "Web", timestamp: "2026-05-17T14:30:00" },
  { id: "ec-006", customerId: "ent-003", userName: "Yuki Sato", workerName: "Drive Sales AI", channel: "Web", timestamp: "2026-05-18T07:22:00" },
  { id: "ec-007", customerId: "ent-004", userName: "Michael Brown", workerName: "Vega Sales Pro", channel: "Web", timestamp: "2026-05-18T11:05:00" },
];

export function slugifyEnterpriseName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getEnterpriseBySlug(
  customers: EnterpriseCustomer[],
  slug: string
): EnterpriseCustomer | undefined {
  return customers.find((c) => c.slug === slug);
}

export function getEnterpriseById(
  customers: EnterpriseCustomer[],
  id: string
): EnterpriseCustomer | undefined {
  return customers.find((c) => c.id === id);
}

export function getTeamMembersForCustomer(customerId: string): EnterpriseTeamMember[] {
  return TEAM_MEMBERS.filter((m) => m.customerId === customerId);
}

export function getWorkersForCustomer(customerId: string): EnterpriseWorker[] {
  return WORKERS.filter((w) => w.customerId === customerId);
}

export function getConversationsForCustomer(customerId: string): EnterpriseConversation[] {
  return CONVERSATIONS.filter((c) => c.customerId === customerId);
}

export function createEnterpriseCustomerId(): string {
  return `ent-${Date.now()}`;
}

/** In-memory store so list + detail pages share UI session state */
let runtimeCustomers: EnterpriseCustomer[] | null = null;

export function getEnterpriseCustomers(): EnterpriseCustomer[] {
  return runtimeCustomers ?? [...ENTERPRISE_CUSTOMERS_SEED];
}

export function setEnterpriseCustomers(customers: EnterpriseCustomer[]): void {
  runtimeCustomers = customers;
}

export function updateEnterpriseCustomer(
  id: string,
  patch: Partial<EnterpriseCustomer>
): EnterpriseCustomer[] {
  const next = getEnterpriseCustomers().map((c) => (c.id === id ? { ...c, ...patch } : c));
  setEnterpriseCustomers(next);
  return next;
}
