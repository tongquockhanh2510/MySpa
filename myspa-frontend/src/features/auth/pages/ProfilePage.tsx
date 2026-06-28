import React from 'react';
import { useAppSelector } from '@hooks/useAppSelector';
import { Avatar, Chip } from '@mui/material';
import { getInitials } from '@utils/formatters';
import PageHeader from '@components/common/PageHeader';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import WorkIcon from '@mui/icons-material/Work';
import './AuthPages.css';

const ProfilePage: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  if (!user) return null;

  const details = [
    { label: 'Tên đăng nhập', value: user.userName, icon: <PersonIcon /> },
    { label: 'Mã người dùng', value: user.userId, icon: <BadgeIcon /> },
    { label: 'Vai trò', value: user.roles.map(role => role.description || role.name).join(', '), icon: <SecurityIcon /> },
    { label: 'Nhân viên', value: user.employee?.name ?? user.employeeName ?? 'Chưa liên kết', icon: <WorkIcon /> },
  ];

  return (
    <main className="profile-page animate-fadeIn">
      <PageHeader title="Thông tin cá nhân" subtitle="Quản lý thông tin tài khoản của bạn" />

      <div className="profile-grid">
        <section className="profile-card profile-card--identity">
          <Avatar className="profile-avatar">
            {getInitials(user.userName)}
          </Avatar>
          <div className="profile-identity-text">
            <h2>{user.userName}</h2>
            <p>{user.employeeName || 'Tài khoản hệ thống'}</p>
          </div>
          <div className="profile-role-list">
            {user.roles.map(role => (
              <Chip key={role.name} label={role.description || role.name} size="small" className="profile-role-chip" />
            ))}
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card__header">
            <h2>Thông tin tài khoản</h2>
            <p>Dữ liệu được đồng bộ từ phiên đăng nhập hiện tại.</p>
          </div>
          <div className="profile-detail-grid">
            {details.map(item => (
              <div className="profile-detail" key={item.label}>
                <span aria-hidden="true">{item.icon}</span>
                <div>
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;
