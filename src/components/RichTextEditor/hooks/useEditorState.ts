
import { useState, useCallback } from "react";
import { Tag, Token, Note, TradeInfo } from "@/types";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { fetchTags } from "@/services/tag";
 
// Use the modular hooks instead of having everything in this file
import { useEditorState } from './useEditorState/index';

// Re-export the hook
export { useEditorState };
