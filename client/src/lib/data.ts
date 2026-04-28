// ============================================================
// Qiko Super Admin Panel — Platform-Level Data Layer
// All data represents cross-tenant, platform-wide operational data
// ============================================================

// ── Types ────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  slug: string;
  plan: "Starter" | "Growth" | "Business" | "Enterprise";
  status: "Active" | "Trial" | "Churned" | "Suspended";
  industry: string;
  workersCount: number;
  conversationsTotal: number;
  leadsTotal: number;
  paidSubscribers: number;
  totalEarnings: number;
  mrr: number;
  joinedDate: string;
  lastActive: string;
  contactEmail: string;
  country: string;
}

export interface PlatformWorker {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  type: "Sales" | "Support" | "Research" | "Financial Analyst" | "Onboarding" | "Retention";
  status: "Live" | "Training" | "Paused" | "Error";
  channels: ("Web" | "Voice")[];
  conversationsToday: number;
  conversationsTotal: number;
  leadsGenerated: number;
  avgResponseTime: string;
  conversionRate: number;
  lastActive: string;
  createdDate: string;
}

export interface PlatformConversation {
  id: string;
  userId: string;
  userName: string;
  workerId: string;
  workerName: string;
  customerId: string;
  customerName: string;
  channel: "Web" | "Voice";
  status: "Active" | "Completed" | "Escalated" | "Dropped";
  conversionStatus: "Converted" | "Qualified" | "Nurturing" | "Lost" | "None";
  revenueOutcome: number;
  messagesCount: number;
  duration: string;
  leadCaptured: boolean;
  bookingMade: boolean;
  timestamp: string;
  satisfaction: number | null;
  // Metadata
  source: string;
  campaign: string | null;
  device: string;
  location: string;
  referrer: string | null;
  paidSubscription: boolean;
  subscriptionValue: number;
}

export interface RevenueEntry {
  month: string;
  mrr: number;
  newMrr: number;
  churnedMrr: number;
  expansionMrr: number;
  customers: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  eventType: string;
  actor: string;
  actorType: "Customer" | "Worker" | "System" | "Admin";
  action: string;
  resource: string;
  details: string;
  severity: "info" | "warning" | "error" | "success";
  category: string;
  customerId?: string;
  customerName?: string;
  workerId?: string;
  workerName?: string;
}

// ── Platform KPIs ────────────────────────────────────────────

export const platformKPIs = {
  totalCustomers: 247,
  activeCustomers: 218,
  totalWorkers: 1_843,
  liveWorkers: 1_412,
  totalConversations: 2_847_392,
  conversationsToday: 12_847,
  totalLeads: 384_291,
  leadsToday: 1_892,
  platformMRR: 187_400,
  avgRevenuePerCustomer: 859,
  conversionRate: 13.5,
  avgResponseTime: "1.8s",
  customerChurnRate: 2.1,
  nps: 72,
};

export const kpiTrends = {
  totalCustomers: { value: 12.3, direction: "up" as const },
  activeCustomers: { value: 8.7, direction: "up" as const },
  totalWorkers: { value: 15.2, direction: "up" as const },
  conversationsToday: { value: 6.4, direction: "up" as const },
  leadsToday: { value: 9.1, direction: "up" as const },
  platformMRR: { value: 11.8, direction: "up" as const },
  conversionRate: { value: 0.8, direction: "up" as const },
  customerChurnRate: { value: 0.3, direction: "down" as const },
};

// ── Customers ────────────────────────────────────────────────

export const customers: Customer[] = [
  { id: "cust-001", name: "Acme Corp", slug: "acme-corp", plan: "Enterprise", status: "Active", industry: "SaaS", workersCount: 24, conversationsTotal: 284_102, leadsTotal: 38_291, paidSubscribers: 3, totalEarnings: 47_481, mrr: 2_499, joinedDate: "2024-08-15", lastActive: "2 min ago", contactEmail: "ops@acmecorp.com", country: "United States" },
  { id: "cust-002", name: "TechFlow Solutions", slug: "techflow", plan: "Business", status: "Active", industry: "Technology", workersCount: 12, conversationsTotal: 156_847, leadsTotal: 21_034, paidSubscribers: 2, totalEarnings: 16_983, mrr: 999, joinedDate: "2024-10-02", lastActive: "5 min ago", contactEmail: "admin@techflow.io", country: "United Kingdom" },
  { id: "cust-003", name: "GlobalHealth Inc", slug: "globalhealth", plan: "Enterprise", status: "Active", industry: "Healthcare", workersCount: 31, conversationsTotal: 412_093, leadsTotal: 52_187, paidSubscribers: 5, totalEarnings: 104_979, mrr: 4_999, joinedDate: "2024-06-20", lastActive: "1 min ago", contactEmail: "it@globalhealth.com", country: "United States" },
  { id: "cust-004", name: "FinanceHub", slug: "financehub", plan: "Growth", status: "Active", industry: "Finance", workersCount: 8, conversationsTotal: 89_234, leadsTotal: 12_847, paidSubscribers: 1, totalEarnings: 7_485, mrr: 499, joinedDate: "2025-01-10", lastActive: "12 min ago", contactEmail: "support@financehub.co", country: "Singapore" },
  { id: "cust-005", name: "RetailMax", slug: "retailmax", plan: "Business", status: "Active", industry: "Retail", workersCount: 15, conversationsTotal: 198_472, leadsTotal: 28_193, paidSubscribers: 2, totalEarnings: 18_981, mrr: 999, joinedDate: "2024-09-05", lastActive: "8 min ago", contactEmail: "tech@retailmax.com", country: "Australia" },
  { id: "cust-006", name: "EduLearn Pro", slug: "edulearn", plan: "Starter", status: "Trial", industry: "Education", workersCount: 3, conversationsTotal: 4_821, leadsTotal: 412, paidSubscribers: 0, totalEarnings: 0, mrr: 0, joinedDate: "2026-03-10", lastActive: "1 hour ago", contactEmail: "hello@edulearn.pro", country: "Canada" },
  { id: "cust-007", name: "PropTech AI", slug: "proptech-ai", plan: "Growth", status: "Active", industry: "Real Estate", workersCount: 6, conversationsTotal: 67_291, leadsTotal: 9_847, paidSubscribers: 1, totalEarnings: 6_487, mrr: 499, joinedDate: "2025-02-18", lastActive: "22 min ago", contactEmail: "dev@proptech.ai", country: "United Arab Emirates" },
  { id: "cust-008", name: "LegalMind", slug: "legalmind", plan: "Business", status: "Active", industry: "Legal", workersCount: 9, conversationsTotal: 112_384, leadsTotal: 14_291, paidSubscribers: 1, totalEarnings: 15_984, mrr: 999, joinedDate: "2024-11-30", lastActive: "3 min ago", contactEmail: "admin@legalmind.law", country: "United States" },
  { id: "cust-009", name: "TravelWise", slug: "travelwise", plan: "Growth", status: "Churned", industry: "Travel", workersCount: 0, conversationsTotal: 34_182, leadsTotal: 4_291, paidSubscribers: 0, totalEarnings: 3_493, mrr: 0, joinedDate: "2025-04-12", lastActive: "45 days ago", contactEmail: "ops@travelwise.com", country: "Germany" },
  { id: "cust-010", name: "FoodChain Co", slug: "foodchain", plan: "Starter", status: "Active", industry: "F&B", workersCount: 4, conversationsTotal: 23_847, leadsTotal: 3_102, paidSubscribers: 1, totalEarnings: 891, mrr: 99, joinedDate: "2025-06-01", lastActive: "30 min ago", contactEmail: "hello@foodchain.co", country: "India" },
  { id: "cust-011", name: "AutoDrive Systems", slug: "autodrive", plan: "Enterprise", status: "Active", industry: "Automotive", workersCount: 18, conversationsTotal: 287_491, leadsTotal: 34_182, paidSubscribers: 3, totalEarnings: 49_980, mrr: 2_499, joinedDate: "2024-07-22", lastActive: "6 min ago", contactEmail: "platform@autodrive.io", country: "Japan" },
  { id: "cust-012", name: "CloudNine SaaS", slug: "cloudnine", plan: "Business", status: "Active", industry: "SaaS", workersCount: 11, conversationsTotal: 142_093, leadsTotal: 19_847, paidSubscribers: 2, totalEarnings: 14_985, mrr: 999, joinedDate: "2024-12-15", lastActive: "15 min ago", contactEmail: "admin@cloudnine.io", country: "Netherlands" },
  { id: "cust-013", name: "MediCare Plus", slug: "medicare-plus", plan: "Growth", status: "Active", industry: "Healthcare", workersCount: 7, conversationsTotal: 78_291, leadsTotal: 10_182, paidSubscribers: 1, totalEarnings: 5_988, mrr: 499, joinedDate: "2025-03-08", lastActive: "45 min ago", contactEmail: "ops@medicareplus.com", country: "United Kingdom" },
  { id: "cust-014", name: "InsureTech Global", slug: "insuretech", plan: "Enterprise", status: "Active", industry: "Insurance", workersCount: 22, conversationsTotal: 324_182, leadsTotal: 41_293, paidSubscribers: 4, totalEarnings: 109_978, mrr: 4_999, joinedDate: "2024-05-10", lastActive: "4 min ago", contactEmail: "it@insuretech.global", country: "United States" },
  { id: "cust-015", name: "StartupLab", slug: "startuplab", plan: "Starter", status: "Trial", industry: "Venture Capital", workersCount: 2, conversationsTotal: 1_847, leadsTotal: 198, paidSubscribers: 0, totalEarnings: 0, mrr: 0, joinedDate: "2026-03-18", lastActive: "2 hours ago", contactEmail: "founder@startuplab.vc", country: "Israel" },
  { id: "cust-016", name: "GreenEnergy Co", slug: "greenenergy", plan: "Growth", status: "Suspended", industry: "Energy", workersCount: 5, conversationsTotal: 42_193, leadsTotal: 5_847, paidSubscribers: 0, totalEarnings: 5_988, mrr: 0, joinedDate: "2025-01-25", lastActive: "12 days ago", contactEmail: "admin@greenenergy.co", country: "Sweden" },
];

