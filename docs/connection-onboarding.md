# Connection onboarding decisions

Checked October 31, 2026.

The flow reduces simultaneous decisions: choose a provider, copy its name and URL, authorize, then ask the AI to propose context. A small illustrated preview follows the current instruction. It is not a live recording of the provider UI. Provider settings open in another tab so users keep their place here. Existing authenticated connections stay active when another provider is added. A connection is not a context import; approved notes still pass through website review before saving.

## Provider instructions and limits

- [OpenAI: Connect and test your plugin](https://developers.openai.com/plugins/deploy/connect-chatgpt): ChatGPT Plugins → plus → Add custom MCP server; provide a name and endpoint, configure authentication, acknowledge the warning, create/install, then select the plugin in a conversation. Account and workspace permissions control availability; UI labels can differ. Direct destination: https://chatgpt.com/plugins.
- [Claude: Custom connectors](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp): Customize → Connectors → + Add → Add custom connector; enter the name and server URL, continue through detected authentication, then add and connect. ContextGraph currently supports dynamic client registration, so Register automatically is the compatible option when prompted. Team/Enterprise owners may need to install it for members. Direct destination: https://claude.ai/customize/connectors.

These are official documented destination links. No undocumented auto-install or prefilled modal link is used. The app cannot silently create a connector inside another provider account. The local OAuth/MCP browser fixture verifies our protocol and consent flow; it is not proof that a particular signed-in provider account has the required plan or workspace permissions.

MCP initialize metadata includes the existing public ContextGraph SVG logo. A host decides whether to show it. Custom connector directory branding is controlled by the host; metadata does not imply directory listing or verified identity. The OAuth allow screen shows ContextGraph's own branding and a neutral requesting-client initial, retaining the warning that the registered app name is self-reported.

## Draft review

Six compact rows per page replace the full stack of editors. Search and category filters narrow the draft, expandable rows expose editing, and include/exclude choices persist across pages. Save applies to every selected item, including hidden pages, through the existing revisioned API. Nothing is silently saved by expanding a row or connecting an AI.

## Visual assets

Monochrome Claude and OpenAI identity SVGs come from [Lobe Icons](https://github.com/lobehub/lobe-icons), packages/static-svg/icons/claude.svg and openai.svg. Their marks identify the respective providers, without implying affiliation. The existing ContextGraph mark remains the app identity.


## UX research applied

[NN/g: Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) recommends showing the essential choices first and exposing secondary options only when needed. Here, provider cards lead to one task at a time; account caveats and prompt details remain available on demand. This is the rationale for a step-linked preview instead of an unrelated autoplay loop.

[Microsoft: Consent experience](https://learn.microsoft.com/en-us/entra/identity-platform/application-consent-experience) identifies app identity, the account being accessed, permission descriptions and the ability to remove access as core consent information. Our consent layout uses those building blocks without a verified-publisher claim or an inferred third-party logo. It distinguishes import review from ongoing capture and notes that write scope can manage existing notes.
