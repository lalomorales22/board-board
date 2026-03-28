const PREFIX = 'board-board';

export function loadState<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}-${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${PREFIX}-${key}`, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}
