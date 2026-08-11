import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/noto-serif-ethiopic/400.css";
import "@fontsource/noto-serif-ethiopic/500.css";
import "@fontsource/noto-serif-ethiopic/600.css";
import "@fontsource/noto-serif-ethiopic/700.css";

import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
