local on_attach = vim.lsp.config.on_attach
local capabilities = vim.lsp.config.capabilities

vim.lsp.config('cssls', {
  on_attach = on_attach,
  capabilities = capabilities,
})

vim.lsp.config('ts_ls', {
  on_attach = on_attach,
  capabilities = capabilities,
})

vim.lsp.config('html', {
  on_attach = on_attach,
  capabilities = capabilities,
  init_options = {
    provideFormatter = true 
  },
  settings = {  
    css = {
      lint = {
        validProperties = {}
      }
    },
  },
})

vim.lsp.config('clangd', {
  cmd = { "clangd" },
  on_attach = on_attach,
  capabilities = capabilities,
})

-- Enable all LSPs
vim.lsp.enable({'cssls', 'ts_ls', 'html', 'clangd'})
