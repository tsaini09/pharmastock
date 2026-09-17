import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api";
import BatchImport from "../components/BatchImport";
function MedicineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showBatchForm, setShowBatchForm] = useState(false);
  const [showDispenseForm, setShowDispenseForm] = useState(false);

  const [batchForm, setBatchForm] = useState({
    batchNumber: "",
    quantity: "",
    expiryDate: "",
  });

  const [dispenseQuantity, setDispenseQuantity] = useState("");

  async function loadMedicine() {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(`/medicines/${id}`);

      setMedicine(data.medicine || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedicine();
  }, [id]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  function handleBatchChange(event) {
    const { name, value } = event.target;

    setBatchForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function addBatch(event) {
    event.preventDefault();

    try {
      await apiRequest(`/medicines/${id}/batches`, {
        method: "POST",
        body: JSON.stringify({
          batchNumber: batchForm.batchNumber,
          quantity: Number(batchForm.quantity),
          expiryDate: batchForm.expiryDate,
        }),
      });

      setBatchForm({
        batchNumber: "",
        quantity: "",
        expiryDate: "",
      });

      setShowBatchForm(false);
      await loadMedicine();
    } catch (err) {
      setError(err.message);
    }
  }

  async function dispense() {
    const quantity = Number(dispenseQuantity);

    if (!quantity || quantity <= 0) {
      setError("Enter a valid quantity.");
      return;
    }

    try {
      setError("");

      await apiRequest("/dispense", {
        method: "POST",
        body: JSON.stringify({
          medicineId: Number(id),
          quantity,
        }),
      });

      setDispenseQuantity("");
      setShowDispenseForm(false);

      await loadMedicine();
    } catch (err) {
      setError(err.message);
    }
  }

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getBatchStatus(batch) {
    if (batch.quarantined) {
      return {
        text: "Quarantined",
        className: "status-danger",
      };
    }

    const today = new Date();
    const expiry = new Date(batch.expiryDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    if (expiry < today) {
      return {
        text: "Expired",
        className: "status-danger",
      };
    }

    const days =
      Math.ceil(
        (expiry - today) /
          (1000 * 60 * 60 * 24)
      );

    if (days <= 7) {
      return {
        text: "Expiring soon",
        className: "status-warning",
      };
    }

    return {
      text: "In date",
      className: "status-good",
    };
  }

  if (loading) {
    return (
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            💊 PharmaStock
          </div>
        </aside>

        <main className="dashboard-main">
          <div className="loading-box">
            Loading medicine...
          </div>
        </main>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="app-layout">
        <main className="dashboard-main">
          <div className="error-box">
            {error || "Medicine not found."}
          </div>

          <Link
            to="/medicines"
            className="primary-button"
          >
            ← Back to Medicines
          </Link>
        </main>
      </div>
    );
  }

  const batches = Array.isArray(medicine.batches)
    ? medicine.batches
    : [];

  const stock = Number(
    medicine.sellableStock ??
      medicine.totalStock ??
      medicine.stock ??
      0
  );

  const threshold = Number(
    medicine.reorderThreshold || 0
  );

  const isLowStock =
    threshold > 0 && stock < threshold;

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

          <Link to="/medicines" className="active">
            📦 Medicines
          </Link>

          <Link to="/alerts">
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
        <div className="breadcrumb">
          <Link to="/medicines">
            Medicines
          </Link>

          <span>/</span>

          <span>{medicine.name}</span>
        </div>

        <header className="details-header">
          <div>
            <p className="small-label">
              MEDICINE DETAILS
            </p>

            <h1>{medicine.name}</h1>

            {medicine.genericName && (
              <p className="muted">
                {medicine.genericName}
              </p>
            )}

            {medicine.manufacturer && (
              <p className="manufacturer">
                Manufacturer:{" "}
                {medicine.manufacturer}
              </p>
            )}
          </div>

          <div className="header-actions">
            <button
              className="secondary-button"
              onClick={() =>
                setShowBatchForm(true)
              }
            >
              + Add Batch
            </button>

            <button
              className="primary-button"
              onClick={() =>
                setShowDispenseForm(true)
              }
              disabled={stock === 0}
            >
              Dispense
            </button>
          </div>
        </header>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <section className="details-stats">
          <div className="detail-stat">
            <span>In-date Stock</span>

            <strong
              className={
                isLowStock
                  ? "stock-low large"
                  : "stock-good large"
              }
            >
              {stock}
            </strong>

            <small>units available</small>
          </div>

          <div className="detail-stat">
            <span>Reorder Threshold</span>

            <strong>
              {threshold}
            </strong>

            <small>units</small>
          </div>

          <div className="detail-stat">
            <span>Total Batches</span>

            <strong>
              {batches.length}
            </strong>

            <small>recorded batches</small>
          </div>

          <div className="detail-stat">
            <span>Inventory Status</span>

            <strong
              className={
                isLowStock
                  ? "stock-low"
                  : "stock-good"
              }
            >
              {isLowStock
                ? "Low Stock"
                : "Healthy"}
            </strong>

            <small>
              {isLowStock
                ? "Reorder required"
                : "Above threshold"}
            </small>
          </div>
        </section>

        {showBatchForm && (
          <section className="form-card">
            <div className="section-title-row">
              <div>
                <h2>Add New Batch</h2>
                <p>
                  Add stock with its expiry date.
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowBatchForm(false)
                }
              >
                ×
              </button>
            </div>

            <form
              className="medicine-form"
              onSubmit={addBatch}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Batch Number *
                  </label>

                  <input
                    name="batchNumber"
                    value={batchForm.batchNumber}
                    onChange={handleBatchChange}
                    placeholder="e.g. P004"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Quantity *
                  </label>

                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={batchForm.quantity}
                    onChange={handleBatchChange}
                    placeholder="e.g. 50"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Expiry Date *
                  </label>

                  <input
                    type="date"
                    name="expiryDate"
                    value={batchForm.expiryDate}
                    onChange={handleBatchChange}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowBatchForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Add Batch
                </button>
              </div>
            </form>
          </section>
        )}

        {showDispenseForm && (
          <section className="form-card dispense-card">
            <div className="section-title-row">
              <div>
                <h2>Dispense Medicine</h2>

                <p>
                  PharmaStock will automatically use
                  the earliest-expiry batch first (FEFO).
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowDispenseForm(false)
                }
              >
                ×
              </button>
            </div>

            <div className="dispense-form">
              <div className="form-group">
                <label>
                  Quantity to dispense
                </label>

                <input
                  type="number"
                  min="1"
                  max={stock}
                  value={dispenseQuantity}
                  onChange={(e) =>
                    setDispenseQuantity(
                      e.target.value
                    )
                  }
                  placeholder={`Maximum ${stock}`}
                />
              </div>

              <div className="dispense-info">
                <span>
                  Available in-date stock:
                </span>

                <strong>
                  {stock} units
                </strong>
              </div>

              <div className="form-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowDispenseForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  onClick={dispense}
                >
                  Confirm Dispense
                </button>
              </div>
            </div>
          </section>
        )}
        <BatchImport
  medicineId={Number(id)}
  onImported={loadMedicine}
/>
        <section className="dashboard-section">
          <div className="section-title-row">
            <div>
              <h2>Medicine Batches</h2>

              <p>
                FEFO selects the earliest in-date
                batch first.
              </p>
            </div>

            {isLowStock && (
              <span className="alert-pill">
                ⚠ Reorder required
              </span>
            )}
          </div>

          {batches.length === 0 ? (
            <div className="empty-box">
              <h3>No batches recorded</h3>

              <p>
                Add a batch to start tracking stock.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setShowBatchForm(true)
                }
              >
                + Add Batch
              </button>
            </div>
          ) : (
            <div className="medicine-table-wrapper">
              <table className="medicine-table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Quantity</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {[...batches]
                    .sort(
                      (a, b) =>
                        new Date(a.expiryDate) -
                        new Date(b.expiryDate)
                    )
                    .map((batch) => {
                      const status =
                        getBatchStatus(batch);

                      return (
                        <tr key={batch.id}>
                          <td>
                            <strong>
                              {batch.batchNumber}
                            </strong>
                          </td>

                          <td>
                            {batch.quantity} units
                          </td>

                          <td>
                            {formatDate(
                              batch.expiryDate
                            )}
                          </td>

                          <td>
                            <span
                              className={
                                status.className
                              }
                            >
                              {status.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="fefo-note">
          <strong>🔄 FEFO enabled</strong>

          <span>
            When dispensing, PharmaStock automatically
            uses the batch with the earliest expiry date
            and never uses expired or quarantined stock.
          </span>
        </div>
      </main>
    </div>
  );
}

export default MedicineDetails;