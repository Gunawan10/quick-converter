(() => {
  let selectionRange = null;
  let fallbackDocumentRect = null;
  let frameId = null;

  const originalSetSelectionRect = QuickConverterContent.setSelectionRect;

  QuickConverterContent.setSelectionRect = function setAnchoredSelectionRect(rect) {
    originalSetSelectionRect(rect);

    fallbackDocumentRect = {
      top: rect.top + window.scrollY,
      bottom: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      right: rect.right + window.scrollX,
      width: rect.width,
      height: rect.height
    };

    selectionRange = getCurrentSelectionRange();
  };

  window.addEventListener('scroll', scheduleReposition, true);
  window.addEventListener('resize', scheduleReposition);

  function getCurrentSelectionRange() {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    try {
      return selection.getRangeAt(0).cloneRange();
    } catch {
      return null;
    }
  }

  function scheduleReposition() {
    if (frameId !== null) {
      return;
    }

    frameId = requestAnimationFrame(() => {
      frameId = null;
      repositionVisibleUi();
    });
  }

  function repositionVisibleUi() {
    const rect = getAnchorRect();

    if (!rect) {
      return;
    }

    const trigger = document.getElementById('quick-converter-trigger');
    const card = document.getElementById('quick-converter-result');
    const anchorVisible = isAnchorVisible(rect);

    setVisibility(trigger, anchorVisible);
    setVisibility(card, anchorVisible);

    if (!anchorVisible) {
      return;
    }

    if (trigger) {
      positionTrigger(trigger, rect);
    }

    if (card) {
      positionCard(card, rect);
    }
  }

  function getAnchorRect() {
    if (selectionRange) {
      try {
        const rect = selectionRange.getBoundingClientRect();

        if (
          Number.isFinite(rect.top) &&
          Number.isFinite(rect.left) &&
          (rect.width > 0 || rect.height > 0)
        ) {
          return rect;
        }
      } catch {
        selectionRange = null;
      }
    }

    if (!fallbackDocumentRect) {
      return null;
    }

    return {
      top: fallbackDocumentRect.top - window.scrollY,
      bottom: fallbackDocumentRect.bottom - window.scrollY,
      left: fallbackDocumentRect.left - window.scrollX,
      right: fallbackDocumentRect.right - window.scrollX,
      width: fallbackDocumentRect.width,
      height: fallbackDocumentRect.height
    };
  }

  function isAnchorVisible(rect) {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    return (
      rect.bottom > 0 &&
      rect.top < viewportHeight &&
      rect.right > 0 &&
      rect.left < viewportWidth
    );
  }

  function setVisibility(element, visible) {
    if (!element) {
      return;
    }

    element.style.visibility = visible ? 'visible' : 'hidden';
    element.style.pointerEvents = visible ? '' : 'none';
  }

  function positionTrigger(trigger, rect) {
    const margin = 8;
    const gap = 7;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const width = trigger.offsetWidth;
    const height = trigger.offsetHeight;

    let left = rect.right + gap;
    let top = rect.bottom + gap;

    if (left + width > viewportWidth - margin) {
      left = rect.left - width - gap;
    }

    if (top + height > viewportHeight - margin) {
      top = rect.top - height - gap;
    }

    trigger.style.left = `${Math.max(margin, left)}px`;
    trigger.style.top = `${Math.max(margin, top)}px`;
  }

  function positionCard(card, rect) {
    const margin = 10;
    const gap = 10;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const width = card.offsetWidth;
    const height = card.offsetHeight;

    let left = rect.left;
    let top = rect.bottom + gap;

    left = Math.max(
      margin,
      Math.min(left, viewportWidth - width - margin)
    );

    if (top + height > viewportHeight - margin) {
      top = rect.top - height - gap;
    }

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }
})();
