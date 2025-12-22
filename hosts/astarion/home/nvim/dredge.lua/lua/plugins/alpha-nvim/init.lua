
-- ▄▀█ █░░ █▀█ █░█ ▄▀█   █▄░█ █░█ █ █▀▄▀█
-- █▀█ █▄▄ █▀▀ █▀█ █▀█ ▄ █░▀█ ▀▄▀ █ █░▀░█


-- Hide statusbar, tabline, ruler when alpha is visible
vim.api.nvim_create_autocmd("User", {
  pattern = "AlphaReady",
  callback = function()
    vim.opt.laststatus = 0
  end,
})

-- Restore statusbar, tabline, ruler when alpha exits
vim.api.nvim_create_autocmd("BufEnter", {
  callback = function()
    if vim.bo.filetype ~= "alpha" then
      vim.opt.laststatus = 3
    end
  end,
})

local config = {
  "goolord/alpha-nvim",
  event = 'VimEnter',
  after = function()
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
    dashboard.config.layout = {
        { type = "padding", val = vim.fn.max({ 2, vim.fn.floor(vim.fn.winheight(0) * 0.2) }) },
        dashboard.section.header,
        { type = "padding", val = 2 },
        dashboard.section.footer,
    }

    alpha.setup(dashboard.config)
  end
}

return config
