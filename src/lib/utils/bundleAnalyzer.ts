// src/lib/utils/bundleAnalyzer.ts
import { browser } from '$app/environment';

interface BundleStats {
	totalSize: number;
	loadedChunks: string[];
	pendingChunks: string[];
	loadTime: number;
	networkTime: number;
}

class BundleAnalyzer {
	private startTime = Date.now();
	private chunkLoadTimes = new Map<string, number>();
	private loadedChunks = new Set<string>();
	
	constructor() {
		if (browser) {
			this.setupPerformanceObserver();
		}
	}

	private setupPerformanceObserver() {
		if ('PerformanceObserver' in window) {
			const observer = new PerformanceObserver((list) => {
				list.getEntries().forEach((entry) => {
					if (entry.entryType === 'resource' && entry.name.includes('chunk')) {
						const chunkName = this.extractChunkName(entry.name);
						this.chunkLoadTimes.set(chunkName, entry.duration);
						this.loadedChunks.add(chunkName);
					}
				});
			});
			
			try {
				observer.observe({ entryTypes: ['resource'] });
			} catch (error) {
				console.warn('Performance observer not supported:', error);
			}
		}
	}

	private extractChunkName(url: string): string {
		const match = url.match(/\/([^\/]*\.js)$/);
		return match ? match[1] : url;
	}

	getStats(): BundleStats {
		const loadTime = Date.now() - this.startTime;
		const networkTime = Array.from(this.chunkLoadTimes.values())
			.reduce((sum, time) => sum + time, 0);

		return {
			totalSize: this.estimateTotalSize(),
			loadedChunks: Array.from(this.loadedChunks),
			pendingChunks: this.getPendingChunks(),
			loadTime,
			networkTime
		};
	}

	private estimateTotalSize(): number {
		// This would ideally get actual bundle sizes from build manifest
		// For now, estimate based on loaded chunks
		return this.loadedChunks.size * 50; // Rough estimate in KB
	}

	private getPendingChunks(): string[] {
		// This would track known chunks that haven't loaded yet
		const knownChunks = ['map', 'comments', 'admin', 'marketing'];
		return knownChunks.filter(chunk => !this.loadedChunks.has(chunk));
	}

	// Log performance metrics
	logPerformance() {
		const stats = this.getStats();
		console.group('Bundle Performance');
		console.log('Load Time:', stats.loadTime + 'ms');
		console.log('Network Time:', stats.networkTime.toFixed(2) + 'ms');
		console.log('Loaded Chunks:', stats.loadedChunks);
		console.log('Pending Chunks:', stats.pendingChunks);
		console.log('Estimated Size:', stats.totalSize + 'KB');
		console.groupEnd();
	}

	// Report to analytics (if implemented)
	reportToAnalytics() {
		const stats = this.getStats();
		
		// This could send to Google Analytics, PostHog, etc.
		if (typeof gtag === 'function') {
			gtag('event', 'bundle_performance', {
				load_time: stats.loadTime,
				chunks_loaded: stats.loadedChunks.length,
				estimated_size: stats.totalSize
			});
		}
	}

	// Get Web Vitals
	getWebVitals() {
		if (!browser) return null;

		const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
		
		return {
			fcp: this.getFirstContentfulPaint(),
			lcp: this.getLargestContentfulPaint(),
			fid: this.getFirstInputDelay(),
			cls: this.getCumulativeLayoutShift(),
			ttfb: navigation ? navigation.responseStart - navigation.requestStart : 0
		};
	}

	private getFirstContentfulPaint(): number {
		const entries = performance.getEntriesByName('first-contentful-paint');
		return entries.length > 0 ? entries[0].startTime : 0;
	}

	private getLargestContentfulPaint(): number {
		const entries = performance.getEntriesByType('largest-contentful-paint');
		return entries.length > 0 ? entries[entries.length - 1].startTime : 0;
	}

	private getFirstInputDelay(): number {
		const entries = performance.getEntriesByType('first-input');
		return entries.length > 0 ? entries[0].processingStart - entries[0].startTime : 0;
	}

	private getCumulativeLayoutShift(): number {
		const entries = performance.getEntriesByType('layout-shift');
		return entries
			.filter((entry: any) => !entry.hadRecentInput)
			.reduce((sum, entry: any) => sum + entry.value, 0);
	}
}

// Create singleton
export const bundleAnalyzer = new BundleAnalyzer();

// Development helper to log performance on page load
if (browser && process.env.NODE_ENV === 'development') {
	window.addEventListener('load', () => {
		setTimeout(() => {
			bundleAnalyzer.logPerformance();
		}, 2000);
	});
}