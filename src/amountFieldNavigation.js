// An in-page accessory for decimal inputs. This does not modify the native keyboard.
export function addAmountFieldNavigation(form) {
  const toolbar = document.createElement('div');
  toolbar.className = 'amount-field-navigation';
  toolbar.hidden = true;
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Amount field navigation');
  const position = document.createElement('span');
  const fieldName = document.createElement('strong');
  const count = document.createElement('small');
  position.append(fieldName, count);
  position.setAttribute('aria-live', 'polite');
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.nextAmount = '';
  toolbar.append(position, button);
  document.body.append(toolbar);

  let active = null;
  let frame = 0;
  let settleTimer = 0;
  let recoverUntil = 0;
  const viewport = window.visualViewport;
  const usable = input => input.isConnected && !input.matches(':disabled, [readonly], [type="hidden"]') &&
    !input.closest('[hidden], [inert]') && input.getClientRects().length > 0 &&
    getComputedStyle(input).visibility === 'visible';
  const fields = () => {
    const panel = active?.closest('.flow-step');
    return panel ? [...panel.querySelectorAll('input[inputmode="decimal"]')].filter(usable) : [];
  };
  const hide = () => { active = null; toolbar.hidden = true; clearTimeout(settleTimer); recoverUntil = 0; };
  const contextFor = input => {
    const row = input.closest('.category-row');
    const label = input.closest('label');
    const name = row?.querySelector('[data-row-label]');
    const kind = row?.querySelector('[data-row-kind]');
    return {
      name: name?.value.trim() || kind?.selectedOptions[0]?.textContent ||
        row?.querySelector('legend')?.textContent || label?.querySelector(':scope > span')?.textContent || 'Amount',
      heading: row ? (name?.type === 'hidden' ? row.querySelector('legend') : name) : label?.querySelector(':scope > span'),
    };
  };
  const update = (reveal = false) => {
    const inputs = fields();
    const index = inputs.indexOf(active);
    if (index < 0 || (document.activeElement !== active && !toolbar.contains(document.activeElement))) {
      hide(); return;
    }
    const context = contextFor(active);
    if (fieldName.textContent !== context.name) fieldName.textContent = context.name;
    const progress = `${index + 1} of ${inputs.length}`;
    if (count.textContent !== progress) count.textContent = progress;
    const action = index < inputs.length - 1 ? 'Next field' : 'Done';
    if (button.textContent !== action) button.textContent = action;
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
      const header = document.querySelector('.site-header');
      const headerBottom = header && getComputedStyle(header).position === 'fixed' ? header.getBoundingClientRect().bottom : 0;
      const upper = Math.max(top, headerBottom) + 12;
      const lower = toolbarTop - 12;
      const heading = context.heading?.getBoundingClientRect();
      // Include the category's visible name when it fits. At extreme zoom the
      // persistent toolbar name supplies context while the input takes priority.
      const start = heading && rect.bottom - heading.top <= lower - upper ? Math.min(heading.top, rect.top) : rect.top;
      if (start < upper - 1 || rect.bottom > lower + 1) {
        window.scrollBy({ top: start - upper - Math.max(0, (lower - upper - (rect.bottom - start)) / 2),
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      }
    }
  };
  const schedule = (reveal = false) => {
    if (reveal) {
      clearTimeout(settleTimer);
      // Safari can pan after focus() returns and while its keyboard animates.
      // Wait for a quiet viewport, then measure fresh geometry once. Subsequent
      // native scroll events can repair visibility during this bounded window.
      settleTimer = setTimeout(() => update(true), 120);
    }
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };
  form.addEventListener('focusin', event => {
    if (event.target.matches('input[inputmode="decimal"]') && usable(event.target)) {
      active = event.target;
      // Keep the fixed control next in the tab order, outside the input's label.
      // Moving the same element also preserves Shift+Tab back to the current amount.
      const label = active.closest('label');
      if (label && label.nextElementSibling !== toolbar) label.after(toolbar);
      recoverUntil = performance.now() + 1400;
      update();
      schedule(true);
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
  const resize = () => { if (active) recoverUntil = performance.now() + 1400; schedule(Boolean(active)); };
  const scroll = () => schedule(Boolean(active) && performance.now() < recoverUntil);
  // Never drag the page back against an intentional finger/wheel scroll.
  const manualScroll = () => { recoverUntil = 0; clearTimeout(settleTimer); };
  window.addEventListener('touchmove', manualScroll, { passive: true });
  window.addEventListener('wheel', manualScroll, { passive: true });
  viewport?.addEventListener('resize', resize);
  viewport?.addEventListener('scroll', scroll);
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('resize', resize);
}
