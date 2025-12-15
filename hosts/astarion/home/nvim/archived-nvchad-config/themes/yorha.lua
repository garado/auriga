-- yorha.lua

local M = {}

M.base_30 = {
  white = "#c0bca7",          -- background (color0)
  darker_black = "#c0bca7",   -- darker version of same beige tone
  black = "#444444",          -- dark text/foreground - proper contrast!
  black2 = "#333333",         -- even darker text
  one_bg = "#cfc5b0",         -- subtle bg variation
  one_bg2 = "#c7c3ae",        -- slightly darker bg
  one_bg3 = "#bfbba6",        -- interpolated
  grey = "#a1998d",           -- mid-tone
  grey_fg = "#777369",        -- darker for text
  grey_fg2 = "#555147",       -- even darker text
  light_grey = "#494847",     -- darkest text
  red = "#825b69",            -- color1
  baby_pink = "#bda0aa",      -- color9 - bright red
  pink = "#b3a0bd",           -- color13 - bright magenta
  line = "#494847",           -- color15 for subtle lines
  green = "#69825b",          -- color2
  vibrant_green = "#aabda0",  -- color10 - bright green
  blue = "#5b6982",           -- color4
  nord_blue = "#7484a2",      -- color12 - bright blue
  yellow = "#82755b",         -- color3
  sun = "#bdb3a0",            -- color11 - bright yellow
  purple = "#755b82",         -- color5
  dark_purple = "#5b6982",    -- color4 (using blue as dark purple)
  teal = "#5b8275",           -- color6
  orange = "#82755b",         -- color3 (using yellow as orange)
  cyan = "#a0bdb3",           -- color14 - bright cyan
  statusline_bg = "#cec9b0",     -- subtle bg for statusline
  lightbg = "#cec9b0",        -- light background elements
  pmenu_bg = "#69825b",       -- color2 (green)
  folder_bg = "#5b6982",      -- color4 (blue)
}

M.base_16 = {
  base00 = "#cdc9b3", -- background
  base01 = "#cec9b0", -- lighter background 
  base02 = "#c7c3ae", -- selection background
  base03 = "#a1998d", -- comments (darker for readability)
  base04 = "#777369", -- dark foreground
  base05 = "#444444", -- default foreground (dark text)
  base06 = "#333333", -- light foreground (darker text)
  base07 = "#211f14", -- lightest foreground (darkest text)
  base08 = "#825b69", -- variables (color1 - red)
  base09 = "#82755b", -- integers, constants (color3 - yellow/orange)
  base0A = "#bdb3a0", -- classes, search text bg (color11 - bright yellow)
  base0B = "#69825b", -- strings (color2 - green)
  base0C = "#5b8275", -- support, regex (color6 - cyan)
  base0D = "#5b6982", -- functions (color4 - blue)
  base0E = "#755b82", -- keywords (color5 - magenta)
  base0F = "#bda0aa", -- deprecated (color9 - bright red)
}

M.polish_hl = {
  -- Custom highlight overrides
  ["NvimTreeCursorLine"] = { bg = M.base_16.base0A },
  ["@comment"] = { fg = M.base_16.base03, italic = true },
  ["comment"] = { fg = M.base_16.base03, italic = true },
  ["Todo"] = { fg = M.base_16.base00, bg = M.base_16.base0D, italic = true },
  ["CursorLineNr"] = { fg = M.base_16.base08 },
  ["Search"] = { bg = M.base_30.yellow, fg = M.base_30.black },
  ["Type"] = { fg = M.base_16.base03 },
  ["PreProc"] = { fg = M.base_16.base0E },
  ["Label"] = { fg = M.base_16.base0E },

  -- Tabufline
  ["TbLineBufOn"] = { fg = M.base_30.black2, bg = M.base_30.grey }, -- active
  ["TbLineBufOnClose"] = { fg = M.base_16.base08, bg = M.base_30.grey },
  ["TbLineBufOff"] = { fg = M.base_30.grey, bg = M.base_30.one_bg3 }, -- inactive
  ["TbLineBufOffClose"] = { fg = M.base_30.grey, bg = M.base_30.one_bg3 },
  ["TblineFill"] = { bg = M.base_30.one_bg2 },
  
  -- Statusline
  ["StatusLine"] = { bg = M.base_30.statusline_bg, fg = M.base_30.black },
  ["St_NormalMode"] = { bg = M.base_30.blue, fg = M.base_30.white },
  ["St_InsertMode"] = { bg = M.base_30.green, fg = M.base_30.white },
  ["St_file_info"] = { fg = M.base_30.grey },
  ["St_cwd_text"] = { fg = M.base_16.base08 },
  ["St_cwd_icon"] = { fg = M.base_30.fg, bg = M.base_16.base08 },

  -- Telescope
  ["TelescopeNormal"] = { fg = M.base_30.black, bg = M.base_16.base00 },
  ["TelescopeBorder"] = { fg = M.base_16.base00, bg = M.base_16.base00 },
  ["TelescopePromptNormal"] = { fg = M.base_30.black, bg = M.base_16.base00 },
  ["TelescopePromptTitle"] = { fg = M.base_30.white, bg = M.base_16.base08 },
  ["TelescopePromptPrefix"] = { fg = M.base_30.black, bg = M.base_16.base00 },
  ["TelescopePromptBorder"] = { fg = M.base_16.base00, bg = M.base_16.base00 },
  ["TelescopeResultsTitle"] = { fg = M.base_30.white, bg = M.base_16.base08 },
  ["TelescopeSelection"] = { fg = M.base_30.black, bg = M.base_16.base0A },

  -- Completion
  ["Pmenu"] = { fg = M.base_16.base05, bg = M.base_16.base00 },
  ["CmpPmenu"] = { bg = M.base_16.base00 },
  ["CmpItemAbbr"] = { fg = M.base_30.black },
  ["CmpItemAbbrMatch"] = { fg = M.base_16.base0D, bold = true },
  ["CmpItemAbbrMatchFuzzy"] = { fg = M.base_16.base0D },

  -- Misc
  ["IndentBlanklineChar"] = { fg = M.base_16.base03 },
}

M.type = "light"

return M
