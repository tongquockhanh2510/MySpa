import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch } from '@hooks/useAppDispatch';
import { useAppSelector } from '@hooks/useAppSelector';
import { login, clearError } from '@store/authSlice';
import { ROUTES } from '@constants/routes';
import { toast } from 'sonner';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SpaIcon from '@mui/icons-material/Spa';
import './AuthPages.css';

const schema = z.object({
  userName: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const darkInputSx = {
  '& .MuiOutlinedInput-root': {
    background: 'rgba(255,255,255,0.07)',
    borderRadius: '12px',
    color: '#fff',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.14)' },
    '&:hover fieldset': { borderColor: 'rgba(217,119,6,0.65)' },
    '&.Mui-focused fieldset': { borderColor: '#D97706' },
    '& input': {
      background: 'transparent',
      color: '#fff',
    },
    '& input::placeholder': { color: 'rgba(255,255,255,0.35)' },
    '& input:-webkit-autofill': {
      WebkitBoxShadow: '0 0 0 1000px rgba(255,255,255,0.07) inset',
      WebkitTextFillColor: '#fff',
      caretColor: '#fff',
      transition: 'background-color 9999s ease-in-out 0s',
    },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.58)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#F59E0B' },
  '& .MuiFormHelperText-root': { color: '#FCA5A5' },
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = React.useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { userName: '', password: '', rememberMe: false },
  });

  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.DASHBOARD, { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = async (data: FormData) => {
    await dispatch(login({ userName: data.userName, password: data.password }));
  };

  return (
    <section className="auth-card animate-fadeInUp">
      <div className="auth-brand-mark" aria-hidden="true"><SpaIcon /></div>
      <div className="auth-card__header">
        <p>MY SPA Management</p>
        <h1>Chào mừng trở lại</h1>
        <span>Đăng nhập để quản lý lịch hẹn, bán hàng và vận hành spa.</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
        <Controller
          name="userName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Tên đăng nhập"
              placeholder="Nhập tên đăng nhập"
              error={!!errors.userName}
              helperText={errors.userName?.message}
              fullWidth
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon className="auth-field-icon" /></InputAdornment> } }}
              sx={darkInputSx}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              type={showPassword ? 'text' : 'password'}
              error={!!errors.password}
              helperText={errors.password?.message}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><LockIcon className="auth-field-icon" /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOffIcon className="auth-field-icon" /> : <VisibilityIcon className="auth-field-icon" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={darkInputSx}
            />
          )}
        />

        <div className="auth-form__row">
          <Controller
            name="rememberMe"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox {...field} checked={field.value ?? false} size="small" sx={{ color: 'rgba(255,255,255,0.35)', '&.Mui-checked': { color: '#D97706' } }} />}
                label={<span>Ghi nhớ đăng nhập</span>}
              />
            )}
          />
          <button type="button" onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}>Quên mật khẩu?</button>
        </div>

        <Button type="submit" variant="contained" fullWidth disabled={isLoading} className="auth-primary-button">
          {isLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Đăng nhập'}
        </Button>
      </form>

      <div className="auth-demo-note">
        Demo: <strong>admin</strong> / <strong>admin123</strong>
      </div>
    </section>
  );
};

export default LoginPage;
