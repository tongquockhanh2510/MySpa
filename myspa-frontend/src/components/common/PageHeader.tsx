import React from 'react';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  extra?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, extra }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.3px',
            marginBottom: subtitle ? 4 : 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)' }}>{subtitle}</p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {extra}
        {action && (
          <Button
            variant="contained"
            onClick={action.onClick}
            startIcon={action.icon ?? <AddIcon />}
            sx={{
              background: 'linear-gradient(135deg, #D97706, #F59E0B)',
              borderRadius: '10px',
              textTransform: 'none',
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: 13.5,
              px: 2.5,
              py: 1,
              boxShadow: '0 2px 8px rgba(217,119,6,0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #B45309, #D97706)',
                boxShadow: '0 4px 12px rgba(217,119,6,0.4)',
                transform: 'translateY(-1px)',
              },
              transition: 'all var(--transition-base)',
            }}
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
