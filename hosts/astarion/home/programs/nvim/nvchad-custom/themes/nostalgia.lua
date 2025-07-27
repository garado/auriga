-- nostalgia.lua - NvChad theme based on color-nostalgia
-- https://github.com/mitchweaver/color-nostalgia

local M = {}

M.base_30 = {
  white = "#d9d5ba",          -- background (color0)
  darker_black = "#cec9b0",   -- darker version of same beige tone
  black = "#c7c3ae",          -- lighter sidebar bg
  black2 = "#bfbba6",         -- even lighter for contrast
  one_bg = "#b7b39e",         -- subtle darker areas
  one_bg2 = "#afab96",        -- slightly darker
  one_bg3 = "#a7a38e",        -- interpolated
  grey = "#9f9b86",           -- interpolated
  grey_fg = "#97937e",        -- interpolated
  grey_fg2 = "#8f8b76",       -- interpolated
  light_grey = "#87836e",     -- interpolated
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
  statusline_bg = "#c7c3ae",     -- lighter for light theme
  lightbg = "#bfbba6",        -- light background
  pmenu_bg = "#69825b",       -- color2 (green)
  folder_bg = "#5b6982",      -- color4 (blue)
}

M.base_16 = {
  base00 = "#d9d5ba", -- background
  base01 = "#c7c3ae", -- lighter background (interpolated)
  base02 = "#b5b1a2", -- selection background (interpolated)
  base03 = "#a39f96", -- comments (interpolated)
  base04 = "#918d8a", -- dark foreground (interpolated)
  base05 = "#444444", -- default foreground
  base06 = "#3a3a3a", -- light foreground (interpolated)
  base07 = "#333333", -- lightest foreground (color8)
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
  ["@comment"] = { fg = M.base_16.base03, italic = true },
  ["LineNr"] = { fg = M.base_30.grey },
  ["CursorLineNr"] = { fg = M.base_30.green },
  ["Visual"] = { bg = M.base_30.one_bg2 },
  ["Search"] = { bg = M.base_30.yellow, fg = M.base_30.black },
  ["IncSearch"] = { bg = M.base_30.sun, fg = M.base_30.black },
  ["Pmenu"] = { bg = M.base_30.one_bg },
  ["PmenuSel"] = { bg = M.base_30.pmenu_bg, fg = M.base_30.white },
  ["StatusLine"] = { bg = M.base_30.statusline_bg, fg = M.base_30.light_grey },
  ["StatusLineNC"] = { bg = M.base_30.black, fg = M.base_30.grey },
  ["TabLine"] = { bg = M.base_30.black, fg = M.base_30.light_grey },
  ["TabLineFill"] = { bg = M.base_30.black },
  ["TabLineSel"] = { bg = M.base_30.pmenu_bg, fg = M.base_30.white },
}

M.type = "light"

return M
