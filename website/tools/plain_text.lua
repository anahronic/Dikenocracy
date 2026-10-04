-- TXT-specific rendering: copy-safe formula notation and unindented code.

function Superscript(el)
  local s = pandoc.utils.stringify(el)
  if s:match('^[%w%.]+$') then return pandoc.Str('^' .. s) end
  return pandoc.Str('^(' .. s .. ')')
end

function Subscript(el)
  return pandoc.Str('_' .. pandoc.utils.stringify(el))
end

-- Code is emitted verbatim (no 4-space indent) between ``` fences, so that
-- Python copied from the TXT keeps valid indentation.
function CodeBlock(el)
  return pandoc.RawBlock('plain', '```\n' .. el.text .. '\n```')
end

function HorizontalRule()
  return pandoc.RawBlock('plain', '----------------------------------------')
end
