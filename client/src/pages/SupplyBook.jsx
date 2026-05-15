import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Plus } from "lucide-react";
import API from "../api";
import { TrashIcon } from "../components/Icons";
import ConfirmLogout from "../components/ConfirmLogout";
import SupplyBookHeader from "../components/SupplyBookHeader";

function SupplyBook() {
  const [activeTab, setActiveTab] = useState("view");
  const [suppliers, setSuppliers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newSupplier, setNewSupplier] = useState({ name: "", gst_no: "" });
  const [supplierSearch, setSupplierSearch] = useState("");
  const [sortMode, setSortMode] = useState("recent");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const res = await API.get("/suppliers");
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    API.get("/suppliers")
      .then((res) => {
        if (isMounted) {
          setSuppliers(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const addSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplier.name) return alert("Supplier name required");
    try {
      await API.post("/suppliers", newSupplier);
      setNewSupplier({ name: "", gst_no: "" });
      fetchSuppliers();
      setActiveTab("view");
      setIsSortMenuOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSupplier = async () => {
    if (!selected) return;
    if (!window.confirm("Delete this supplier?")) return;
    try {
      await API.delete(`/suppliers/${selected.id}`);
      setSelected(null);
      setTransactions([]);
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
    setIsSortMenuOpen(false);
    setSelected(supplier);
    try {
      const res = await API.get(`/suppliers/${supplier.id}`);
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const visibleSuppliers = useMemo(() => {
    const search = supplierSearch.trim().toLowerCase();
    const filteredSuppliers = suppliers.filter((supplier) => {
      const name = supplier.name || "";
      const gstNo = supplier.gst_no || "";
      return (
        name.toLowerCase().includes(search) ||
        gstNo.toLowerCase().includes(search)
      );
    });

    return [...filteredSuppliers].sort((a, b) => {
      if (sortMode === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }

      const aInteraction =
        new Date(a.last_interaction_at || 0).getTime() ||
        Number(a.last_interaction_id || 0);
      const bInteraction =
        new Date(b.last_interaction_at || 0).getTime() ||
        Number(b.last_interaction_id || 0);

      if (bInteraction !== aInteraction) return bInteraction - aInteraction;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [suppliers, supplierSearch, sortMode]);

  const formatLastInteraction = (supplier) => {
    if (!supplier.last_interaction_at) return "No activity yet";
    return `Last supply: ${new Date(supplier.last_interaction_at).toLocaleDateString(
      "en-IN",
    )}`;
  };

  const handleSortSelect = (mode) => {
    setSortMode(mode);
    setIsSortMenuOpen(false);
  };

  if (selected) {
    return (
      <div className="dashboard-container">
        <SupplyBookHeader onLogoutClick={() => setShowLogoutConfirm(true)} />

        <div className="card">
          <div className="flex-between mb-4">
            <button className="btn btn-outline" onClick={() => setSelected(null)}>
              ← Back
            </button>
            <button
              className="btn btn-icon"
              type="button"
              onClick={deleteSupplier}
            >
              <TrashIcon />
            </button>
          </div>

          <h3 className="mb-2">{selected.name}</h3>
          <p className="text-muted mb-4">GST no: {selected.gst_no || "No GST"}</p>

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

        {showLogoutConfirm && (
          <ConfirmLogout setShowLogoutConfirm={setShowLogoutConfirm} />
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <SupplyBookHeader onLogoutClick={() => setShowLogoutConfirm(true)} />

      <div className="card">
        <div className="supplybook-tabs mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("view")}
            className={`tab-btn ${activeTab === "view" ? "active" : ""}`}
          >
            View Suppliers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("add")}
            className={`tab-btn ${activeTab === "add" ? "active" : ""}`}
          >
            Add Supplier
          </button>
        </div>

        {activeTab === "view" && (
          <>
            <div className="supplybook-list-header">
              <h3>Suppliers</h3>
              <button
                type="button"
                className="btn btn-primary supplybook-add-fab"
                onClick={() => setActiveTab("add")}
                aria-label="Add supplier"
              >
                <Plus size={22} strokeWidth={2.5} />
              </button>
            </div>

            <div className="supplybook-controls">
              <input
                className="input-field"
                placeholder="Search suppliers"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
              />
              <div className="supplybook-sort-menu">
                <button
                  type="button"
                  className="btn btn-outline supplybook-sort-btn"
                  onClick={() => setIsSortMenuOpen((isOpen) => !isOpen)}
                  aria-label="Sort suppliers"
                  aria-expanded={isSortMenuOpen}
                >
                  <ArrowUpDown size={20} strokeWidth={2.2} aria-hidden="true" />
                </button>
                {isSortMenuOpen && (
                  <div className="supplybook-sort-options">
                    <button
                      type="button"
                      className={sortMode === "recent" ? "active" : ""}
                      onClick={() => handleSortSelect("recent")}
                    >
                      Recent transaction
                    </button>
                    <button
                      type="button"
                      className={sortMode === "name" ? "active" : ""}
                      onClick={() => handleSortSelect("name")}
                    >
                      Name A-Z
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!Array.isArray(suppliers) || suppliers.length === 0 ? (
              <p>No suppliers found.</p>
            ) : visibleSuppliers.length === 0 ? (
              <p>No suppliers match your search.</p>
            ) : (
              visibleSuppliers.map((s) => (
                <div
                  key={s.id}
                  className="supplier-item"
                  onClick={() => handleSelect(s)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleSelect(s);
                  }}
                >
                  <strong>{s.name}</strong>
                  <p className="text-muted">GST no: {s.gst_no || "No GST"}</p>
                  <p className="text-muted">{formatLastInteraction(s)}</p>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "add" && (
          <form onSubmit={addSupplier}>
            <div className="supplybook-list-header mb-4">
              <h3>Add Supplier</h3>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActiveTab("view")}
              >
                View Suppliers
              </button>
            </div>
            <div className="form-grid mb-4">
              <div>
                <label>Supplier Name</label>
                <input
                  placeholder="Supplier Name"
                  value={newSupplier.name}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, name: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label>GST No</label>
                <input
                  placeholder="GST No"
                  value={newSupplier.gst_no}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, gst_no: e.target.value })
                  }
                  className="input-field"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Add Supplier
            </button>
          </form>
        )}
      </div>
      {showLogoutConfirm && (
        <ConfirmLogout setShowLogoutConfirm={setShowLogoutConfirm} />
      )}
    </div>
  );
}

export default SupplyBook;
