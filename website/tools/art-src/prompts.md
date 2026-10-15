# Illustration set (to generate when the OpenAI balance allows)

The first attempt on 2026-10-14 failed with `insufficient_quota / credit_balance_exhausted`; nothing was generated.
Run from the repo root (PowerShell), one image per command:

    & "$env:USERPROFILE\.claude\skills\impeccable\scripts\impeccable.cmd" generate-image --prompt "<subject> <STYLE>" --out website/tools/art-src/<name>.png --size <WxH> --quality high --background opaque

Then convert to WebP (ffmpeg) into `website/assets/art/` and swap the file names in the pages listed below.

## STYLE (append to every prompt)

Two-colour risograph print on pale cool grey paper (#EEF0F3). Only two inks: cobalt blue (#1F2DE6) and near-black (#0B0C0E), overprinted where they overlap. Visible paper grain and print texture, slight misregistration, flat shapes, confident editorial illustration in the tradition of mid-century printed annual reports. No gradients, no glow, no neon, no text, no letters, no numbers, no logos, no scales of justice, no statues, no futuristic skyscrapers.

## Subjects

| File | Size | Used on | Subject |
| --- | --- | --- | --- |
| masthead | 1536x1024 | home masthead | A new small town being built alongside an old one: an old stone colonnade on the left, new timber-and-glass buildings (one in scaffolding) on the right, an open square with ordinary people between them; two surveyors measure the ground with a levelling staff and a tripod level. Open sky at the top. |
| measure | 1024x1536 | home intro tile, about | Close-up of a surveyor's hands reading a levelling staff in a field; the measuring marks are abstract stripes, not digits. |
| strata | 1024x1536 | home stack section, protocols index | A cross-section of nine horizontal earth layers under a town: bedrock at the bottom, then soil, roots, foundations, water pipes, cables, a street with people on top. Each layer clearly separate. |
| square | 1536x1024 | about | A public reading room open to the street: people of different ages read large printed sheets pinned to long public boards. |
| time | 1024x1024 | converter, DKP-0-TIME | A stone sundial ring with 360 fine tick marks seen from above, a long shadow crossing it. |
| workshop | 1536x1024 | projects | A workbench seen from above: a ledger with receipts, a padlock on a folded letter, a dial calendar, a hand-crank radio and a first-aid kit. |
