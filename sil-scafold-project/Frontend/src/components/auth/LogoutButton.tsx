import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonProps } from '@/components/ui/button';
import useAuthStore from '@/stores/authStore';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps extends ButtonProps {
  showIcon?: boolean;
  redirectTo?: string;
}

const LogoutButton = React.forwardRef<HTMLButtonElement, LogoutButtonProps>(({
  showIcon = true,
  redirectTo = '/',
  children,
  ...props
}, ref) => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      navigate(redirectTo);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Button ref={ref} onClick={handleLogout} {...props}>
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {children || 'Sign Out'}
    </Button>
  );
});

LogoutButton.displayName = 'LogoutButton';

export default LogoutButton;