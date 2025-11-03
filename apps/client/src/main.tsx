import { ThemePanel } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { createRoot } from "react-dom/client";
import { Providers } from "./providers";
import { Routes } from "./routes";
import "./style.css";

const App = () => (
  <Providers>
    <Routes />
    <ThemePanel defaultOpen={false} />
  </Providers>
);

createRoot(document.getElementById("app")!).render(<App />);
