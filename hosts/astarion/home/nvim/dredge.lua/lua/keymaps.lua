local map = vim.keymap.set

-- Toggle NvimTree
map('n', '<C-n>', '<cmd>NvimTreeToggle<cr>')

-- Close buffer
map('n', '<leader>q', function()
  local buf = vim.api.nvim_get_current_buf()
  vim.cmd('BufferLineCycleNext')
  vim.cmd('bd ' .. buf)
end)

-- Switch next/prev buffers
map('n', '<Tab>', '<cmd>BufferLineCycleNext<cr>')
map('n', '<S-Tab>', '<cmd>BufferLineCyclePrev<cr>')

-- Telescope
map('n', '<leader>ff', '<cmd>Telescope find_files<cr>')
map('n', '<leader>fw', '<cmd>Telescope live_grep<cr>')
map('n', '<leader>fb', '<cmd>Telescope buffers<cr>')

-- Comment line/selection
map('n', '<C-Space>', function() require('Comment.api').toggle.linewise.current() end)
map('v', '<C-Space>', function() require('Comment.api').toggle.linewise(vim.fn.visualmode()) end)

-- Toggle trouble diagnostics
map('n', '<leader>xx', "<cmd>Trouble diagnostics toggle<cr>")
