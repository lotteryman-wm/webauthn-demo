import { createContext, useContext, useMemo, useState } from "react";

export enum Page {
  Home = "HOME",
  Login1 = "LOGIN_1",
  Login2 = "LOGIN_2",
  Register = "REGISTER",
}

interface RouteContextValue {
  page: Page;
  navigate: (nextPage: Page) => void;
}

const RouteContext = createContext<RouteContextValue | undefined>(undefined);

export const RouteProvider = ({ children }: React.PropsWithChildren) => {
  const [page, setPage] = useState(Page.Home);

  const contextValue: RouteContextValue = useMemo(() => {
    return {
      page,
      navigate: setPage,
    };
  }, [page]);

  return (
    <RouteContext.Provider value={contextValue}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => {
  const context = useContext(RouteContext);

  if (!context) {
    throw new Error("RouteProvider를 제공해야 합니다.");
  }

  return context;
};
