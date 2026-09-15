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
    opts = {
      ensure_installed = {
        "lua",
        "luadoc",
        "printf",
        "vim",
        "vimdoc",
        "query",
        "python",
        "c",
        "cpp",
        "bash",
        "markdown",
        "markdown_inline",
      },
    },
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
          python =  { "black" },

          sh = { "shfmt" },

          nix = { "nixfmt" },
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
    nested = true,
    config = function()
      local alpha = require('alpha')
      local dashboard = require('alpha.themes.dashboard')

      -- Buttons
      local resume_review_btn = dashboard.button("r", "  Resume review", "<cmd>OctoResumeReview<cr>")
      resume_review_btn.opts.cursor = 2

      local review_requests_btn = dashboard.button(
        "p",
        "  Awaiting my review",
        "<cmd>Octo search is:pr is:open review-requested:@me<cr>"
      )
      review_requests_btn.opts.cursor = 2
      
      local pr_list_btn = dashboard.button(
        "l",
        "  List PRs",
        "<cmd>Octo pr list<cr>"
      )
      pr_list_btn.opts.cursor = 2

      local quit_btn = dashboard.button("q", "  Quit", "<cmd>qa<cr>")
      quit_btn.opts.cursor = 2


      dashboard.section.buttons.val = {
        resume_review_btn,
        review_requests_btn,
        pr_list_btn,
        quit_btn,
      }

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
        "make it work, make it right, make it fast",
      }

      -- Vertically center header/footer
      dashboard.config.layout = {
        { type = "padding", val = vim.fn.max({ 2, vim.fn.floor(vim.fn.winheight(0) * 0.2) }) },
        dashboard.section.header,
        { type = "padding", val = 2 },
        dashboard.section.footer,
        { type = "padding", val = 2 },
        dashboard.section.buttons,
      }

      alpha.setup(dashboard.config)

      -- NvChad's highlights sometimes finish loading after alpha has
      -- already drawn, so splash screen is sad and colorless.
      -- Re-apply highlights once alpha is done rendering.
      vim.api.nvim_create_autocmd("User", {
        pattern = "AlphaReady",
        callback = function()
          vim.schedule(function()
            require("base46").load_all_highlights()
          end)

          vim.defer_fn(function()
            local eventignore = vim.o.eventignore
            vim.o.eventignore = "CursorMoved,CursorMovedI"
            vim.api.nvim_win_set_cursor(0, { 1, 0 })
            vim.o.eventignore = eventignore
          end, 0)
        end,
      })
    end
  },

  ---------------------------------------
  -- GITHUB
  ---------------------------------------

  -- Work with GitHub issues and PRs from within nvim
  {
    "pwntester/octo.nvim",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "nvim-tree/nvim-web-devicons",
    },
    cmd = "Octo",
    config = function()
      require("octo").setup({
        picker = "telescope",
      })
    end,
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
        basedpyright = {},
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
