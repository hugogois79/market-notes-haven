
import { useState, useEffect } from "react";

/**
 * Custom hook for debouncing a value.
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(callback: (value: T) => void, delay: number) {
  return (value: T) => {
    const handler = setTimeout(() => {
      callback(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  };
}
