import { Menu, X, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [user] = useState(() => {
    const savedUser = localStorage.getItem('lumoraUser');

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-mark">L</span>
          <span className="logo-name">LUMORA</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar-links">
          <a href="/#discover">Discover</a>
          <a href="/#experiences">Experiences</a>
          <a href="/#about">About</a>
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">

          {/* Account / Sign In */}
          <Link
            to={user ? '/account' : '/login'}
            className="login-button"
          >
            <UserRound
              size={16}
              strokeWidth={1.5}
            />

            <span>
              {user ? 'My Account' : 'Sign In'}
            </span>
          </Link>

          {/* Reserve */}
          <Link
            to="/reserve"
            className="reserve-button"
          >
            Reserve a Table
          </Link>

        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <X size={24} strokeWidth={1.4} />
          ) : (
            <Menu size={24} strokeWidth={1.4} />
          )}
        </button>

      </div>

      {/* Mobile Navigation */}
      <div
        className={`mobile-menu ${
          menuOpen ? 'open' : ''
        }`}
      >

        <a
          href="/#discover"
          onClick={closeMenu}
        >
          Discover
        </a>

        <a
          href="/#experiences"
          onClick={closeMenu}
        >
          Experiences
        </a>

        <a
          href="/#about"
          onClick={closeMenu}
        >
          About
        </a>

        {/* Mobile Account */}
        <Link
          to={user ? '/account' : '/login'}
          className="mobile-signin"
          onClick={closeMenu}
        >
          <UserRound
            size={16}
            strokeWidth={1.4}
          />

          {user ? 'My Account' : 'Sign In'}
        </Link>

        {/* Mobile Reserve */}
        <Link
          to="/reserve"
          className="mobile-reserve"
          onClick={closeMenu}
        >
          Reserve a Table
        </Link>

      </div>
    </header>
  );
}

export default Navbar;