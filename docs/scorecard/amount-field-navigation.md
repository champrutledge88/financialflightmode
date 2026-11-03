# Amount field navigation

When a decimal amount input has focus, an on-page control offers **Next field** within the current scorecard step. The final amount offers **Done**, which moves focus to Continue without activating it. Existing input modes, values, totals, validation and step navigation remain unchanged.

The control resolves eligible fields from the current DOM, skipping hidden, disabled and read-only inputs. Added and removed categories are handled immediately. It follows the visual viewport when the keyboard changes the available space or the page is zoomed. Pointer activation keeps the next focus change inside the user gesture; keyboard and assistive activation use the button's click behavior.

The active category or field name stays visible in the toolbar, including at zoom. Visibility checks include the category label and input when both fit, account for the fixed header, and prioritize the input when space is too small. After focus or viewport resize, a 120ms quiet period lets native viewport movement settle before a geometry correction. Scroll events can repair a late native pan during a bounded 1.4-second recovery window. Intentional touch/wheel scrolling cancels recovery. Corrections use smooth scrolling unless reduced motion is requested; there is no custom per-frame scroll animation.

This is an in-page accessory, not a modification of the native iOS keyboard.

## Verification

Run the local site on port 4173, then:

```sh
npm test
node scripts/verify-amount-field-navigation.mjs
node scripts/verify-scorecard.mjs
```

The focused navigation suite covers Chromium and WebKit at 390px and 1280px widths, repeated taps, single and final fields, keyboard navigation, dynamic categories, skipped fields, empty and negative amounts, value retention, reduced viewport height, rotation, and full report completion. It asserts category/input geometry, recovery from a simulated late native pan, rapid navigation with ordinary motion, wants-category context, and respect for intentional scrolling. Chromium additionally covers 2x viewport zoom. WebKit on macOS uses Option+Tab to include buttons in sequential keyboard focus.

Headless engines do not display the native iOS keyboard. A physical iPhone Safari check is still needed to confirm keyboard retention and accessory placement during real typing, rotation and zoom.

## Release status

The initial control shipped in `b03e89ac6a734e8dd4fb942c5c41ef23289ce7c6`. This context/scroll follow-up is prepared locally against that release and requires fresh deployment approval.
