const MARKDOWN_CONFIG = {
  monospaceFonts: "Mononoki",
} as const;

/**
 * Converts markdown text to Pango markup for GTK rendering.
 * Handles headers, bold, italic, code blocks, and other formatting.
 * Based on end-4's excellent markdown converter implementation.
 * @param markdownText - Raw markdown text to convert
 * @returns Pango markup string
 */
export const convertMarkdownToPangoMarkup = (markdownText: string): string => {
  const replacementRules = {
    indents: [
      { name: "BULLET", re: /^(\s*)([\*\-]\s)(.*)(\s*)$/, sub: " $1- $3" },
      { name: "NUMBERING", re: /^(\s*[0-9]+\.\s)(.*)(\s*)$/, sub: " $1 $2" },
    ],
    escapes: [
      { name: "COMMENT", re: /<!--.*-->/, sub: "" },
      { name: "AMPERSAND", re: /&/g, sub: "&amp;" },
      { name: "LESS_THAN", re: /</g, sub: "&lt;" },
      { name: "GREATER_THAN", re: />/g, sub: "&gt;" },
    ],
    sections: [
      {
        name: "H1",
        re: /^(#\s+)(.*)(\s*)$/,
        sub: '<span font_weight="bold" size="170%">$2</span>',
      },
      {
        name: "H2",
        re: /^(##\s+)(.*)(\s*)$/,
        sub: '<span font_weight="bold" size="150%">$2</span>',
      },
      {
        name: "H3",
        re: /^(###\s+)(.*)(\s*)$/,
        sub: '<span font_weight="bold" size="125%">$2</span>',
      },
      {
        name: "H4",
        re: /^(####\s+)(.*)(\s*)$/,
        sub: '<span font_weight="bold" size="100%">$2</span>',
      },
      {
        name: "H5",
        re: /^(#####\s+)(.*)(\s*)$/,
        sub: '<span font_weight="bold" size="90%">$2</span>',
      },
    ],
    styles: [
      { name: "BOLD", re: /(\*\*)(\S[\s\S]*?\S)(\*\*)/g, sub: "<b>$2</b>" },
      { name: "UNDERLINE", re: /(__)(\S[\s\S]*?\S)(__)/g, sub: "<u>$2</u>" },
      { name: "EMPHASIS", re: /\*(\S.*?\S)\*/g, sub: "<i>$1</i>" },
      {
        name: "HEX_COLOR",
        re: /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g,
        sub: `<span bgcolor="#$1" fgcolor="#000000" font_family="${MARKDOWN_CONFIG.monospaceFonts}">#$1</span>`,
      },
      {
        name: "INLINE_CODE",
        re: /(`)([^`]*)(`)/g,
        sub: `<span font_weight="bold" font_family="${MARKDOWN_CONFIG.monospaceFonts}">$2</span>`,
      },
    ],
  };

  /**
   * Applies a category of replacement rules to text.
   * @param text - Text to process
   * @param replacements - Array of replacement rules
   * @returns Processed text
   */
  const applyReplacementCategory = (text: string, replacements: any[]) => {
    return replacements.reduce(
      (processedText, rule) => processedText.replace(rule.re, rule.sub),
      text,
    );
  };

  const lines = markdownText.split("\n");
  const processedLines = lines.map((line) => {
    let result = line;
    result = applyReplacementCategory(result, replacementRules.indents);
    result = applyReplacementCategory(result, replacementRules.escapes);
    result = applyReplacementCategory(result, replacementRules.sections);
    result = applyReplacementCategory(result, replacementRules.styles);
    return result.replace(/ +$/, ""); // Remove trailing whitespace
  });

  return processedLines.join("\n");
};
