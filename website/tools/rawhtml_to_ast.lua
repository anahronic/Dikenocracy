-- Turns the few raw HTML constructs allowed in canonical DKP Markdown
-- (<sup>, <sub>, <div class="formula">) into pandoc elements, so that
-- DOCX and TXT output keep formulas instead of silently dropping raw HTML.

local function pair_tags(inlines)
  local out = pandoc.List()
  local i = 1
  while i <= #inlines do
    local el = inlines[i]
    local open = el.t == 'RawInline' and el.format == 'html' and el.text:match('^<(su[bp])>$')
    if open then
      local close = '</' .. open .. '>'
      local inner = pandoc.List()
      local j = i + 1
      while j <= #inlines and not (inlines[j].t == 'RawInline' and inlines[j].text == close) do
        inner:insert(inlines[j])
        j = j + 1
      end
      if open == 'sup' then out:insert(pandoc.Superscript(inner)) else out:insert(pandoc.Subscript(inner)) end
      i = j + 1
    else
      out:insert(el)
      i = i + 1
    end
  end
  return out
end

function Inlines(inlines)
  return pair_tags(inlines)
end

function RawBlock(el)
  if el.format == 'html' and el.text:match('class="formula"') then
    local doc = pandoc.read(el.text, 'html')
    local blocks = pandoc.List()
    for _, b in ipairs(doc.blocks) do
      if b.t == 'Div' then
        for _, c in ipairs(b.content) do blocks:insert(c) end
      else
        blocks:insert(b)
      end
    end
    for k, b in ipairs(blocks) do
      if b.t == 'Plain' then blocks[k] = pandoc.Para(b.content) end
    end
    return blocks
  end
end
