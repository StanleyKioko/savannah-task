import { Helmet } from 'react-helmet-async';
import LoginForm from '@/components/auth/LoginForm';

const Login = () => {
  return (
    <>
      <Helmet>
        <title>Sign In - EStore | Login to Your Account</title>
        <meta name="description" content="Sign in to your EStore account to access your orders, wishlist, and more." />
      </Helmet>
      <div className="container-fluid py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Sign In</h1>
          <LoginForm />
        </div>
      </div>
    </>
  );
};

export default Login;