// ── Workers (Platform-wide) ──────────────────────────────────

export const platformWorkers: PlatformWorker[] = [
  { id: "w-001", name: "Luna Sales Bot", customerId: "cust-001", customerName: "Acme Corp", type: "Sales", status: "Live", channels: ["Web", "Voice"], conversationsToday: 47, conversationsTotal: 84_291, leadsGenerated: 12_847, avgResponseTime: "1.2s", conversionRate: 15.2, lastActive: "Just now", createdDate: "2024-09-01" },
  { id: "w-002", name: "Atlas Support", customerId: "cust-001", customerName: "Acme Corp", type: "Support", status: "Live", channels: ["Web"], conversationsToday: 89, conversationsTotal: 124_182, leadsGenerated: 3_291, avgResponseTime: "0.9s", conversionRate: 2.6, lastActive: "Just now", createdDate: "2024-09-15" },
  { id: "w-003", name: "Iris Research", customerId: "cust-003", customerName: "GlobalHealth Inc", type: "Research", status: "Live", channels: ["Web"], conversationsToday: 34, conversationsTotal: 67_291, leadsGenerated: 8_192, avgResponseTime: "2.1s", conversionRate: 12.2, lastActive: "2 min ago", createdDate: "2024-07-10" },
  { id: "w-004", name: "Nova Onboarding", customerId: "cust-002", customerName: "TechFlow Solutions", type: "Onboarding", status: "Live", channels: ["Web", "Voice"], conversationsToday: 23, conversationsTotal: 45_182, leadsGenerated: 6_847, avgResponseTime: "1.5s", conversionRate: 15.2, lastActive: "5 min ago", createdDate: "2024-11-01" },
  { id: "w-005", name: "Bolt Financial", customerId: "cust-004", customerName: "FinanceHub", type: "Financial Analyst", status: "Live", channels: ["Web"], conversationsToday: 18, conversationsTotal: 34_291, leadsGenerated: 5_102, avgResponseTime: "1.8s", conversionRate: 14.9, lastActive: "8 min ago", createdDate: "2025-01-20" },
  { id: "w-006", name: "Zen Support Pro", customerId: "cust-005", customerName: "RetailMax", type: "Support", status: "Live", channels: ["Web", "Voice"], conversationsToday: 62, conversationsTotal: 98_472, leadsGenerated: 7_291, avgResponseTime: "1.1s", conversionRate: 7.4, lastActive: "1 min ago", createdDate: "2024-10-05" },
  { id: "w-007", name: "Spark Sales AI", customerId: "cust-008", customerName: "LegalMind", type: "Sales", status: "Live", channels: ["Web"], conversationsToday: 31, conversationsTotal: 52_384, leadsGenerated: 8_291, avgResponseTime: "1.4s", conversionRate: 15.8, lastActive: "3 min ago", createdDate: "2024-12-10" },
  { id: "w-008", name: "Echo Retention", customerId: "cust-011", customerName: "AutoDrive Systems", type: "Retention", status: "Live", channels: ["Web", "Voice"], conversationsToday: 41, conversationsTotal: 72_182, leadsGenerated: 9_847, avgResponseTime: "1.6s", conversionRate: 13.6, lastActive: "4 min ago", createdDate: "2024-08-20" },
  { id: "w-009", name: "Pixel Assistant", customerId: "cust-012", customerName: "CloudNine SaaS", type: "Support", status: "Training", channels: ["Web"], conversationsToday: 0, conversationsTotal: 2_847, leadsGenerated: 182, avgResponseTime: "2.4s", conversionRate: 6.4, lastActive: "1 hour ago", createdDate: "2026-03-01" },
  { id: "w-010", name: "Vega Sales Pro", customerId: "cust-014", customerName: "InsureTech Global", type: "Sales", status: "Live", channels: ["Web", "Voice"], conversationsToday: 56, conversationsTotal: 112_847, leadsGenerated: 18_291, avgResponseTime: "1.3s", conversionRate: 16.2, lastActive: "Just now", createdDate: "2024-06-15" },
  { id: "w-011", name: "Orion Qualifier", customerId: "cust-003", customerName: "GlobalHealth Inc", type: "Sales", status: "Live", channels: ["Web"], conversationsToday: 28, conversationsTotal: 58_291, leadsGenerated: 9_182, avgResponseTime: "1.7s", conversionRate: 15.8, lastActive: "6 min ago", createdDate: "2024-08-01" },
  { id: "w-012", name: "Helix Support", customerId: "cust-014", customerName: "InsureTech Global", type: "Support", status: "Error", channels: ["Web"], conversationsToday: 0, conversationsTotal: 87_291, leadsGenerated: 4_102, avgResponseTime: "—", conversionRate: 4.7, lastActive: "2 hours ago", createdDate: "2024-07-20" },
  { id: "w-013", name: "Drift Sales", customerId: "cust-007", customerName: "PropTech AI", type: "Sales", status: "Live", channels: ["Web", "Voice"], conversationsToday: 19, conversationsTotal: 38_291, leadsGenerated: 6_102, avgResponseTime: "1.5s", conversionRate: 15.9, lastActive: "10 min ago", createdDate: "2025-03-01" },
  { id: "w-014", name: "Cleo Onboarding", customerId: "cust-011", customerName: "AutoDrive Systems", type: "Onboarding", status: "Paused", channels: ["Web"], conversationsToday: 0, conversationsTotal: 24_182, leadsGenerated: 3_847, avgResponseTime: "1.9s", conversionRate: 15.9, lastActive: "3 days ago", createdDate: "2024-09-10" },
  { id: "w-015", name: "Sage Analyst", customerId: "cust-004", customerName: "FinanceHub", type: "Financial Analyst", status: "Live", channels: ["Web"], conversationsToday: 14, conversationsTotal: 28_847, leadsGenerated: 4_291, avgResponseTime: "2.0s", conversionRate: 14.9, lastActive: "12 min ago", createdDate: "2025-02-15" },
];

// ── Conversations (Platform-wide) ────────────────────────────

