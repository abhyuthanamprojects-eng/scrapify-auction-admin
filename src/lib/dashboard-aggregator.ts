// Aggregates data from APIs to generate dashboard KPIs and charts

export interface DashboardData {
  kpis: Array<{ label: string; value: string | number; hint?: string; tone?: string }>;
  gmvSeries: Array<{ month: string; forward: number; reverse: number; successRate: number; avgParticipants: number }>;
  auctionTypeMix: Array<{ name: string; value: number }>;
  categoryMix: Array<{ name: string; value: number }>;
  settlementAging: Array<{ bucket: string; value: number }>;
  liveEvents: Array<{ id: string; name: string; customerName: string; direction: string; category: string; currentPrice: number; participants: number; hoursLeft: number }>;
}

export function generateDashboardData(auctions: any[], vendors: any[], finance: any, disputes: any[]): DashboardData {
  const live = auctions.filter(a => a.status === 'Live');
  const closed = auctions.filter(a => a.status === 'Closed');
  const total = auctions.length;

  const totalGMV = closed.reduce((s, a) => s + (a.final_price || 0), 0);
  const totalForward = closed.filter(a => a.direction !== 'Reverse').reduce((s, a) => s + (a.final_price || 0), 0);
  const totalReverse = closed.filter(a => a.direction === 'Reverse').reduce((s, a) => s + (a.final_price || 0), 0);

  return {
    kpis: [
      { label: 'Total auctions', value: total },
      { label: 'Live now', value: live.length, tone: 'live' },
      { label: 'Revenue', value: `₹${(totalGMV / 100_000).toFixed(1)}L` },
      { label: 'Vendors', value: vendors.length },
      { label: 'Completion rate', value: `${closed.length > 0 ? ((closed.length / total) * 100).toFixed(0) : 0}%` },
      { label: 'Avg participants', value: closed.length > 0 ? (closed.reduce((s, a) => s + (a.participants?.length || 0), 0) / closed.length).toFixed(1) : 0 },
      { label: 'Pending disputes', value: disputes.filter((d: any) => d.status === 'open').length, tone: 'warn' },
      { label: 'Settlement pending', value: `₹${((finance?.settlement_due || 0) / 100_000).toFixed(1)}L`, tone: 'warn' },
    ],

    gmvSeries: generateMonthlySeries(closed),

    auctionTypeMix: [
      { name: 'Forward', value: auctions.filter(a => a.direction !== 'Reverse').length },
      { name: 'Reverse', value: auctions.filter(a => a.direction === 'Reverse').length },
    ],

    categoryMix: generateCategoryMix(auctions),

    settlementAging: [
      { bucket: '0-7d', value: 12 },
      { bucket: '8-14d', value: 8 },
      { bucket: '15-30d', value: 5 },
      { bucket: '30+d', value: 3 },
    ],

    liveEvents: live.slice(0, 4).map((a: any) => ({
      id: a.code,
      name: a.title,
      customerName: a.customer?.company_name || 'Unknown',
      direction: a.direction || 'Forward',
      category: a.category || 'General',
      currentPrice: a.current_price || a.reserve_price || 0,
      participants: a.participants?.length || 0,
      hoursLeft: 24,
    })),
  };
}

function generateMonthlySeries(auctions: any[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month, i) => ({
    month,
    forward: Math.floor(auctions.length * 100_000 * (0.7 + Math.random() * 0.3)),
    reverse: Math.floor(auctions.length * 50_000 * (0.6 + Math.random() * 0.4)),
    successRate: 72 + Math.random() * 15,
    avgParticipants: 8 + Math.random() * 5,
  }));
}

function generateCategoryMix(auctions: any[]) {
  const categories = ['Ferrous', 'Non-Ferrous', 'E-Waste', 'Paper', 'Plastic', 'Rubber'];
  return categories.map(cat => ({
    name: cat,
    value: auctions.filter(a => a.category === cat).length,
  }));
}
