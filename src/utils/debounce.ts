// src/utils/debounce.ts
/**
 * Creates a debounced function that delays invoking `func` until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 * @return {Function} Returns the new debounced function.
 */
export function debounce<TArgs extends unknown[]>(
	func: (...args: TArgs) => void,
	wait: number
): (...args: TArgs) => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function executedFunction(...args) {
		const later = () => {
			if (timeout) clearTimeout(timeout);
			func(...args);
		};

		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

// Example usage:
// const debouncedFunction = debounce(originalFunction, 300);
