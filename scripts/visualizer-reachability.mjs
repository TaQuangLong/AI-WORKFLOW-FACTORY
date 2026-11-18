import http from "node:http";

export const VISUALIZER_URL = "http://127.0.0.1:5173";
export const API_HEALTH_URL = "http://127.0.0.1:8787/api/health";

/** @param {string} url @param {number} [timeoutMs] */
export function isReachable(url, timeoutMs = 800) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}
