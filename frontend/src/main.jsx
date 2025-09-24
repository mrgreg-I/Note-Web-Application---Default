import React from "react";
import ReactDOM from "react-dom/client"; // Use 'react-dom/client'
import App from "./App";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";
import "@fontsource/poppins"; // Defaults to 400 weight


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
