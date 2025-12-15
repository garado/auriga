---@type ChadrcConfig
local M = {}

-- Path to overriding theme and highlights files
local highlights = require "custom.highlights"

vim.wo.relativenumber = true

M.ui = {
  theme = "mountain",
  theme_toggle = { "gruvbox", "one_light" },

  hl_override = highlights.override,
  hl_add = highlights.add,
}

M.plugins = "custom.plugins"

-- check core.mappings for table structure
M.mappings = require "custom.mappings"

M.lazy_nvim = {
  lockfile = vim.fn.stdpath("data") .. "/lazy-lock.json",
}

return M
