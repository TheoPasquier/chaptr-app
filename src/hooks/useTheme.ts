import { useCallback, useEffect, useState } from "react";
import type { ThemeSetting } from "@/types";

const KEY = "chaptr-theme";

function readSetting(): ThemeSetting {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(setting: ThemeSetting) {
  const dark = setting === "dark" || (setting === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function useTheme() {
  const [setting, setSettingState] = useState<ThemeSetting>(readSetting);

  useEffect(() => {
    apply(setting);
    if (setting !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setting]);

  const setSetting = useCallback((s: ThemeSetting) => {
    setSettingState(s);
    try {
      if (s === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, s);
    } catch {
      /* ignore */
    }
  }, []);

  return { setting, setSetting };
}
