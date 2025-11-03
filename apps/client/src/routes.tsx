import { Page, useRoute } from "./contexts/route";
import { HomePage } from "./pages/home";
import { LoginType1Page } from "./pages/login-type1";
import { LoginType2Page } from "./pages/login-type2";
import { RegisterPage } from "./pages/register";

const getPageComponent = (page: Page) => {
  switch (page) {
    case Page.Home: {
      return HomePage;
    }
    case Page.Register: {
      return RegisterPage;
    }
    case Page.Login1: {
      return LoginType1Page;
    }
    case Page.Login2: {
      return LoginType2Page;
    }
    default: {
      return HomePage;
    }
  }
};

export const Routes = () => {
  const router = useRoute();

  const PageComponent = getPageComponent(router.page);
  return <PageComponent key={router.page} />;
};
