local plugins = {

  ---------------------------------------
  -- SYNTAX HIGHLIGHTING
  ---------------------------------------

  {
    "ledger/vim-ledger",
    ft = "ledger",
  },

  ---------------------------------------
  -- QUALITY OF LIFE
  ---------------------------------------

  -- Automatically toggle between relative and absolute line numbers
  {
    "sitiom/nvim-numbertoggle",
    event = "BufEnter",
  },

  -- Highlight, list, and search todo comments
  {
    "folke/todo-comments.nvim",
    dependencies = { "nvim-lua/plenary.nvim" },
    event = "BufEnter",
  },

  -- Pretty diagnostics, references, telescope results, quickfix and location list
  {
    "folke/trouble.nvim",
    opts = {},
    cmd = "Trouble",
    keys = {
      {
        "<leader>xx",
        "<cmd>Trouble diagnostics toggle<cr>",
        desc = "Diagnostics (Trouble)",
      },
      {
        "<leader>cl",
        "<cmd>Trouble lsp toggle focus=false win.position=right<cr>",
        desc = "LSP Definitions / references / ... (Trouble)",
      },
    },
  },

  ---------------------------------------
  -- LSP, DAP, LINTER, FORMATTER
  ---------------------------------------

  -- Tree-sitter parser
  {
    "nvim-treesitter/nvim-treesitter",
    -- opts = overrides.treesitter,
  },

  -- Install and manage LSP servers, DAP servers, linters, and formatters
  {
    "williamboman/mason.nvim",
    -- opts = overrides.mason
  },

  -- Formatter
  {
    "stevearc/conform.nvim",
    event = "BufWritePre",
    cmd = { "ConformInfo" },
    keys = {
      {
        "<leader>f",
        function()
          require("conform").format({ async = true })
        end,
        mode = "",
        desc = "Format buffer",
      },
    },
    config = function()
      local options = {
        lsp_fallback = true,

        formatters_by_ft = {
          lua = { "stylua" },

          typescript = { "prettierd" },
          javascript = { "prettierd" },
          css = { "prettierd" },
          html = { "prettierd" },
          cpp = { "clang" },
          c = { "clang" },

          sh = { "shfmt" },
        },

        prettier = {
          single_quote = true,
          jsx_single_quote = true,
        },

        format_on_save = {
          timeout_ms = 500,
          lsp_format = "fallback",
        },
      }

      require("conform").setup(options)
    end,
  },


  ---------------------------------------
  -- UI
  ---------------------------------------

  -- File explorer tree
  {
    "nvim-tree/nvim-tree.lua",
    -- opts = overrides.nvimtree,
    config = function()
      require("nvim-tree").setup({
      })
    end
  },

  -- Aesthetic splash screen
  {
    "goolord/alpha-nvim",
    event = 'VimEnter',
    config = function()
      local alpha = require('alpha')
      local dashboard = require('alpha.themes.dashboard')

      -- No buttons
      dashboard.section.buttons.val = {}

      -- Header
      dashboard.section.header.val = {
        "                                   ",
        "                                   ",
        "                                   ",
        "   ⣴⣶⣤⡤⠦⣤⣀⣤⠆     ⣈⣭⣿⣶⣿⣦⣼⣆          ",
        "    ⠉⠻⢿⣿⠿⣿⣿⣶⣦⠤⠄⡠⢾⣿⣿⡿⠋⠉⠉⠻⣿⣿⡛⣦       ",
        "          ⠈⢿⣿⣟⠦ ⣾⣿⣿⣷    ⠻⠿⢿⣿⣧⣄     ",
        "           ⣸⣿⣿⢧ ⢻⠻⣿⣿⣷⣄⣀⠄⠢⣀⡀⠈⠙⠿⠄    ",
        "          ⢠⣿⣿⣿⠈    ⣻⣿⣿⣿⣿⣿⣿⣿⣛⣳⣤⣀⣀   ",
        "   ⢠⣧⣶⣥⡤⢄ ⣸⣿⣿⠘  ⢀⣴⣿⣿⡿⠛⣿⣿⣧⠈⢿⠿⠟⠛⠻⠿⠄  ",
        "  ⣰⣿⣿⠛⠻⣿⣿⡦⢹⣿⣷   ⢊⣿⣿⡏  ⢸⣿⣿⡇ ⢀⣠⣄⣾⠄   ",
        " ⣠⣿⠿⠛ ⢀⣿⣿⣷⠘⢿⣿⣦⡀ ⢸⢿⣿⣿⣄ ⣸⣿⣿⡇⣪⣿⡿⠿⣿⣷⡄  ",
        " ⠙⠃   ⣼⣿⡟  ⠈⠻⣿⣿⣦⣌⡇⠻⣿⣿⣷⣿⣿⣿ ⣿⣿⡇ ⠛⠻⢷⣄ ",
        "      ⢻⣿⣿⣄   ⠈⠻⣿⣿⣿⣷⣿⣿⣿⣿⣿⡟ ⠫⢿⣿⡆     ",
        "       ⠻⣿⣿⣿⣿⣶⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⡟⢀⣀⣤⣾⡿⠃     ",
        "                                   ",
        "       ▐▌ ▄▄▄ ▗▞▀▚▖   ▐▌  ▗▞▀▚▖    ",
        "       ▐▌█    ▐▛▀▀▘   ▐▌  ▐▛▀▀▘    ",
        "    ▗▞▀▜▌█    ▝▚▄▄▖▗▞▀▜▌  ▝▚▄▄▖    ",
        "    ▝▚▄▟▌          ▝▚▄▟▌▗▄▖        ",
        "                       ▐▌ ▐▌       ",
        "                        ▝▀▜▌       ",
        "                       ▐▙▄▞▘       ",
      }

      -- Footer
      dashboard.section.footer.val = {
        "less talk, more code",
      }

      -- Vertically center header/footer
      -- dashboard.config.layout = {
      --   { type = "padding", val = vim.fn.max({ 2, vim.fn.floor(vim.fn.winheight(0) * 0.2) }) },
      --   dashboard.section.header,
      --   { type = "padding", val = 2 },
      --   dashboard.section.footer,
      -- }

      alpha.setup(dashboard.config)
    end
  },

  ---------------------------------------
  -- UNSORTED
  ---------------------------------------

  {
    "L3MON4D3/LuaSnip",
    config = function()
      -- require("custom.configs.luasnip")
    end,
  },

  {
    "neovim/nvim-lspconfig",
    config = function()
      local on_attach = vim.lsp.config.on_attach
      local capabilities = vim.lsp.config.capabilities
      
      local servers = {
        cssls = {},
        ts_ls = {},
        html = {
          init_options = {
            provideFormatter = true 
          },
          settings = {  
            css = {
              lint = {
                validProperties = {}
              }
            },
          },
        },
        clangd = {
          cmd = { "clangd" },
        },
        qmlls = {},
      }
      
      for server, opts in pairs(servers) do
        opts.on_attach = on_attach
        opts.capabilities = capabilities
        vim.lsp.config(server, opts)
      end
      
      vim.lsp.enable(vim.tbl_keys(servers))
    end,
  },

  -- Extra TS Features
  -- Improves TypeScript support with organizing imports, fixing imports, and more.
  -- { 
  --   'jose-elias-alvarez/nvim-lsp-ts-utils',
  --   ft = "typescript",
  -- },

  {
    "pmizio/typescript-tools.nvim",
    dependencies = { "nvim-lua/plenary.nvim", "neovim/nvim-lspconfig" },
    event = "BufEnter",
    ft = "typescript",
    opts = {},
  },

}

return plugins
