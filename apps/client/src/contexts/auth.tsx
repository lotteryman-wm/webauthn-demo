import {
  startAuthentication,
  startRegistration,
  WebAuthnAbortService,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import ky from "ky";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { logger } from "../libs/logger";

interface UserState {
  id: string | null;
  isLoggedIn: boolean;
}

interface WebAuthn {
  register: {
    generateOptions: (
      username: string
    ) => Promise<PublicKeyCredentialCreationOptionsJSON>;
    startRegistration: (
      optionsJSON: PublicKeyCredentialCreationOptionsJSON
    ) => Promise<RegistrationResponseJSON>;
    verify: (
      registrationJSON: RegistrationResponseJSON,
      username: string
    ) => Promise<void>;
  };

  authenticate: {
    generateOptions: (
      username?: string
    ) => Promise<PublicKeyCredentialCreationOptionsJSON>;
    startAuthentication: (
      optionsJSON: PublicKeyCredentialCreationOptionsJSON,
      options?: Pick<
        Parameters<typeof startAuthentication>[0],
        "useBrowserAutofill" | "verifyBrowserAutofillInput"
      >
    ) => Promise<AuthenticationResponseJSON>;
    verify: (
      authenticationJSON: AuthenticationResponseJSON,
      username?: string
    ) => Promise<{ username: string }>;
  };

  cancelCeremony: () => void;
}

interface AuthContextValue extends UserState {
  login: (username: string) => void;
  logout: () => void;
  webAuthn: WebAuthn;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_URL = "https://localhost:3001";

const createLogger = (tagName: string) => {
  return (message: string) => logger.info("\n" + message, tagName);
};

const webAuthn: WebAuthn = {
  /**
   * 등록 과정
   */
  register: {
    generateOptions: async (username) => {
      const logInfo = createLogger("WebAuthn:Registration");

      // 1. 서버로부터 Registration에 필요한 정보 요청
      logInfo(
        "서버로부터 Registration에 필요한 정보(Challenge, 등록 옵션 정보)를 요청합니다."
      );

      const generateOptionsResponse = await ky.get(
        `${API_URL}/web-authn/registration/generate-options?username=${username}`,
        {
          credentials: "include",
        }
      );
      const optionsJSON =
        await generateOptionsResponse.json<PublicKeyCredentialCreationOptionsJSON>();
      logInfo(
        `서버가 전달한 Challenge, 자격증명:\n${JSON.stringify(optionsJSON, null, 2)}`
      );

      return optionsJSON;
    },
    startRegistration: async (optionsJSON) => {
      const logInfo = createLogger("WebAuthn:Registration");

      // 2. 서버로부터 받은 정보를 바탕으로 사용할 인증기에서 서명된 Challenge, 자격 증명 생성
      logInfo(
        "서버로부터 받은 정보를 바탕으로 사용할 인증기의 서명된 Challenge, 자격 증명을 생성합니다."
      );
      const registration = await startRegistration({ optionsJSON });
      logInfo(
        `서명된 Challenge, 자격 증명:\n${JSON.stringify(registration, null, 2)}`
      );

      return registration;
    },
    verify: async (registrationJSON, username) => {
      const logInfo = createLogger("WebAuthn:Registration");

      // 3. 서명된 Challenge, 자격 증명을 서버로 전달하여 검증 및 Registration 완료
      logInfo(
        "서명된 Challenge, 자격 증명을 서버로 전송하여 Registration을 완료합니다."
      );
      await ky.post(`${API_URL}/web-authn/registration/verify`, {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          registration: registrationJSON,
        }),
        credentials: "include",
      });
    },
  },

  /**
   * 실제 인증 처리
   */
  authenticate: {
    generateOptions: async (username) => {
      const logInfo = createLogger("WebAuthn:Authentication");

      // 1. 서버로부터 Registration에 필요한 정보 요청
      logInfo(
        "서버로부터 Authentication에 필요한 정보(Challenge)를 요청합니다."
      );

      const apiUrl = username
        ? `${API_URL}/web-authn/authentication/generate-options?username=${username}`
        : `${API_URL}/web-authn/authentication/generate-options`;

      const generateOptionsResponse = await ky.get(apiUrl, {
        credentials: "include",
      });
      const optionsJSON =
        await generateOptionsResponse.json<PublicKeyCredentialCreationOptionsJSON>();

      logInfo(
        `서버가 전달한 Challenge, 자격증명:\n${JSON.stringify(optionsJSON, null, 2)}`
      );

      return optionsJSON;
    },
    startAuthentication: async (optionsJSON, options) => {
      const logInfo = createLogger("WebAuthn:Authentication");

      // 2. 서버로부터 받은 정보를 바탕으로 인증기를 통해 서명된 Challenge를 생성
      logInfo(
        "서버로부터 받은 정보를 바탕으로 인증기를 통해 서명된 Challenge를 생성합니다."
      );
      const authentication = await startAuthentication({
        ...options,
        optionsJSON,
      });
      logInfo(`서명된 Challenge:\n${JSON.stringify(authentication, null, 2)}`);

      return authentication;
    },
    verify: async (authenticationJSON, username) => {
      const logInfo = createLogger("WebAuthn:Authentication");

      // 3. 서명된 Challenge를 서버로 전달하여 Authentication 완료
      logInfo(
        "서명된 Challenge를 서버로 전송하여 Authentication을 완료합니다."
      );

      const data: {
        username?: string;
        authentication: AuthenticationResponseJSON;
      } = {
        username,
        authentication: authenticationJSON,
      };
      Object.keys(data).forEach((key) => {
        const typedKey = key as unknown as keyof typeof data;
        if (!data[typedKey]) {
          delete data[typedKey];
        }
      });

      const verifyResponse = await ky.post(
        `${API_URL}/web-authn/authentication/verify`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include",
        }
      );

      return verifyResponse.json<{ username: string }>();
    },
  },

  /**
   * Abort
   */
  cancelCeremony: () => {
    WebAuthnAbortService.cancelCeremony();
  },
};

export const AuthProvider = ({ children }: React.PropsWithChildren) => {
  const [userState, setUserState] = useState<UserState>({
    id: null,
    isLoggedIn: false,
  });

  const login = useCallback((id: string) => {
    setUserState({ id, isLoggedIn: true });
  }, []);

  const logout = useCallback(() => {
    setUserState({
      id: null,
      isLoggedIn: false,
    });
  }, []);

  const contextValue: AuthContextValue = useMemo(() => {
    return {
      ...userState,
      logout,
      login,
      webAuthn,
    };
  }, [userState, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("AuthProvider를 제공해야 합니다.");
  }

  return context;
};
