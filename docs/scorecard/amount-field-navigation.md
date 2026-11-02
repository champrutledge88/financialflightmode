# Amount field navigation

When a decimal amount input has focus, an on-page control offers **Next field** within the current scorecard step. The final amount offers **Done**, which moves focus to Continue without activating it. Existing input modes, values, totals, validation and step navigation remain unchanged.

The control resolves eligible fields from the current DOM, skipping hidden, disabled and read-only inputs. Added and removed categories are handled immediately. It follows the visual viewport when the keyboard changes the available space or the page is zoomed. Pointer activation keeps the next focus change inside the user gesture; keyboard and assistive activation use the button's click behavior.

This is an in-page accessory, not a modification of the native iOS keyboard.

## Verification

Run the local site on port 4173, then:

```sh
npm test
node scripts/verify-amount-field-navigation.mjs
node scripts/verify-scorecard.mjs
```

The focused navigation suite covers Chromium and WebKit at 390px and 1280px widths, repeated taps, single and final fields, keyboard navigation, dynamic categories, skipped fields, empty and negative amounts, value retention, reduced viewport height, rotation, and full report completion. Chromium additionally covers 2x viewport zoom. WebKit on macOS uses Option+Tab to include buttons in sequential keyboard focus.

Headless engines do not display the native iOS keyboard. A physical iPhone Safari check is still needed to confirm keyboard retention and accessory placement during real typing, rotation and zoom.

## Release status

Prepared locally against `70825755a8faadb4b3288f427b9a2366937da830`. Not deployed; this change requires fresh deployment approval.
