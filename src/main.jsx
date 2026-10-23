import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { LoaderProvider } from "./components/loader/LoaderProvider.jsx";

import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./styles/index.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <LoaderProvider>
        <BrowserRouter basename="/Athar">
          <App />
        </BrowserRouter>
      </LoaderProvider>
  </React.StrictMode>
);
