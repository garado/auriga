
-- █▀█ █░░ █░█ █▀▀ █ █▄░█ █▀
-- █▀▀ █▄▄ █▄█ █▄█ █ █░▀█ ▄█

-- Plugin configuration (lazy loaded with lze)

require('lze').load {
  require('plugins.alpha-nvim'),

  {
    "nvim-numbertoggle",
    enabled = true,
    event = "BufReadPre",
  },

  {
    "bufferline.nvim",
    enabled = true,
    event = "BufEnter",
    load = function()
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
    "nvim-tree.lua",
    enabled = true,
    event = "BufEnter",
    load = function()
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
    load = function()
      require("better_escape").setup({
        mapping = {"jk"},
        timeout = 200,
      })
    end,
  },
}
