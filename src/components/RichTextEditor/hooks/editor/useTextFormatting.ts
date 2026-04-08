
/**
 * This file is kept for backward compatibility.
 * It re-exports all functionality from the new structure.
 */
import { useTextFormatting as useFormattingHook } from "../formatting";

export const useTextFormatting = useFormattingHook;

// Re-export individual hooks for direct access
export * from "../formatting";
