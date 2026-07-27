import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { setBrand } from "../redux/BrandSlice";

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

const resolveLogoUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${process.env.REACT_APP_API_URL}/${path.replace(/^\/+/, "")}`;
};

const AuthSettingsPanel = () => {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // draft for the site-name text field (separate from settings so typing
  // doesn't PUT on every keystroke)
  const [nameDraft, setNameDraft] = useState("");
  const [logoPreview, setLogoPreview] = useState(""); // local blob preview while a file is picked

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/settings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(res.data.settings);
      setNameDraft(res.data.settings.siteName || "");
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleOtpLogin = async () => {
    const nextValue = !settings.otpLoginEnabled;

    // optimistic update so the switch feels instant
    setSettings((prev) => ({ ...prev, otpLoginEnabled: nextValue }));
    setSaving(true);

    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/admin/settings`,
        { otpLoginEnabled: nextValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(res.data.settings);
    } catch (error) {
      console.log(error);
      // roll back on failure
      setSettings((prev) => ({ ...prev, otpLoginEnabled: !nextValue }));
      showErrorAlert(error, "Could not update setting.");
    } finally {
      setSaving(false);
    }
  };

  const saveSiteName = async () => {
    if (!nameDraft.trim()) {
      return showErrorAlert(null, "Site name can't be empty.");
    }

    setSaving(true);
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/admin/settings`,
        { siteName: nameDraft.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(res.data.settings);
      dispatch(setBrand({ siteName: res.data.settings.siteName }));
      showSuccessAlert("Site name updated.");
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not save site name.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // quick client-side guard — real validation still belongs on the backend
    if (!file.type.startsWith("image/")) {
      showErrorAlert(null, "Please choose an image file.");
      return;
    }

    setLogoPreview(URL.createObjectURL(file));
    uploadLogo(file);
  };

  const uploadLogo = async (file) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/settings/logo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSettings(res.data.settings);
      dispatch(setBrand({ siteLogoUrl: resolveLogoUrl(res.data.settings.siteLogoUrl) }));
      showSuccessAlert("Logo updated.");
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not upload logo.");
    } finally {
      setUploadingLogo(false);
      setLogoPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading || !settings) {
    return <div className="dashboard-wrapper p-4">Loading…</div>;
  }

  const currentLogoSrc = logoPreview || resolveLogoUrl(settings.siteLogoUrl);

  return (
    <>
      {/* ===== BRANDING ===== */}
      <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
        <h4 className="fw-bold mb-3">Branding</h4>

        <div className="mb-4">
          <label className="form-label admin-label">Site name</label>
          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control admin-input"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              disabled={saving}
              maxLength={40}
            />
            <button
              type="button"
              className="btn btn-warning btn-sm"
              onClick={saveSiteName}
              disabled={saving || nameDraft.trim() === settings.siteName}
            >
              Save
            </button>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Shown on the sign-in page, browser tab, and anywhere else the brand name appears.
          </p>
        </div>

        <div>
          <label className="form-label admin-label d-block">Logo</label>
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-3 border"
              style={{ width: 64, height: 64, overflow: "hidden", background: "#faf7f2" }}
            >
              {currentLogoSrc ? (
                <img src={currentLogoSrc} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <i className="fa-solid fa-feather-pointed" style={{ fontSize: "1.5rem" }}></i>
              )}
            </div>

            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleLogoPick}
                disabled={uploadingLogo}
                className="form-control form-control-sm"
                style={{ maxWidth: 240 }}
              />
              <p className="text-muted small mb-0 mt-1">
                {uploadingLogo ? "Uploading…" : "PNG or SVG works best. Replaces the feather icon everywhere."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== LOGIN OPTIONS ===== */}
      <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
        <h4 className="fw-bold mb-3">Login Options</h4>

        <div className="d-flex justify-content-between align-items-center">
          <div>
            <p className="mb-1 fw-semibold">OTP Login</p>
            <p className="mb-0 text-muted small">
              When off, users only see the Password tab on the sign-in page — the
              OTP tab is hidden site-wide.
            </p>
          </div>

          <div className="form-check form-switch m-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              style={{ width: "2.5rem", height: "1.4rem", cursor: "pointer" }}
              checked={settings.otpLoginEnabled}
              onChange={toggleOtpLogin}
              disabled={saving}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthSettingsPanel;