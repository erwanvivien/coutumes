'use client';

import { accountUrl } from '@/lib/urls';
import { LoaderCircle, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import stylesheet from './page.module.css';

const LogoutPage: React.FC = () => {
  const [showLogoutNow, setShowLogoutNow] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowLogoutNow(true);
    }, 1500);
  }, []);

  useEffect(() => {
    void signOut({ redirectTo: accountUrl() });
  }, []);

  return (
    <div className={stylesheet.container}>
      <LoaderCircle className={stylesheet.spinner} />
      {showLogoutNow && (
        <button
          type="submit"
          className={stylesheet.providerButton}
          onClick={() => void signOut({ redirectTo: accountUrl() })}
        >
          <LogOut size={18} />
          Log out now
        </button>
      )}
    </div>
  );
};

export default LogoutPage;
