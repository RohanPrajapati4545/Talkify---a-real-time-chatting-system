import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { FaPen } from "react-icons/fa";

const swalTheme = {
  background: "#1c1812",
  color: "#f2ece2",
  confirmButtonColor: "#e8a33d",
};

const showSuccessAlert = (text) => {
  Swal.fire({ title: "Saved", text, icon: "success", ...swalTheme });
};

const showErrorAlert = (error, fallbackText) => {
  const backendMsg = error?.response?.data?.msg || error?.response?.data?.message;
  Swal.fire({ title: "Error", text: backendMsg || fallbackText, icon: "error", ...swalTheme });
};

const AdminHomeEditor = () => {
  const { token } = useSelector((state) => state.auth);

  const [content, setContent] = useState(null); // full doc from backend
  const [loading, setLoading] = useState(true);

  // which popup is open: null | "hero" | "entry-0".."entry-3" | "closer"
  const [activeModal, setActiveModal] = useState(null);
  const [saving, setSaving] = useState(false);

  // local draft state for whichever modal is open
  const [heroDraft, setHeroDraft] = useState(null);
  const [entryDraft, setEntryDraft] = useState(null);
  const [closerDraft, setCloserDraft] = useState(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/home-content`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent(res.data.content);
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not load home page content.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  // ---- open popups ----
  const openHeroModal = () => {
    setHeroDraft({
      heroEyebrow: content.heroEyebrow,
      heroTitleLine1: content.heroTitleLine1,
      heroTitleLine2: content.heroTitleLine2,
      heroSubtitle: content.heroSubtitle,
      heroCtaPrimaryText: content.heroCtaPrimaryText,
      heroCtaGhostText: content.heroCtaGhostText,
      wireThreadLabel: content.wireThreadLabel,
    });
    setActiveModal("hero");
  };

  const openEntryModal = (index) => {
    setEntryDraft({ index, ...content.entries[index] });
    setActiveModal(`entry-${index}`);
  };

  const openCloserModal = () => {
    setCloserDraft({
      closerTitle: content.closerTitle,
      closerSubtitle: content.closerSubtitle,
      closerButtonText: content.closerButtonText,
    });
    setActiveModal("closer");
  };

  const closeModal = () => {
    if (saving) return;
    setActiveModal(null);
    setHeroDraft(null);
    setEntryDraft(null);
    setCloserDraft(null);
  };

  // ---- save handlers — each PUTs the full content object (backend only
  // requires the fields you send, but sending the merged full object keeps
  // things simple and avoids ever losing another section's data) ----
  const saveSection = async (patch, successText) => {
    try {
      setSaving(true);
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/admin/home-content`,
        { ...content, ...patch },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent(res.data.content);
      showSuccessAlert(successText);
      closeModal();
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHero = (e) => {
    e.preventDefault();
    saveSection(heroDraft, "Hero section updated.");
  };

  const handleSaveEntry = (e) => {
    e.preventDefault();
    const { index, ...fields } = entryDraft;
    const entries = [...content.entries];
    entries[index] = fields;
    saveSection({ entries }, `Box ${index + 1} updated.`);
  };

  const handleSaveCloser = (e) => {
    e.preventDefault();
    saveSection(closerDraft, "Closer section updated.");
  };

  if (loading || !content) {
    return <div className="dashboard-wrapper p-4">Loading…</div>;
  }

  return (
    <div className="dashboard-wrapper p-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Home Page Content</h2>
        <p className="text-muted mb-0">Click Edit on any section to update it — changes go live immediately.</p>
      </div>

      {/* ===== HERO SECTION SUMMARY ===== */}
      <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h4 className="fw-bold m-0">Hero (top section)</h4>
          <button className="btn btn-sm btn-outline-warning" onClick={openHeroModal}>
            <FaPen size={11} className="me-1" />
            Edit
          </button>
        </div>
        <p className="mb-1 text-muted">{content.heroEyebrow}</p>
        <p className="mb-1 fw-semibold">
          {content.heroTitleLine1} {content.heroTitleLine2}
        </p>
        <p className="mb-0 text-muted">{content.heroSubtitle}</p>
      </div>

      {/* ===== 4 ENTRY BOXES SUMMARY ===== */}
      <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
        <h4 className="fw-bold mb-3">Entry Boxes (the 4 cards)</h4>
        <div className="row g-3">
          {content.entries.map((entry, index) => (
            <div className="col-12 col-md-6" key={index}>
              <div className="border rounded-3 p-3 h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="fw-bold">Box {index + 1}</span>
                  <button
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => openEntryModal(index)}
                  >
                    <FaPen size={11} className="me-1" />
                    Edit
                  </button>
                </div>
                <p className="mb-1 fw-semibold">{entry.title}</p>
                <p className="mb-0 text-muted small">{entry.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== CLOSER SECTION SUMMARY ===== */}
      <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h4 className="fw-bold m-0">Closer (bottom section)</h4>
          <button className="btn btn-sm btn-outline-warning" onClick={openCloserModal}>
            <FaPen size={11} className="me-1" />
            Edit
          </button>
        </div>
        <p className="mb-1 fw-semibold">{content.closerTitle}</p>
        <p className="mb-0 text-muted">{content.closerSubtitle}</p>
      </div>

      {/* ===== HERO MODAL ===== */}
      {activeModal === "hero" && heroDraft && (
        <>
          <div className="modal fade show d-block admin-edit-modal" tabIndex="-1" role="dialog" onClick={closeModal}>
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Edit Hero Section</h5>
                  <button type="button" className="btn-close" onClick={closeModal} disabled={saving} aria-label="Close"></button>
                </div>

                <div className="modal-body">
                  <form id="heroForm" onSubmit={handleSaveHero}>
                    <div className="mb-3">
                      <label className="form-label admin-label">Eyebrow badge text</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={heroDraft.heroEyebrow}
                        onChange={(e) => setHeroDraft({ ...heroDraft, heroEyebrow: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label admin-label">Title — line 1</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={heroDraft.heroTitleLine1}
                        onChange={(e) => setHeroDraft({ ...heroDraft, heroTitleLine1: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label admin-label">Title — line 2 (gradient text)</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={heroDraft.heroTitleLine2}
                        onChange={(e) => setHeroDraft({ ...heroDraft, heroTitleLine2: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label admin-label">Subtitle</label>
                      <textarea
                        className="form-control admin-input"
                        rows={3}
                        value={heroDraft.heroSubtitle}
                        onChange={(e) => setHeroDraft({ ...heroDraft, heroSubtitle: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label admin-label">Primary button text</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={heroDraft.heroCtaPrimaryText}
                        onChange={(e) => setHeroDraft({ ...heroDraft, heroCtaPrimaryText: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label admin-label">Ghost button text</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={heroDraft.heroCtaGhostText}
                        onChange={(e) => setHeroDraft({ ...heroDraft, heroCtaGhostText: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-1">
                      <label className="form-label admin-label">Chat mock thread label (right side)</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={heroDraft.wireThreadLabel}
                        onChange={(e) => setHeroDraft({ ...heroDraft, wireThreadLabel: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                  </form>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={closeModal} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" form="heroForm" className="btn btn-warning btn-sm" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* ===== ENTRY BOX MODAL ===== */}
      {activeModal?.startsWith("entry-") && entryDraft && (
        <>
          <div className="modal fade show d-block admin-edit-modal" tabIndex="-1" role="dialog" onClick={closeModal}>
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Edit Box {entryDraft.index + 1}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} disabled={saving} aria-label="Close"></button>
                </div>

                <div className="modal-body">
                  <form id="entryForm" onSubmit={handleSaveEntry}>
                    <div className="mb-3">
                      <label className="form-label admin-label">Icon (Font Awesome class)</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        placeholder="fa-solid fa-bolt"
                        value={entryDraft.icon}
                        onChange={(e) => setEntryDraft({ ...entryDraft, icon: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label admin-label">Title</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={entryDraft.title}
                        onChange={(e) => setEntryDraft({ ...entryDraft, title: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-1">
                      <label className="form-label admin-label">Description</label>
                      <textarea
                        className="form-control admin-input"
                        rows={3}
                        value={entryDraft.description}
                        onChange={(e) => setEntryDraft({ ...entryDraft, description: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                  </form>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={closeModal} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" form="entryForm" className="btn btn-warning btn-sm" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* ===== CLOSER MODAL ===== */}
      {activeModal === "closer" && closerDraft && (
        <>
          <div className="modal fade show d-block admin-edit-modal" tabIndex="-1" role="dialog" onClick={closeModal}>
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Edit Closer Section</h5>
                  <button type="button" className="btn-close" onClick={closeModal} disabled={saving} aria-label="Close"></button>
                </div>

                <div className="modal-body">
                  <form id="closerForm" onSubmit={handleSaveCloser}>
                    <div className="mb-3">
                      <label className="form-label admin-label">Title</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={closerDraft.closerTitle}
                        onChange={(e) => setCloserDraft({ ...closerDraft, closerTitle: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label admin-label">Subtitle</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={closerDraft.closerSubtitle}
                        onChange={(e) => setCloserDraft({ ...closerDraft, closerSubtitle: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-1">
                      <label className="form-label admin-label">Button text</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={closerDraft.closerButtonText}
                        onChange={(e) => setCloserDraft({ ...closerDraft, closerButtonText: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                  </form>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={closeModal} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" form="closerForm" className="btn btn-warning btn-sm" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default AdminHomeEditor;