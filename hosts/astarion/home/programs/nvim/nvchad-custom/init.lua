local autocmd = vim.api.nvim_create_autocmd

-- Auto resize panes when resizing nvim window
autocmd("VimResized", {
  pattern = "*",
  command = "tabdo wincmd =",
})

-- Hide command bar
vim.o.cmdheight = 0

local enable_providers = {
  "python3_provider",
}

for _, plugin in pairs(enable_providers) do
  vim.g["loaded_" .. plugin] = nil
  vim.cmd("runtime " .. plugin)
end

-- Custom command to help integrate nvim with AwesomeWM theme switcher
-- I have a script that'll execute this command in all running instances
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
