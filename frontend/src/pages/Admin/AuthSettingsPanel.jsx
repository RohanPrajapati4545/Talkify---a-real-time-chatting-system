import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";

const swalTheme = {
  background: "#1c1812",
  color: "#f2ece2",
  confirmButtonColor: "#e8a33d",
};

const showErrorAlert = (error, fallbackText) => {
  const backendMsg = error?.response?.data?.msg || error?.response?.data?.message;
  Swal.fire({ title: "Error", text: backendMsg || fallbackText, icon: "error", ...swalTheme });
};

const AuthSettingsPanel = () => {
  const { token } = useSelector((state) => state.auth);

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/settings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(res.data.settings);
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

  if (loading || !settings) {
    return <div className="dashboard-wrapper p-4">Loading…</div>;
  }

  return (
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
  );
};

export default AuthSettingsPanel;