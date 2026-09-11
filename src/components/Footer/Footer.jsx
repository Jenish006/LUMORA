import './Footer.css';


function Footer() {
  return (
    <footer className="footer">
      <div className="container">

        <div className="footer-top">

          <div className="footer-brand">
            <a href="/" className="footer-logo">
              <span className="footer-logo-mark">L</span>
              <span>LUMORA</span>
            </a>

            <p>
              Exceptional dining experiences,
              thoughtfully brought together.
            </p>
          </div>

          <div className="footer-column">
            <h4>DISCOVER</h4>
            <a href="#discover">Restaurants</a>
            <a href="#experiences">Experiences</a>
            <a href="#ai-assistant">AI Assistant</a>
          </div>

          <div className="footer-column">
            <h4>COMPANY</h4>
            <a href="#about">About Lumora</a>
            <a href="#">Contact</a>
            <a href="#">Careers</a>
          </div>

          <div className="footer-column">
            <h4>SUPPORT</h4>
            <a href="#">Help Center</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>

        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <p>© 2026 LUMORA. All rights reserved.</p>

          <a href="#home" className="back-to-top">
            Back to top ↑
          </a>
        </div>

      </div>
    </footer>
  );
}

export default Footer;