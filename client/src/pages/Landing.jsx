import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="logo">💊 PharmaStock</div>

        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/register" className="nav-button">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <p className="badge">SMART PHARMACY INVENTORY</p>

          <h1>
            Never dispense an
            <span> expired medicine.</span>
          </h1>

          <p className="hero-text">
            PharmaStock helps neighbourhood pharmacies manage medicine
            batches, follow FEFO dispensing, track expiry dates, and
            automatically identify stock that needs attention.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="primary-button">
              Start Managing Stock →
            </Link>

            <Link to="/login" className="secondary-button">
              Login
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-header">
            <span>Inventory Overview</span>
            <span className="status">● Live</span>
          </div>

          <div className="stock-number">1,248</div>
          <div className="stock-label">In-date units</div>

          <div className="mini-stats">
            <div>
              <strong>42</strong>
              <span>Medicines</span>
            </div>

            <div>
              <strong>7</strong>
              <span>Expiring soon</span>
            </div>

            <div>
              <strong>3</strong>
              <span>Reorder alerts</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="section-heading">
          <p className="badge">KEY FEATURES</p>
          <h2>Everything your pharmacy needs</h2>
          <p>
            Simple tools designed around real pharmacy inventory problems.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h3>Batch Management</h3>
            <p>
              Track every medicine batch with its quantity, batch number,
              manufacturer and expiry date.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>FEFO Dispensing</h3>
            <p>
              Automatically dispense from the batch with the earliest
              expiry date while avoiding expired stock.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚠️</div>
            <h3>Expiry Alerts</h3>
            <p>
              Quickly identify batches that are expired or approaching
              their expiry date.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Fast Search</h3>
            <p>
              Search medicines instantly and check whether in-date stock
              is available.
            </p>
          </div>
        </div>
      </section>

      <section className="audience">
        <div>
          <p className="badge">WHO IT'S FOR</p>
          <h2>Built for neighbourhood pharmacies.</h2>
          <p>
            PharmaStock is designed for pharmacy owners and staff who need
            a reliable way to keep track of medicine stock without
            complicated inventory software.
          </p>
        </div>

        <div className="audience-points">
          <div>✓ Know exactly what is in stock</div>
          <div>✓ Prevent expired medicines from being dispensed</div>
          <div>✓ Identify medicines that need reordering</div>
          <div>✓ Manage batches from one simple interface</div>
        </div>
      </section>

      <section className="future">
        <div className="section-heading">
          <p className="badge">NEXT FEATURES</p>
          <h2>What's coming next</h2>
        </div>

        <div className="future-grid">
          <div className="future-card">
            <span>01</span>
            <h3>Barcode Scanning</h3>
            <p>
              Scan medicine and batch barcodes to speed up inventory
              operations.
            </p>
          </div>

          <div className="future-card">
            <span>02</span>
            <h3>Supplier Management</h3>
            <p>
              Track suppliers, purchase orders and incoming medicine
              batches.
            </p>
          </div>

          <div className="future-card">
            <span>03</span>
            <h3>Demand Forecasting</h3>
            <p>
              Use historical inventory data to help predict future
              medicine requirements.
            </p>
          </div>
        </div>
      </section>

      <footer>
        <div>💊 PharmaStock</div>
        <p>Smart inventory management for neighbourhood pharmacies.</p>
      </footer>
    </div>
  );
}

export default Landing;