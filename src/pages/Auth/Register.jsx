import { API_BASE_URL } from '../../api';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import './Register.css';

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      alert('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      alert('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || 'Registration failed.');
        return;
      }

      localStorage.setItem(
        'lumoraUser',
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          loggedIn: true,
        })
      );

      alert('Account created successfully!');

      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Unable to connect to LUMORA server.');
    }
  };

  return (
    <main className="register-page">
      <div className="register-background"></div>

      <div className="register-container">

        <Link to="/" className="register-back">
          <ArrowLeft size={15} strokeWidth={1.4} />
          Back to Lumora
        </Link>

        <div className="register-card">

          {/* BRAND */}
          <div className="register-brand">
            <span className="register-logo-mark">L</span>
            <span>LUMORA</span>
          </div>

          {/* HEADING */}
          <div className="register-heading">

            <div className="register-eyebrow">
              <Sparkles size={13} strokeWidth={1.3} />
              CREATE YOUR ACCOUNT
            </div>

            <h1>
              Begin your
              <span>experience.</span>
            </h1>

            <p>
              Create your Lumora account to reserve tables,
              manage your bookings, and discover exceptional dining.
            </p>

          </div>

          {/* FORM */}
          <form
            className="register-form"
            onSubmit={handleSubmit}
          >

            {/* NAME */}
            <div className="register-field">

              <label>FULL NAME</label>

              <div className="register-input">

                <UserRound
                  size={17}
                  strokeWidth={1.3}
                />

                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                />

              </div>

            </div>

            {/* EMAIL */}
            <div className="register-field">

              <label>EMAIL ADDRESS</label>

              <div className="register-input">

                <Mail
                  size={17}
                  strokeWidth={1.3}
                />

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div className="register-field">

              <label>PASSWORD</label>

              <div className="register-input">

                <LockKeyhole
                  size={17}
                  strokeWidth={1.3}
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}
            <div className="register-field">

              <label>CONFIRM PASSWORD</label>

              <div className="register-input">

                <LockKeyhole
                  size={17}
                  strokeWidth={1.3}
                />

                <input
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword ? 'HIDE' : 'SHOW'}
                </button>

              </div>

            </div>

            {/* PASSWORD INFO */}
            <div className="register-password-info">

              <div>
                <Check size={13} strokeWidth={1.5} />
                <span>At least 6 characters</span>
              </div>

              <div>
                <Check size={13} strokeWidth={1.5} />
                <span>Passwords must match</span>
              </div>

            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="register-submit"
            >
              Create Account
              <ArrowRight
                size={17}
                strokeWidth={1.4}
              />
            </button>

          </form>

          {/* DIVIDER */}
          <div className="register-divider">
            <span>ALREADY A MEMBER?</span>
          </div>

          {/* LOGIN */}
          <div className="register-login">

            <span>Already have a Lumora account?</span>

            <Link to="/login">
              Sign In
              <ArrowRight
                size={15}
                strokeWidth={1.4}
              />
            </Link>

          </div>

        </div>

        <p className="register-footer">
          © 2026 LUMORA · Exceptional dining experiences
        </p>

      </div>
    </main>
  );
}

export default Register;