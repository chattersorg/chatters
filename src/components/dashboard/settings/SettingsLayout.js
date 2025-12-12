const SettingsLayout = ({ children }) => {
  return (
    <div className="flex gap-8">
      <aside className="w-48 border rounded-xl bg-white p-4">
        <ul className="space-y-2 text-sm font-medium">
          <li><Link to="/account/profile" className={isActive('/account/profile')}>Profile</Link></li>
          <li><Link to="/venue-settings/details" className={isActive('/venue-settings/details')}>Venue</Link></li>
          <li><Link to="/venue-settings/branding" className={isActive('/venue-settings/branding')}>Branding</Link></li>
          <li><Link to="/account/notifications" className={isActive('/account/notifications')}>Notifications</Link></li>
          <li><Link to="/staff" className={isActive('/staff')}>Staff</Link></li>
        </ul>
      </aside>

      <section className="flex-1">
        {children}
      </section>
    </div>
  );
};

const isActive = (path) =>
  window.location.pathname === path
    ? 'text-black font-semibold'
    : 'text-gray-500 hover:text-black';
