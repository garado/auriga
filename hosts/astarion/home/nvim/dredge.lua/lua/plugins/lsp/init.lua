
-- █░░ █▀ █▀█
-- █▄▄ ▄█ █▀▀

-- General LSP configuration
vim.lsp.config('*', {
  on_attach = function(_, bufnr)
    local nmap = function(keys, func, desc)
      if desc then
        desc = 'LSP: ' .. desc
      end
      vim.keymap.set('n', keys, func, { buffer = bufnr, desc = desc })
    end

    -- View documentation
    nmap('K', vim.lsp.buf.hover, 'Hover Documentation')
    nmap('<C-k>', vim.lsp.buf.signature_help, 'Signature Documentation')
  end,
})

-- Server-specific configurations
local servers = {
  -- Python
  basedpyright = {
    settings = {
      python = {
        pythonPath = "/nix/store/75wi6cm494h7wx0sa79di31aznp7cnwk-python3-3.12.11-env/bin/python3.12",
        analysis = {
          autoSearchPaths = true,
          useLibraryCodeForTypes = true,
          diagnosticMode = "workspace",
          extraPaths = {
            vim.fn.stdpath("data"),
            "/nix/store/75wi6cm494h7wx0sa79di31aznp7cnwk-python3-3.12.11-env/lib/python3.12/site-packages",
          },
          -- sigh
          reportMissingImports = false,          -- ignores imports pyright can't find
          reportMissingModuleSource = false,     -- ignores C-backed modules like gi
        },
      },
    },
  },

  -- Lua
  lua_ls = {
    settings = {
      Lua = {
        formatters = {
          ignoreComments = true,
        },
        signatureHelp = { enabled = true },
        diagnostics = {
          globals = { 'vim', 'nixCats' },
          disable = { 'missing-fields' },
        },
      }
    }
  }
}

-- Set up the servers to be loaded on the appropriate filetypes
for server_name, cfg in pairs(servers) do
  vim.lsp.config(server_name, cfg)
  vim.lsp.enable(server_name)
end
