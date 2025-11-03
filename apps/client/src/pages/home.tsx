import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { useAuth } from "../contexts/auth";
import { Page, useRoute } from "../contexts/route";

export const HomePage = () => {
  const { isLoggedIn, id, logout } = useAuth();
  const { navigate } = useRoute();

  return (
    <Flex
      direction="column"
      gap="4"
      p="5"
      style={{ maxWidth: 600, border: "1px solid var(--gray-7)" }}
    >
      <Heading size="5">1. 홈 화면</Heading>

      <Text size="3">
        <strong>로그인 여부: </strong>
        {isLoggedIn ? (
          <Text color="green" weight="bold">
            ✅ 로그인 중 ({id})
          </Text>
        ) : (
          <Text color="red" weight="bold">
            ❌ 로그아웃 상태
          </Text>
        )}
      </Text>
      <Text size="3">
        <strong>브라우저의 WebAuthn 지원 여부: </strong>
        {browserSupportsWebAuthn() ? (
          <Text color="green" weight="bold">
            ✅
          </Text>
        ) : (
          <Text color="red" weight="bold">
            ❌
          </Text>
        )}
      </Text>

      {isLoggedIn ? (
        <Button onClick={logout} variant="solid" color="red">
          로그아웃
        </Button>
      ) : (
        <Flex direction="column" gap="2" mt="4">
          <Button onClick={() => navigate(Page.Register)} variant="soft">
            2. 계정 등록 (PassKey 등록)
          </Button>
          <Button onClick={() => navigate(Page.Login1)} variant="soft">
            3. 로그인 예시 1 (PassKey 자동 로그인)
          </Button>
          <Button onClick={() => navigate(Page.Login2)} variant="soft">
            4. 로그인 예시 2 (PassKey 기반 MFA)
          </Button>
        </Flex>
      )}
    </Flex>
  );
};
