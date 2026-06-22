import React from 'react';
import { useAppSelector } from '@hooks/useAppSelector';
import { getGenderLabel } from '@utils/formatters';
import { Avatar, Chip } from '@mui/material';
import { getInitials } from '@utils/formatters';
import PageHeader from '@components/common/PageHeader';

const ProfilePage: React.FC = () => {
  const { user } = useAppSelector(s => s.auth);
  if (!user) return null;

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Thông tin cá nhân" subtitle="Quản lý thông tin tài khoản của bạn" />
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Avatar card */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Avatar sx={{ width: 80, height: 80, background: 'linear-gradient(135deg, #D97706, #F59E0B)', fontSize: 28, fontWeight: 700 }}>
            {getInitials(user.userName)}
          </Avatar>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{user.userName}</p>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}>
              {user.roles.map(r => (
                <Chip key={r.name} label={r.description} size="small" sx={{ background: '#FEF3C7', color: '#D97706', fontWeight: 600, fontSize: 11, borderRadius: 1 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Info card */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', padding: 32 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Thông tin tài khoản</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { label: 'Tên đăng nhập', value: user.userName },
              { label: 'Mã người dùng', value: user.userId },
              { label: 'Vai trò', value: user.roles.map(r => r.description).join(', ') },
              { label: 'Nhân viên', value: user.employee?.name ?? '—' },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
