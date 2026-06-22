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

const schema = z.object({
  userName: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = React.useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      userName: '',
      password: '',
      rememberMe: false,
    },
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
    <div
      className="animate-fadeInUp"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 36px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px' }}>
          Chào mừng trở lại
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          Đăng nhập để quản lý hệ thống MY SPA
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                size="medium"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                    '&:hover fieldset': { borderColor: 'rgba(217,119,6,0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#D97706' },
                    '& input::placeholder': { color: 'rgba(255,255,255,0.3)' },
                    '& input': { color: '#fff' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#F59E0B' },
                  '& .MuiFormHelperText-root': { color: '#EF4444' },
                }}
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
                size="medium"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword 
                            ? <VisibilityOffIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} /> 
                            : <VisibilityIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
                          }
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                    '&:hover fieldset': { borderColor: 'rgba(217,119,6,0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#D97706' },
                    '& input': { color: '#fff' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#F59E0B' },
                  '& .MuiFormHelperText-root': { color: '#EF4444' },
                }}
              />
            )}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value ?? false}
                      size="small"
                      sx={{
                        color: 'rgba(255,255,255,0.3)',
                        '&.Mui-checked': { color: '#D97706' },
                      }}
                    />
                  }
                  label={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13.5 }}>Ghi nhớ đăng nhập</span>}
                />
              )}
            />
            <button
              type="button"
              onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
              style={{ color: '#F59E0B', fontSize: 13.5, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Quên mật khẩu?
            </button>
          </div>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
            sx={{
              background: 'linear-gradient(135deg, #D97706, #F59E0B)',
              borderRadius: '12px',
              py: 1.4,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'inherit',
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(217,119,6,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #B45309, #D97706)',
                boxShadow: '0 6px 20px rgba(217,119,6,0.5)',
                transform: 'translateY(-1px)',
              },
              '&:active': { transform: 'translateY(0)' },
              transition: 'all var(--transition-base)',
              '&.Mui-disabled': { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
            }}
          >
            {isLoading ? (
              <CircularProgress size={20} sx={{ color: '#fff' }} />
            ) : 'Đăng nhập'}
          </Button>
        </div>
      </form>

      {/* Demo hint */}
      <div style={{
        marginTop: 24,
        padding: '12px 16px',
        background: 'rgba(217,119,6,0.08)',
        border: '1px solid rgba(217,119,6,0.2)',
        borderRadius: '10px',
        fontSize: 12.5,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
      }}>
        Demo: <strong style={{ color: '#F59E0B' }}>admin</strong> / <strong style={{ color: '#F59E0B' }}>admin123</strong>
      </div>
    </div>
  );
};

export default LoginPage;
