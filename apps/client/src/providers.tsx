import { Theme } from "@radix-ui/themes";
import { AuthProvider } from "./contexts/auth";
import { RouteProvider } from "./contexts/route";

export const Providers = ({ children }: React.PropsWithChildren) => {
  return (
    <RouteProvider>
      <AuthProvider>
        <Theme>{children}</Theme>
      </AuthProvider>
    </RouteProvider>
  );
};
