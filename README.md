# WebAuthn 기반 PassKey 데모

## Getting Started

### Installation

Node.js 및 패키지 매니저 정보는 다음과 같습니다.

- Node.js: `^22`
- Package Manager: `pnpm@8.15.6`

```bash
$ pnpm install
```

### Start Apps

본 레포지토리는 Turborepo로 작성되어 있으며, 클라이언트와 서버 모두 개발환경을 띄워야 합니다.

```bash
pnpm run dev # Turborepo에서 client, server 개발환경 실행
```

클라이언트와 서버 URL은 다음과 같습니다.

- client: https://localhost:3000
- server: http://localhost:3001

## Play demo

데모는 WebAuthn 기반으로 구현된 PassKey 방식을 체험해볼 수 있도록 되어 있습니다.
[계정 등록]을 통해 해당 계정의 PassKey를 등록하고, 각각의 로그인 시나리오를 테스트할 수 있습니다.

### PassKey 자동 로그인

PW 방식 대신 PassKey만으로 로그인하는 방식을 테스트합니다.

### MFA 로그인

전통적인 ID + PW 방식과 함께 2단 인증으로 PassKey를 사용합니다.
