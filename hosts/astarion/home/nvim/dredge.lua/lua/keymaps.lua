local map = vim.keymap.set

map('n', '<C-n>', '<cmd>NvimTreeToggle<cr>')

-- Close buffer
map('n', '<leader>x', '<cmd>bd<cr>')

-- Reload config
-- map('n', '<leader>r', '<cmd>source $MYVIMRC<cr>', { desc = 'Reload config' })

-- Switch to next/prev buffers
map('n', '<Tab>', '<cmd>BufferLineCycleNext<cr>')
map('n', '<S-Tab>', '<cmd>BufferLineCyclePrev<cr>')
