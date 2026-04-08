
import { getBaseStyles } from './styles/baseStyles';
import { getSpecialSectionStyles } from './styles/specialSectionStyles';
import { getContentStyles } from './styles/contentStyles';
import { getTableStyles } from './styles/tableStyles';
import { getAlignmentStyles } from './styles/alignmentStyles';
import { getPrintMediaStyles } from './styles/printMediaStyles';

/**
 * Returns CSS styles for the print window by combining all style modules
 */
export const getPrintStyles = (): string => {
  return `
    <style>
      ${getBaseStyles()}
      ${getSpecialSectionStyles()}
      ${getContentStyles()}
      ${getTableStyles()}
      ${getAlignmentStyles()}
      ${getPrintMediaStyles()}
    </style>
  `;
};