export const platformConversations: PlatformConversation[] = [
  { id: "conv-001", userId: "u-1847", userName: "Sarah Mitchell", workerId: "w-001", workerName: "Luna Sales Bot", customerId: "cust-001", customerName: "Acme Corp", channel: "Web", status: "Completed", conversionStatus: "Converted", revenueOutcome: 2400, messagesCount: 14, duration: "4m 32s", leadCaptured: true, bookingMade: true, timestamp: "2026-03-25 09:42 AM", satisfaction: 5, source: "Google Ads", campaign: "enterprise-q1-2026", device: "Desktop — Chrome 122", location: "San Francisco, CA", referrer: "google.com/search", paidSubscription: true, subscriptionValue: 4788 },
  { id: "conv-002", userId: "u-2934", userName: "James Rodriguez", workerId: "w-002", workerName: "Atlas Support", customerId: "cust-001", customerName: "Acme Corp", channel: "Web", status: "Escalated", conversionStatus: "None", revenueOutcome: 0, messagesCount: 22, duration: "8m 15s", leadCaptured: false, bookingMade: false, timestamp: "2026-03-25 09:38 AM", satisfaction: 2, source: "Direct", campaign: null, device: "Desktop — Firefox 124", location: "New York, NY", referrer: null, paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-003", userId: "u-4821", userName: "Emily Chen", workerId: "w-003", workerName: "Iris Research", customerId: "cust-003", customerName: "GlobalHealth Inc", channel: "Web", status: "Active", conversionStatus: "Nurturing", revenueOutcome: 0, messagesCount: 7, duration: "2m 10s", leadCaptured: false, bookingMade: false, timestamp: "2026-03-25 09:45 AM", satisfaction: null, source: "Organic Search", campaign: null, device: "Mobile — Safari 17", location: "Boston, MA", referrer: "google.com", paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-004", userId: "u-7291", userName: "Michael Brown", workerId: "w-010", workerName: "Vega Sales Pro", customerId: "cust-014", customerName: "InsureTech Global", channel: "Voice", status: "Completed", conversionStatus: "Converted", revenueOutcome: 4800, messagesCount: 18, duration: "6m 48s", leadCaptured: true, bookingMade: true, timestamp: "2026-03-25 09:35 AM", satisfaction: 5, source: "LinkedIn Ads", campaign: "insurance-vertical-q1", device: "Desktop — Edge 122", location: "Chicago, IL", referrer: "linkedin.com", paidSubscription: true, subscriptionValue: 5988 },
  { id: "conv-005", userId: "u-3847", userName: "Lisa Park", workerId: "w-006", workerName: "Zen Support Pro", customerId: "cust-005", customerName: "RetailMax", channel: "Web", status: "Completed", conversionStatus: "None", revenueOutcome: 0, messagesCount: 9, duration: "3m 22s", leadCaptured: false, bookingMade: false, timestamp: "2026-03-25 09:30 AM", satisfaction: 4, source: "Help Center", campaign: null, device: "Desktop — Chrome 122", location: "Portland, OR", referrer: "help.retailmax.com", paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-006", userId: "u-9182", userName: "David Kim", workerId: "w-007", workerName: "Spark Sales AI", customerId: "cust-008", customerName: "LegalMind", channel: "Web", status: "Completed", conversionStatus: "Qualified", revenueOutcome: 1200, messagesCount: 16, duration: "5m 41s", leadCaptured: true, bookingMade: false, timestamp: "2026-03-25 09:28 AM", satisfaction: 4, source: "Google Ads", campaign: "legal-saas-demo", device: "Desktop — Chrome 122", location: "Austin, TX", referrer: "google.com/search", paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-007", userId: "u-2847", userName: "Anonymous", workerId: "w-004", workerName: "Nova Onboarding", customerId: "cust-002", customerName: "TechFlow Solutions", channel: "Web", status: "Dropped", conversionStatus: "Lost", revenueOutcome: 0, messagesCount: 3, duration: "0m 45s", leadCaptured: false, bookingMade: false, timestamp: "2026-03-25 09:25 AM", satisfaction: null, source: "Organic Search", campaign: null, device: "Mobile — Chrome 121", location: "Unknown", referrer: "google.com", paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-008", userId: "u-5291", userName: "Rachel Green", workerId: "w-008", workerName: "Echo Retention", customerId: "cust-011", customerName: "AutoDrive Systems", channel: "Voice", status: "Completed", conversionStatus: "Converted", revenueOutcome: 3600, messagesCount: 12, duration: "4m 18s", leadCaptured: true, bookingMade: true, timestamp: "2026-03-25 09:20 AM", satisfaction: 5, source: "Email Campaign", campaign: "retention-march-2026", device: "Desktop — Safari 17", location: "Detroit, MI", referrer: "mail.google.com", paidSubscription: true, subscriptionValue: 3588 },
  { id: "conv-009", userId: "u-8472", userName: "Tom Wilson", workerId: "w-005", workerName: "Bolt Financial", customerId: "cust-004", customerName: "FinanceHub", channel: "Web", status: "Active", conversionStatus: "Nurturing", revenueOutcome: 0, messagesCount: 5, duration: "1m 52s", leadCaptured: false, bookingMade: false, timestamp: "2026-03-25 09:47 AM", satisfaction: null, source: "Direct", campaign: null, device: "Desktop — Chrome 122", location: "London, UK", referrer: null, paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-010", userId: "u-1293", userName: "Anna Schmidt", workerId: "w-013", workerName: "Drift Sales", customerId: "cust-007", customerName: "PropTech AI", channel: "Voice", status: "Completed", conversionStatus: "Converted", revenueOutcome: 5400, messagesCount: 20, duration: "7m 12s", leadCaptured: true, bookingMade: true, timestamp: "2026-03-25 09:15 AM", satisfaction: 5, source: "Google Ads", campaign: "proptech-enterprise", device: "Desktop — Chrome 122", location: "Berlin, DE", referrer: "google.de/search", paidSubscription: true, subscriptionValue: 5388 },
  { id: "conv-011", userId: "u-6847", userName: "Chris Taylor", workerId: "w-011", workerName: "Orion Qualifier", customerId: "cust-003", customerName: "GlobalHealth Inc", channel: "Web", status: "Completed", conversionStatus: "Qualified", revenueOutcome: 0, messagesCount: 11, duration: "3m 56s", leadCaptured: true, bookingMade: false, timestamp: "2026-03-25 09:10 AM", satisfaction: 4, source: "Referral", campaign: "partner-health-q1", device: "Desktop — Chrome 122", location: "Houston, TX", referrer: "partnerportal.globalhealth.com", paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-012", userId: "u-4182", userName: "Priya Sharma", workerId: "w-015", workerName: "Sage Analyst", customerId: "cust-004", customerName: "FinanceHub", channel: "Web", status: "Escalated", conversionStatus: "Lost", revenueOutcome: 0, messagesCount: 19, duration: "6m 33s", leadCaptured: false, bookingMade: false, timestamp: "2026-03-25 09:05 AM", satisfaction: 2, source: "Direct", campaign: null, device: "Mobile — Chrome 121", location: "Mumbai, IN", referrer: null, paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-013", userId: "u-7482", userName: "Mark Johnson", workerId: "w-001", workerName: "Luna Sales Bot", customerId: "cust-001", customerName: "Acme Corp", channel: "Web", status: "Completed", conversionStatus: "Qualified", revenueOutcome: 999, messagesCount: 10, duration: "3m 12s", leadCaptured: true, bookingMade: false, timestamp: "2026-03-25 08:55 AM", satisfaction: 4, source: "LinkedIn Ads", campaign: "enterprise-q1-2026", device: "Desktop — Chrome 122", location: "Denver, CO", referrer: "linkedin.com", paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-014", userId: "u-2184", userName: "Sophie Martin", workerId: "w-006", workerName: "Zen Support Pro", customerId: "cust-005", customerName: "RetailMax", channel: "Voice", status: "Active", conversionStatus: "None", revenueOutcome: 0, messagesCount: 4, duration: "1m 28s", leadCaptured: false, bookingMade: false, timestamp: "2026-03-25 09:48 AM", satisfaction: null, source: "Organic Search", campaign: null, device: "Mobile — Safari 17", location: "Paris, FR", referrer: "google.fr", paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-015", userId: "u-9384", userName: "Alex Rivera", workerId: "w-010", workerName: "Vega Sales Pro", customerId: "cust-014", customerName: "InsureTech Global", channel: "Web", status: "Completed", conversionStatus: "Converted", revenueOutcome: 2400, messagesCount: 15, duration: "5m 02s", leadCaptured: true, bookingMade: true, timestamp: "2026-03-25 08:48 AM", satisfaction: 5, source: "Email Campaign", campaign: "insurance-renewal-q1", device: "Desktop — Firefox 124", location: "Miami, FL", referrer: "mail.google.com", paidSubscription: true, subscriptionValue: 5988 },
  { id: "conv-016", userId: "u-6601", userName: "Nina Patel", workerId: "w-003", workerName: "Iris Research", customerId: "cust-003", customerName: "GlobalHealth Inc", channel: "Web", status: "Completed", conversionStatus: "Qualified", revenueOutcome: 0, messagesCount: 13, duration: "4m 06s", leadCaptured: true, bookingMade: false, timestamp: "2026-03-24 07:42 PM", satisfaction: 4, source: "Organic Search", campaign: null, device: "Desktop — Chrome 122", location: "Seattle, WA", referrer: "google.com/search", paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-017", userId: "u-6602", userName: "Victor Hale", workerId: "w-002", workerName: "Atlas Support", customerId: "cust-001", customerName: "Acme Corp", channel: "Web", status: "Escalated", conversionStatus: "None", revenueOutcome: 0, messagesCount: 27, duration: "9m 44s", leadCaptured: false, bookingMade: false, timestamp: "2026-03-24 07:30 PM", satisfaction: 2, source: "Direct", campaign: null, device: "Desktop — Edge 122", location: "Toronto, CA", referrer: null, paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-018", userId: "u-6603", userName: "Carla Gomez", workerId: "w-007", workerName: "Spark Sales AI", customerId: "cust-008", customerName: "LegalMind", channel: "Voice", status: "Completed", conversionStatus: "Converted", revenueOutcome: 1800, messagesCount: 17, duration: "5m 55s", leadCaptured: true, bookingMade: true, timestamp: "2026-03-24 06:58 PM", satisfaction: 5, source: "Google Ads", campaign: "legal-intake-q1", device: "Desktop — Chrome 122", location: "Phoenix, AZ", referrer: "google.com/search", paidSubscription: true, subscriptionValue: 2388 },
  { id: "conv-019", userId: "u-6604", userName: "Igor Petrov", workerId: "w-010", workerName: "Vega Sales Pro", customerId: "cust-014", customerName: "InsureTech Global", channel: "Web", status: "Completed", conversionStatus: "Qualified", revenueOutcome: 600, messagesCount: 11, duration: "3m 39s", leadCaptured: true, bookingMade: false, timestamp: "2026-03-24 06:21 PM", satisfaction: 4, source: "Referral", campaign: "broker-network", device: "Desktop — Safari 17", location: "Prague, CZ", referrer: "partner.insuretechglobal.com", paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-020", userId: "u-6605", userName: "Olivia Reed", workerId: "w-004", workerName: "Nova Onboarding", customerId: "cust-002", customerName: "TechFlow Solutions", channel: "Web", status: "Dropped", conversionStatus: "Lost", revenueOutcome: 0, messagesCount: 2, duration: "0m 32s", leadCaptured: false, bookingMade: false, timestamp: "2026-03-24 06:03 PM", satisfaction: null, source: "Organic Search", campaign: null, device: "Mobile — Chrome 121", location: "Unknown", referrer: "google.com", paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-021", userId: "u-6606", userName: "Hassan Ali", workerId: "w-006", workerName: "Zen Support Pro", customerId: "cust-005", customerName: "RetailMax", channel: "Voice", status: "Active", conversionStatus: "Nurturing", revenueOutcome: 0, messagesCount: 6, duration: "2m 04s", leadCaptured: false, bookingMade: false, timestamp: "2026-03-24 05:47 PM", satisfaction: null, source: "Help Center", campaign: null, device: "Desktop — Firefox 124", location: "Dubai, AE", referrer: "help.retailmax.com", paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-022", userId: "u-6607", userName: "Maya Chen", workerId: "w-011", workerName: "Orion Qualifier", customerId: "cust-003", customerName: "GlobalHealth Inc", channel: "Web", status: "Completed", conversionStatus: "Converted", revenueOutcome: 2100, messagesCount: 14, duration: "4m 49s", leadCaptured: true, bookingMade: true, timestamp: "2026-03-24 05:18 PM", satisfaction: 5, source: "Email Campaign", campaign: "provider-outreach", device: "Desktop — Chrome 122", location: "San Diego, CA", referrer: "mail.google.com", paidSubscription: true, subscriptionValue: 2988 },
  { id: "conv-023", userId: "u-6608", userName: "Ethan Cole", workerId: "w-005", workerName: "Bolt Financial", customerId: "cust-004", customerName: "FinanceHub", channel: "Web", status: "Escalated", conversionStatus: "None", revenueOutcome: 0, messagesCount: 21, duration: "7m 06s", leadCaptured: false, bookingMade: false, timestamp: "2026-03-24 04:52 PM", satisfaction: 2, source: "Direct", campaign: null, device: "Desktop — Chrome 122", location: "Dublin, IE", referrer: null, paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-024", userId: "u-6609", userName: "Lara Hoffman", workerId: "w-013", workerName: "Drift Sales", customerId: "cust-007", customerName: "PropTech AI", channel: "Voice", status: "Completed", conversionStatus: "Qualified", revenueOutcome: 900, messagesCount: 9, duration: "3m 14s", leadCaptured: true, bookingMade: false, timestamp: "2026-03-24 04:20 PM", satisfaction: 4, source: "LinkedIn Ads", campaign: "proptech-growth", device: "Desktop — Edge 122", location: "Hamburg, DE", referrer: "linkedin.com", paidSubscription: false, subscriptionValue: 0 },
  { id: "conv-025", userId: "u-6610", userName: "Noah Brooks", workerId: "w-008", workerName: "Echo Retention", customerId: "cust-011", customerName: "AutoDrive Systems", channel: "Web", status: "Completed", conversionStatus: "Converted", revenueOutcome: 3200, messagesCount: 16, duration: "5m 11s", leadCaptured: true, bookingMade: true, timestamp: "2026-03-24 03:57 PM", satisfaction: 5, source: "Referral", campaign: "customer-success-loop", device: "Desktop — Chrome 122", location: "Atlanta, GA", referrer: "community.autodrive.io", paidSubscription: true, subscriptionValue: 3588 },
];

// ── Revenue Data ─────────────────────────────────────────────

export const revenueHistory: RevenueEntry[] = [
  { month: "Apr 2025", mrr: 98_200, newMrr: 12_400, churnedMrr: 3_200, expansionMrr: 4_800, customers: 142 },
  { month: "May 2025", mrr: 108_400, newMrr: 14_200, churnedMrr: 4_000, expansionMrr: 5_200, customers: 154 },
  { month: "Jun 2025", mrr: 118_900, newMrr: 15_800, churnedMrr: 5_300, expansionMrr: 6_100, customers: 164 },
  { month: "Jul 2025", mrr: 127_400, newMrr: 13_200, churnedMrr: 4_700, expansionMrr: 5_800, customers: 172 },
  { month: "Aug 2025", mrr: 136_800, newMrr: 14_600, churnedMrr: 5_200, expansionMrr: 6_400, customers: 181 },
  { month: "Sep 2025", mrr: 145_200, newMrr: 13_800, churnedMrr: 5_400, expansionMrr: 7_200, customers: 189 },
  { month: "Oct 2025", mrr: 152_800, newMrr: 12_400, churnedMrr: 4_800, expansionMrr: 6_800, customers: 197 },
  { month: "Nov 2025", mrr: 161_400, newMrr: 14_200, churnedMrr: 5_600, expansionMrr: 7_400, customers: 208 },
  { month: "Dec 2025", mrr: 168_900, newMrr: 13_800, churnedMrr: 6_300, expansionMrr: 8_200, customers: 218 },
  { month: "Jan 2026", mrr: 175_200, newMrr: 12_800, churnedMrr: 6_500, expansionMrr: 7_800, customers: 228 },
  { month: "Feb 2026", mrr: 181_400, newMrr: 11_200, churnedMrr: 5_000, expansionMrr: 6_800, customers: 238 },
  { month: "Mar 2026", mrr: 187_400, newMrr: 12_400, churnedMrr: 6_400, expansionMrr: 8_200, customers: 247 },
];

export const planDistribution = [
  { plan: "Starter", customers: 48, mrr: 4_752, percentage: 19.4 },
  { plan: "Growth", customers: 87, mrr: 43_413, percentage: 35.2 },
  { plan: "Business", customers: 74, mrr: 73_926, percentage: 30.0 },
  { plan: "Enterprise", customers: 38, mrr: 65_309, percentage: 15.4 },
];

export const conversionFunnel = [
  { stage: "Website Visitors", count: 847_291, rate: 100 },
  { stage: "Widget Opened", count: 284_102, rate: 33.5 },
  { stage: "Conversation Started", count: 142_847, rate: 50.3 },
  { stage: "Lead Captured", count: 38_291, rate: 26.8 },
  { stage: "Booking Made", count: 12_847, rate: 33.5 },
  { stage: "Payment Completed", count: 8_291, rate: 64.5 },
];

// ── Activity Logs ────────────────────────────────────────────

export const activityLogs: ActivityLog[] = [
  // Mar 25 — Today
  { id: "log-001", timestamp: "2026-03-25 09:48:12", eventType: "Conversion Recorded", actor: "Luna Sales Bot", actorType: "Worker", action: "Lead captured", resource: "Sarah Mitchell — sarah@company.com", details: "Lead captured via web chat with booking scheduled", severity: "success", category: "Leads", customerId: "cust-001", customerName: "Acme Corp", workerId: "w-001", workerName: "Luna Sales Bot" },
  { id: "log-002", timestamp: "2026-03-25 09:45:03", eventType: "Integration Error", actor: "System", actorType: "System", action: "Integration error", resource: "Salesforce sync — Acme Corp", details: "OAuth token expired, re-authentication required", severity: "error", category: "Integrations", customerId: "cust-001", customerName: "Acme Corp" },
  { id: "log-003", timestamp: "2026-03-25 09:42:18", eventType: "Conversation Spike", actor: "Atlas Support", actorType: "Worker", action: "Conversation escalated", resource: "Ticket #4821 — James Rodriguez", details: "Low confidence on billing dispute, escalated to human agent", severity: "warning", category: "Conversations", customerId: "cust-001", customerName: "Acme Corp", workerId: "w-002", workerName: "Atlas Support" },
  { id: "log-004", timestamp: "2026-03-25 09:38:44", eventType: "Worker Created", actor: "Acme Corp", actorType: "Customer", action: "Worker deployed", resource: "New worker: Nebula Qualifier", details: "Sales worker deployed to Web + Voice channels", severity: "info", category: "Workers", customerId: "cust-001", customerName: "Acme Corp" },
  { id: "log-005", timestamp: "2026-03-25 09:35:21", eventType: "Conversion Recorded", actor: "Vega Sales Pro", actorType: "Worker", action: "Booking completed", resource: "Michael Brown — Calendly meeting", details: "Enterprise demo booked for Mar 28, 2026 at 2:00 PM", severity: "success", category: "Bookings", customerId: "cust-014", customerName: "InsureTech Global", workerId: "w-009", workerName: "Vega Sales Pro" },
  { id: "log-006", timestamp: "2026-03-25 09:30:09", eventType: "Worker Error", actor: "System", actorType: "System", action: "Worker error", resource: "Helix Support — InsureTech Global", details: "Worker entered error state: internal model index corrupted, unable to process queries", severity: "error", category: "Workers", customerId: "cust-014", customerName: "InsureTech Global", workerId: "w-010", workerName: "Helix Support" },
  { id: "log-007", timestamp: "2026-03-25 09:28:55", eventType: "Subscription Changed", actor: "TechFlow Solutions", actorType: "Customer", action: "Plan upgraded", resource: "Growth → Business", details: "Monthly plan upgraded, new MRR: $999/mo", severity: "success", category: "Billing", customerId: "cust-002", customerName: "TechFlow Solutions" },
  { id: "log-008", timestamp: "2026-03-25 09:25:33", eventType: "Conversation Spike", actor: "Nova Onboarding", actorType: "Worker", action: "Conversation dropped", resource: "Anonymous user session", details: "User abandoned after 3 messages, no engagement signal", severity: "warning", category: "Conversations", customerId: "cust-002", customerName: "TechFlow Solutions", workerId: "w-006", workerName: "Nova Onboarding" },
  { id: "log-009", timestamp: "2026-03-25 09:20:17", eventType: "Conversion Recorded", actor: "Echo Retention", actorType: "Worker", action: "Lead captured", resource: "Rachel Green — rachel@autodrive.io", details: "Retention offer accepted, renewal booking made", severity: "success", category: "Leads", customerId: "cust-011", customerName: "AutoDrive Systems", workerId: "w-007", workerName: "Echo Retention" },
  { id: "log-010", timestamp: "2026-03-25 09:15:42", eventType: "Account Status Changed", actor: "Admin", actorType: "Admin", action: "Customer suspended", resource: "GreenEnergy Co", details: "Account suspended due to payment failure (3 retries exhausted)", severity: "error", category: "Accounts", customerId: "cust-016", customerName: "GreenEnergy Co" },
  { id: "log-011", timestamp: "2026-03-25 09:10:28", eventType: "Conversion Recorded", actor: "Orion Qualifier", actorType: "Worker", action: "Lead captured", resource: "Chris Taylor — chris@hospital.org", details: "Qualified lead for enterprise healthcare plan", severity: "success", category: "Leads", customerId: "cust-003", customerName: "GlobalHealth Inc", workerId: "w-003", workerName: "Orion Qualifier" },
  { id: "log-012", timestamp: "2026-03-25 09:05:14", eventType: "System Alert", actor: "System", actorType: "System", action: "Rate limit triggered", resource: "API — CloudNine SaaS", details: "API rate limit exceeded: 10,000 req/hr threshold", severity: "warning", category: "System", customerId: "cust-012", customerName: "CloudNine SaaS" },
  { id: "log-013", timestamp: "2026-03-25 08:58:39", eventType: "Revenue Event", actor: "Drift Sales", actorType: "Worker", action: "Payment link sent", resource: "Anna Schmidt — PropTech AI lead", details: "Stripe payment link generated: $2,400 annual plan", severity: "info", category: "Revenue", customerId: "cust-007", customerName: "PropTech AI", workerId: "w-008", workerName: "Drift Sales" },
  { id: "log-014", timestamp: "2026-03-25 08:52:11", eventType: "System Alert", actor: "System", actorType: "System", action: "Data source synced", resource: "RetailMax — Product catalog", details: "142 data sources refreshed, 12 new entries indexed", severity: "info", category: "System", customerId: "cust-005", customerName: "RetailMax" },
  { id: "log-015", timestamp: "2026-03-25 08:45:07", eventType: "Worker Created", actor: "FinanceHub", actorType: "Customer", action: "Worker created", resource: "New worker: Sage Analyst v2", details: "Financial Analyst worker created in Training mode", severity: "info", category: "Workers", customerId: "cust-004", customerName: "FinanceHub" },
  { id: "log-016", timestamp: "2026-03-25 08:38:22", eventType: "System Alert", actor: "System", actorType: "System", action: "Scheduled maintenance", resource: "Platform infrastructure", details: "Database maintenance window completed, 0 downtime", severity: "info", category: "System" },
  { id: "log-017", timestamp: "2026-03-25 08:30:55", eventType: "Conversation Spike", actor: "Spark Sales AI", actorType: "Worker", action: "Low confidence response", resource: "Conversation #conv-847", details: "Response confidence 42% — legal compliance question outside configured scope", severity: "warning", category: "Conversations", customerId: "cust-008", customerName: "LegalMind", workerId: "w-004", workerName: "Spark Sales AI" },
  { id: "log-018", timestamp: "2026-03-25 08:22:18", eventType: "Revenue Event", actor: "Admin", actorType: "Admin", action: "Billing adjustment", resource: "GlobalHealth Inc", details: "Enterprise discount applied: 15% annual commitment", severity: "info", category: "Revenue", customerId: "cust-003", customerName: "GlobalHealth Inc" },
  { id: "log-019", timestamp: "2026-03-25 08:15:44", eventType: "Customer Created", actor: "System", actorType: "System", action: "New trial started", resource: "StartupLab — Starter plan", details: "14-day trial initiated, 2 workers provisioned", severity: "success", category: "Accounts", customerId: "cust-015", customerName: "StartupLab" },
  { id: "log-020", timestamp: "2026-03-25 08:08:31", eventType: "System Alert", actor: "System", actorType: "System", action: "VAPI outage detected", resource: "Voice infrastructure", details: "VAPI endpoint latency > 5s, affecting 3 workers with voice channels", severity: "error", category: "System" },
  // Mar 24 — Yesterday
  { id: "log-021", timestamp: "2026-03-24 22:15:33", eventType: "Revenue Event", actor: "System", actorType: "System", action: "Subscription payment received", resource: "AutoDrive Systems — Enterprise", details: "Monthly payment $2,499 processed via Stripe", severity: "success", category: "Revenue", customerId: "cust-011", customerName: "AutoDrive Systems" },
  { id: "log-022", timestamp: "2026-03-24 20:42:18", eventType: "Worker Activated", actor: "RetailMax", actorType: "Customer", action: "Worker activated", resource: "Pixel Support v3", details: "Worker moved from Training to Live status", severity: "success", category: "Workers", customerId: "cust-005", customerName: "RetailMax", workerId: "w-011", workerName: "Pixel Support v3" },
  { id: "log-023", timestamp: "2026-03-24 19:18:07", eventType: "Conversation Spike", actor: "System", actorType: "System", action: "Conversation spike detected", resource: "Acme Corp — 3x normal volume", details: "Conversation volume 312% above daily average, likely marketing campaign", severity: "warning", category: "Conversations", customerId: "cust-001", customerName: "Acme Corp" },
  { id: "log-024", timestamp: "2026-03-24 17:55:44", eventType: "Conversion Recorded", actor: "Nova Sales", actorType: "Worker", action: "Paid subscription created", resource: "David Kim — $99/mo Growth plan", details: "New paid subscriber via web chat conversion funnel", severity: "success", category: "Revenue", customerId: "cust-002", customerName: "TechFlow Solutions", workerId: "w-005", workerName: "Nova Sales" },
  { id: "log-025", timestamp: "2026-03-24 16:30:21", eventType: "Worker Paused", actor: "Admin", actorType: "Admin", action: "Worker paused", resource: "Iris Research — EduLearn Pro", details: "Paused after 3 consecutive low-confidence responses for reconfiguration", severity: "warning", category: "Workers", customerId: "cust-006", customerName: "EduLearn Pro", workerId: "w-012", workerName: "Iris Research" },
  { id: "log-026", timestamp: "2026-03-24 15:12:09", eventType: "Account Status Changed", actor: "System", actorType: "System", action: "Trial expiring", resource: "MediCare Plus — 2 days remaining", details: "Trial expires Mar 26, no payment method on file", severity: "warning", category: "Accounts", customerId: "cust-013", customerName: "MediCare Plus" },
  { id: "log-027", timestamp: "2026-03-24 14:05:55", eventType: "Integration Error", actor: "System", actorType: "System", action: "Calendly sync failed", resource: "GlobalHealth Inc — Calendly", details: "Webhook delivery failed: 502 Bad Gateway from Calendly endpoint", severity: "error", category: "Integrations", customerId: "cust-003", customerName: "GlobalHealth Inc" },
  { id: "log-028", timestamp: "2026-03-24 12:48:33", eventType: "Customer Created", actor: "System", actorType: "System", action: "New customer onboarded", resource: "DataVault Analytics — Growth plan", details: "New customer signed up via partner referral, 3 workers provisioned", severity: "success", category: "Accounts" },
  { id: "log-029", timestamp: "2026-03-24 11:22:17", eventType: "Subscription Changed", actor: "CloudNine SaaS", actorType: "Customer", action: "Plan downgraded", resource: "Business → Growth", details: "Downgrade effective next billing cycle, MRR impact: -$500/mo", severity: "warning", category: "Billing", customerId: "cust-012", customerName: "CloudNine SaaS" },
  { id: "log-030", timestamp: "2026-03-24 10:05:42", eventType: "Revenue Event", actor: "System", actorType: "System", action: "Payment failed", resource: "GreenEnergy Co — $499/mo", details: "Card declined, retry 2 of 3 scheduled for Mar 25", severity: "error", category: "Revenue", customerId: "cust-016", customerName: "GreenEnergy Co" },
  // Mar 23
  { id: "log-031", timestamp: "2026-03-23 21:38:11", eventType: "Worker Created", actor: "InsureTech Global", actorType: "Customer", action: "Worker created", resource: "Claims Analyzer v2", details: "Financial Analyst worker created for claims processing", severity: "info", category: "Workers", customerId: "cust-014", customerName: "InsureTech Global" },
  { id: "log-032", timestamp: "2026-03-23 18:15:28", eventType: "Conversion Recorded", actor: "Luna Sales Bot", actorType: "Worker", action: "Enterprise deal closed", resource: "Jennifer Walsh — $4,999/mo Enterprise", details: "Enterprise contract signed after 14-day evaluation", severity: "success", category: "Revenue", customerId: "cust-001", customerName: "Acme Corp", workerId: "w-001", workerName: "Luna Sales Bot" },
  { id: "log-033", timestamp: "2026-03-23 16:42:55", eventType: "Account Status Changed", actor: "System", actorType: "System", action: "Customer reactivated", resource: "FoodChain Logistics", details: "Account reactivated after payment method updated", severity: "success", category: "Accounts", customerId: "cust-009", customerName: "FoodChain Logistics" },
  { id: "log-034", timestamp: "2026-03-23 14:28:17", eventType: "Worker Activated", actor: "FinanceHub", actorType: "Customer", action: "Worker reactivated", resource: "Sage Analyst — FinanceHub", details: "Worker moved back to Live after configuration update", severity: "success", category: "Workers", customerId: "cust-004", customerName: "FinanceHub", workerId: "w-013", workerName: "Sage Analyst" },
  { id: "log-035", timestamp: "2026-03-23 12:05:44", eventType: "System Alert", actor: "System", actorType: "System", action: "Database failover", resource: "Primary DB cluster", details: "Automatic failover to replica completed in 2.3s, no data loss", severity: "warning", category: "System" },
  { id: "log-036", timestamp: "2026-03-23 10:33:21", eventType: "Subscription Changed", actor: "Acme Corp", actorType: "Customer", action: "Add-on purchased", resource: "Voice channel add-on — $200/mo", details: "VAPI voice channel enabled for 5 workers", severity: "info", category: "Billing", customerId: "cust-001", customerName: "Acme Corp" },
  { id: "log-037", timestamp: "2026-03-23 08:18:09", eventType: "Conversation Spike", actor: "System", actorType: "System", action: "Failed conversation batch", resource: "RetailMax — 12 conversations", details: "12 conversations failed due to worker timeout, auto-recovered", severity: "error", category: "Conversations", customerId: "cust-005", customerName: "RetailMax" },
  // Mar 22
  { id: "log-038", timestamp: "2026-03-22 19:45:33", eventType: "Revenue Event", actor: "System", actorType: "System", action: "Invoice generated", resource: "Monthly invoices — 218 accounts", details: "Batch invoice generation completed, total: $187,400", severity: "info", category: "Revenue" },
  { id: "log-039", timestamp: "2026-03-22 16:22:18", eventType: "Worker Paused", actor: "System", actorType: "System", action: "Worker auto-paused", resource: "Zenith Sales — PropTech AI", details: "Auto-paused after 5 consecutive error responses", severity: "error", category: "Workers", customerId: "cust-007", customerName: "PropTech AI", workerId: "w-014", workerName: "Zenith Sales" },
  { id: "log-040", timestamp: "2026-03-22 14:08:55", eventType: "Customer Created", actor: "System", actorType: "System", action: "Customer signed up", resource: "NovaPharma — Enterprise trial", details: "Enterprise trial started, 5 workers provisioned, dedicated support assigned", severity: "success", category: "Accounts" },
  { id: "log-041", timestamp: "2026-03-22 11:35:42", eventType: "Integration Error", actor: "System", actorType: "System", action: "Gmail API quota exceeded", resource: "LegalMind — Gmail integration", details: "Daily sending quota reached (500 emails), resuming tomorrow", severity: "warning", category: "Integrations", customerId: "cust-008", customerName: "LegalMind" },
  { id: "log-042", timestamp: "2026-03-22 09:12:28", eventType: "Conversion Recorded", actor: "Spark Sales AI", actorType: "Worker", action: "Bulk leads captured", resource: "LegalMind — 8 qualified leads", details: "8 leads captured from webinar follow-up campaign", severity: "success", category: "Leads", customerId: "cust-008", customerName: "LegalMind", workerId: "w-004", workerName: "Spark Sales AI" },
  // Mar 21
  { id: "log-043", timestamp: "2026-03-21 20:55:11", eventType: "Account Status Changed", actor: "Admin", actorType: "Admin", action: "Account flagged", resource: "TravelWise — Unusual activity", details: "Account flagged for review: 500% spike in API calls", severity: "warning", category: "Accounts", customerId: "cust-010", customerName: "TravelWise" },
  { id: "log-044", timestamp: "2026-03-21 17:30:28", eventType: "Revenue Event", actor: "System", actorType: "System", action: "Refund processed", resource: "EduLearn Pro — $249 refund", details: "Prorated refund for unused portion of Business plan", severity: "info", category: "Revenue", customerId: "cust-006", customerName: "EduLearn Pro" },
  { id: "log-045", timestamp: "2026-03-21 15:18:44", eventType: "Worker Created", actor: "GlobalHealth Inc", actorType: "Customer", action: "Worker created", resource: "Patient Intake Bot v3", details: "Onboarding worker created with HIPAA-compliant configuration", severity: "info", category: "Workers", customerId: "cust-003", customerName: "GlobalHealth Inc" },
];

// ── Overview Chart Data ──────────────────────────────────────

export const conversationsTrend = [
  { date: "Feb 24", conversations: 8_291, leads: 1_102 },
  { date: "Feb 25", conversations: 9_182, leads: 1_247 },
  { date: "Feb 26", conversations: 8_847, leads: 1_182 },
  { date: "Feb 27", conversations: 10_291, leads: 1_384 },
  { date: "Feb 28", conversations: 9_847, leads: 1_291 },
  { date: "Mar 01", conversations: 7_291, leads: 982 },
  { date: "Mar 02", conversations: 6_847, leads: 891 },
  { date: "Mar 03", conversations: 10_847, leads: 1_482 },
  { date: "Mar 04", conversations: 11_291, leads: 1_547 },
  { date: "Mar 05", conversations: 10_182, leads: 1_391 },
  { date: "Mar 06", conversations: 11_847, leads: 1_624 },
  { date: "Mar 07", conversations: 12_291, leads: 1_682 },
  { date: "Mar 08", conversations: 8_847, leads: 1_182 },
  { date: "Mar 09", conversations: 7_291, leads: 984 },
  { date: "Mar 10", conversations: 11_182, leads: 1_547 },
  { date: "Mar 11", conversations: 12_847, leads: 1_782 },
  { date: "Mar 12", conversations: 11_291, leads: 1_547 },
  { date: "Mar 13", conversations: 12_182, leads: 1_682 },
  { date: "Mar 14", conversations: 13_291, leads: 1_847 },
  { date: "Mar 15", conversations: 9_291, leads: 1_247 },
  { date: "Mar 16", conversations: 8_182, leads: 1_102 },
  { date: "Mar 17", conversations: 12_847, leads: 1_782 },
  { date: "Mar 18", conversations: 13_291, leads: 1_847 },
  { date: "Mar 19", conversations: 12_182, leads: 1_682 },
  { date: "Mar 20", conversations: 13_847, leads: 1_924 },
  { date: "Mar 21", conversations: 14_291, leads: 1_982 },
  { date: "Mar 22", conversations: 10_182, leads: 1_391 },
  { date: "Mar 23", conversations: 9_291, leads: 1_247 },
  { date: "Mar 24", conversations: 13_182, leads: 1_847 },
  { date: "Mar 25", conversations: 12_847, leads: 1_892 },
];

export const topCustomersByConversations = [
  { name: "GlobalHealth Inc", conversations: 2_847, leads: 412, conversion: 14.5 },
  { name: "Acme Corp", conversations: 2_291, leads: 347, conversion: 15.1 },
  { name: "InsureTech Global", conversations: 1_982, leads: 298, conversion: 15.0 },
  { name: "RetailMax", conversations: 1_547, leads: 198, conversion: 12.8 },
  { name: "AutoDrive Systems", conversations: 1_384, leads: 192, conversion: 13.9 },
];

export const systemHealth = {
  apiUptime: 99.97,
  avgLatency: "142ms",
  activeConnections: 1_847,
  errorRate: 0.12,
  vapiStatus: "degraded" as const,
  dbStatus: "healthy" as const,
  cacheStatus: "healthy" as const,
  queueDepth: 247,
};

// ── Revenue KPIs ────────────────────────────────────────────

export const revenueKPIs = {
  mrr: 187_400,
  arr: 2_248_800,
  arpa: 758,
  netRevenueRetention: 112.4,
  mrrGrowth: 7.2,
};

export const mrrTrend = revenueHistory;

// ── New vs Churned Customers Trend ─────────────────────────

export const customerGrowthTrend = [
  { month: "Apr 2025", newCustomers: 18, churnedCustomers: 3, netGrowth: 15 },
  { month: "May 2025", newCustomers: 16, churnedCustomers: 4, netGrowth: 12 },
  { month: "Jun 2025", newCustomers: 14, churnedCustomers: 5, netGrowth: 9 },
  { month: "Jul 2025", newCustomers: 12, churnedCustomers: 4, netGrowth: 8 },
  { month: "Aug 2025", newCustomers: 15, churnedCustomers: 6, netGrowth: 9 },
  { month: "Sep 2025", newCustomers: 13, churnedCustomers: 5, netGrowth: 8 },
  { month: "Oct 2025", newCustomers: 14, churnedCustomers: 6, netGrowth: 8 },
  { month: "Nov 2025", newCustomers: 17, churnedCustomers: 6, netGrowth: 11 },
  { month: "Dec 2025", newCustomers: 16, churnedCustomers: 6, netGrowth: 10 },
  { month: "Jan 2026", newCustomers: 15, churnedCustomers: 5, netGrowth: 10 },
  { month: "Feb 2026", newCustomers: 14, churnedCustomers: 4, netGrowth: 10 },
  { month: "Mar 2026", newCustomers: 13, churnedCustomers: 4, netGrowth: 9 },
];

// ── Top Customers by Earnings ──────────────────────────────

export const topCustomersByEarnings = [
  { name: "GlobalHealth Inc", mrr: 4_999, plan: "Enterprise", workers: 31, trend: 8.2 },
  { name: "InsureTech Global", mrr: 4_999, plan: "Enterprise", workers: 22, trend: 12.4 },
  { name: "Acme Corp", mrr: 2_499, plan: "Enterprise", workers: 24, trend: 5.1 },
  { name: "AutoDrive Systems", mrr: 2_499, plan: "Enterprise", workers: 18, trend: 9.7 },
  { name: "TechFlow Solutions", mrr: 999, plan: "Business", workers: 12, trend: 15.2 },
  { name: "RetailMax", mrr: 999, plan: "Business", workers: 15, trend: 3.8 },
  { name: "CloudNine SaaS", mrr: 999, plan: "Business", workers: 11, trend: 7.1 },
  { name: "LegalMind", mrr: 999, plan: "Business", workers: 9, trend: 4.3 },
];

// ── Platform Alerts / Issues ───────────────────────────────

export const platformAlerts = [
  { id: "alert-001", type: "inactive_customer" as const, severity: "warning" as const, title: "Inactive customer: EduLearn Pro", description: "No worker activity in 7 days. Trial expires in 3 days.", customer: "EduLearn Pro", timestamp: "2026-03-25 09:30 AM", actionLabel: "View Account" },
  { id: "alert-002", type: "failed_conversation" as const, severity: "error" as const, title: "Worker error: Helix Support", description: "Worker model index corrupted. 0 conversations handled today.", customer: "InsureTech Global", timestamp: "2026-03-25 09:28 AM", actionLabel: "Investigate" },
  { id: "alert-003", type: "conversion_drop" as const, severity: "warning" as const, title: "Conversion drop: RetailMax", description: "Conversion rate dropped 34% week-over-week (12.8% → 8.4%).", customer: "RetailMax", timestamp: "2026-03-25 09:15 AM", actionLabel: "View Analytics" },
  { id: "alert-004", type: "payment_issue" as const, severity: "error" as const, title: "Payment failed: GreenEnergy Co", description: "3 consecutive payment retries failed. Account suspended.", customer: "GreenEnergy Co", timestamp: "2026-03-25 08:45 AM", actionLabel: "View Billing" },
  { id: "alert-005", type: "inactive_customer" as const, severity: "warning" as const, title: "Inactive customer: TravelWise", description: "Churned 45 days ago. No re-engagement attempts made.", customer: "TravelWise", timestamp: "2026-03-25 08:30 AM", actionLabel: "View Account" },
  { id: "alert-006", type: "failed_conversation" as const, severity: "error" as const, title: "VAPI voice degraded", description: "Voice endpoint latency >5s affecting 3 workers across 2 customers.", customer: "Platform-wide", timestamp: "2026-03-25 08:08 AM", actionLabel: "View Status" },
  { id: "alert-007", type: "conversion_drop" as const, severity: "warning" as const, title: "Low confidence: Spark Sales AI", description: "42% confidence on legal compliance question. Outside configured scope.", customer: "LegalMind", timestamp: "2026-03-25 07:55 AM", actionLabel: "Review" },
  { id: "alert-008", type: "payment_issue" as const, severity: "warning" as const, title: "Trial expiring: StartupLab", description: "14-day trial ends in 2 days. No upgrade intent signals detected.", customer: "StartupLab", timestamp: "2026-03-25 07:30 AM", actionLabel: "View Account" },
];

// ── Recent Worker Activity ─────────────────────────────────

export const recentWorkerActivity = [
  { id: "wa-001", workerName: "Luna Sales Bot", customer: "Acme Corp", action: "Captured 12 leads in last hour", type: "success" as const, timestamp: "09:48 AM" },
  { id: "wa-002", workerName: "Atlas Support", customer: "Acme Corp", action: "Resolved 89 tickets today", type: "success" as const, timestamp: "09:45 AM" },
  { id: "wa-003", workerName: "Helix Support", customer: "InsureTech Global", action: "Entered error state — internal index corrupted", type: "error" as const, timestamp: "09:30 AM" },
  { id: "wa-004", workerName: "Vega Sales Pro", customer: "InsureTech Global", action: "Booked 4 enterprise demos today", type: "success" as const, timestamp: "09:35 AM" },
  { id: "wa-005", workerName: "Pixel Assistant", customer: "CloudNine SaaS", action: "Moved to Training mode — configuration updated", type: "info" as const, timestamp: "09:20 AM" },
  { id: "wa-006", workerName: "Zen Support Pro", customer: "RetailMax", action: "Escalated 3 conversations to human agents", type: "warning" as const, timestamp: "09:15 AM" },
  { id: "wa-007", workerName: "Spark Sales AI", customer: "LegalMind", action: "Low confidence response (42%) on compliance query", type: "warning" as const, timestamp: "08:30 AM" },
  { id: "wa-008", workerName: "Echo Retention", customer: "AutoDrive Systems", action: "Completed 41 retention conversations", type: "success" as const, timestamp: "09:10 AM" },
  { id: "wa-009", workerName: "Cleo Onboarding", customer: "AutoDrive Systems", action: "Paused by customer — scheduled maintenance", type: "info" as const, timestamp: "08:00 AM" },
  { id: "wa-010", workerName: "Drift Sales", customer: "PropTech AI", action: "Generated $2,400 payment link for annual plan", type: "success" as const, timestamp: "08:58 AM" },
];

// ── Recent Customer Activity ───────────────────────────────

export const recentCustomerActivity = [
  { id: "ca-001", customer: "TechFlow Solutions", action: "Upgraded plan: Growth → Business", type: "success" as const, timestamp: "09:28 AM", detail: "New MRR: $999/mo" },
  { id: "ca-002", customer: "Acme Corp", action: "Deployed new worker: Nebula Qualifier", type: "info" as const, timestamp: "09:38 AM", detail: "Sales worker on Web + Voice" },
  { id: "ca-003", customer: "GreenEnergy Co", action: "Account suspended — payment failure", type: "error" as const, timestamp: "09:15 AM", detail: "3 retries exhausted" },
  { id: "ca-004", customer: "FinanceHub", action: "Created new worker: Sage Analyst v2", type: "info" as const, timestamp: "08:45 AM", detail: "Financial Analyst in Training mode" },
  { id: "ca-005", customer: "GlobalHealth Inc", action: "Enterprise discount applied: 15%", type: "success" as const, timestamp: "08:22 AM", detail: "Annual commitment discount" },
  { id: "ca-006", customer: "StartupLab", action: "Started 14-day trial", type: "info" as const, timestamp: "08:15 AM", detail: "Starter plan, 2 workers provisioned" },
  { id: "ca-007", customer: "RetailMax", action: "Data sources refreshed", type: "info" as const, timestamp: "08:52 AM", detail: "142 sources synced, 12 new entries" },
  { id: "ca-008", customer: "InsureTech Global", action: "Worker Helix Support entered error state", type: "error" as const, timestamp: "09:30 AM", detail: "Internal index corrupted" },
  { id: "ca-009", customer: "PropTech AI", action: "Payment link generated: $2,400", type: "success" as const, timestamp: "08:58 AM", detail: "Annual plan via Drift Sales" },
  { id: "ca-010", customer: "CloudNine SaaS", action: "API rate limit exceeded", type: "warning" as const, timestamp: "09:05 AM", detail: "10,000 req/hr threshold" },
];

// ── Subscriber Trend ─────────────────────────────────────────
export const subscribersTrend = [
  { month: "Apr 2025", total: 89, new: 14, churned: 3 },
  { month: "May 2025", total: 98, new: 12, churned: 3 },
  { month: "Jun 2025", total: 108, new: 15, churned: 5 },
  { month: "Jul 2025", total: 118, new: 14, churned: 4 },
  { month: "Aug 2025", total: 129, new: 16, churned: 5 },
  { month: "Sep 2025", total: 140, new: 15, churned: 4 },
  { month: "Oct 2025", total: 152, new: 17, churned: 5 },
  { month: "Nov 2025", total: 164, new: 18, churned: 6 },
  { month: "Dec 2025", total: 175, new: 16, churned: 5 },
  { month: "Jan 2026", total: 186, new: 15, churned: 4 },
  { month: "Feb 2026", total: 198, new: 17, churned: 5 },
  { month: "Mar 2026", total: 212, new: 19, churned: 5 },
];

// ── Conversion Trend ─────────────────────────────────────────
export const conversionTrend = [
  { month: "Apr 2025", conversations: 8420, leads: 1264, conversions: 412, rate: 4.89 },
  { month: "May 2025", conversations: 9180, leads: 1468, conversions: 478, rate: 5.21 },
  { month: "Jun 2025", conversations: 9840, leads: 1574, conversions: 502, rate: 5.10 },
  { month: "Jul 2025", conversations: 10200, leads: 1632, conversions: 538, rate: 5.27 },
  { month: "Aug 2025", conversations: 10800, leads: 1728, conversions: 572, rate: 5.30 },
  { month: "Sep 2025", conversations: 11400, leads: 1824, conversions: 608, rate: 5.33 },
  { month: "Oct 2025", conversations: 11800, leads: 1888, conversions: 642, rate: 5.44 },
  { month: "Nov 2025", conversations: 12200, leads: 1952, conversions: 678, rate: 5.56 },
  { month: "Dec 2025", conversations: 12600, leads: 2016, conversions: 712, rate: 5.65 },
  { month: "Jan 2026", conversations: 12400, leads: 1984, conversions: 698, rate: 5.63 },
  { month: "Feb 2026", conversations: 12200, leads: 1952, conversions: 682, rate: 5.59 },
  { month: "Mar 2026", conversations: 12800, leads: 2048, conversions: 724, rate: 5.66 },
];

// ── Top Workers by Revenue ───────────────────────────────────
export const topWorkersByRevenue = [
  { name: "Luna Sales Bot", customer: "Acme Corp", conversations: 42_180, conversions: 5_891, paidSubscribers: 842, revenue: 48_200 },
  { name: "Vega Sales Pro", customer: "InsureTech Global", conversations: 38_420, conversions: 4_892, paidSubscribers: 712, revenue: 42_800 },
  { name: "Drift Sales", customer: "PropTech AI", conversations: 28_940, conversions: 3_472, paidSubscribers: 498, revenue: 34_200 },
  { name: "Spark Sales AI", customer: "LegalMind", conversations: 24_180, conversions: 2_904, paidSubscribers: 412, revenue: 28_400 },
  { name: "Orion Qualifier", customer: "GlobalHealth Inc", conversations: 32_840, conversions: 4_284, paidSubscribers: 624, revenue: 38_600 },
  { name: "Nova Sales", customer: "TechFlow Solutions", conversations: 22_480, conversions: 2_698, paidSubscribers: 384, revenue: 24_800 },
  { name: "Echo Retention", customer: "AutoDrive Systems", conversations: 18_920, conversions: 2_270, paidSubscribers: 328, revenue: 21_200 },
  { name: "Atlas Support", customer: "Acme Corp", conversations: 48_200, conversions: 1_928, paidSubscribers: 284, revenue: 18_400 },
  { name: "Pixel Assistant", customer: "CloudNine SaaS", conversations: 16_840, conversions: 2_021, paidSubscribers: 292, revenue: 17_800 },
  { name: "Zen Support Pro", customer: "RetailMax", conversations: 28_480, conversions: 1_424, paidSubscribers: 198, revenue: 14_200 },
];

export const topAccountsByRevenue = [
  { name: "GlobalHealth Inc", industry: "Healthcare", plan: "Enterprise", mrr: 4_999, workers: 31, conversations: 412_093, leads: 52_187, conversionRate: 12.7 },
  { name: "InsureTech Global", industry: "Insurance", plan: "Enterprise", mrr: 4_999, workers: 22, conversations: 324_182, leads: 41_293, conversionRate: 12.7 },
  { name: "AutoDrive Systems", industry: "Automotive", plan: "Enterprise", mrr: 2_499, workers: 18, conversations: 287_491, leads: 34_182, conversionRate: 11.9 },
  { name: "Acme Corp", industry: "SaaS", plan: "Enterprise", mrr: 2_499, workers: 24, conversations: 284_102, leads: 38_291, conversionRate: 13.5 },
  { name: "RetailMax", industry: "Retail", plan: "Business", mrr: 999, workers: 15, conversations: 198_472, leads: 28_193, conversionRate: 14.2 },
  { name: "TechFlow Solutions", industry: "Technology", plan: "Business", mrr: 999, workers: 12, conversations: 156_847, leads: 21_034, conversionRate: 13.4 },
  { name: "CloudNine SaaS", industry: "SaaS", plan: "Business", mrr: 999, workers: 11, conversations: 142_093, leads: 19_847, conversionRate: 14.0 },
  { name: "LegalMind", industry: "Legal", plan: "Business", mrr: 999, workers: 9, conversations: 112_384, leads: 14_291, conversionRate: 12.7 },
];
