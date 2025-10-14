import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Disable console logs in production
if (process.env.NODE_ENV === "production") {
  const noop = function () {};
  const methods = ["log", "debug", "info", "warn"];

  // Save original console.error for critical errors
  const originalError = console.error;

  methods.forEach((method) => {
    console[method] = noop;
  });

  // Keep console.error functional for critical errors
  console.error = originalError;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
