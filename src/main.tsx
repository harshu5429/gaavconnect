
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { registerServiceWorker, setupOfflineListener } from "./utils/offline";

  // Register service worker for offline support
  registerServiceWorker();

  // Setup offline listener
  setupOfflineListener((isOnline) => {
    console.log('Network status:', isOnline ? 'online' : 'offline');
  });

  createRoot(document.getElementById("root")!).render(<App />);
  