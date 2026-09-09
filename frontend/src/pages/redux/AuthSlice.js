import { createSlice } from "@reduxjs/toolkit";

let user = null;

try {
  const storedUser =
    localStorage.getItem("user");

  if (
    storedUser &&
    storedUser !== "undefined"
  ) {
    user = JSON.parse(storedUser);
  }
} catch (error) {
  user = null;
}

const initialState = {
  token:
    localStorage.getItem("token") ||
    null,
  user,
  isAuth: !!localStorage.getItem(
    "token"
  ),
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    login: (state, action) => {
      const { token, user } =
        action.payload;

      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      state.token = token;
      state.user = user;
      state.isAuth = true;
    },

    logout: (state) => {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      state.token = null;
      state.user = null;
      state.isAuth = false;
    },

    updateUser: (
      state,
      action
    ) => {
      state.user = action.payload;

      localStorage.setItem(
        "user",
        JSON.stringify(
          action.payload
        )
      );
    },
  },
});

export const {
  login,
  logout,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;