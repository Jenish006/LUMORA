import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  LockKeyhole,
  Mail,
  Sparkles,
  X,
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import './Login.css';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  /*
  ==================================================
  ERROR MODAL
  ==================================================
  */

  const [errorModal, setErrorModal] = useState({
    open: false,
    title: '',
    message: '',
  });

  /*
  ==================================================
  SHOW ERROR MODAL
  ==================================================
  */

  const showErrorModal = (
    message,
    title = 'Unable to sign in'
  ) => {
    setErrorModal({
      open: true,
      title,
      message,
    });
  };

  /*
  ==================================================
  CLOSE ERROR MODAL
  ==================================================
  */

  const closeErrorModal = () => {
    setErrorModal({
      open: false,
      title: '',
      message: '',
    });
  };

  /*
  ==================================================
  LOGIN
  ==================================================
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    /*
    ----------------------------------------------
    FRONTEND VALIDATION
    ----------------------------------------------
    */

    if (!email || !password) {
      showErrorModal(
        'Please enter your email and password.',
        'Missing information'
      );
      return;
    }

    try {
      /*
      ----------------------------------------------
      SEND LOGIN REQUEST
      ----------------------------------------------
      */

      const response = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',

          credentials: 'include',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      /*
      ----------------------------------------------
      READ SERVER RESPONSE
      ----------------------------------------------
      */

      const data = await response.json();

      /*
      ----------------------------------------------
      LOGIN FAILED
      ----------------------------------------------
      */

      if (!response.ok || !data.success) {
        /*
        401:
        Invalid email/password

        429:
        Account temporarily locked
        */

        showErrorModal(
          data.message ||
            'Invalid email or password. Please try again.',
          response.status === 429
            ? 'Account temporarily locked'
            : 'Unable to sign in'
        );

        return;
      }

      /*
      ----------------------------------------------
      SAVE USER
      ----------------------------------------------
      */

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

      /*
      ----------------------------------------------
      ADMIN → ADMIN DASHBOARD
      CUSTOMER → LUMORA HOME
      ----------------------------------------------
      */

      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error(
        'Login error:',
        error
      );

      showErrorModal(
        'Unable to connect to the LUMORA server. Please check your connection and try again.',
        'Connection error'
      );
    }
  };

  /*
  ==================================================
  UI
  ==================================================
  */

  return (
    <main className="auth-page">

      <div className="auth-background"></div>

      <div className="auth-container">

        {/* BACK TO HOME */}

        <Link
          to="/"
          className="auth-back"
        >
          <ArrowLeft
            size={15}
            strokeWidth={1.4}
          />

          Back to Lumora
        </Link>


        {/* AUTH CARD */}

        <div className="auth-card">

          {/* BRAND */}

          <div className="auth-brand">

            <span className="auth-logo-mark">
              L
            </span>

            <span>
              LUMORA
            </span>

          </div>


          {/* HEADING */}

          <div className="auth-heading">

            <div className="auth-eyebrow">

              <Sparkles
                size={13}
                strokeWidth={1.3}
              />

              WELCOME BACK

            </div>


            <h1>
              Continue your
              <span>
                journey.
              </span>
            </h1>


            <p>
              Sign in to manage your reservations and
              discover exceptional dining experiences.
            </p>

          </div>


          {/* LOGIN FORM */}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >

            {/* EMAIL */}

            <div className="auth-field">

              <label>
                EMAIL ADDRESS
              </label>

              <div className="auth-input">

                <Mail
                  size={17}
                  strokeWidth={1.3}
                />

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="auth-field">

              <div className="auth-label-row">

                <label>
                  PASSWORD
                </label>

                <Link to="/forgot-password">
                  Forgot password?
                </Link>

              </div>


              <div className="auth-input">

                <LockKeyhole
                  size={17}
                  strokeWidth={1.3}
                />

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                />


                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? 'HIDE'
                    : 'SHOW'}
                </button>

              </div>

            </div>


            {/* SIGN IN */}

            <button
              type="submit"
              className="auth-submit"
            >

              Sign In

              <ArrowRight
                size={17}
                strokeWidth={1.4}
              />

            </button>

          </form>


          {/* DIVIDER */}

          <div className="auth-divider">

            <span>
              OR
            </span>

          </div>


          {/* SIGN UP */}

          <div className="auth-signup">

            <span>
              New to Lumora?
            </span>

            <Link to="/register">

              Create an account

              <ArrowRight
                size={15}
                strokeWidth={1.4}
              />

            </Link>

          </div>

        </div>


        {/* FOOTER */}

        <p className="auth-footer">
          © 2026 LUMORA · Exceptional dining experiences
        </p>

      </div>


      {/* ==================================================
          PROFESSIONAL ERROR MODAL
          ================================================== */}

      {errorModal.open && (

        <div
          className="lumora-error-overlay"
          onClick={closeErrorModal}
        >

          <div
            className="lumora-error-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* CLOSE */}

            <button
              type="button"
              className="lumora-error-close"
              onClick={closeErrorModal}
              aria-label="Close"
            >
              <X
                size={18}
              />
            </button>


            {/* ERROR ICON */}

            <div className="lumora-error-icon">

              <AlertTriangle
                size={28}
                strokeWidth={1.7}
              />

            </div>


            {/* TITLE */}

            <h3>
              {errorModal.title}
            </h3>


            {/* MESSAGE */}

            <p>
              {errorModal.message}
            </p>


            {/* OK */}

            <button
              type="button"
              className="lumora-error-button"
              onClick={closeErrorModal}
            >
              OK
            </button>

          </div>

        </div>

      )}

    </main>
  );
}

export default Login;