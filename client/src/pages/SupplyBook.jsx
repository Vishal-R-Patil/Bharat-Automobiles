import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import ThemeToggle from "../components/ThemeToggle";
import { TrashIcon } from "lucide-react";

function SupplyBook() {
  const [suppliers, setSuppliers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newSupplier, setNewSupplier] = useState({ name: "", gst_no: "" });

  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await API.get("/suppliers");
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const addSupplier = async () => {
    if (!newSupplier.name) return alert("Supplier name required");
    try {
      await API.post("/suppliers", newSupplier);
      setNewSupplier({ name: "", gst_no: "" });
      fetchSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSupplier = async (id) => {
    if (!window.confirm("Delete this supplier?")) return;
    try {
      await API.delete(`/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
       if (err.response?.data?.hasTransactions) {
    alert(err.response.data.error);

  } else {
    alert("Failed to delete supplier");

  }
    }
  };

  const handleSelect = async (supplier) => {
    setSelected(supplier);
    try {
      const res = await API.get(`/suppliers/${supplier.id}`);
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (selected) {
    return (
      <div className="dashboard-container">
        <div
          className="dashboard-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              className="btn btn-outline"
              onClick={() => navigate("/dashboard")}
            >
              ← Dashboard
            </button>
            <h2 style={{ margin: 0 }}>Supply Book</h2>
          </div>

          <ThemeToggle />
        </div>

        <div className="card">
          <button onClick={() => setSelected(null)}>← Back</button>

          <h3>{selected.name}</h3>

          {transactions.length === 0 ? (
            <p>No transactions found.</p>
          ) : (
            transactions.map((t) => (
              <div className="transaction-item" key={t.id}>
                <p style={{ fontWeight: "bold" }}>
                  ₹ {Number(t.total_cost).toLocaleString("en-IN")}
                </p>
                <p className="text-muted">
                  {new Date(t.issued_date).toLocaleDateString("en-IN")}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div
        className="dashboard-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="btn btn-outline"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
          <h2 style={{ margin: 0 }}>Supply Book</h2>
        </div>

        <ThemeToggle />
      </div>

      <div className="card">

        <div style={{ marginBottom: "15px" }}>
          <input
            placeholder="Supplier Name"
            value={newSupplier.name}
            onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
            className="input-field"
          />
          <input
            placeholder="GST No"
            value={newSupplier.gst_no}
            onChange={(e) => setNewSupplier({ ...newSupplier, gst_no: e.target.value })}
            className="input-field"
          />
          <button onClick={addSupplier} className="btn btn-primary">
            Add Supplier
          </button>
        </div>

        {!Array.isArray(suppliers) || suppliers.length === 0 ? (
          <p>No suppliers found.</p>
        ) : (
          
          suppliers.map((s) => (
            <div
              key={s.id}
              className="supplier-item"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div onClick={() => handleSelect(s)} style={{ flex: 1 }}>
                <strong>{s.name}</strong>
                <p className="text-muted">{s.gst_no || "No GST"}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteSupplier(s.id)}
                style={{ marginLeft: "10px" }}
              >
                <TrashIcon/>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SupplyBook;