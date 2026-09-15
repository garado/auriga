
local autocmd = vim.api.nvim_create_autocmd

---------------------------------------------------------
-- LEADER
---------------------------------------------------------

vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

---------------------------------------------------------
-- FILETYPES
---------------------------------------------------------

vim.filetype.add {
  pattern = {
    ["BUILD"] = "bzl",
    ["BUILD%.bazel"] = "bzl",
    ["WORKSPACE"] = "bzl",
    ["WORKSPACE%.bazel"] = "bzl",
    [".*%.bzl"] = "bzl",
  },
}

---------------------------------------------------------
-- OPTIONS
---------------------------------------------------------

-- Hide command bar
vim.o.cmdheight = 0

---------------------------------------------------------
-- CUSTOM KEYBINDS
---------------------------------------------------------

vim.keymap.set("n", "<leader>q", "<cmd>bd<cr>", { desc = "Close buffer" })
vim.keymap.set("n", "<leader>o", "<cmd>Octo actions<cr>", { desc = "Octo actions" })
vim.keymap.set("n", "<leader>a", "<cmd>Trouble symbols toggle<cr>", { desc = "Trouble symbols toggle" })

---------------------------------------------------------
-- DIFF HIGHLIGHTING
---------------------------------------------------------

-- Preserve syntax highlighting in Octo diff view.
local function fix_diff_highlights()
  for _, group in ipairs {
    "DiffAdd",
    "DiffDelete",
    "DiffChange",
    "DiffText",
    "OctoReviewDiffAddText",
    "OctoReviewDiffDeleteText",
  } do
    local hl = vim.api.nvim_get_hl(0, { name = group })
    hl.fg = nil
    hl.ctermfg = nil
    vim.api.nvim_set_hl(0, group, hl)
  end
end

fix_diff_highlights()

autocmd("ColorScheme", {
  pattern = "*",
  callback = fix_diff_highlights,
})

autocmd("FileType", {
  pattern = "*",
  callback = function(args)
    if vim.api.nvim_buf_get_name(args.buf):match "^octo://" then
      fix_diff_highlights()
    end
  end,
})

---------------------------------------------------------
-- LSP
---------------------------------------------------------

-- Addresses race condition causing Pyright diagnostics to not load properly.
-- Pyright's diagnostics can sometimes initialize before imports in extraPaths do,
-- causing false import errors. Detach/reattach from buffer to reload and fix.
autocmd("LspAttach", {
  callback = function(args)
    local client = vim.lsp.get_client_by_id(args.data.client_id)
    if not client or client.name ~= "pyright" then
      return
    end
    local bufnr = args.buf
    vim.defer_fn(function()
      if vim.api.nvim_buf_is_valid(bufnr) then
        vim.lsp.buf_detach_client(bufnr, client.id)
        vim.lsp.buf_attach_client(bufnr, client.id)
      end
    end, 200)
  end,
})

---------------------------------------------------------
-- MISCELLANEOUS
---------------------------------------------------------

-- Resume an in-progress Octo PR review, or warn if there isn't one.
-- Wrapped in a user command (rather than used as a raw Lua function)
-- because alpha-nvim's <CR>-on-button handler feeds the keybind through
-- nvim_replace_termcodes, which requires a string.
vim.api.nvim_create_user_command("OctoResumeReview", function()
  local ok = pcall(vim.cmd, "Octo review resume")
  if not ok then
    vim.notify("No Octo review to resume", vim.log.levels.WARN)
  end
end, {})

-- Custom command to help integrate NvChad with system theme switcher.
-- A script will execute this command in all running instances.
vim.api.nvim_create_user_command("ForceReloadNvchadTheme", function()
  require("plenary.reload").reload_module "base46"
  require("plenary.reload").reload_module "custom.chadrc"

  local config = require("core.utils").load_config()

  vim.g.nvchad_theme = config.ui.theme
  vim.g.transparency = config.ui.transparency

  -- statusline
  require("plenary.reload").reload_module("nvchad.statusline." .. config.ui.statusline.theme)
  vim.opt.statusline = "%!v:lua.require('nvchad.statusline." .. config.ui.statusline.theme .. "').run()"

  -- tabufline
  if config.ui.tabufline.enabled then
    require("plenary.reload").reload_module "nvchad.tabufline.modules"
    vim.opt.tabline = "%!v:lua.require('nvchad.tabufline.modules').run()"
  end

  require("base46").load_all_highlights()
end, {})
