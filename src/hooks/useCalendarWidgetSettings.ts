import { useState, useEffect, useCallback } from "react";

const WIDGET_STORAGE_KEY = "calendar-widget-visible";

export function useCalendarWidgetSettings() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem(WIDGET_STORAGE_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(isVisible));
  }, [isVisible]);

  const toggle = useCallback(() => {
    setIsVisible((prev: boolean) => !prev);
  }, []);

  const show = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    toggle,
    show,
    hide,
  };
}
