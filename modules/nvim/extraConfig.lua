
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

-- Disable Neovim 0.12's native OSC 9;4 progress bar (shows as a flash
-- in the kitty window/taskbar on every LSP progress event, e.g. save).
pcall(vim.api.nvim_del_augroup_by_name, "nvim.progress")

-- Make yank/paste work over SSH.
-- Only override the clipboard provider when actually remote: OSC 52 paste
-- requires the terminal to answer a clipboard-read escape sequence, and
-- kitty prompts for confirmation on every read. Locally, nvim already has
-- native clipboard access, so forcing OSC 52 there just adds a nag prompt.
if vim.env.SSH_TTY or vim.env.SSH_CONNECTION then
  vim.g.clipboard = {
    name = "OSC 52",
    copy = {
      ["+"] = require("vim.ui.clipboard.osc52").copy("+"),
      ["*"] = require("vim.ui.clipboard.osc52").copy("*"),
    },
    paste = {
      ["+"] = require("vim.ui.clipboard.osc52").paste("+"),
      ["*"] = require("vim.ui.clipboard.osc52").paste("*"),
    },
  }
end

-- Workaround for upstream neovim/nvim-treesitter crash on markdown fenced code blocks
-- TODO remove once neovim is > 0.12.4
autocmd("FileType", {
  pattern = "markdown",
  callback = function(args)
    vim.opt_local.conceallevel = 0
    vim.schedule(function()
      pcall(vim.treesitter.stop, args.buf)
    end)
  end,
})

---------------------------------------------------------
-- CUSTOM KEYBINDS
---------------------------------------------------------

vim.keymap.set("n", "<leader>q", "<cmd>bd<cr>", { desc = "Close buffer" })
vim.keymap.set("n", "<leader>o", "<cmd>Octo actions<cr>", { desc = "Octo actions" })
vim.keymap.set("n", "<leader>a", "<cmd>Trouble symbols toggle<cr>", { desc = "Trouble symbols toggle" })
vim.keymap.set("n", "<leader>ww", "<cmd>set wrap<cr>", { desc = "Set wrap" })
vim.keymap.set("n", "<leader>wn", "<cmd>set nowrap<cr>", { desc = "Unset wrap" })

-- Replace NvChad's default Telescope pickers with Snacks.picker equivalents.
vim.keymap.set("n", "<leader>ff", function() Snacks.picker.files() end, { desc = "find files" })
vim.keymap.set("n", "<leader>fw", function() Snacks.picker.grep() end, { desc = "live grep" })
vim.keymap.set("n", "<leader>fb", function() Snacks.picker.buffers() end, { desc = "find buffers" })
vim.keymap.set("n", "<leader>fh", function() Snacks.picker.help() end, { desc = "help page" })
vim.keymap.set("n", "<leader>fo", function() Snacks.picker.recent() end, { desc = "find oldfiles" })
vim.keymap.set("n", "<leader>fz", function() Snacks.picker.lines() end, { desc = "find in current buffer" })

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
