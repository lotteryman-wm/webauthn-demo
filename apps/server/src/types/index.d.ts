import "express-session";

declare module "express-session" {
  interface SessionData {
    /**
     * A simple way of storing a user's current challenge being signed by registration or
     * authentication. It should be expired after `timeout` milliseconds (optional argument for
     * `generate` methods, defaults to 60000ms)
     */
    currentChallenge?: string;
  }
}
