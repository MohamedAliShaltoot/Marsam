export function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);

  for (const [key, val] of Object.entries(attrs)) {
    if (val === undefined || val === null) continue;

    if (key.startsWith('on') && typeof val === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, val);
    } else if (key === 'className' || key === 'class') {
      element.className = String(val);
    } else if (key === 'dataset' && typeof val === 'object') {
      for (const [dataKey, dataVal] of Object.entries(val)) {
        element.dataset[dataKey] = String(dataVal);
      }
    } else if (key === 'style' && typeof val === 'object') {
      for (const [styleProp, styleVal] of Object.entries(val)) {
        element.style.setProperty(styleProp, styleVal);
      }
    } else if (typeof val === 'boolean') {
      if (val) element.setAttribute(key, '');
    } else {
      element.setAttribute(key, String(val));
    }
  }

  const childList = Array.isArray(children) ? children : [children];
  for (const child of childList) {
    if (child === null || child === undefined) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }

  return element;
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function empty(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function createHighlightedText(text, query) {
  const fragment = document.createDocumentFragment();
  if (!query || !query.trim()) {
    fragment.appendChild(document.createTextNode(text));
    return fragment;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  let startIndex = 0;
  let matchIndex = lowerText.indexOf(lowerQuery, startIndex);

  while (matchIndex !== -1) {
    if (matchIndex > startIndex) {
      fragment.appendChild(document.createTextNode(text.slice(startIndex, matchIndex)));
    }
    const matchSpan = el('span', { class: 'search-highlight' }, text.slice(matchIndex, matchIndex + lowerQuery.length));
    fragment.appendChild(matchSpan);
    startIndex = matchIndex + lowerQuery.length;
    matchIndex = lowerText.indexOf(lowerQuery, startIndex);
  }

  if (startIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(startIndex)));
  }

  return fragment;
}

