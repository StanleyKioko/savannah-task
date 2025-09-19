import { Helmet } from 'react-helmet-async';
import RegisterForm from '@/components/auth/RegisterForm';

const Register = () => {
  return (
    <>
      <Helmet>
        <title>Create Account - EStore | Join Us Today</title>
        <meta name="description" content="Create a new account on EStore to start shopping, save favorites, and track your orders." />
      </Helmet>
      <div className="container-fluid py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Create Account</h1>
          <RegisterForm />
        </div>
      </div>
    </>
  );
};

export default Register;