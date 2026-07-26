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

const AboutEditor = () => {
  const { token } = useSelector((state) => state.auth);

  const [content, setContent] = useState(null); // full doc from backend
  const [loading, setLoading] = useState(true);

  // which popup is open: null | "hero" | "timeline-0".."timeline-3" | "value-0".."value-2" | "stats" | "closer"
  const [activeModal, setActiveModal] = useState(null);
  const [saving, setSaving] = useState(false);

  // local draft state for whichever modal is open
  const [heroDraft, setHeroDraft] = useState(null);
  const [timelineDraft, setTimelineDraft] = useState(null);
  const [valueDraft, setValueDraft] = useState(null);
  const [statsDraft, setStatsDraft] = useState(null);
  const [closerDraft, setCloserDraft] = useState(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/about-content`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent(res.data.content);
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not load about page content.");
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
      aboutTitleLine1: content.aboutTitleLine1,
      aboutTitleLine2: content.aboutTitleLine2,
      aboutLede: content.aboutLede,
    });
    setActiveModal("hero");
  };

  const openTimelineModal = (index) => {
    setTimelineDraft({ index, ...content.timelineEntries[index] });
    setActiveModal(`timeline-${index}`);
  };

  const openValueModal = (index) => {
    setValueDraft({ index, ...content.valueCards[index] });
    setActiveModal(`value-${index}`);
  };

  const openStatsModal = () => {
    setStatsDraft({
      statThreadsTarget: content.statThreadsTarget,
      statThreadsLabel: content.statThreadsLabel,
      statMessagesTarget: content.statMessagesTarget,
      statMessagesLabel: content.statMessagesLabel,
      statUptimeTarget: content.statUptimeTarget,
      statUptimeLabel: content.statUptimeLabel,
    });
    setActiveModal("stats");
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
    setTimelineDraft(null);
    setValueDraft(null);
    setStatsDraft(null);
    setCloserDraft(null);
  };

  // ---- save handlers — each PUTs the full content object (backend only
  // requires the fields you send, but sending the merged full object keeps
  // things simple and avoids ever losing another section's data) ----
  const saveSection = async (patch, successText) => {
    try {
      setSaving(true);
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/admin/about-content`,
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

  const handleSaveTimeline = (e) => {
    e.preventDefault();
    const { index, ...fields } = timelineDraft;
    const timelineEntries = [...content.timelineEntries];
    timelineEntries[index] = fields;
    saveSection({ timelineEntries }, `Timeline entry ${index + 1} updated.`);
  };

  const handleSaveValue = (e) => {
    e.preventDefault();
    const { index, ...fields } = valueDraft;
    const valueCards = [...content.valueCards];
    valueCards[index] = fields;
    saveSection({ valueCards }, `Value card ${index + 1} updated.`);
  };

  const handleSaveStats = (e) => {
    e.preventDefault();
    saveSection(statsDraft, "Stats section updated.");
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
        <h2 className="fw-bold mb-1">About Page Content</h2>
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
          {content.aboutTitleLine1} {content.aboutTitleLine2}
        </p>
        <p className="mb-0 text-muted">{content.aboutLede}</p>
      </div>

      {/* ===== TIMELINE ENTRIES SUMMARY ===== */}
      <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
        <h4 className="fw-bold mb-3">Timeline ("dispatch log" rows)</h4>
        <div className="row g-3">
          {content.timelineEntries.map((entry, index) => (
            <div className="col-12 col-md-6" key={index}>
              <div className="border rounded-3 p-3 h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="fw-bold">Entry {index + 1}</span>
                  <button
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => openTimelineModal(index)}
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

      {/* ===== VALUE CARDS SUMMARY ===== */}
      <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
        <h4 className="fw-bold mb-3">Values (the 3 cards)</h4>
        <div className="row g-3">
          {content.valueCards.map((card, index) => (
            <div className="col-12 col-md-4" key={index}>
              <div className="border rounded-3 p-3 h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="fw-bold">Card {index + 1}</span>
                  <button
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => openValueModal(index)}
                  >
                    <FaPen size={11} className="me-1" />
                    Edit
                  </button>
                </div>
                <p className="mb-1 fw-semibold">{card.title}</p>
                <p className="mb-0 text-muted small">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== STATS SUMMARY ===== */}
      <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h4 className="fw-bold m-0">Stats (count-up numbers)</h4>
          <button className="btn btn-sm btn-outline-warning" onClick={openStatsModal}>
            <FaPen size={11} className="me-1" />
            Edit
          </button>
        </div>
        <p className="mb-1 text-muted">
          {content.statThreadsTarget} {content.statThreadsLabel} · {content.statMessagesTarget}{" "}
          {content.statMessagesLabel} · {content.statUptimeTarget} {content.statUptimeLabel}
        </p>
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
                      <label className="form-label admin-label">Eyebrow</label>
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
                        value={heroDraft.aboutTitleLine1}
                        onChange={(e) => setHeroDraft({ ...heroDraft, aboutTitleLine1: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label admin-label">Title — line 2 (gradient text)</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={heroDraft.aboutTitleLine2}
                        onChange={(e) => setHeroDraft({ ...heroDraft, aboutTitleLine2: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-1">
                      <label className="form-label admin-label">Lede paragraph</label>
                      <textarea
                        className="form-control admin-input"
                        rows={3}
                        value={heroDraft.aboutLede}
                        onChange={(e) => setHeroDraft({ ...heroDraft, aboutLede: e.target.value })}
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

      {/* ===== TIMELINE ENTRY MODAL ===== */}
      {activeModal?.startsWith("timeline-") && timelineDraft && (
        <>
          <div className="modal fade show d-block admin-edit-modal" tabIndex="-1" role="dialog" onClick={closeModal}>
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Edit Timeline Entry {timelineDraft.index + 1}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} disabled={saving} aria-label="Close"></button>
                </div>

                <div className="modal-body">
                  <form id="timelineForm" onSubmit={handleSaveTimeline}>
                    <div className="mb-3">
                      <label className="form-label admin-label">Stamp label</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        placeholder="ENTRY 01 · DAY ONE"
                        value={timelineDraft.stamp}
                        onChange={(e) => setTimelineDraft({ ...timelineDraft, stamp: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label admin-label">Title</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={timelineDraft.title}
                        onChange={(e) => setTimelineDraft({ ...timelineDraft, title: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-1">
                      <label className="form-label admin-label">Description</label>
                      <textarea
                        className="form-control admin-input"
                        rows={3}
                        value={timelineDraft.description}
                        onChange={(e) => setTimelineDraft({ ...timelineDraft, description: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                  </form>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={closeModal} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" form="timelineForm" className="btn btn-warning btn-sm" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* ===== VALUE CARD MODAL ===== */}
      {activeModal?.startsWith("value-") && valueDraft && (
        <>
          <div className="modal fade show d-block admin-edit-modal" tabIndex="-1" role="dialog" onClick={closeModal}>
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Edit Value Card {valueDraft.index + 1}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} disabled={saving} aria-label="Close"></button>
                </div>

                <div className="modal-body">
                  <form id="valueForm" onSubmit={handleSaveValue}>
                    <div className="mb-3">
                      <label className="form-label admin-label">Icon (Font Awesome class)</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        placeholder="fa-solid fa-bolt"
                        value={valueDraft.icon}
                        onChange={(e) => setValueDraft({ ...valueDraft, icon: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label admin-label">Title</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={valueDraft.title}
                        onChange={(e) => setValueDraft({ ...valueDraft, title: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-1">
                      <label className="form-label admin-label">Description</label>
                      <textarea
                        className="form-control admin-input"
                        rows={3}
                        value={valueDraft.description}
                        onChange={(e) => setValueDraft({ ...valueDraft, description: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                  </form>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={closeModal} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" form="valueForm" className="btn btn-warning btn-sm" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* ===== STATS MODAL ===== */}
      {activeModal === "stats" && statsDraft && (
        <>
          <div className="modal fade show d-block admin-edit-modal" tabIndex="-1" role="dialog" onClick={closeModal}>
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Edit Stats Section</h5>
                  <button type="button" className="btn-close" onClick={closeModal} disabled={saving} aria-label="Close"></button>
                </div>

                <div className="modal-body">
                  <form id="statsForm" onSubmit={handleSaveStats}>
                    <div className="row g-3 mb-1">
                      <div className="col-12">
                        <label className="form-label admin-label">Threads — target value</label>
                        <input
                          type="text"
                          className="form-control admin-input"
                          placeholder="10000+"
                          value={statsDraft.statThreadsTarget}
                          onChange={(e) => setStatsDraft({ ...statsDraft, statThreadsTarget: e.target.value })}
                          disabled={saving}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label admin-label">Threads — label</label>
                        <input
                          type="text"
                          className="form-control admin-input"
                          value={statsDraft.statThreadsLabel}
                          onChange={(e) => setStatsDraft({ ...statsDraft, statThreadsLabel: e.target.value })}
                          disabled={saving}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label admin-label">Messages — target value</label>
                        <input
                          type="text"
                          className="form-control admin-input"
                          placeholder="2000000+"
                          value={statsDraft.statMessagesTarget}
                          onChange={(e) => setStatsDraft({ ...statsDraft, statMessagesTarget: e.target.value })}
                          disabled={saving}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label admin-label">Messages — label</label>
                        <input
                          type="text"
                          className="form-control admin-input"
                          value={statsDraft.statMessagesLabel}
                          onChange={(e) => setStatsDraft({ ...statsDraft, statMessagesLabel: e.target.value })}
                          disabled={saving}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label admin-label">Uptime — target value</label>
                        <input
                          type="text"
                          className="form-control admin-input"
                          placeholder="99.9%"
                          value={statsDraft.statUptimeTarget}
                          onChange={(e) => setStatsDraft({ ...statsDraft, statUptimeTarget: e.target.value })}
                          disabled={saving}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label admin-label">Uptime — label</label>
                        <input
                          type="text"
                          className="form-control admin-input"
                          value={statsDraft.statUptimeLabel}
                          onChange={(e) => setStatsDraft({ ...statsDraft, statUptimeLabel: e.target.value })}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </form>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={closeModal} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" form="statsForm" className="btn btn-warning btn-sm" disabled={saving}>
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

export default AboutEditor;