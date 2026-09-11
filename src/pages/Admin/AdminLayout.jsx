import { useState } from 'react';
import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Utensils,
  CreditCard,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

import './Admin.css';

const AdminLayout = () => {
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const savedUser = JSON.parse(
    localStorage.getItem('lumoraUser') || 'null'
  );

  const handleLogout = async () => {
    try {
      await fetch(
        'http://localhost:5000/api/auth/logout',
        {
          method: 'POST',
          credentials: 'include',
        }
      );
    } catch (error) {
      console.error(
        'Admin logout error:',
        error
      );
    }

    localStorage.removeItem('lumoraUser');
    localStorage.removeItem('lumoraBooking');

    navigate('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
      end: true,
    },
    {
      label: 'Bookings',
      path: '/admin/bookings',
      icon: CalendarDays,
    },
    {
      label: 'Users',
      path: '/admin/users',
      icon: Users,
    },
    {
      label: 'Restaurants',
      path: '/admin/restaurants',
      icon: Utensils,
    },
    {
      label: 'Payments',
      path: '/admin/payments',
      icon: CreditCard,
    },
  ];

  return (
    <div className="admin-shell">

      {/* MOBILE HEADER */}
      <header className="admin-mobile-header">
        <div className="admin-brand">
          <span>LUMORA</span>
          <small>ADMIN</small>
        </div>

        <button
          type="button"
          className="admin-menu-button"
          onClick={() =>
            setMobileMenuOpen(
              !mobileMenuOpen
            )
          }
        >
          {mobileMenuOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>
      </header>

      {/* SIDEBAR */}
      <aside
        className={`admin-sidebar ${
          mobileMenuOpen
            ? 'admin-sidebar-open'
            : ''
        }`}
      >

        {/* SIDEBAR BRAND */}
        <div className="admin-sidebar-brand">
          <div className="admin-logo">
            LUMORA
          </div>

          <div className="admin-logo-subtitle">
            ADMIN PANEL
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="admin-navigation">

          <div className="admin-nav-label">
            MANAGEMENT
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `admin-nav-link ${
                    isActive
                      ? 'admin-nav-link-active'
                      : ''
                  }`
                }
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                <Icon size={19} />

                <span>
                  {item.label}
                </span>
              </NavLink>
            );
          })}

        </nav>

        {/* SIDEBAR BOTTOM */}
        <div className="admin-sidebar-bottom">

          {/* ADMIN USER */}
          <div className="admin-user-box">

            <div className="admin-user-avatar">
              {savedUser?.name
                ? savedUser.name
                    .charAt(0)
                    .toUpperCase()
                : 'A'}
            </div>

            <div className="admin-user-info">
              <strong>
                {savedUser?.name ||
                  'Administrator'}
              </strong>

              <span>
                Administrator
              </span>
            </div>

          </div>

          {/* LOGOUT */}
          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={18} />

            <span>
              Logout
            </span>
          </button>

        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="admin-main">

        {/* TOP BAR */}
        <header className="admin-topbar">

          <div>
            <span className="admin-topbar-label">
              LUMORA
            </span>

            <h1>
              Administration
            </h1>
          </div>

          {/* TOP BAR USER */}
          <div className="admin-topbar-user">

            <div className="admin-user-avatar">
              {savedUser?.name
                ? savedUser.name
                    .charAt(0)
                    .toUpperCase()
                : 'A'}
            </div>

            <div>
              <strong>
                {savedUser?.name ||
                  'Administrator'}
              </strong>

              <span>
                ADMIN
              </span>
            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}
        <section className="admin-content">
          <Outlet />
        </section>

      </main>

    </div>
  );
};

export default AdminLayout;