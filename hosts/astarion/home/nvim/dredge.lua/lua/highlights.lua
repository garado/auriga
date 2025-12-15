local M = {}

function M.setup(colors, overrides)
  local c = vim.tbl_extend("force", colors.base_16, colors.base_30)
  local hi = vim.api.nvim_set_hl
  
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then
    vim.cmd("syntax reset")
  end
  vim.g.colors_name = "mountain"
  
  -- Default highlights
  local highlights = {
    -- UI
    Normal        = { fg = c.base05, bg = c.base00 },
    NormalFloat   = { fg = c.base05, bg = c.base01 },
    LineNr        = { fg = c.base03 },
    CursorLine    = { bg = c.base01 },
    CursorLineNr  = { fg = c.base08 },
    Visual        = { bg = c.base02 },
    Search        = { fg = c.base01, bg = c.base0A },
    IncSearch     = { fg = c.base01, bg = c.base09 },
    StatusLine    = { fg = c.base04, bg = c.base02 },
    StatusLineNC  = { fg = c.base03, bg = c.base01 },
    VertSplit     = { fg = c.base02 },
    SignColumn    = { fg = c.base03, bg = c.base01 },
    ColorColumn   = { bg = c.base01 },
    CursorColumn  = { bg = c.base01 },
    Pmenu         = { fg = c.base05, bg = c.base01 },
    PmenuSel      = { fg = c.base01, bg = c.base05 },
    TabLine       = { fg = c.base03, bg = c.base01 },
    TabLineFill   = { fg = c.base03, bg = c.base01 },
    TabLineSel    = { fg = c.base0B, bg = c.base01 },
    Folded        = { fg = c.base03, bg = c.base01 },
    FoldColumn    = { fg = c.base0C, bg = c.base01 },
    MatchParen    = { bg = c.base03 },
    NonText       = { fg = c.base00 },
    SpecialKey    = { fg = c.base03 },
    
    -- Syntax
    Comment       = { fg = c.base03 },
    Constant      = { fg = c.base09 },
    String        = { fg = c.base0B },
    Character     = { fg = c.base08 },
    Number        = { fg = c.base09 },
    Boolean       = { fg = c.base09 },
    Float         = { fg = c.base09 },
    Identifier    = { fg = c.base08 },
    Function      = { fg = c.base0D },
    Statement     = { fg = c.base08 },
    Conditional   = { fg = c.base0E },
    Repeat        = { fg = c.base0A },
    Label         = { fg = c.base0A },
    Operator      = { fg = c.base05 },
    Keyword       = { fg = c.base0E },
    Exception     = { fg = c.base08 },
    PreProc       = { fg = c.base0A },
    Include       = { fg = c.base0D },
    Define        = { fg = c.base0E },
    Macro         = { fg = c.base08 },
    Type          = { fg = c.base0A },
    StorageClass  = { fg = c.base0A },
    Structure     = { fg = c.base0E },
    Typedef       = { fg = c.base0A },
    Special       = { fg = c.base0C },
    SpecialChar   = { fg = c.base08 },
    Delimiter     = { fg = c.base08 },
    Todo          = { fg = c.base0A, bg = c.base01 },
    Error         = { fg = c.base00, bg = c.base08 },
    ErrorMsg      = { fg = c.base08, bg = c.base00 },
    WarningMsg    = { fg = c.base08 },
    
    -- Diff
    DiffAdd       = { fg = c.base0B, bg = c.base01 },
    DiffChange    = { fg = c.base03, bg = c.base01 },
    DiffDelete    = { fg = c.base08, bg = c.base01 },
    DiffText      = { fg = c.base0D, bg = c.base01 },

    -- nvim-tree
    NvimTreeNormal           = { fg = c.base05, bg = c.bg1 },
    NvimTreeNormalNC         = { fg = c.base05, bg = c.bg1 },
    NvimTreeVertSplit        = { fg = c.base01, bg = c.base01 },
    NvimTreeWinSeparator     = { fg = c.base00, bg = c.base00 },
    NvimTreeFolderIcon       = { fg = c.base0D },
    NvimTreeFolderName       = { fg = c.base0D },
    NvimTreeOpenedFolderName = { fg = c.base0D },
    NvimTreeEmptyFolderName  = { fg = c.base0D },
    NvimTreeRootFolder       = { fg = c.base0E, bold = true },
    NvimTreeSpecialFile      = { fg = c.base0E },
    NvimTreeExecFile         = { fg = c.base0B },
    NvimTreeImageFile        = { fg = c.base0D },
    NvimTreeSymlink          = { fg = c.base0C },
    NvimTreeIndentMarker     = { fg = c.base02 },
    NvimTreeGitDirty         = { fg = c.base09 },
    NvimTreeGitStaged        = { fg = c.base0B },
    NvimTreeGitMerge         = { fg = c.base08 },
    NvimTreeGitRenamed       = { fg = c.base0E },
    NvimTreeGitNew           = { fg = c.base0B },
    NvimTreeGitDeleted       = { fg = c.base08 },
    NvimTreeGitIgnored       = { fg = c.base03 },

    -- bufferline.nvim (top tab bar)
    BufferLineFill                = { bg = c.base00 },
    BufferLineBackground          = { fg = c.base03, bg = c.base01 },
    BufferLineBufferSelected      = { fg = c.base05, bg = c.base00, bold = true },
    BufferLineBufferVisible       = { fg = c.base04, bg = c.base01 },
    BufferLineModified            = { fg = c.base09, bg = c.base01 },
    BufferLineModifiedSelected    = { fg = c.base09, bg = c.base00, bold = true },
    BufferLineModifiedVisible     = { fg = c.base09, bg = c.base01 },
    BufferLineSeparator           = { fg = c.base00, bg = c.base01 },
    BufferLineSeparatorSelected   = { fg = c.base00, bg = c.base00 },
    BufferLineSeparatorVisible    = { fg = c.base00, bg = c.base01 },
    BufferLineTab                 = { fg = c.base03, bg = c.base01 },
    BufferLineTabSelected         = { fg = c.base0D, bg = c.base00, bold = true },
    BufferLineTabClose            = { fg = c.base08, bg = c.base01 },
    BufferLineCloseButton         = { fg = c.base03, bg = c.base01 },
    BufferLineCloseButtonSelected = { fg = c.base08, bg = c.base00 },
    BufferLineCloseButtonVisible  = { fg = c.base04, bg = c.base01 },
    BufferLineDuplicate           = { fg = c.base03, bg = c.base01 },
    BufferLineDuplicateSelected   = { fg = c.base05, bg = c.base00, bold = true },
    BufferLineDuplicateVisible    = { fg = c.base04, bg = c.base01 },
    BufferLineIndicatorSelected   = { fg = c.base0D, bg = c.base00 }, 
    BufferLineDevIconDefault          = { bg = c.base01 },
    BufferLineDevIconDefaultInactive  = { bg = c.base01 },
    BufferLineDevIconDefaultSelected  = { bg = c.base00 },

    -- Add after your bufferline highlights
    DevIconDefault          = { bg = c.base01 },
    DevIconDefaultSelected  = { bg = c.base00 },

    -- lualine (bottom status bar)
    lualine_a_normal          = { fg = c.base00, bg = c.base0D, bold = true },
    lualine_a_insert          = { fg = c.base00, bg = c.base0B, bold = true },
    lualine_a_visual          = { fg = c.base00, bg = c.base0E, bold = true },
    lualine_a_replace         = { fg = c.base00, bg = c.base08, bold = true },
    lualine_a_command         = { fg = c.base00, bg = c.base0A, bold = true },
    lualine_a_inactive        = { fg = c.base03, bg = c.base00 },
    
    lualine_b_normal          = { fg = c.base0D, bg = c.base02 },
    lualine_b_insert          = { fg = c.base0B, bg = c.base02 },
    lualine_b_visual          = { fg = c.base0E, bg = c.base02 },
    lualine_b_replace         = { fg = c.base08, bg = c.base02 },
    lualine_b_command         = { fg = c.base0A, bg = c.base02 },
    lualine_b_inactive        = { fg = c.base03, bg = c.base00 },
    
    lualine_c_normal          = { fg = c.base04, bg = c.base00 },
    lualine_c_insert          = { fg = c.base04, bg = c.base00 },
    lualine_c_visual          = { fg = c.base04, bg = c.base00 },
    lualine_c_replace         = { fg = c.base04, bg = c.base00 },
    lualine_c_command         = { fg = c.base04, bg = c.base00 },
    lualine_c_inactive        = { fg = c.base03, bg = c.base00 },
    
    lualine_x_normal          = { fg = c.base04, bg = c.base00 },
    lualine_x_insert          = { fg = c.base04, bg = c.base00 },
    lualine_x_visual          = { fg = c.base04, bg = c.base00 },
    lualine_x_replace         = { fg = c.base04, bg = c.base00 },
    lualine_x_command         = { fg = c.base04, bg = c.base00 },
    lualine_x_inactive        = { fg = c.base03, bg = c.base00 },
    
    lualine_y_normal          = { fg = c.base0D, bg = c.base02 },
    lualine_y_insert          = { fg = c.base0B, bg = c.base02 },
    lualine_y_visual          = { fg = c.base0E, bg = c.base02 },
    lualine_y_replace         = { fg = c.base08, bg = c.base02 },
    lualine_y_command         = { fg = c.base0A, bg = c.base02 },
    lualine_y_inactive        = { fg = c.base03, bg = c.base00 },
    
    lualine_z_normal          = { fg = c.base00, bg = c.base0D, bold = true },
    lualine_z_insert          = { fg = c.base00, bg = c.base0B, bold = true },
    lualine_z_visual          = { fg = c.base00, bg = c.base0E, bold = true },
    lualine_z_replace         = { fg = c.base00, bg = c.base08, bold = true },
    lualine_z_command         = { fg = c.base00, bg = c.base0A, bold = true },
    lualine_z_inactive        = { fg = c.base03, bg = c.base00 },
  }
  
  -- Merge overrides
  if overrides then
    highlights = vim.tbl_deep_extend("force", highlights, overrides)
  end
  
  -- Apply all highlights
  for group, opts in pairs(highlights) do
    hi(0, group, opts)
  end
end

return M
