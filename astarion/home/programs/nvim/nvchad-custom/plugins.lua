local overrides = require("custom.configs.overrides")

---@type NvPluginSpec[]
local plugins = {

  -- Override plugin definition options

  {
    "neovim/nvim-lspconfig",
    config = function()
      require "plugins.configs.lspconfig"
      require "custom.configs.lspconfig"
    end, -- Override to setup mason-lspconfig
  },

  -- override plugin configs
  {
    "williamboman/mason.nvim",
    opts = overrides.mason
  },

  {
    "nvim-treesitter/nvim-treesitter",
    opts = overrides.treesitter,
  },

  {
    "nvim-tree/nvim-tree.lua",
    opts = overrides.nvimtree,
  },

  -- Install a plugin
  {
    "max397574/better-escape.nvim",
    event = "InsertEnter",
    config = function()
      require("better_escape").setup()
    end,
  },

  {
    "stevearc/conform.nvim",
    --  for users those who want auto-save conform + lazyloading!
    event = "BufWritePre",
    cmd = { "ConformInfo" },
    -- keys = {
    --   {
    --     -- Customize or remove this keymap to your liking
    --     "<leader>f",
    --     function()
    --       require("conform").format({ async = true })
    --     end,
    --     mode = "",
    --     desc = "Format buffer",
    --   },
    -- },
    config = function()
      require "custom.configs.conform"
    end,
  },

  -- Syntax highlighting for ledger
  {
    "ledger/vim-ledger",
    ft = "ledger",
  },

  {
    "vimwiki/vimwiki",
    ft = "markdown",
    branch = "dev",
    init = function()
      vim.g.vimwiki_key_mappings = {
        -- Disable tab/shift-tab to navigate to links
        links = 0,
      }
      vim.g.vimwiki_list = {
        {
          path = "~/Github/files/Vault/Goals/",
          syntax = "markdown",
          ext = ".md",
        },
      }
    end,
  },

  -- Extra TS Features
  -- Improves TypeScript support with organizing imports, fixing imports, and more.
  { 
    'jose-elias-alvarez/nvim-lsp-ts-utils',
    ft = "typescript",
  },

  {
    "tools-life/taskwiki",
    ft = "markdown",
    init = function()
      vim.g.taskwiki_suppress_mappings = 'yes'
      vim.g.taskwiki_dont_fold = 'yes'
      vim.g.taskwiki_dont_preserve_folds = 'yes'

      vim.g.taskwiki_data_location = "~/Enchiridion/self/todo/.taskwiki/"

      vim.g.taskwiki_extra_warriors = {
        T = {
          data_location = '/home/alexis/Enchiridion/self/todo/.taskwiki/',
        }
      }

      -- vim.g.taskwiki_extra_warriors = [
      --   'H' = [
      --     'data_location' = "/home/alexis/.habit/",
      --     'taskrc_location' = "/home/alexis/.habitrc",
      --   ],
      --   'H' = [
      --     'data_location' = "/home/alexis/.habit/",
      --     'taskrc_location' = "/home/alexis/.habitrc",
      --   ],
      -- ]
    end,
  },

}

return plugins
