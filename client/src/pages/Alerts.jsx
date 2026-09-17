import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

function Alerts() {
  const navigate = useNavigate();

  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAlerts() {
    try {
      setLoading(true);
      setError("");

      const [expiryData, outboxData] =
        await Promise.all([
          apiRequest("/alerts/expiring"),
          apiRequest("/outbox"),
        ]);

      const expiryList =
        expiryData.batches ||
        expiryData.alerts ||
        expiryData.data ||
        [];

      const outboxList =
        outboxData.events ||
        outboxData.outbox ||
        outboxData.data ||
        [];

      setExpiryAlerts(
        Array.isArray(expiryList)
          ? expiryList
          : []
      );

      setReorderAlerts(
        Array.isArray(outboxList)
          ? outboxList.filter(
              (event) =>
                event.type === "REORDER_ALERT"
            )
          : []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  async function runDailyCheck() {
    try {
      setClockLoading(true);
      setError("");
      setMessage("");

      const data = await apiRequest("/clock", {
        method: "POST",
        body: JSON.stringify({
          date: new Date()
            .toISOString()
            .split("T")[0],
        }),
      });

      setMessage(
        `Daily check completed. ${
          data.expiredQuarantined ?? 0
        } expired batch(es) quarantined and ${
          data.expiringWithin7Days ?? 0
        } batch(es) expiring within 7 days.`
      );

      await loadAlerts();
    } catch (err) {
      setError(err.message);
    } finally {
      setClockLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function daysUntilExpiry(date) {
    const today = new Date();
    const expiry = new Date(date);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    return Math.ceil(
      (expiry - today) /
        (1000 * 60 * 60 * 24)
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          💊 PharmaStock
        </div>

        <nav>
          <Link to="/dashboard">
            🏠 Dashboard
          </Link>

          <Link to="/medicines">
            📦 Medicines
          </Link>

          <Link to="/alerts" className="active">
            ⚠️ Alerts
          </Link>
        </nav>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="small-label">
              INVENTORY ALERTS
            </p>

            <h1>Alerts</h1>

            <p className="muted">
              Monitor expiry and low-stock events.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={runDailyCheck}
            disabled={clockLoading}
          >
            {clockLoading
              ? "Running..."
              : "⏱ Run Daily Check"}
          </button>
        </header>

        {message && (
          <div className="success-box">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-box">
            Loading alerts...
          </div>
        ) : (
          <>
            <section className="dashboard-section">
              <div className="section-title-row">
                <div>
                  <h2>Expiry Alerts</h2>
                  <p>
                    Batches that are expired or
                    approaching expiry.
                  </p>
                </div>

                <span className="alert-count">
                  {expiryAlerts.length} alerts
                </span>
              </div>

              {expiryAlerts.length === 0 ? (
                <div className="empty-box">
                  <div className="empty-icon">
                    ✓
                  </div>

                  <h3>No expiry alerts</h3>

                  <p>
                    There are currently no batches
                    requiring attention.
                  </p>
                </div>
              ) : (
                <div className="alert-list">
                  {expiryAlerts.map((batch) => {
                    const days = daysUntilExpiry(
                      batch.expiryDate
                    );

                    const expired =
                      days < 0 ||
                      batch.quarantined;

                    return (
                      <div
                        className="alert-card"
                        key={batch.id}
                      >
                        <div className="alert-card-icon">
                          {expired ? "🚫" : "⚠️"}
                        </div>

                        <div className="alert-card-content">
                          <div className="alert-card-header">
                            <h3>
                              {batch.medicine?.name ||
                                batch.medicineName ||
                                "Medicine"}
                            </h3>

                            <span
                              className={
                                expired
                                  ? "status-danger"
                                  : "status-warning"
                              }
                            >
                              {batch.quarantined
                                ? "Quarantined"
                                : expired
                                ? "Expired"
                                : `${days} day${
                                    days === 1
                                      ? ""
                                      : "s"
                                  } left`}
                            </span>
                          </div>

                          <p>
                            Batch:{" "}
                            <strong>
                              {batch.batchNumber}
                            </strong>
                          </p>

                          <p>
                            Expiry:{" "}
                            <strong>
                              {formatDate(
                                batch.expiryDate
                              )}
                            </strong>
                          </p>

                          <p>
                            Quantity:{" "}
                            <strong>
                              {batch.quantity} units
                            </strong>
                          </p>
                        </div>

                        {batch.medicineId && (
                          <Link
                            to={`/medicines/${batch.medicineId}`}
                            className="view-link"
                          >
                            View Medicine →
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="dashboard-section">
              <div className="section-title-row">
                <div>
                  <h2>Reorder Alerts</h2>

                  <p>
                    Notifications generated when
                    in-date stock falls below the
                    reorder threshold.
                  </p>
                </div>

                <span className="alert-count">
                  {reorderAlerts.length} alerts
                </span>
              </div>

              {reorderAlerts.length === 0 ? (
                <div className="empty-box">
                  <div className="empty-icon">
                    ✓
                  </div>

                  <h3>No reorder alerts</h3>

                  <p>
                    No medicine has triggered a
                    reorder notification yet.
                  </p>
                </div>
              ) : (
                <div className="alert-list">
                  {reorderAlerts.map((event) => (
                    <div
                      className="alert-card reorder"
                      key={event.id}
                    >
                      <div className="alert-card-icon">
                        🔔
                      </div>

                      <div className="alert-card-content">
                        <div className="alert-card-header">
                          <h3>
                            Reorder Required
                          </h3>

                          <span className="status-warning">
                            {event.sent
                              ? "Sent"
                              : "Pending"}
                          </span>
                        </div>

                        <p>
                          {event.message}
                        </p>

                        <small>
                          Created:{" "}
                          {formatDate(
                            event.createdAt
                          )}
                        </small>
                      </div>

                      {event.medicineId && (
                        <Link
                          to={`/medicines/${event.medicineId}`}
                          className="view-link"
                        >
                          View Medicine →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="automation-card">
              <div className="automation-icon">
                ⏱️
              </div>

              <div>
                <h2>Daily Inventory Automation</h2>

                <p>
                  The daily clock job checks medicine
                  batches, quarantines expired stock,
                  and reports batches expiring within
                  the next 7 days.
                </p>

                <div className="automation-flow">
                  <span>Daily Clock</span>
                  <span>→</span>
                  <span>Check Expiry</span>
                  <span>→</span>
                  <span>Quarantine Expired</span>
                  <span>→</span>
                  <span>Report</span>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Alerts;