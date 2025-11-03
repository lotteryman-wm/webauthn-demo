import {
  Button,
  Callout,
  Flex,
  Heading,
  Text,
  TextField,
} from "@radix-ui/themes";
import { HTTPError } from "ky";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/auth";
import { Page, useRoute } from "../contexts/route";

export const LoginType1Page = () => {
  const { navigate } = useRoute();
  const { login, authenticate } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    /**
     * 아이디 입력 없이 PassKey로 직접 로그인하는 방식
     */
    async function handleAutoFillLogin() {
      try {
        const optionsJSON = await authenticate.generateOptions();

        /**
         * authenticationJSON은 Input 필드 내에서 PassKey 로그인 호출 시 Promise를 반환합니다.
         */
        const authenticationJSON = await authenticate.startAuthentication(
          optionsJSON,
          {
            useBrowserAutofill: true,
          }
        );

        setLoading(true);

        const { username: loggedInUsername } =
          await authenticate.verify(authenticationJSON);

        setMessage(`✅ 로그인 성공! (WebAuthn 인증 완료)`);
        login(loggedInUsername);
        setLoading(false);
        setTimeout(() => navigate(Page.Home), 1000);
      } catch (error) {
        let message: string = `알 수 없는 오류: ${error}`;

        if (error instanceof HTTPError) {
          const errorBody = await error.response.json<{ error: string }>();
          message = errorBody.error;
        } else if (error instanceof Error) {
          switch (error.name) {
            case "InvalidStateError": {
              message = "이미 Authenticator가 등록되었습니다.";
              break;
            }
            case "NotAllowedError": {
              message =
                "사용자가 인증 프롬프트를 닫았거나, 시간 초과되었습니다.";
              break;
            }
            case "AbortError": {
              // 사용자가 직접 로그인하려는 경우 취소
              return;
            }
            default: {
              // DO NOTHING
            }
          }
        }

        setMessage(`❌ 로그인 실패: ${message}`);
        setLoading(false);
      }
    }

    handleAutoFillLogin();

    return () => {
      authenticate.cancelMemory();
    };
  }, []);

  const handleManualLogin = async () => {
    if (!username || !password) {
      alert("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }
    setLoading(true);

    try {
      const optionsJSON = await authenticate.generateOptions(username);

      const authenticationJSON =
        await authenticate.startAuthentication(optionsJSON);

      const { username: loggedInUsername } = await authenticate.verify(
        authenticationJSON,
        username
      );

      setMessage(`✅ 로그인 성공! (WebAuthn 인증 완료)`);
      login(loggedInUsername);
      setLoading(false);
      setTimeout(() => navigate(Page.Home), 1000);
    } catch (error) {
      let message: string = `알 수 없는 오류: ${error}`;

      if (error instanceof HTTPError) {
        const errorBody = await error.response.json<{ error: string }>();
        message = errorBody.error;
      } else if (error instanceof Error) {
        switch (error.name) {
          case "InvalidStateError": {
            message = "이미 Authenticator가 등록되었습니다.";
            break;
          }
          case "NotAllowedError": {
            message = "사용자가 인증 프롬프트를 닫았거나, 시간 초과되었습니다.";
            break;
          }
          default: {
            // DO NOTHING
          }
        }
      }

      setMessage(`❌ 로그인 실패: ${message}`);
      setLoading(false);
    }
  };

  return (
    <Flex
      direction="column"
      gap="4"
      p="5"
      style={{ maxWidth: 600, border: "1px solid var(--orange-7)" }}
    >
      <Heading size="5">3. 로그인 예시 1 (PassKey 자동 로그인)</Heading>
      <Text size="2">
        아이디 또는 비밀번호 필드 클릭 시 PassKey 로그인을 시도할 수 있습니다.
      </Text>

      <Flex direction="column" gap="2">
        <TextField.Root
          name="username"
          type="text"
          placeholder="아이디"
          autoComplete="username webauthn"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          size="2"
          disabled={loading}
        />
        <TextField.Root
          name="password"
          type="password"
          placeholder="비밀번호"
          autoComplete="current-password webauthn"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          size="2"
        />
        <Button onClick={handleManualLogin} color="orange" disabled={loading}>
          {loading ? "인증 처리 중..." : "WebAuthn 인증 및 로그인"}
        </Button>
      </Flex>

      <Callout.Root
        color={message.startsWith("✅") ? "green" : message ? "red" : "gray"}
        size="1"
      >
        <Callout.Text>
          {message || "입력 필드 클릭 시 PassKey 선택이 활성화됩니다."}
        </Callout.Text>
      </Callout.Root>

      <Button
        onClick={() => navigate(Page.Home)}
        variant="ghost"
        style={{ marginTop: 10 }}
      >
        홈으로 돌아가기
      </Button>
    </Flex>
  );
};
