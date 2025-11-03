const COLORS = {
  INFO: "color: green; font-weight: bold",
  WARN: "color: orange; font-weight: bold",
  ERROR: "color: red; font-weight: bold",
};

export const logger = {
  info: (message: string, tag = "APP") => {
    // %c 를 사용하여 CSS 스타일 적용
    console.info(`%c[${tag}]`, COLORS.INFO, message);
  },
  warn: (message: string, tag = "APP") => {
    console.warn(`%c[${tag}]`, COLORS.WARN, message);
  },
  error: (message: string, tag = "APP") => {
    console.error(`%c[${tag}]`, COLORS.ERROR, message);
  },
} as const;
