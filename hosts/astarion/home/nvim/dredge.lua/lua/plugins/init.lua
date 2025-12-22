
-- █▀█ █░░ █░█ █▀▀ █ █▄░█ █▀
-- █▀▀ █▄▄ █▄█ █▄█ █ █░▀█ ▄█

-- Plugin configuration (lazy loaded with lze)

require('plugins.lsp')

require('lze').load {
  require('plugins.alpha-nvim'),
  require('plugins.treesitter'),

  {
    "comment.nvim",
    enabled = true,
    event = "BufReadPre",
    load = function(name)
      vim.cmd.packadd(name)
      require("Comment").setup()
    end,
  },

  {
    "telescope.nvim",
    enabled = true,
    cmd = { "Telescope" },
    load = function(name)
      vim.cmd.packadd(name)
      require("telescope").setup({
        defaults = {
          prompt_prefix = "   ",
          selection_caret = " ",
          entry_prefix = " ",
          sorting_strategy = "ascending",
          layout_strategy = "horizontal",
          layout_config = {
            horizontal = {
              prompt_position = "top",
              preview_width = 0.55,
            },
            width = 0.87,
            height = 0.80,
          },
          border = true,
          borderchars = {
            prompt = { "─", "│", " ", "│", "╭", "╮", "│", "│" },
            results = { "─", "│", "─", "│", "├", "┤", "╯", "╰" },
            preview = { "─", "│", "─", "│", "╭", "╮", "╯", "╰" },
          },
          mappings = {
            i = {
              ["<Tab>"] = "move_selection_next",
              ["<S-Tab>"] = "move_selection_previous",
            },
          },
        },
      })
    end,
  },

  {
    "nvim-numbertoggle",
    enabled = true,
    event = "BufReadPre",
    load = function(name)
      vim.cmd.packadd(name)
    end,
  },

  {
    "bufferline-nvim",
    enabled = true,
    event = "BufEnter",
    load = function(name)
      vim.cmd.packadd(name)
      require("bufferline").setup({
        options = {
          offsets = {
            {
              filetype = "NvimTree",
              text = "",
              highlight = "Directory",
              text_align = "left"
            }
          },
        },
      })
    end,
  },

  {
    "lualine.nvim",
     enabled = nixCats('general') or false,
     event = "DeferredUIEnter",
     load = function (name)
       vim.cmd.packadd(name)
     end,
     after = function (plugin)
       require('lualine').setup({
         options = {
           icons_enabled = false,
           theme = 'auto',
           component_separators = '|',
           section_separators = '',
         },
         sections = {
           lualine_c = {
             {
               'filename', path = 1, status = true,
             },
           },
         },
         inactive_sections = {
           lualine_b = {
             {
               'filename', path = 3, status = true,
             },
           },
           lualine_x = {'filetype'},
         },
       })
     end,
   },

  {
    "nvim-tree.lua",
    enabled = true,
    cmd = { "NvimTreeToggle", "NvimTreeFocus" },
    load = function(name)
      vim.cmd.packadd(name)
      require("nvim-tree").setup({
        update_focused_file = {
          enable = true,
          update_cwd = true,
          ignore_list = {},
        },
        renderer = {
          root_folder_label = false,
        },
        view = {
          width = 30,
        },
      })
    end,
  },

  {
    "better-escape.nvim",
    enabled = true,
    event = "InsertEnter",
    load = function(name)
      vim.cmd.packadd(name)
      require("better_escape").setup({
        mapping = {"jk"},
        timeout = 200,
      })
    end,
  },
 
  {
    "blink.cmp",
    enabled = nixCats('general') or false,
    event = "DeferredUIEnter",
    on_require = "blink",
    after = function (plugin)
      require("blink.cmp").setup({
        keymap = {
          ['<CR>'] = { 'accept', 'fallback' },
          ['<S-Tab>'] = { 'select_prev', 'fallback' },
          ['<Tab>'] = { 'select_next', 'fallback' },
        },
        appearance = {
          nerd_font_variant = 'mono'
        },
        signature = { enabled = true, },
        sources = {
          default = { 'lsp', 'path', 'snippets', 'buffer' },
        },
      })
    end,
  },

  {
    "blink.pairs",
    enabled = true,
    event = "DeferredUIEnter",
    on_require = "blink",
    after = function (plugin)
      require("blink.pairs").setup({})
    end,
  },

  {
    -- lazydev makes your lsp way better in your config without needing extra lsp configuration.
    "lazydev.nvim",
    enabled = true,
    cmd = { "LazyDev" },
    ft = "lua",
    after = function(_)
      require('lazydev').setup({
        library = {
          { words = { "nixCats" }, path = (nixCats.nixCatsPath or "") .. '/lua' },
        },
      })
    end,
  },

  {
    "conform.nvim",
    enabled = nixCats('general') or false,
    keys = {
      { "<leader>FF", desc = "[F]ormat [F]ile" },
    },
    after = function (plugin)
      local conform = require("conform")

      conform.setup({
        formatters_by_ft = {
          lua = nixCats('lua') and { "stylua" } or nil,
          go = nixCats('go') and { "gofmt", "golint" } or nil,
          python = { "ruff" },
          cpp = { "clang-format" },
          c = { "clang-format" },
        },
      })

      vim.keymap.set({ "n", "v" }, "<leader>FF", function()
        conform.format({
          lsp_fallback = true,
          async = false,
          timeout_ms = 1000,
        })
      end, { desc = "[F]ormat [F]ile" })
    end,
  },

  {
    "nvim-lint",
    enabled = nixCats("general") or false,
    event = "FileType",
    after = function ()
      require("lint").linters_by_ft = {
        python = { "ruff" },
        go = nixCats("go") and { "golangcilint" } or nil,
        c = { "clang" },
      }

      vim.api.nvim_create_autocmd({ "BufWritePost" }, {
        callback = function()
          require("lint").try_lint()
        end,
      })
    end,
  },

  {
    "trouble.nvim",
    enabled = true,
    load = function()
      require("trouble").setup()
    end,
    cmd = "Trouble",
    keys = {
      {
        "<leader>xx",
        "<cmd>Trouble diagnostics toggle<cr>",
        desc = "Diagnostics (Trouble)",
      },
      {
        "<leader>xX",
        "<cmd>Trouble diagnostics toggle filter.buf=0<cr>",
        desc = "Buffer Diagnostics (Trouble)",
      },
    },
  },
}
