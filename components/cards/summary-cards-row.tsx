'use client';

import KPIStatCard from './kpi-stat-card';

interface Card {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon?: any;
  description?: string;
  highlight?: boolean;
  onClick?: () => void;
}

interface SummaryCardsRowProps {
  cards: Card[];
  className?: string;
}

export default function SummaryCardsRow({ cards, className = '' }: SummaryCardsRowProps) {
  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {cards.map((card, index) => (
        <KPIStatCard
          key={index}
          {...card}
        />
      ))}
    </div>
  );
}
