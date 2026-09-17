import { useState } from "react";
import { apiRequest } from "../api";

function BatchImport({ medicineId, onImported }) {
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const example = `[
  {
    "batchNumber": "IMPORT-A",
    "quantity": "10 units",
    "expiryDate": "15/10/2026"
  },
  {
    "batchNumber": "IMPORT-B",
    "quantity": 20,
    "expiryDate": "2027-02-20"
  },
  {
    "batchNumber": "IMPORT-A",
    "quantity": "10 units",
    "expiryDate": "15/10/2026"
  },
  {
    "batchNumber": null,
    "quantity": 15,
    "expiryDate": "20/11/2026"
  },
  {
    "batchNumber": "BAD-001",
    "quantity": "wrong",
    "expiryDate": "not-a-date"
  }
]`;

  async function handleImport() {
    if (!text.trim()) {
      setError("Please paste batch data first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      let rows;

      try {
        rows = JSON.parse(text);
      } catch {
        setError("Invalid JSON. Please use the example format.");
        return;
      }

      if (!Array.isArray(rows)) {
        setError("Import data must be an array of rows.");
        return;
      }

      const data = await apiRequest(
        `/medicines/${medicineId}/batches/import`,
        {
          method: "POST",
          body: JSON.stringify({ rows }),
        }
      );

      setResult(data);

      if (onImported) {
        await onImported();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="form-card import-card">
      <div className="section-title-row">
        <div>
          <h2>Import Batch Data</h2>
          <p>
            Import messy batch data and automatically
            handle duplicates and rejected rows.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => {
            setShow(!show);
            setError("");
            setResult(null);
          }}
        >
          {show ? "Hide Import" : "Import Batches"}
        </button>
      </div>

      {show && (
        <div className="import-content">
          <div className="import-help">
            <strong>Supported:</strong>
            <span>
              quantities such as "10 units", dates such
              as 15/10/2026 or 2026-10-15, null values
              and duplicate rows.
            </span>
          </div>

          <label className="import-label">
            Batch JSON
          </label>

          <textarea
            className="import-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={example}
            rows={14}
          />

          <div className="import-actions">
            <button
              className="secondary-button"
              onClick={() => setText(example)}
            >
              Load Example
            </button>

            <button
              className="primary-button"
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? "Importing..." : "Import Batch Data"}
            </button>
          </div>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {result && (
            <div className="import-result">
              <h3>Import Report</h3>

              <div className="import-stats">
                <div>
                  <strong>{result.imported ?? 0}</strong>
                  <span>Imported</span>
                </div>

                <div>
                  <strong>{result.deduped ?? 0}</strong>
                  <span>Deduped</span>
                </div>

                <div>
                  <strong>{result.rejected ?? 0}</strong>
                  <span>Rejected</span>
                </div>
              </div>

              {Array.isArray(result.rejectedRows) &&
                result.rejectedRows.length > 0 && (
                  <div className="rejected-rows">
                    <h4>Rejected Rows</h4>

                    {result.rejectedRows.map(
                      (row, index) => (
                        <div
                          className="rejected-row"
                          key={index}
                        >
                          <strong>
                            Row {row.row ?? index + 1}
                          </strong>

                          <span>
                            {row.reason || "Invalid data"}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}

              <div className="success-box">
                ✓ Import completed successfully.
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default BatchImport;