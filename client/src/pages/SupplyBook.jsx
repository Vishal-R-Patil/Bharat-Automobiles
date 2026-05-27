import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Plus } from "lucide-react";
import API from "../api";
import ConfirmLogout from "../components/ConfirmLogout";
import SupplyBookHeader from "../components/SupplyBookHeader";

function SupplyBook() {
  const [activeTab, setActiveTab] = useState("view");
  const [suppliers, setSuppliers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState({
    totalSupplies: 0,
    totalPayments: 0,
    balance: 0,
  });
  const [newSupplier, setNewSupplier] = useState({ name: "", gst_no: "" });
  const [newPayment, setNewPayment] = useState({
    payment_date: new Date().toISOString().slice(0, 10),
    amount: "",
    payment_method: "",
    note: "",
  });
  const [paymentImage, setPaymentImage] = useState(null);
  const [attachmentFiles, setAttachmentFiles] = useState({});
  const [supplierSearch, setSupplierSearch] = useState("");
  const [sortMode, setSortMode] = useState("recent");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [expandedLedgerId, setExpandedLedgerId] = useState(null);
  const [showBillViewer, setShowBillViewer] = useState(false);
  const [billImages, setBillImages] = useState([]);
  const [activeBillIndex, setActiveBillIndex] = useState(0);
  const [billFilters, setBillFilters] = useState({
    supplier_id: "all",
    type: "both",
  });
  const [touchStartX, setTouchStartX] = useState(null);

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

  useEffect(() => {
    if (!showBillViewer) return;

    const params = {};
    if (billFilters.supplier_id !== "all") {
      params.supplier_id = billFilters.supplier_id;
    }
    params.type = billFilters.type;

    API.get("/suppliers/bills", { params })
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        setBillImages(rows);
        setActiveBillIndex(0);
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.error || "Failed to fetch bills");
      });
  }, [showBillViewer, billFilters]);

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

  const fetchSupplierLedger = async (supplier) => {
    const res = await API.get(`/suppliers/${supplier.id}/ledger`);
    setSelected(res.data.supplier || supplier);
    setTransactions(Array.isArray(res.data.deliveries) ? res.data.deliveries : []);
    setPayments(Array.isArray(res.data.payments) ? res.data.payments : []);
    setLedgerSummary(
      res.data.summary || {
        totalSupplies: 0,
        totalPayments: 0,
        balance: 0,
      },
    );
  };

  const deleteSupplier = async () => {
    if (!selected) return;
    if (!window.confirm("Delete this supplier?")) return;
    try {
      await API.delete(`/suppliers/${selected.id}`);
      setSelected(null);
      setTransactions([]);
      setPayments([]);
      setLedgerSummary({ totalSupplies: 0, totalPayments: 0, balance: 0 });
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
    try {
      await fetchSupplierLedger(supplier);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackToSuppliers = () => {
    setSelected(null);
    setTransactions([]);
    setPayments([]);
    setLedgerSummary({ totalSupplies: 0, totalPayments: 0, balance: 0 });
    setAttachmentFiles({});
    setShowPaymentForm(false);
    setExpandedLedgerId(null);
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

  const formatCurrency = (value) =>
    `₹ ${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("en-IN") : "No date";

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!newPayment.payment_date || !newPayment.amount) {
      return alert("Payment date and amount are required");
    }

    try {
      const formData = new FormData();
      formData.append("payment_date", newPayment.payment_date);
      formData.append("amount", newPayment.amount);
      formData.append("payment_method", newPayment.payment_method);
      formData.append("note", newPayment.note);
      if (paymentImage) formData.append("image", paymentImage);

      await API.post(`/suppliers/${selected.id}/payments`, formData);
      setNewPayment({
        payment_date: new Date().toISOString().slice(0, 10),
        amount: "",
        payment_method: "",
        note: "",
      });
      setPaymentImage(null);
      setShowPaymentForm(false);
      await fetchSupplierLedger(selected);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to add supplier payment");
    }
  };

  const handleAttachmentSubmit = async (entityType, entityId) => {
    const key = `${entityType}:${entityId}`;
    const image = attachmentFiles[key];
    if (!image) return alert("Image required");

    try {
      const formData = new FormData();
      formData.append("entity_type", entityType);
      formData.append("entity_id", entityId);
      formData.append("image", image);

      await API.post("/suppliers/attachments", formData);
      setAttachmentFiles((current) => ({ ...current, [key]: null }));
      await fetchSupplierLedger(selected);
      setShowBillViewer(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to add image");
    }
  };

  const handleAttachmentDelete = async (attachmentId) => {
    if (!window.confirm("Delete this image?")) return;

    try {
      await API.delete(`/suppliers/attachments/${attachmentId}`);
      await fetchSupplierLedger(selected);
      setShowBillViewer(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete image");
    }
  };

  const renderAttachments = (attachments = []) => {
    if (attachments.length === 0) {
      return <p className="text-muted">No images attached.</p>;
    }

    return (
      <div className="attachment-grid">
        {attachments.map((attachment) => (
          <div className="attachment-thumb-wrap" key={attachment.id}>
            <a
              href={attachment.file_url}
              target="_blank"
              rel="noreferrer"
              className="attachment-thumb"
            >
              <img src={attachment.file_url} alt="Bill attachment" />
            </a>
            <button
              type="button"
              className="attachment-delete-btn"
              onClick={() => handleAttachmentDelete(attachment.id)}
              aria-label="Delete image"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  const balanceAmount = Number(ledgerSummary.balance || 0);
  const balanceLabel =
    balanceAmount > 0
      ? "You owe supplier"
      : balanceAmount < 0
        ? "Supplier owes you"
        : "Settled";

  const supplyEvents = transactions.map((delivery) => ({
    id: `supply-${delivery.id}`,
    type: "supply",
    date: delivery.issued_date || delivery.delivery_date,
    amount: delivery.total_cost,
    title: delivery.invoice_number
      ? `Invoice ${delivery.invoice_number}`
      : `Supply #${delivery.id}`,
    meta: `Received ${formatDate(delivery.delivery_date)}`,
    attachments: delivery.attachments || [],
    source: delivery,
  }));

  const paymentEvents = payments.map((payment) => ({
    id: `payment-${payment.id}`,
    type: "payment",
    date: payment.payment_date,
    amount: payment.amount,
    title: payment.payment_method || "Payment",
    meta: payment.note || "Supplier payment",
    attachments: payment.attachments || [],
    source: payment,
  }));

  const ledgerEvents = [...supplyEvents, ...paymentEvents].sort((a, b) => {
    const aTime = new Date(a.date || 0).getTime();
    const bTime = new Date(b.date || 0).getTime();
    if (bTime !== aTime) return bTime - aTime;
    return b.id.localeCompare(a.id);
  });

  const activeBill = billImages[activeBillIndex];
  const showPreviousBill = () => {
    if (billImages.length === 0) return;
    setActiveBillIndex((index) =>
      index === 0 ? billImages.length - 1 : index - 1,
    );
  };
  const showNextBill = () => {
    if (billImages.length === 0) return;
    setActiveBillIndex((index) =>
      index === billImages.length - 1 ? 0 : index + 1,
    );
  };
  const handleBillTouchEnd = (e) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) showNextBill();
      else showPreviousBill();
    }
    setTouchStartX(null);
  };

  const billViewerModal = showBillViewer && (
    <div className="modal-overlay">
      <div className="modal-content bill-viewer-modal">
        <div className="supplybook-list-header mb-4">
          <h3>View Bills</h3>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowBillViewer(false)}
          >
            Close
          </button>
        </div>

        <div className="bill-viewer-filters">
          <select
            className="input-field"
            value={billFilters.supplier_id}
            onChange={(e) =>
              setBillFilters({ ...billFilters, supplier_id: e.target.value })
            }
          >
            <option value="all">All suppliers</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={billFilters.type}
            onChange={(e) =>
              setBillFilters({ ...billFilters, type: e.target.value })
            }
          >
            <option value="both">Supply invoices and payments</option>
            <option value="supply">Only supply invoices</option>
            <option value="payment">Only payments</option>
          </select>
        </div>

        {billImages.length === 0 ? (
          <p className="text-muted">No bill images found.</p>
        ) : (
          <>
            <div
              className="bill-viewer-stage"
              onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
              onTouchEnd={handleBillTouchEnd}
            >
              <button
                type="button"
                className="btn btn-outline bill-nav-btn"
                onClick={showPreviousBill}
                aria-label="Previous bill"
              >
                &lt;
              </button>
              <a
                href={activeBill.file_url}
                target="_blank"
                rel="noreferrer"
                className="bill-viewer-image-link"
              >
                <img src={activeBill.file_url} alt="Supplier bill" />
              </a>
              <button
                type="button"
                className="btn btn-outline bill-nav-btn"
                onClick={showNextBill}
                aria-label="Next bill"
              >
                &gt;
              </button>
            </div>

            <div className="bill-viewer-meta">
              <strong>
                {activeBill.bill_type === "supply"
                  ? activeBill.invoice_number || "Supply invoice"
                  : "Payment"}
              </strong>
              <span>{activeBill.supplier_name}</span>
              <span>
                {formatCurrency(activeBill.amount)} |{" "}
                {formatDate(activeBill.transaction_date)}
              </span>
              <span>
                {activeBillIndex + 1} / {billImages.length}
              </span>
            </div>

            <div className="bill-viewer-thumbs">
              {billImages.map((bill, index) => (
                <button
                  type="button"
                  key={bill.id}
                  className={index === activeBillIndex ? "active" : ""}
                  onClick={() => setActiveBillIndex(index)}
                  aria-label={`Open bill ${index + 1}`}
                >
                  <img src={bill.file_url} alt="" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (selected) {
    return (
      <div className="dashboard-container">
        <SupplyBookHeader
          title={selected.name}
          onBack={handleBackToSuppliers}
          onAddPayment={() => setShowPaymentForm(true)}
          onDelete={deleteSupplier}
          onViewBills={() => setShowBillViewer(true)}
          onLogoutClick={() => setShowLogoutConfirm(true)}
        />

        <div className="card">
          <p className="text-muted mb-4">GST no: {selected.gst_no || "No GST"}</p>

          <div className="ledger-summary">
            <div>
              <span>Total supplies</span>
              <strong>{formatCurrency(ledgerSummary.totalSupplies)}</strong>
            </div>
            <div>
              <span>Total paid</span>
              <strong>{formatCurrency(ledgerSummary.totalPayments)}</strong>
            </div>
            <div className={balanceAmount === 0 ? "settled" : balanceAmount > 0 ? "owed" : "advance"}>
              <span>{balanceLabel}</span>
              <strong>{formatCurrency(Math.abs(balanceAmount))}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4">Supplier Ledger</h3>
          {ledgerEvents.length === 0 ? (
            <p>No supplier ledger entries found.</p>
          ) : (
            ledgerEvents.map((entry) => {
              const key =
                entry.type === "supply"
                  ? `supply_delivery:${entry.source.id}`
                  : `supplier_payment:${entry.source.id}`;
              return (
                <div className={`ledger-item ${entry.type}`} key={entry.id}>
                  <button
                    type="button"
                    className="ledger-compact-btn"
                    onClick={() =>
                      setExpandedLedgerId((current) =>
                        current === entry.id ? null : entry.id,
                      )
                    }
                    aria-expanded={expandedLedgerId === entry.id}
                  >
                    <strong>{formatCurrency(entry.amount)}</strong>
                    <span>{formatDate(entry.date)}</span>
                  </button>

                  {expandedLedgerId === entry.id && (
                    <div className="ledger-expanded">
                      <strong>{entry.title}</strong>
                      <p className="text-muted">{entry.meta}</p>
                      {entry.type === "supply" && (
                        <p className="text-muted">
                          Invoice: {entry.source.invoice_number || "No invoice number"}
                        </p>
                      )}

                      {renderAttachments(entry.attachments)}

                      <div className="attachment-form">
                        <input
                          type="file"
                          accept="image/*"
                          className="input-field"
                          onChange={(e) =>
                            setAttachmentFiles({
                              ...attachmentFiles,
                              [key]: e.target.files?.[0] || null,
                            })
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() =>
                            handleAttachmentSubmit(
                              entry.type === "supply"
                                ? "supply_delivery"
                                : "supplier_payment",
                              entry.source.id,
                            )
                          }
                        >
                          Add Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {showPaymentForm && (
          <div className="modal-overlay">
            <div className="modal-content supplybook-payment-modal">
              <div className="supplybook-list-header mb-4">
                <h3>Add Supplier Payment</h3>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowPaymentForm(false)}
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={handlePaymentSubmit}>
                <div className="form-grid mb-4">
                  <div>
                    <label>Payment Date</label>
                    <input
                      type="date"
                      className="input-field"
                      value={newPayment.payment_date}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, payment_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-field"
                      placeholder="Amount paid"
                      value={newPayment.amount}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, amount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Payment Method</label>
                    <input
                      className="input-field"
                      placeholder="Cash, UPI, bank transfer"
                      value={newPayment.payment_method}
                      onChange={(e) =>
                        setNewPayment({
                          ...newPayment,
                          payment_method: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label>Payment Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="input-field"
                      onChange={(e) => setPaymentImage(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
                <label>Note</label>
                <textarea
                  className="input-field mb-4"
                  placeholder="Optional payment note"
                  value={newPayment.note}
                  onChange={(e) =>
                    setNewPayment({ ...newPayment, note: e.target.value })
                  }
                  rows="3"
                />
                <button type="submit" className="btn btn-primary">
                  Save Payment
                </button>
              </form>
            </div>
          </div>
        )}

        {billViewerModal}

        {showLogoutConfirm && (
          <ConfirmLogout setShowLogoutConfirm={setShowLogoutConfirm} />
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <SupplyBookHeader
        onViewBills={() => setShowBillViewer(true)}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      />

      <div className="card">
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
              <button
                type="button"
                className="btn btn-outline supplybook-symbol-btn"
                onClick={() => setActiveTab("view")}
                aria-label="Back to suppliers"
              >
                &lt;
              </button>
              <h3>Add Supplier</h3>
              <span />
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
      {billViewerModal}
    </div>
  );
}

export default SupplyBook;
