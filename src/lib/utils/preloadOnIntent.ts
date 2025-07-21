// src/lib/utils/preloadOnIntent.ts
import { browser } from '$app/environment';

type PreloadTrigger = 'hover' | 'focus' | 'visible' | 'click' | 'idle';

interface PreloadOptions {
	trigger: PreloadTrigger;
	delay?: number;
	threshold?: number;
}

class PreloadManager {
	private preloadQueue = new Map<string, () => Promise<any>>();
	private preloaded = new Set<string>();
	private observer?: IntersectionObserver;
	private idleCallback?: number;

	constructor() {
		if (browser) {
			this.setupIntersectionObserver();
			this.setupIdleCallback();
		}
	}

	private setupIntersectionObserver() {
		this.observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const element = entry.target as HTMLElement;
						const preloadKey = element.dataset.preload;
						if (preloadKey) {
							this.executePreload(preloadKey);
							this.observer?.unobserve(element);
						}
					}
				});
			},
			{
				threshold: 0.1,
				rootMargin: '100px'
			}
		);
	}

	private setupIdleCallback() {
		if ('requestIdleCallback' in window) {
			this.idleCallback = requestIdleCallback(() => {
				this.preloadIdle();
			});
		} else {
			// Fallback for browsers without requestIdleCallback
			setTimeout(() => this.preloadIdle(), 2000);
		}
	}

	register(key: string, preloadFn: () => Promise<any>) {
		this.preloadQueue.set(key, preloadFn);
	}

	private async executePreload(key: string) {
		if (this.preloaded.has(key)) return;

		const preloadFn = this.preloadQueue.get(key);
		if (preloadFn) {
			this.preloaded.add(key);
			try {
				await preloadFn();
				console.log(`Preloaded: ${key}`);
			} catch (error) {
				console.warn(`Failed to preload ${key}:`, error);
				this.preloaded.delete(key);
			}
		}
	}

	// Preload on hover
	onHover(element: HTMLElement, key: string, delay = 200) {
		if (!browser) return;

		let timeoutId: number;
		
		const handleMouseEnter = () => {
			timeoutId = window.setTimeout(() => {
				this.executePreload(key);
			}, delay);
		};

		const handleMouseLeave = () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};

		element.addEventListener('mouseenter', handleMouseEnter);
		element.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			element.removeEventListener('mouseenter', handleMouseEnter);
			element.removeEventListener('mouseleave', handleMouseLeave);
			if (timeoutId) clearTimeout(timeoutId);
		};
	}

	// Preload on focus
	onFocus(element: HTMLElement, key: string) {
		if (!browser) return;

		const handleFocus = () => {
			this.executePreload(key);
		};

		element.addEventListener('focus', handleFocus);

		return () => {
			element.removeEventListener('focus', handleFocus);
		};
	}

	// Preload when visible
	onVisible(element: HTMLElement, key: string) {
		if (!browser || !this.observer) return;

		element.dataset.preload = key;
		this.observer.observe(element);

		return () => {
			this.observer?.unobserve(element);
			delete element.dataset.preload;
		};
	}

	// Preload on click (useful for modals, etc.)
	onClick(element: HTMLElement, key: string) {
		if (!browser) return;

		const handleClick = () => {
			this.executePreload(key);
		};

		element.addEventListener('click', handleClick);

		return () => {
			element.removeEventListener('click', handleClick);
		};
	}

	// Preload during idle time
	private preloadIdle() {
		const criticalKeys = ['map', 'comments', 'search'];
		criticalKeys.forEach(key => {
			if (this.preloadQueue.has(key)) {
				this.executePreload(key);
			}
		});
	}

	// Preload immediately
	preloadNow(key: string) {
		return this.executePreload(key);
	}

	// Preload multiple components
	preloadMultiple(keys: string[]) {
		return Promise.all(keys.map(key => this.executePreload(key)));
	}

	// Get preload statistics
	getStats() {
		return {
			registered: this.preloadQueue.size,
			preloaded: this.preloaded.size,
			pending: this.preloadQueue.size - this.preloaded.size
		};
	}

	// Clean up
	destroy() {
		if (this.observer) {
			this.observer.disconnect();
		}
		if (this.idleCallback) {
			cancelIdleCallback(this.idleCallback);
		}
		this.preloadQueue.clear();
		this.preloaded.clear();
	}
}

// Create singleton instance
export const preloadManager = new PreloadManager();

// Svelte action for easy use in templates
export function preload(element: HTMLElement, options: { key: string } & PreloadOptions) {
	const { key, trigger, delay, threshold } = options;

	switch (trigger) {
		case 'hover':
			return preloadManager.onHover(element, key, delay);
		case 'focus':
			return preloadManager.onFocus(element, key);
		case 'visible':
			return preloadManager.onVisible(element, key);
		case 'click':
			return preloadManager.onClick(element, key);
		case 'idle':
			// Idle preloading is handled globally
			return () => {};
		default:
			return () => {};
	}
}

// Helper to register preloads
export function registerPreloads() {
	const { LazyMap, LazyComments, LazyItineraryModal } = import('$lib/utils/lazyComponents').then(module => {
		preloadManager.register('map', module.LazyMap.load);
		preloadManager.register('comments', module.LazyComments.load);
		preloadManager.register('itinerary', module.LazyItineraryModal.load);
	});
}