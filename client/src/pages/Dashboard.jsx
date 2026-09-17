import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

function Dashboard() {
  const [medicines, setMedicines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function loadDashboard() {
    try {
      setLoading(true);

      const medicineData = await apiRequest("/medicines?page=1&limit=100");

      const medicineList =
        medicineData.medicines ||
        medicineData.data ||
        medicineData ||
        [];

      setMedicines(Array.isArray(medicineList) ? medicineList : []);

      try {
        const alertData = await apiRequest("/alerts/expiring");
        const alertList =
          alertData.batches ||
          alertData.alerts ||
          alertData.data ||
          alertData ||
          [];

        setAlerts(Array.isArray(alertList) ? alertList : []);
      } catch {
        setAlerts([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const totalMedicines = medicines.length;

  const totalStock = medicines.reduce(
    (sum, medicine) =>
      sum +
      Number(
        medicine.sellableStock ??
          medicine.totalStock ??
          medicine.stock ??
          0
      ),
    0
  );

  const lowStockCount = medicines.filter(
    (medicine) =>
      Number(medicine.reorderThreshold || 0) > 0 &&
      Number(
        medicine.sellableStock ??
          medicine.totalStock ??
          medicine.stock ??
          0
      ) < Number(medicine.reorderThreshold)
  ).length;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">💊 PharmaStock</div>

        <nav>
          <Link to="/dashboard" className="active">
            🏠 Dashboard
          </Link>

          <Link to="/medicines">
            📦 Medicines
          </Link>

          <Link to="/alerts">
            ⚠️ Alerts
          </Link>
        </nav>

        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="small-label">PHARMACY INVENTORY</p>
            <h1>Dashboard</h1>
            <p className="muted">
              Monitor your medicine stock and expiry status.
            </p>
          </div>

          <Link to="/medicines" className="primary-button">
            + Manage Medicines
          </Link>
        </header>

        {loading ? (
          <div className="loading-box">Loading dashboard...</div>
        ) : (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">💊</div>
                <div>
                  <p>Total Medicines</p>
                  <h2>{totalMedicines}</h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div>
                  <p>In-date Stock</p>
                  <h2>{totalStock}</h2>
                  <span>units available</span>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">⚠️</div>
                <div>
                  <p>Expiring Soon</p>
                  <h2>{alerts.length}</h2>
                  <span>batch alerts</span>
                </div>
              </div>

              <div className="stat-card danger">
                <div className="stat-icon">🔔</div>
                <div>
                  <p>Low Stock</p>
                  <h2>{lowStockCount}</h2>
                  <span>need attention</span>
                </div>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-title-row">
                <div>
                  <h2>Medicine Inventory</h2>
                  <p>Current in-date stock</p>
                </div>

                <Link to="/medicines">View all →</Link>
              </div>

              {medicines.length === 0 ? (
                <div className="empty-box">
                  <h3>No medicines yet</h3>
                  <p>Add your first medicine to start managing inventory.</p>

                  <Link to="/medicines" className="primary-button">
                    Add Medicine
                  </Link>
                </div>
              ) : (
                <div className="medicine-table-wrapper">
                  <table className="medicine-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Manufacturer</th>
                        <th>In-date Stock</th>
                        <th>Reorder Threshold</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {medicines.slice(0, 8).map((medicine) => {
                        const stock = Number(
                          medicine.sellableStock ??
                            medicine.totalStock ??
                            medicine.stock ??
                            0
                        );

                        const threshold = Number(
                          medicine.reorderThreshold || 0
                        );

                        return (
                          <tr key={medicine.id}>
                            <td>
                              <strong>{medicine.name}</strong>

                              {medicine.genericName && (
                                <small>{medicine.genericName}</small>
                              )}
                            </td>

                            <td>
                              {medicine.manufacturer || "—"}
                            </td>

                            <td>
                              <span
                                className={
                                  threshold > 0 && stock < threshold
                                    ? "stock-low"
                                    : "stock-good"
                                }
                              >
                                {stock} units
                              </span>
                            </td>

                            <td>{threshold} units</td>

                            <td>
                              <Link
                                to={`/medicines/${medicine.id}`}
                                className="view-link"
                              >
                                View →
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="quick-actions">
              <h2>Quick Actions</h2>

              <div className="quick-grid">
                <Link to="/medicines" className="quick-card">
                  <span>📦</span>
                  <div>
                    <h3>Manage Medicines</h3>
                    <p>Search and manage your inventory.</p>
                  </div>
                </Link>

                <Link to="/alerts" className="quick-card">
                  <span>⚠️</span>
                  <div>
                    <h3>View Alerts</h3>
                    <p>Check batches approaching expiry.</p>
                  </div>
                </Link>

                <Link to="/medicines" className="quick-card">
                  <span>🔄</span>
                  <div>
                    <h3>Dispense Stock</h3>
                    <p>Use FEFO to dispense medicines.</p>
                  </div>
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;