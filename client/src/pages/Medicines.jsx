import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

function Medicines() {
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    genericName: "",
    manufacturer: "",
    reorderThreshold: 0,
  });

  async function loadMedicines() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: "8",
        sortBy,
        sortOrder,
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const data = await apiRequest(`/medicines?${params.toString()}`);

      const list =
        data.medicines ||
        data.data ||
        [];

      setMedicines(Array.isArray(list) ? list : []);

      setTotalPages(
        Number(data.totalPages || 1)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedicines();
  }, [page, sortBy, sortOrder]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    loadMedicines();
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "reorderThreshold"
          ? Number(value)
          : value,
    }));
  }

  async function addMedicine(event) {
    event.preventDefault();

    try {
      await apiRequest("/medicines", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          genericName: form.genericName || null,
          manufacturer: form.manufacturer || null,
          reorderThreshold: Number(
            form.reorderThreshold || 0
          ),
        }),
      });

      setForm({
        name: "",
        genericName: "",
        manufacturer: "",
        reorderThreshold: 0,
      });

      setShowForm(false);
      setPage(1);

      await loadMedicines();
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  function changeSort(value) {
    setSortBy(value);
    setPage(1);
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
        <header className="dashboard-header">
          <div>
            <p className="small-label">
              INVENTORY
            </p>

            <h1>Medicines</h1>

            <p className="muted">
              Search, sort and manage your pharmacy stock.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            + Add Medicine
          </button>
        </header>

        {showForm && (
          <div className="form-card">
            <div className="section-title-row">
              <div>
                <h2>Add Medicine</h2>
                <p>Create a new medicine record.</p>
              </div>

              <button
                className="close-button"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form
              className="medicine-form"
              onSubmit={addMedicine}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Medicine Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Paracetamol"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Generic Name
                  </label>

                  <input
                    name="genericName"
                    value={form.genericName}
                    onChange={handleFormChange}
                    placeholder="e.g. Paracetamol 500mg"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Manufacturer
                  </label>

                  <input
                    name="manufacturer"
                    value={form.manufacturer}
                    onChange={handleFormChange}
                    placeholder="e.g. ABC Pharma"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Reorder Threshold
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="reorderThreshold"
                    value={form.reorderThreshold}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        )}

        <section className="toolbar">
          <form
            className="search-form"
            onSubmit={handleSearch}
          >
            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="🔍 Search medicine..."
            />

            <button
              type="submit"
              className="secondary-button"
            >
              Search
            </button>
          </form>

          <div className="sort-controls">
            <label>Sort by:</label>

            <select
              value={sortBy}
              onChange={(e) =>
                changeSort(e.target.value)
              }
            >
              <option value="name">
                Name
              </option>

              <option value="createdAt">
                Recently Added
              </option>
            </select>

            <button
              className="secondary-button"
              onClick={() => {
                setSortOrder(
                  sortOrder === "asc"
                    ? "desc"
                    : "asc"
                );
                setPage(1);
              }}
            >
              {sortOrder === "asc"
                ? "↑ Asc"
                : "↓ Desc"}
            </button>
          </div>
        </section>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <section className="dashboard-section">
          {loading ? (
            <div className="loading-box">
              Loading medicines...
            </div>
          ) : medicines.length === 0 ? (
            <div className="empty-box">
              <h3>No medicines found</h3>

              <p>
                Try a different search or add a new
                medicine.
              </p>
            </div>
          ) : (
            <div className="medicine-table-wrapper">
              <table className="medicine-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Manufacturer</th>
                    <th>In-date Stock</th>
                    <th>Reorder At</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {medicines.map((medicine) => {
                    const stock = Number(
                      medicine.sellableStock ??
                        medicine.totalStock ??
                        medicine.stock ??
                        0
                    );

                    const threshold = Number(
                      medicine.reorderThreshold || 0
                    );

                    const lowStock =
                      threshold > 0 &&
                      stock < threshold;

                    return (
                      <tr key={medicine.id}>
                        <td>
                          <div className="medicine-name">
                            <strong>
                              {medicine.name}
                            </strong>

                            {medicine.genericName && (
                              <small>
                                {medicine.genericName}
                              </small>
                            )}
                          </div>
                        </td>

                        <td>
                          {medicine.manufacturer ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={
                              lowStock
                                ? "stock-low"
                                : "stock-good"
                            }
                          >
                            {stock} units
                          </span>
                        </td>

                        <td>
                          {threshold} units
                        </td>

                        <td>
                          <Link
                            to={`/medicines/${medicine.id}`}
                            className="view-link"
                          >
                            Manage →
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

        <div className="pagination">
          <button
            className="secondary-button"
            disabled={page <= 1}
            onClick={() =>
              setPage((p) => p - 1)
            }
          >
            ← Previous
          </button>

          <span>
            Page <strong>{page}</strong> of{" "}
            <strong>{totalPages}</strong>
          </span>

          <button
            className="secondary-button"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((p) => p + 1)
            }
          >
            Next →
          </button>
        </div>
      </main>
    </div>
  );
}

export default Medicines;