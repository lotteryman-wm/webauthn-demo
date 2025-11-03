export const wait = (delayMs: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, delayMs);
  });
};
