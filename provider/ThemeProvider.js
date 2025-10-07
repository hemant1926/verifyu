"use client";
import React from "react";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { Windmill } from "@roketid/windmill-react-ui";
import PropTypes from "prop-types";
import { AuthProvider } from "@/context/authContext";

ThemeProvider.propTypes = {
  children: PropTypes.any.isRequired,
};
export default function ThemeProvider({ children }) {
  return (
    <AuthProvider>
      <Windmill usePreferences={true}>
        {children}
        <ToastContainer />
      </Windmill>
    </AuthProvider>
  );
}
