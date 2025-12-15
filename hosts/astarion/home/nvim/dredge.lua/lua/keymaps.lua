local map = vim.keymap.set

map('n', '<C-n>', '<cmd>NvimTreeToggle<cr>')

-- Close buffer
map('n', '<leader>x', function()
  local buf = vim.api.nvim_get_current_buf()
  vim.cmd('BufferLineCycleNext')
  vim.cmd('bd ' .. buf)
end)

-- Reload config
-- map('n', '<leader>r', '<cmd>source $MYVIMRC<cr>', { desc = 'Reload config' })

-- Switch to next/prev buffers
map('n', '<Tab>', '<cmd>BufferLineCycleNext<cr>')
map('n', '<S-Tab>', '<cmd>BufferLineCyclePrev<cr>')

-- Telescope
map('n', '<leader>ff', '<cmd>Telescope find_files<cr>')
map('n', '<leader>fw', '<cmd>Telescope grep_string<cr>')
