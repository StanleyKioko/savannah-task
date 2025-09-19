import { Helmet } from 'react-helmet-async';
import UserProfile from '@/components/auth/UserProfile';

const Profile = () => {
  return (
    <>
      <Helmet>
        <title>My Profile - EStore</title>
        <meta name="description" content="View and manage your EStore account." />
      </Helmet>
      <div className="container-fluid py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">My Profile</h1>
          <UserProfile />
        </div>
      </div>
    </>
  );
};

export default Profile;