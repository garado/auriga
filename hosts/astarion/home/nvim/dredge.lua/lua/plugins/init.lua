
-- █▀█ █░░ █░█ █▀▀ █ █▄░█ █▀
-- █▀▀ █▄▄ █▄█ █▄█ █ █░▀█ ▄█

-- Plugin configuration (lazy loaded with lze)

require('lze').load {
  require('plugins.alpha-nvim'),
  require('plugins.treesitter'),

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
              text = "File Explorer",
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
    dependencies = "nvim-tree/nvim-web-devicons",
    event = "BufReadPost",
    load = function(name)
      vim.cmd.packadd(name)
      require('lualine').setup({
        options = {
          theme = 'auto',
          section_separators = { left = '', right = '' },
          component_separators = { left = '', right = '' },
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
