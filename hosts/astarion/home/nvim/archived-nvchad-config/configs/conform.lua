--type conform.options
local options = {
	lsp_fallback = true,

	formatters_by_ft = {
		lua = { "stylua" },

		typescript = { "prettierd" },
		javascript = { "prettierd" },
		css = { "prettierd" },
		html = { "prettierd" },

		sh = { "shfmt" },
	},

  prettier = {
    single_quote = true,
    jsx_single_quote = true,
  },

  format_on_save = {
    -- These options will be passed to conform.format()
    timeout_ms = 500,
    lsp_format = "fallback",
  },

  -- adding same formatter for multiple filetypes can look too much work for some
  -- instead of the above code you could just use a loop! the config is just a table after all!

  -- format_on_save = {
  --   -- These options will be passed to conform.format()
  --   timeout_ms = 500,
  --   lsp_fallback = true,
  -- },
}

require("conform").setup(options)
