import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./styles.css";

// Met en cache l'application : elle s'ouvre ensuite sans connexion.
// (Inactif quand la page est ouverte directement depuis un fichier.)
if (location.protocol.startsWith("http") && "serviceWorker" in navigator) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
