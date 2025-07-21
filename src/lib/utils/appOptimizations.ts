// src/lib/utils/appOptimizations.ts
import { browser } from '$app/environment';
import { preloadManager, registerPreloads } from './preloadOnIntent';
import { bundleAnalyzer } from './bundleAnalyzer';

// Initialize app-wide optimizations
export function initializeOptimizations() {
	if (!browser) return;

	// Register preload strategies
	registerPreloads();

	// Set up critical resource hints
	setupResourceHints();

	// Optimize third-party scripts
	optimizeThirdPartyScripts();

	// Setup performance monitoring
	setupPerformanceMonitoring();

	// Optimize images loading
	optimizeImageLoading();
}

function setupResourceHints() {
	const head = document.head;

	// DNS prefetch for external resources
	const prefetchDomains = [
		'https://fonts.googleapis.com',
		'https://fonts.gstatic.com',
		'https://api.mapbox.com',
		'https://supabase.co'
	];

	prefetchDomains.forEach(domain => {
		if (!document.querySelector(`link[href="${domain}"]`)) {
			const link = document.createElement('link');
			link.rel = 'dns-prefetch';
			link.href = domain;
			head.appendChild(link);
		}
	});

	// Preconnect to critical origins
	const preconnectOrigins = [
		'https://fonts.gstatic.com',
		'https://api.mapbox.com'
	];

	preconnectOrigins.forEach(origin => {
		if (!document.querySelector(`link[href="${origin}"][rel="preconnect"]`)) {
			const link = document.createElement('link');
			link.rel = 'preconnect';
			link.href = origin;
			link.crossOrigin = 'anonymous';
			head.appendChild(link);
		}
	});
}

function optimizeThirdPartyScripts() {
	// Lazy load non-critical third-party scripts
	const thirdPartyScripts = [
		{
			src: 'https://www.googletagmanager.com/gtag/js',
			condition: () => document.visibilityState === 'visible'
		}
	];

	thirdPartyScripts.forEach(script => {
		if (script.condition()) {
			loadScriptAsync(script.src);
		} else {
			document.addEventListener('visibilitychange', () => {
				if (script.condition()) {
					loadScriptAsync(script.src);
				}
			}, { once: true });
		}
	});
}

function loadScriptAsync(src: string) {
	if (document.querySelector(`script[src="${src}"]`)) return;

	const script = document.createElement('script');
	script.src = src;
	script.async = true;
	script.defer = true;
	document.head.appendChild(script);
}

function setupPerformanceMonitoring() {
	// Monitor page load performance
	window.addEventListener('load', () => {
		// Report Web Vitals after load
		setTimeout(() => {
			const vitals = bundleAnalyzer.getWebVitals();
			if (vitals) {
				console.log('Web Vitals:', vitals);
				
				// Report to analytics if configured
				bundleAnalyzer.reportToAnalytics();
			}
		}, 1000);
	});

	// Monitor memory usage
	if ('memory' in performance) {
		setInterval(() => {
			const memory = (performance as any).memory;
			if (memory.usedJSHeapSize > memory.totalJSHeapSize * 0.9) {
				console.warn('High memory usage detected');
				// Could trigger garbage collection or cleanup
			}
		}, 30000); // Check every 30 seconds
	}
}

function optimizeImageLoading() {
	// Set up image intersection observer for eager loading of above-fold images
	const imageObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach(entry => {
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
		document.querySelectorAll('img[data-src]').forEach(img => {
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
		navigator.serviceWorker.register('/sw.js')
			.then(registration => {
				console.log('SW registered: ', registration);
			})
			.catch(registrationError => {
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
				caches.keys().then(names => {
					names.forEach(name => {
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