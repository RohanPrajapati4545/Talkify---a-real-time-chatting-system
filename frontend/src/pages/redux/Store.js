import { configureStore } from "@reduxjs/toolkit"
import brandReducer from "./BrandSlice";
import authReducer from "./AuthSlice"

export const store = configureStore({

    reducer: {

        auth: authReducer,
         brand: brandReducer,

    }
})