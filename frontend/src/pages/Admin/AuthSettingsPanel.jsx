// ============================================
// AuthSettingsPanel.jsx
// ============================================
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingBranding, setSavingBranding] = useState(false);
  const [savingLogin, setSavingLogin] = useState(false);

  const [nameDraft, setNameDraft] = useState("");

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

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

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const toggleOtpLogin = async () => {
    const nextValue = !settings.otpLoginEnabled;

    setSettings((prev) => ({ ...prev, otpLoginEnabled: nextValue }));
    setSavingLogin(true);

    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/admin/settings`,
        { otpLoginEnabled: nextValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(res.data.settings);
    } catch (error) {
      console.log(error);
      setSettings((prev) => ({ ...prev, otpLoginEnabled: !nextValue }));
      showErrorAlert(error, "Could not update setting.");
    } finally {
      setSavingLogin(false);
    }
  };

  const handleLogoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showErrorAlert(null, "Please choose an image file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const clearLogoStaging = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const nameChanged = nameDraft.trim() !== (settings?.siteName || "");
  const brandingDirty = nameChanged || !!logoFile;

  const saveBranding = async () => {
    if (!brandingDirty) return;

    if (nameChanged && !nameDraft.trim()) {
      return showErrorAlert(null, "Site name can't be empty.");
    }

    setSavingBranding(true);
    try {
      let latestSettings = settings;
      const brandUpdate = {};

      if (nameChanged) {
        const res = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/admin/settings`,
          { siteName: nameDraft.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        latestSettings = res.data.settings;
        brandUpdate.siteName = latestSettings.siteName;
      }

      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);

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
        latestSettings = res.data.settings;
        brandUpdate.siteLogoUrl = resolveLogoUrl(latestSettings.siteLogoUrl);
      }

      setSettings(latestSettings);
      setNameDraft(latestSettings.siteName || "");
      dispatch(setBrand(brandUpdate));
      clearLogoStaging();
      showSuccessAlert("Branding updated.");
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not save branding.");
    } finally {
      setSavingBranding(false);
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
        <button
          type="button"
          className="btn btn-sm btn-outline-dark mb-3"
          onClick={() => navigate("/admin/settings")}
        >
          <i className="fa-solid fa-arrow-left me-1"></i>
          Back to Settings
        </button>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-0">Branding</h4>
          <button
            type="button"
            className="btn btn-warning btn-sm px-3"
            onClick={saveBranding}
            disabled={savingBranding || !brandingDirty}
          >
            {savingBranding ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className=" rounded-3 p-3 h-100" style={{border:"1px solid #493913"}}>
              <label className="form-label admin-label fw-semibold">Site name</label>
              <input
                type="text"
                className="form-control admin-input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                disabled={savingBranding}
                maxLength={40}
              />
              <p className=" small mb-0 mt-2" style={{color:"#4d4b48"}}>
                it will show on the sign-in page, browser tab, and anywhere.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className=" rounded-3 p-3 h-100" style={{border:"1px solid #493913"}}>
              <label className="form-label admin-label fw-semibold d-block">Logo</label>
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 border flex-shrink-0"
                  style={{ width: 64, height: 64, overflow: "hidden", background: "#faf7f2" }}
                >
                  {currentLogoSrc ? (
                    <img
                      src={currentLogoSrc}
                      alt="Logo"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <i className="fa-solid fa-feather-pointed" style={{ fontSize: "1.5rem" }}></i>
                  )}
                </div>

                <div className="flex-grow-1">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleLogoPick}
                    disabled={savingBranding}
                    className="form-control form-control-sm"
                  />
                  <p className=" small mb-0 mt-1" style={{color:"#4d4b48"}}>
                    {logoFile
                      ? `${logoFile.name} — will upload on Save`
                      : "PNG or SVG works best." }
                  </p>
                  {logoFile && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 mt-1"
                      onClick={clearLogoStaging}
                      disabled={savingBranding}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== LOGIN OPTIONS ===== */}
      <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
        <h4 className="fw-bold mb-3">Login Options</h4>

        <div className=" rounded-3 p-3 d-flex justify-content-between align-items-center" style={{border:"1px solid #493913"}}>
          <div>
            <p className="mb-1 fw-semibold">OTP Login</p>
            <p className="mb-0  small" style={{color:"#4d4b48"}}>
              When off, users only see the Password tab on the sign-in page — the
              OTP tab will be hide.
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
              disabled={savingLogin}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthSettingsPanel;