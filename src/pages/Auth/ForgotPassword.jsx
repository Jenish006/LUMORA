import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKeyhole,
  Mail,
  Sparkles,
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import './ForgotPassword.css';

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  /*
    STEP 1
    Send password reset code
  */
  const handleEmailSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      alert('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'http://localhost:5000/api/auth/forgot-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            'Unable to send verification code.'
        );
        return;
      }

      setStep(2);

    } catch (error) {
      console.error(
        'Forgot password error:',
        error
      );

      alert(
        'Unable to connect to the server. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  };


  /*
    STEP 2
    Verify reset code
  */
  const handleCodeSubmit = async (event) => {
    event.preventDefault();

    if (code.length !== 6) {
      alert(
        'Please enter the 6-digit verification code.'
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'http://localhost:5000/api/auth/verify-reset-code',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            'Invalid verification code.'
        );
        return;
      }

      setStep(3);

    } catch (error) {
      console.error(
        'Verify reset code error:',
        error
      );

      alert(
        'Unable to connect to the server. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  };


  /*
    STEP 3
    Reset password
  */
  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      alert(
        'Please fill in both password fields.'
      );
      return;
    }

    if (password.length < 6) {
      alert(
        'Password must contain at least 6 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      alert(
        'Passwords do not match.'
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'http://localhost:5000/api/auth/reset-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            code,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            'Unable to reset password.'
        );
        return;
      }

      setStep(4);

    } catch (error) {
      console.error(
        'Reset password error:',
        error
      );

      alert(
        'Unable to connect to the server. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  };


  /*
    RESEND CODE
  */
  const handleResendCode = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        'http://localhost:5000/api/auth/forgot-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            'Unable to resend verification code.'
        );
        return;
      }

      setCode('');

      alert(
        'A new verification code has been sent.'
      );

    } catch (error) {
      console.error(
        'Resend code error:',
        error
      );

      alert(
        'Unable to connect to the server. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  };


  /*
    GO TO LOGIN
  */
  const goToLogin = () => {
    navigate('/login');
  };


  return (
    <main className="forgot-page">

      <div className="forgot-background"></div>

      <div className="forgot-container">

        <Link
          to="/login"
          className="forgot-back"
        >
          <ArrowLeft
            size={15}
            strokeWidth={1.4}
          />

          Back to Sign In
        </Link>


        <div className="forgot-card">

          {/* BRAND */}

          <div className="forgot-brand">

            <span className="forgot-logo-mark">
              L
            </span>

            <span>
              LUMORA
            </span>

          </div>


          {/* STEP 1 */}

          {step === 1 && (
            <>
              <div className="forgot-heading">

                <div className="forgot-eyebrow">

                  <Sparkles
                    size={13}
                    strokeWidth={1.3}
                  />

                  ACCOUNT RECOVERY

                </div>


                <h1>
                  Forgot your
                  <span>password?</span>
                </h1>


                <p>
                  Enter the email address associated with
                  your Lumora account and we'll help you
                  regain access.
                </p>

              </div>


              <form
                className="forgot-form"
                onSubmit={handleEmailSubmit}
              >

                <div className="forgot-field">

                  <label>
                    EMAIL ADDRESS
                  </label>


                  <div className="forgot-input">

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
                      disabled={loading}
                    />

                  </div>

                </div>


                <button
                  type="submit"
                  className="forgot-submit"
                  disabled={loading}
                >
                  {loading
                    ? 'Sending...'
                    : 'Continue'}

                  {!loading && (
                    <ArrowRight
                      size={17}
                      strokeWidth={1.4}
                    />
                  )}

                </button>

              </form>
            </>
          )}


          {/* STEP 2 */}

          {step === 2 && (
            <>
              <div className="forgot-heading">

                <div className="forgot-eyebrow">

                  <Mail
                    size={13}
                    strokeWidth={1.3}
                  />

                  VERIFY YOUR EMAIL

                </div>


                <h1>
                  Check your
                  <span>inbox.</span>
                </h1>


                <p>
                  We've sent a 6-digit verification code to
                  <strong>{email}</strong>.
                </p>

              </div>


              <form
                className="forgot-form"
                onSubmit={handleCodeSubmit}
              >

                <div className="forgot-field">

                  <label>
                    VERIFICATION CODE
                  </label>


                  <input
                    className="verification-input"
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    placeholder="000000"
                    value={code}
                    onChange={(event) =>
                      setCode(
                        event.target.value.replace(
                          /\D/g,
                          ''
                        )
                      )
                    }
                    disabled={loading}
                  />

                </div>


                <button
                  type="submit"
                  className="forgot-submit"
                  disabled={loading}
                >
                  {loading
                    ? 'Verifying...'
                    : 'Verify Code'}

                  {!loading && (
                    <ArrowRight
                      size={17}
                      strokeWidth={1.4}
                    />
                  )}

                </button>


                <button
                  type="button"
                  className="resend-code"
                  onClick={handleResendCode}
                  disabled={loading}
                >
                  Didn't receive the code? Resend
                </button>

              </form>
            </>
          )}


          {/* STEP 3 */}

          {step === 3 && (
            <>
              <div className="forgot-heading">

                <div className="forgot-eyebrow">

                  <LockKeyhole
                    size={13}
                    strokeWidth={1.3}
                  />

                  CREATE NEW PASSWORD

                </div>


                <h1>
                  Make it
                  <span>secure.</span>
                </h1>


                <p>
                  Create a new password for your Lumora
                  account.
                </p>

              </div>


              <form
                className="forgot-form"
                onSubmit={handlePasswordSubmit}
              >

                <div className="forgot-field">

                  <label>
                    NEW PASSWORD
                  </label>


                  <div className="forgot-input">

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
                      placeholder="Create a password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      disabled={loading}
                    />


                    <button
                      type="button"
                      className="forgot-password-toggle"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      disabled={loading}
                    >
                      {showPassword
                        ? 'HIDE'
                        : 'SHOW'}
                    </button>

                  </div>

                </div>


                <div className="forgot-field">

                  <label>
                    CONFIRM PASSWORD
                  </label>


                  <div className="forgot-input">

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
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      disabled={loading}
                    />


                    <button
                      type="button"
                      className="forgot-password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      disabled={loading}
                    >
                      {showConfirmPassword
                        ? 'HIDE'
                        : 'SHOW'}
                    </button>

                  </div>

                </div>


                <div className="forgot-password-info">

                  <Check
                    size={13}
                    strokeWidth={1.5}
                  />

                  Password must contain at least 6 characters

                </div>


                <button
                  type="submit"
                  className="forgot-submit"
                  disabled={loading}
                >
                  {loading
                    ? 'Updating...'
                    : 'Reset Password'}

                  {!loading && (
                    <ArrowRight
                      size={17}
                      strokeWidth={1.4}
                    />
                  )}

                </button>

              </form>
            </>
          )}


          {/* STEP 4 */}

          {step === 4 && (
            <div className="forgot-success">

              <div className="forgot-success-icon">

                <Check
                  size={32}
                  strokeWidth={1.4}
                />

              </div>


              <div className="forgot-eyebrow">

                <Sparkles
                  size={13}
                  strokeWidth={1.3}
                />

                PASSWORD UPDATED

              </div>


              <h1>
                You're all
                <span>set.</span>
              </h1>


              <p>
                Your password has been successfully updated.
                You can now sign in to your Lumora account.
              </p>


              <button
                type="button"
                className="forgot-submit"
                onClick={goToLogin}
              >
                Continue to Sign In

                <ArrowRight
                  size={17}
                  strokeWidth={1.4}
                />

              </button>

            </div>
          )}


          {/* BOTTOM */}

          {step !== 4 && (
            <div className="forgot-login">

              <span>
                Remember your password?
              </span>


              <Link to="/login">

                Sign In

                <ArrowRight
                  size={15}
                  strokeWidth={1.4}
                />

              </Link>

            </div>
          )}

        </div>


        <p className="forgot-footer">
          © 2026 LUMORA · Exceptional dining experiences
        </p>

      </div>

    </main>
  );
}

export default ForgotPassword;