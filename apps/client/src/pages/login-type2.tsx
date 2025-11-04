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

export const LoginType2Page = () => {
  const { navigate } = useRoute();
  const { login, webAuthn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1); // 1: ID/PW 입력, 2: MFA 대기

  useEffect(() => {
    return () => {
      webAuthn.cancelCeremony();
    };
  }, []);

  const handleInitialLogin = () => {
    if (!username || !password) {
      alert("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }
    // 1. ID/PW 검증 성공했다고 가정
    setStep(2);

    // 2. WebAuthn MFA 호출
    handleMFA();
  };

  const handleMFA = async () => {
    try {
      const optionsJSON = await webAuthn.authenticate.generateOptions(username);

      const authenticationJSON =
        await webAuthn.authenticate.startAuthentication(optionsJSON);

      const { username: loggedInUsername } = await webAuthn.authenticate.verify(
        authenticationJSON,
        username
      );

      alert(`✅ MFA 성공! 로그인 완료.`);
      login(loggedInUsername);
      setStep(1); // 상태 초기화
      navigate(Page.Home);
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

      alert(`❌ MFA 실패. 다시 시도해주세요. (${message})`);
      setStep(1); // 상태 초기화
    }
  };

  return (
    <Flex
      direction="column"
      gap="4"
      p="5"
      style={{ maxWidth: 600, border: "1px solid var(--green-7)" }}
    >
      <Heading size="5">4. 로그인 예시 2 (WebAuthn MFA)</Heading>
      <Text size="2">
        ID/PW 방식과 혼용하여 2단계 인증으로 PassKey를 사용할 수도 있습니다.
      </Text>

      {step === 1 && (
        <>
          <Flex direction="column" gap="2">
            <TextField.Root
              name="username"
              type="text"
              placeholder="아이디"
              autoComplete="username webauthn"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              size="2"
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
            <Button onClick={handleInitialLogin} color="green">
              ID/PW 입력 (1단계)
            </Button>
          </Flex>

          <Callout.Root color="gray" size="1">
            <Callout.Text>
              아이디, 비밀번호를 입력하면 MFA 인증 화면으로 넘어갑니다.
            </Callout.Text>
          </Callout.Root>
        </>
      )}

      {step === 2 && (
        <Callout.Root color="yellow" size="2">
          <Callout.Text>
            <h3>🔒 MFA(2단계 인증) 대기 중...</h3>
            <p>
              WebAuthn 프롬프트에 생체 인식 또는 PIN을 입력하세요. (인증 대기
              중입니다.)
            </p>
          </Callout.Text>
        </Callout.Root>
      )}

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
