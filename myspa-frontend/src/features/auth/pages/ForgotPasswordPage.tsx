import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { TextField, Button, InputAdornment } from '@mui/material';
import { ROUTES } from '@constants/routes';
import EmailIcon from '@mui/icons-material/Email';
import SpaIcon from '@mui/icons-material/Spa';
import './AuthPages.css';

const schema = z.object({
  email: z.string().email('Vui lòng nhập email hợp lệ'),
});

const darkInputSx = {
  '& .MuiOutlinedInput-root': {
    background: 'rgba(255,255,255,0.07)',
    borderRadius: '12px',
    color: '#fff',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.14)' },
    '&:hover fieldset': { borderColor: 'rgba(217,119,6,0.65)' },
    '&.Mui-focused fieldset': { borderColor: '#D97706' },
    '& input': { color: '#fff' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.58)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#F59E0B' },
  '& .MuiFormHelperText-root': { color: '#FCA5A5' },
};

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = () => {
    toast.success('Đã gửi liên kết đặt lại mật khẩu vào email của bạn');
    setTimeout(() => navigate(ROUTES.LOGIN), 2000);
  };

  return (
    <section className="auth-card animate-fadeInUp">
      <div className="auth-brand-mark" aria-hidden="true"><SpaIcon /></div>
      <div className="auth-card__header">
        <p>Khôi phục truy cập</p>
        <h1>Quên mật khẩu</h1>
        <span>Nhập email tài khoản để nhận liên kết đặt lại mật khẩu.</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
        <Controller name="email" control={control} render={({ field }) => (
          <TextField
            {...field}
            label="Email"
            placeholder="your@email.com"
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon className="auth-field-icon" /></InputAdornment> } }}
            sx={darkInputSx}
          />
        )} />

        <Button type="submit" variant="contained" fullWidth className="auth-primary-button">
          Gửi liên kết
        </Button>
        <button type="button" onClick={() => navigate(ROUTES.LOGIN)} className="auth-back-button">
          Quay lại đăng nhập
        </button>
      </form>
    </section>
  );
};

export default ForgotPasswordPage;
