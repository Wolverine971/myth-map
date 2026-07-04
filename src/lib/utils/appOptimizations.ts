// src/lib/utils/appOptimizations.ts
import { browser } from '$app/environment';
import { preloadManager, registerPreloads } from './preloadOnIntent';

// Initialize app-wide optimizations
export function initializeOptimizations() {
	if (!browser) return;

	// Register preload strategies
	registerPreloads();

	// Optimize images loading
	optimizeImageLoading();
}

function optimizeImageLoading() {
	// Set up image intersection observer for eager loading of above-fold images
	const imageObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const img = entry.target as HTMLImageElement;
					if (img.dataset.src && !img.src) {
						img.src = img.dataset.src;
						img.classList.remove('loading');
						imageObserver.unobserve(img);
					}
				}
			});
		},
		{
			threshold: 0.1,
			rootMargin: '50px'
		}
	);

	// Auto-observe images with data-src
	const observeImages = () => {
		document.querySelectorAll('img[data-src]').forEach((img) => {
			imageObserver.observe(img);
		});
	};

	// Initial observation
	observeImages();

	// Re-observe on DOM changes
	const mutationObserver = new MutationObserver(() => {
		observeImages();
	});

	mutationObserver.observe(document.body, {
		childList: true,
		subtree: true
	});
}

// Service Worker registration for offline support
export function registerServiceWorker() {
	if (!browser || !('serviceWorker' in navigator)) return;

	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/sw.js')
			.then((registration) => {
				console.log('SW registered: ', registration);
			})
			.catch((registrationError) => {
				console.log('SW registration failed: ', registrationError);
			});
	});
}

// Clean up unused resources
export function cleanupResources() {
	// Clean up any observers or listeners
	preloadManager.destroy();

	// Clear caches if memory is low
	if ('memory' in performance) {
		const memory = (performance as any).memory;
		if (memory.usedJSHeapSize > memory.totalJSHeapSize * 0.8) {
			// Clear component cache
			if ('caches' in window) {
				caches.keys().then((names) => {
					names.forEach((name) => {
						if (name.includes('component-cache')) {
							caches.delete(name);
						}
					});
				});
			}
		}
	}
}

// Critical CSS inlining (would be used in build process)
export function inlineCriticalCSS() {
	// This would typically be handled by the build process
	// but can be used for dynamic critical CSS
	const criticalStyles = [
		// Above-fold styles
		'body, html { margin: 0; padding: 0; font-family: system-ui; }',
		'.loading { opacity: 0.5; }',
		'.skeleton { animation: pulse 2s infinite; }'
	];

	const style = document.createElement('style');
	style.textContent = criticalStyles.join('\n');
	document.head.appendChild(style);
}
