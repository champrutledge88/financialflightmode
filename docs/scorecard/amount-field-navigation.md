# Amount field navigation

When a decimal amount input has focus, an on-page control offers **Next field** within the current scorecard step. The final amount offers **Done**, which moves focus to Continue without activating it. Existing input modes, values, totals, validation and step navigation remain unchanged.

The control resolves eligible fields from the current DOM, skipping hidden, disabled and read-only inputs. Added and removed categories are handled immediately. It follows the visual viewport when the keyboard changes the available space or the page is zoomed. Pointer activation keeps the next focus change inside the user gesture; keyboard and assistive activation use the button's click behavior.

The active category or field name stays visible in the toolbar, including at zoom. Visibility checks include the category label and input when both fit and account for the fixed header.

The recording-driven candidate removes the repeated recovery window. It permits one reveal after focus or a material viewport dimension change (more than 24 CSS pixels), waiting 180ms for viewport settling. That reveal is consumed before scrolling. Ordinary scroll and same-size resize events position the toolbar without starting a new correction. Touch devices and reduced-motion users receive one immediate, minimal visibility adjustment instead of a competing smooth scroll animation. Deliberate touch/wheel scrolling cancels a pending adjustment.

This deliberately stops repairing late browser pans after the one-shot adjustment. It eliminates the feedback mechanism but cannot guarantee real-device visibility until the affected iPhone/browser is checked. Pointer handling is unchanged: the supplied recording does not establish which control was touched when the keyboard closed.

This is an in-page accessory, not a modification of the native iOS keyboard.

## Verification

Run the local site on port 4173, then:

```sh
npm test
node scripts/verify-amount-field-navigation.mjs
node scripts/verify-scorecard.mjs
```

The focused navigation suite covers Chromium and WebKit at 390px and 1280px widths, repeated taps, single and final fields, keyboard navigation, dynamic categories, skipped fields, empty and negative amounts, value retention, reduced viewport height, rotation, and full report completion. It asserts category/input geometry, a pan during the pending focus-settling interval and no re-armed correction on unchanged viewport notifications, rapid navigation with ordinary motion, wants-category context, and respect for intentional scrolling. Chromium additionally covers 2x viewport zoom. WebKit on macOS uses Option+Tab to include buttons in sequential keyboard focus.

Headless engines do not display the native iOS keyboard. A physical iPhone Safari check is still needed to confirm keyboard retention and accessory placement during real typing, rotation and zoom.

## Release status

The context/scroll release is `e26b6569358fc906bc283e93d49d16f4b690bd92`. This recording-driven candidate is based on that release, is not deployed, and requires fresh deployment approval. Browser tests are regression checks, not proof that the observed iPhone issue is resolved.
