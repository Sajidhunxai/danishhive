import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handler to catch unhandled errors and prevent page refreshes
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Prevent default error handling (which might cause page refresh)
  event.preventDefault();
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent default error handling
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
