export function debounce<T extends unknown[]>(func: (...args: T) => void, wait: number) {
    let timeout: NodeJS.Timeout;
    return (...args: T) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }