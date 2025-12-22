
-- █▀▄ █▀█ █▀▀ █▀▄ █▀▀ █▀▀   █▄░█ █░█ █ █▀▄▀█
-- █▄▀ █▀▄ ██▄ █▄▀ █▄█ ██▄ ▄ █░▀█ ▀▄▀ █ █░▀░█

-- Set leader key to Space
vim.g.mapleader = ' '
vim.g.maplocalleader = ' '

-- Theme
local colors = require('themes.mountain')
local highlights = require('highlights')
highlights.setup(colors, colors.overrides)

vim.opt.fillchars = { eob = " " }

-- Always show sign column
vim.opt.signcolumn = "yes"

vim.opt.showtabline = 0

vim.opt.ruler = false

-- Default to using relative line numbers
vim.opt.number = true
vim.opt.relativenumber = true

-- Hide command bar until a command is typed
vim.opt.cmdheight = 0

-- Copy/paste to/from system clipboard
vim.opt.clipboard = "unnamedplus"

-- Set highlight on search
vim.opt.hlsearch = true
vim.keymap.set('n', '<Esc>', '<cmd>nohlsearch<CR>')

-- Preview substitutions live, as you type!
vim.opt.inccommand = 'split'

-- Minimal number of screen lines to keep above and below the cursor
vim.opt.scrolloff = 0

-- Enable mouse mode
vim.o.mouse = 'a'

-- Indent
vim.o.smarttab = true
vim.opt.cpoptions:append('I')
vim.o.expandtab = true
vim.o.smartindent = true
vim.o.autoindent = true

-- stops line wrapping from being confusing
vim.o.breakindent = true

-- Save undo history
vim.o.undofile = true

-- Case-insensitive searching UNLESS \C or capital in search
vim.o.ignorecase = true
vim.o.smartcase = true

-- Decrease update time
vim.o.updatetime = 250
vim.o.timeoutlen = 300

-- Set completeopt to have a better completion experience
vim.o.completeopt = 'menu,preview,noselect'

vim.o.termguicolors = true

-- Import other pieces of config
require("keymaps")
require("plugins")
