// An in-page accessory for decimal inputs. This does not modify the native keyboard.
export function addAmountFieldNavigation(form) {
  const toolbar = document.createElement('div');
  toolbar.className = 'amount-field-navigation';
  toolbar.hidden = true;
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Amount field navigation');
  const position = document.createElement('span');
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.nextAmount = '';
  toolbar.append(position, button);
  document.body.append(toolbar);

  let active = null;
  let frame = 0;
  let revealOnFrame = false;
  const viewport = window.visualViewport;
  const usable = input => input.isConnected && !input.matches(':disabled, [readonly], [type="hidden"]') &&
    !input.closest('[hidden], [inert]') && input.getClientRects().length > 0 &&
    getComputedStyle(input).visibility === 'visible';
  const fields = () => {
    const panel = active?.closest('.flow-step');
    return panel ? [...panel.querySelectorAll('input[inputmode="decimal"]')].filter(usable) : [];
  };
  const hide = () => { active = null; toolbar.hidden = true; };
  const update = (reveal = false) => {
    const inputs = fields();
    const index = inputs.indexOf(active);
    if (index < 0 || (document.activeElement !== active && !toolbar.contains(document.activeElement))) {
      hide(); return;
    }
    position.textContent = `Amount ${index + 1} of ${inputs.length}`;
    button.textContent = index < inputs.length - 1 ? 'Next field' : 'Done';
    toolbar.hidden = false;

    // Fixed elements otherwise sit behind iOS's keyboard. Use the visible viewport,
    // including its offsets when the user pans or pinches the zoomed page.
    const width = viewport?.width ?? window.innerWidth;
    const height = viewport?.height ?? window.innerHeight;
    const left = viewport?.offsetLeft ?? 0;
    const top = viewport?.offsetTop ?? 0;
    const toolbarWidth = Math.min(600, Math.max(0, width - 24));
    toolbar.classList.toggle('compact', toolbarWidth < 240);
    toolbar.style.width = `${toolbarWidth}px`;
    toolbar.style.left = `${left + (width - toolbarWidth) / 2}px`;
    const toolbarTop = Math.max(top, top + height - toolbar.offsetHeight - 8);
    toolbar.style.top = `${toolbarTop}px`;
    if (reveal && document.activeElement === active) {
      const rect = active.getBoundingClientRect();
      const upper = top + 12;
      const lower = toolbarTop - 12;
      if (rect.top < upper || rect.bottom > lower) {
        window.scrollBy({ top: rect.top - upper - Math.max(0, (lower - upper - rect.height) / 2), behavior: 'instant' });
      }
    }
  };
  const schedule = (reveal = false) => {
    revealOnFrame ||= reveal;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const shouldReveal = revealOnFrame; revealOnFrame = false;
      update(shouldReveal);
    });
  };
  form.addEventListener('focusin', event => {
    if (event.target.matches('input[inputmode="decimal"]') && usable(event.target)) {
      active = event.target;
      // Keep the fixed control next in the tab order, outside the input's label.
      // Moving the same element also preserves Shift+Tab back to the current amount.
      const label = active.closest('label');
      if (label && label.nextElementSibling !== toolbar) label.after(toolbar);
      update(true);
    } else schedule();
  });
  document.addEventListener('focusout', () => schedule());
  // Keep focus on the input until the release synchronously focuses its successor.
  // That direct user gesture is required to keep the iOS number pad open.
  button.addEventListener('pointerdown', event => {
    if (event.button === 0) event.preventDefault();
  });
  const advance = () => {
    const inputs = fields();
    const index = inputs.indexOf(active);
    if (index < 0) { hide(); return; }
    const next = inputs[index + 1];
    if (next) {
      next.focus({ preventScroll: true });
      update(true);
    } else {
      active.blur();
      // Dismiss the keyboard and leave a useful keyboard focus destination.
      // Focusing Continue does not activate it or bypass the step's validation.
      form.querySelector('[data-next]')?.focus();
      hide();
    }
  };
  // WebKit can suppress the synthesized click after a cancelled touch pointerdown.
  // Act on pointerup once; reserve detail=0 clicks for keyboard/assistive activation.
  button.addEventListener('pointerup', event => {
    if (event.button === 0) { event.preventDefault(); advance(); }
  });
  button.addEventListener('click', event => {
    event.preventDefault();
    if (event.detail === 0) advance();
  });
  // Resolve the current DOM on every interaction; added/removed rows and step
  // visibility never leave a stale list of destinations behind.
  new MutationObserver(records => {
    if (records.some(record => !toolbar.contains(record.target))) schedule();
  }).observe(form, {
    subtree: true, childList: true, attributes: true,
    attributeFilter: ['hidden', 'disabled', 'readonly', 'type', 'inputmode', 'style', 'class'],
  });
  viewport?.addEventListener('resize', () => schedule(true));
  viewport?.addEventListener('scroll', () => schedule());
  window.addEventListener('resize', () => schedule(true));
}
