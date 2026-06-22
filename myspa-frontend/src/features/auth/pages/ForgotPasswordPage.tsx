import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { TextField, Button } from '@mui/material';
import { ROUTES } from '@constants/routes';

const schema = z.object({
  email: z.string().email('Vui lòng nhập email hợp lệ'),
});

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { control, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = () => {
    toast.success('Đã gửi liên kết đặt lại mật khẩu vào email của bạn');
    setTimeout(() => navigate(ROUTES.LOGIN), 2000);
  };

  const inputSx = { '& .MuiOutlinedInput-root': { background: 'rgba(255,255,255,0.06)', borderRadius: '12px', color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' }, '&.Mui-focused fieldset': { borderColor: '#D97706' }, '& input': { color: '#fff' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' }, '& .MuiInputLabel-root.Mui-focused': { color: '#F59E0B' }, '& .MuiFormHelperText-root': { color: '#EF4444' } };

  return (
    <div className="animate-fadeInUp" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xl)', padding: '40px 36px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Quên mật khẩu</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Nhập email để nhận liên kết đặt lại mật khẩu</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Controller name="email" control={control} render={({ field }) => (
          <TextField {...field} label="Email" placeholder="your@email.com" error={!!errors.email} helperText={errors.email?.message} fullWidth sx={inputSx} />
        )} />
        <Button type="submit" variant="contained" fullWidth sx={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', borderRadius: '12px', py: 1.4, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', textTransform: 'none', '&:hover': { background: '#B45309' } }}>
          Gửi liên kết
        </Button>
        <button type="button" onClick={() => navigate(ROUTES.LOGIN)} style={{ background: 'none', color: '#F59E0B', fontSize: 13.5, cursor: 'pointer', border: 'none', textAlign: 'center' }}>
          ← Quay lại đăng nhập
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
