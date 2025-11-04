import { Button, Callout, Flex, Heading, TextField } from "@radix-ui/themes";
import { HTTPError } from "ky";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/auth";
import { Page, useRoute } from "../contexts/route";

export const RegisterPage = () => {
  const { webAuthn } = useAuth();
  const { navigate } = useRoute();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      webAuthn.cancelCeremony();
    };
  }, []);

  const handleRegister = async () => {
    if (!username) {
      alert("아이디를 입력해주세요.");
      return;
    }
    setLoading(true);
    setMessage(`[${username}] WebAuthn 등록을 요청 중...`);

    try {
      const optionsJSON = await webAuthn.register.generateOptions(username);

      const registrationJSON =
        await webAuthn.register.startRegistration(optionsJSON);

      await webAuthn.register.verify(registrationJSON, username);

      setMessage(`✅ 등록 성공! 로그인 상태로 전환.`);
      setLoading(false);
      navigate(Page.Home);
    } catch (error) {
      let message: string = `알 수 없는 오류: ${error}`;

      if (error instanceof HTTPError) {
        const errorBody = await error.response.json();
        message = errorBody.error as string;
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

      setMessage(`❌ 등록 실패: ${message}`);
      setLoading(false);
    }
  };

  return (
    <Flex
      direction="column"
      gap="4"
      p="5"
      style={{ maxWidth: 600, border: "1px solid var(--blue-7)" }}
    >
      <Heading size="5">2. 계정 PassKey 등록</Heading>

      <Flex direction="column" gap="2">
        <TextField.Root
          name="username"
          type="text"
          placeholder="아이디 입력 (등록할 사용자)"
          autoComplete="username webauthn"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          size="2"
          disabled={loading}
        />
        <Button onClick={handleRegister} color="blue" disabled={loading}>
          {loading ? "등록 처리 중..." : "PassKey Register 처리"}
        </Button>
      </Flex>

      <Callout.Root
        color={message.startsWith("✅") ? "green" : message ? "red" : "gray"}
        size="1"
      >
        <Callout.Text>
          {message || "아이디 입력 후 등록 버튼을 누르세요."}
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
