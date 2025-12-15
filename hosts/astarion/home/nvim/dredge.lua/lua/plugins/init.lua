
-- █▀█ █░░ █░█ █▀▀ █ █▄░█ █▀
-- █▀▀ █▄▄ █▄█ █▄█ █ █░▀█ ▄█

-- Plugin configuration (lazy loaded with lze)

require('lze').load {
  require('plugins.alpha-nvim'),
  require('plugins.treesitter'),

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
          show_buffer_icons = false,
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
}
