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

    settlementAging: Array.isArray(finance?.settlement_aging)
      ? finance.settlement_aging.map((item: any) => ({ bucket: String(item.bucket ?? ''), value: Number(item.value ?? 0) }))
      : [],

    liveEvents: live.slice(0, 4).map((a: any) => ({
      id: a.code,
      name: a.title,
      customerName: a.customer?.company_name || '',
      direction: a.direction || '',
      category: a.category || '',
      currentPrice: a.current_price || a.reserve_price || 0,
      participants: a.participants?.length || 0,
      hoursLeft: a.end_at ? Math.max(0, (new Date(a.end_at).getTime() - Date.now()) / 3600000) : 0,
    })),
  };
}

function generateMonthlySeries(auctions: any[]) {
  const byMonth = new Map<string, any>();
  auctions.forEach((auction: any) => {
    const sourceDate = auction.closed_at ?? auction.closedAt ?? auction.created_at ?? auction.createdAt;
    if (!sourceDate) return;
    const date = new Date(sourceDate);
    if (Number.isNaN(date.getTime())) return;
    const month = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    const item = byMonth.get(month) ?? { month, forward: 0, reverse: 0, successRateTotal: 0, successRateCount: 0, avgParticipants: 0, count: 0 };
    const value = Number(auction.final_price ?? auction.finalPriceInr ?? 0);
    if (auction.direction === 'Reverse') item.reverse += value;
    else item.forward += value;
    item.avgParticipants += Array.isArray(auction.participants) ? auction.participants.length : Number(auction.participants_count ?? 0);
    if (auction.success_rate != null || auction.successRate != null) {
      item.successRateTotal += Number(auction.success_rate ?? auction.successRate);
      item.successRateCount += 1;
    }
    item.count += 1;
    byMonth.set(month, item);
  });
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month)).map(({ count, successRateTotal, successRateCount, ...item }) => ({
    ...item,
    avgParticipants: count ? item.avgParticipants / count : 0,
    successRate: successRateCount ? successRateTotal / successRateCount : 0,
  }));
}

function generateCategoryMix(auctions: any[]) {
  const counts = new Map<string, number>();
  auctions.forEach((auction: any) => {
    const category = auction.category;
    if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
  });
  return [...counts.entries()].map(([name, value]) => ({ name, value }));
}
