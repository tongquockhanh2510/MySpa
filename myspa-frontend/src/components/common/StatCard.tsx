import React from 'react';
import { formatCurrency, formatNumber } from '@utils/formatters';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  format?: 'currency' | 'number' | 'text';
  subtitle?: string;
  trendLabel?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  format = 'number',
  subtitle,
  trendLabel = 'so với tháng trước',
  onClick,
}) => {
  const displayValue = () => {
    if (typeof value === 'string') return value;
    if (format === 'currency') return formatCurrency(value);
    if (format === 'number') return formatNumber(value);
    return value;
  };

  const isPositive = (trend ?? 0) >= 0;

  return (
    <div
      className="animate-fadeInUp"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-hover)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 6 }}>
            {title}
          </p>
          <p style={{
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
          }}>
            {displayValue()}
          </p>
          {subtitle && (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {subtitle}
            </p>
          )}
        </div>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '14px',
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>

      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isPositive
            ? <TrendingUpIcon sx={{ fontSize: 16, color: 'var(--success)' }} />
            : <TrendingDownIcon sx={{ fontSize: 16, color: 'var(--error)' }} />
          }
          <span style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: isPositive ? 'var(--success)' : 'var(--error)',
          }}>
            {isPositive ? '+' : ''}{trend}%
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
