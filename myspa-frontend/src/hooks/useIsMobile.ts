import useMediaQuery from '@mui/material/useMediaQuery';

// Nguong dung chung cho toan bo app: duoi 768px la mobile (khop voi layout khung Sidebar/Header).
export const MOBILE_BREAKPOINT = '(max-width:768px)';

export const useIsMobile = () => useMediaQuery(MOBILE_BREAKPOINT);

export default useIsMobile;
