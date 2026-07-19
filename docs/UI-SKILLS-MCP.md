# UI skills + 21st.dev MCP (Verlin Labs)

## Installed

| Source | Location | Role |
|--------|----------|------|
| **ui-ux-pro-max** | `.grok/skills/ui-ux-pro-max/` | Motion, a11y, landing UX, design intelligence |
| **verlin-ui-polish** | `.grok/skills/verlin-ui-polish/` | Combines brand + pro-max + 21st anti-slop |
| **21st MCP** | `.grok/config.toml` → `mcp_servers."21st"` | Real component catalog (when API key set) |

## 21st.dev MCP config

Grok project config (already set):

```toml
[mcp_servers."21st"]
url = "https://21st.dev/api/mcp"
enabled = true
headers = { "x-api-key" = "${API_KEY_21ST}" }
```

Equivalent JSON (Cursor / other clients):

```json
{
  "mcpServers": {
    "21st": {
      "url": "https://21st.dev/api/mcp",
      "headers": {
        "x-api-key": "$API_KEY_21ST"
      }
    }
  }
}
```

### Enable live 21st tools

1. Create a key: https://21st.dev/settings/api-keys  
2. In PowerShell (session):

```powershell
$env:API_KEY_21ST = "your_key_here"
```

3. Or add to **local only** `.env.local` (gitignored):

```
API_KEY_21ST=your_key_here
```

4. Restart Grok so MCP reconnects.

**Never commit the raw API key.**

## Design priority (when polishing UI)

1. Verlin brand (teal / amber / navy + `VerlinBrandText`)
2. `DESIGN-VERLIN.md` controlled merge
3. ui-ux-pro-max motion & a11y checklist
4. 21st principles (craft, no generic purple AI slop); live MCP components when key is set

## Preview

```bash
npm run dev
# http://localhost:3000
```

Do not deploy unless asked.
