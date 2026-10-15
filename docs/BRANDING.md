# KAJORA branding

Applied from the supplied KAJORA Brand Identity Moodboard.

| Colour | Hex | Use |
|---|---|---|
| Forest Green | #0F5132 | Logo, primary actions, navigation |
| Sage Green | #6B8F71 | Supporting illustration colour |
| Ivory | #F6F1E7 | App and splash background |
| Gold | #D4AF37 | Start action and highlights |
| Charcoal | #1F1F1F | Main text and text on gold |

Exact brand colours are exported in `src/theme/index.ts`; lighter supporting tints are used for cards, dividers and selected states. Forest actions use light text; gold actions use charcoal text for contrast. Error colours remain distinct.

`assets/brand` contains SVG traces of the actual symbol and bold lettering in the updated logo reference (Screenshot 2026-10-14 at 22.09.08.png), plus PNG exports for React Native, Expo icons and splash. The stacked composition places the supplied symbol above its wordmark; the compact horizontal composition rearranges the same traced symbol and letters for navigation headers. These are traced assets, not original designer vector masters. An original SVG can replace them later without changing the UI.

The icon uses an ivory symbol on forest green. Android adaptive icons have a transparent foreground with a forest background; web uses the matching favicon. Launcher and native splash updates require a new standalone/development build and do not replace the Expo Go launcher icon.
