const STORAGE_KEY = 'integration_modes_v1';

const DEFAULTS = {
  protests: 'fixtures', // fixtures | edge | disabled
  nfe: 'fixtures',
  dda: 'fixtures',
  ocr: 'fixtures',
};

export function getIntegrationModes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...(parsed || {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setIntegrationMode(key, mode) {
  const modes = getIntegrationModes();
  modes[key] = mode;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(modes));
  return modes;
}
