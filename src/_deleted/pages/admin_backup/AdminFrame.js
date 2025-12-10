// /pages/admin/AdminFrame.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { supabase } from '../../utils/supabase';

const AdminFrame = ({ children }) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ email: '', role: null });
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        navigate('/signin', { replace: true });
        return;
      }

      const email = (user.email || '').toLowerCase();
      const { data: userRow, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!mounted) return;

      const role = userRow?.role ?? null;
      const isAdminByRole = role === 'admin';
      const isAdminByDomain = email.endsWith('@getchatters.com');

      if (!isAdminByRole && !isAdminByDomain) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setUserInfo({ email, role: role || (isAdminByDomain ? 'admin' : null) });
      setLoading(false);
    };

    fetchUser();
    return () => { mounted = false; };
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/signin', { replace: true });
  };

  if (loading) {
    return <div className="p-6">Loading admin…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-lg font-bold text-gray-800">
            Chatters Admin Center
          </div>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(prev => !prev)}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.email || 'A')}`}
                className="w-8 h-8 rounded-full border"
                alt="avatar"
              />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-10 bg-white border rounded shadow w-56 z-50">
                <div className="px-4 py-3 text-sm text-gray-700 border-b">
                  <div className="font-medium">{userInfo.email}</div>
                  <div className="text-xs text-gray-500">{userInfo.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="inline-block w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

export default AdminFrame;
