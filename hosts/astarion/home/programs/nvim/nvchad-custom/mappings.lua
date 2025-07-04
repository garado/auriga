---@type MappingsTable
local M = {}

M.general = {
  n = {
    [";"] = { ":", "enter command mode", opts = { nowait = true } },

    --  format with conform
    ["<leader>fm"] = {
      function()
        require("conform").format()
      end,
      "formatting",
    },

    ["<leader>te"] = { ":TaskWikiEdit<CR>", "edit taskwiki" },

  },
  v = {
    [">"] = { ">gv", "indent"},
  },
}

-- more keybinds!

return M
