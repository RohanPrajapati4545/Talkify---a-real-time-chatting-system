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
    
  }
};

 
export const fetchBrand = createAsyncThunk("brand/fetchBrand", async () => {
  const res = await axios.get(`${API_BASE_URL}/api/content/settings?_t=${Date.now()}`);
  const settings = res.data?.settings || {};

  return {
    siteName: settings.siteName || "Talkify",
    siteLogoUrl: resolveAssetUrl(settings.siteLogoUrl),
    siteFaviconUrl: resolveAssetUrl(settings.siteFaviconUrl),
    otpLoginEnabled: settings.otpLoginEnabled ?? true,
  };
});

const cached = loadCachedBrand();

const initialState = {
  ...cached,
  loading: true,
};

 
if (typeof document !== "undefined") {
  document.title = cached.siteName;
  if (cached.siteFaviconUrl) {
    const link = document.getElementById("favicon");
    if (link) link.href = cached.siteFaviconUrl;
  }
}

 
const applyFavicon = (faviconUrl) => {
  if (!faviconUrl) return; 
  const link = document.getElementById("favicon");
  if (link) link.href = faviconUrl;
};

const brandSlice = createSlice({
  name: "brand",
  initialState,
  reducers: {
  
    setBrand: (state, action) => {
      Object.assign(state, action.payload);
      
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
        document.title = state.siteName;  
        applyFavicon(action.payload.siteFaviconUrl);
        saveCachedBrand(state);
      })
      .addCase(fetchBrand.rejected, (state) => {
    
        state.loading = false;
      });
  },
});

export const { setBrand } = brandSlice.actions;
export default brandSlice.reducer;