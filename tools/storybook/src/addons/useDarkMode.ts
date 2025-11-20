import { API } from "storybook/manager-api";
import { useEffect, useState } from "react";
import { DARK_MODE_EVENT_NAME } from "@vueless/storybook-dark-mode";

export const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)");

export function useDarkMode(api: API) {
  const [isDark, setIsDark] = useState(prefersDark);

  useEffect(function () {
    const chan = api.getChannel();
    chan.on(DARK_MODE_EVENT_NAME, setIsDark);
    return function () {
      return chan.off(DARK_MODE_EVENT_NAME, setIsDark);
    };
  }, []);

  return isDark;
}
