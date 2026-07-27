import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// If the backend gave us a relative multer path (e.g. "uploads/logo-123.png"),
// prefix it with the API host so <img src> resolves correctly even when the
// frontend and backend run on different ports/origins in dev.
const resolveLogoUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
};

// Public, no-auth fetch — same endpoint used by Login and any other page
// that needs the current branding/feature toggles.
export const fetchBrand = createAsyncThunk("brand/fetchBrand", async () => {
  const res = await axios.get(`${API_BASE_URL}/api/content/settings?_t=${Date.now()}`);
  const settings = res.data?.settings || {};

  return {
    siteName: settings.siteName || "Talkify",
    siteLogoUrl: resolveLogoUrl(settings.siteLogoUrl),
    otpLoginEnabled: settings.otpLoginEnabled ?? true,
  };
});

const initialState = {
  siteName: "Talkify",
  siteLogoUrl: "",
  otpLoginEnabled: true,
  loading: true,
};

const brandSlice = createSlice({
  name: "brand",
  initialState,
  reducers: {
    // Used by the admin settings panel right after a successful save, so
    // every open tab/page reflects the change without waiting for a refetch.
    setBrand: (state, action) => {
      Object.assign(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrand.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBrand.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.loading = false;
        document.title = state.siteName; // keep the browser tab in sync too
      })
      .addCase(fetchBrand.rejected, (state) => {
        // keep whatever defaults/previous values were already in state
        state.loading = false;
      });
  },
});

export const { setBrand } = brandSlice.actions;
export default brandSlice.reducer;