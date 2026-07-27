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

const CACHE_KEY = "cv_brand_cache";

const FALLBACK_DEFAULTS = {
  siteName: "Talkify",
  siteLogoUrl: "",
  otpLoginEnabled: true,
};

// Read whatever we cached from the last successful fetch, synchronously,
// before the first render happens. This is what stops the flash-of-default
// on reload — the very first paint already shows the real logo/name instead
// of "Talkify" + feather icon while the network request is still in flight.
const loadCachedBrand = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return FALLBACK_DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...FALLBACK_DEFAULTS, ...parsed };
  } catch {
    return FALLBACK_DEFAULTS;
  }
};

const saveCachedBrand = (brand) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        siteName: brand.siteName,
        siteLogoUrl: brand.siteLogoUrl,
        otpLoginEnabled: brand.otpLoginEnabled,
      })
    );
  } catch {
    // localStorage unavailable (e.g. private mode) — safe to ignore,
    // just means the flash-prevention cache won't work this session
  }
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

const cached = loadCachedBrand();

const initialState = {
  ...cached,
  loading: true,
};

// Apply the cached favicon immediately too — the <link id="favicon"> already
// exists in the static HTML by the time this module runs, so we don't have
// to wait for React to mount or for fetchBrand to resolve.
if (typeof document !== "undefined") {
  document.title = cached.siteName;
  if (cached.siteLogoUrl) {
    const link = document.getElementById("favicon");
    if (link) link.href = cached.siteLogoUrl;
  }
}

// Swaps the <link id="favicon"> href at runtime — this is the only way to
// change a favicon after page load, since browsers only read it once from
// the static HTML otherwise.
const applyFavicon = (logoUrl) => {
  if (!logoUrl) return; // keep the default talkify_icon.png from index.html
  const link = document.getElementById("favicon");
  if (link) link.href = logoUrl;
};

const brandSlice = createSlice({
  name: "brand",
  initialState,
  reducers: {
    // Used by the admin settings panel right after a successful save, so
    // every open tab/page reflects the change without waiting for a refetch.
    setBrand: (state, action) => {
      Object.assign(state, action.payload);
      if (action.payload.siteLogoUrl !== undefined) {
        applyFavicon(action.payload.siteLogoUrl);
      }
      saveCachedBrand(state);
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
        applyFavicon(action.payload.siteLogoUrl);
        saveCachedBrand(state);
      })
      .addCase(fetchBrand.rejected, (state) => {
        // keep whatever defaults/previous values were already in state
        state.loading = false;
      });
  },
});

export const { setBrand } = brandSlice.actions;
export default brandSlice.reducer;