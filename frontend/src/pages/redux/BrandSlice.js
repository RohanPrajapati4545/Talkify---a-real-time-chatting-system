import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

 
const resolveAssetUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
};

const CACHE_KEY = "cv_brand_cache";

const FALLBACK_DEFAULTS = {
  siteName: "Talkify",
  siteLogoUrl: "",
  siteFaviconUrl: "", 
  otpLoginEnabled: true,
};

 
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
        siteFaviconUrl: brand.siteFaviconUrl,  
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
    siteLogoUrl: resolveAssetUrl(settings.siteLogoUrl),
    siteFaviconUrl: resolveAssetUrl(settings.siteFaviconUrl), // NEW
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
// NOTE: this now reads siteFaviconUrl, NOT siteLogoUrl — logo and favicon
// are fully independent from here on.
if (typeof document !== "undefined") {
  document.title = cached.siteName;
  if (cached.siteFaviconUrl) {
    const link = document.getElementById("favicon");
    if (link) link.href = cached.siteFaviconUrl;
  }
}

// Swaps the <link id="favicon"> href at runtime — this is the only way to
// change a favicon after page load, since browsers only read it once from
// the static HTML otherwise.
const applyFavicon = (faviconUrl) => {
  if (!faviconUrl) return; // keep the default talkify_icon.png from index.html
  const link = document.getElementById("favicon");
  if (link) link.href = faviconUrl;
};

const brandSlice = createSlice({
  name: "brand",
  initialState,
  reducers: {
    // Used by the admin settings panel right after a successful save, so
    // every open tab/page reflects the change without waiting for a refetch.
    setBrand: (state, action) => {
      Object.assign(state, action.payload);
      // Only siteFaviconUrl changes should touch the actual <link> tag —
      // a logo-only save must NOT affect the browser tab icon anymore.
      if (action.payload.siteFaviconUrl !== undefined) {
        applyFavicon(action.payload.siteFaviconUrl);
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
        applyFavicon(action.payload.siteFaviconUrl);
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