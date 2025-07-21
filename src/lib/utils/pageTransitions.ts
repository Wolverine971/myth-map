import { browser } from '$app/environment';
import { backOut, cubicOut, elasticOut } from 'svelte/easing';
// src/lib/utils/pageTransitions.ts
import { blur, fade, fly, scale, slide } from 'svelte/transition';

export type TransitionType = 'fade' | 'fly' | 'slide' | 'scale' | 'blur' | 'none';
export type TransitionDirection = 'left' | 'right' | 'up' | 'down';

export interface TransitionConfig {
	type: TransitionType;
	direction?: TransitionDirection;
	duration?: number;
	delay?: number;
	easing?: (t: number) => number;
}

// Default transition configurations
export const defaultTransitions: Record<string, TransitionConfig> = {
	page: {
		type: 'fade',
		duration: 300,
		easing: cubicOut
	},
	modal: {
		type: 'scale',
		duration: 250,
		easing: backOut
	},
	slide: {
		type: 'fly',
		direction: 'right',
		duration: 400,
		easing: cubicOut
	},
	card: {
		type: 'fly',
		direction: 'up',
		duration: 350,
		delay: 50,
		easing: cubicOut
	}
};

// Get transition function based on configuration
export function getTransition(config: TransitionConfig) {
	// Return no-op function during SSR
	if (!browser) {
		return (node: Element) => ({ duration: 0 });
	}

	const { type, direction, duration = 300, delay = 0, easing = cubicOut } = config;

	// Return a function that takes a node parameter
	return (node: Element) => {
		// Additional safety check to ensure node is a valid Element
		if (!node || !(node instanceof Element)) {
			return { duration: 0 };
		}

		switch (type) {
			case 'fade':
				return fade(node, { duration, delay, easing });
			
			case 'fly':
				const flyOptions: any = { duration, delay, easing };
				switch (direction) {
					case 'left':
						flyOptions.x = -100;
						break;
					case 'right':
						flyOptions.x = 100;
						break;
					case 'up':
						flyOptions.y = -50;
						break;
					case 'down':
						flyOptions.y = 50;
						break;
					default:
						flyOptions.y = 50;
				}
				return fly(node, flyOptions);
			
			case 'slide':
				return slide(node, { duration, delay, easing });
			
			case 'scale':
				return scale(node, { duration, delay, easing, start: 0.8 });
			
			case 'blur':
				return blur(node, { duration, delay, easing });
			
			case 'none':
				return { duration: 0 };
			
			default:
				return fade(node, { duration: 0 });
		}
	};
}

// Create staggered animations for lists
export function staggered(config: TransitionConfig, index: number, staggerDelay: number = 50) {
	return {
		...config,
		delay: (config.delay || 0) + (index * staggerDelay)
	};
}

// Reduced motion support
export function getAccessibleTransition(config: TransitionConfig, prefersReducedMotion: boolean = false) {
	if (prefersReducedMotion) {
		return {
			type: 'fade' as TransitionType,
			duration: 150,
			easing: cubicOut
		};
	}
	return config;
}

// Page transition helper
export function createPageTransition(fromRoute: string, toRoute: string): TransitionConfig {
	// Determine transition based on route relationship
	if (fromRoute.includes('/locations/') && toRoute === '/') {
		return { type: 'fly', direction: 'right', duration: 400 };
	}
	
	if (fromRoute === '/' && toRoute.includes('/locations/')) {
		return { type: 'fly', direction: 'left', duration: 400 };
	}
	
	// Default fade transition
	return defaultTransitions.page;
}

// Safe transition wrapper that handles edge cases
export function createSafeTransition(config: TransitionConfig) {
	return (node: Element) => {
		try {
			// Ensure we're in the browser and node is valid
			if (!browser || !node || !(node instanceof Element)) {
				return { duration: 0 };
			}
			
			// Get the transition function and call it with the node
			const transitionFn = getTransition(config);
			return transitionFn(node);
		} catch (error) {
			console.warn('Transition error:', error);
			// Fallback to no transition
			return { duration: 0 };
		}
	};
}

// Animation utilities for micro-interactions
export const microAnimations = {
	buttonPress: {
		scale: 0.95,
		duration: 100
	},
	buttonHover: {
		scale: 1.05,
		duration: 200
	},
	cardHover: {
		y: -8,
		shadow: '0 10px 25px rgba(0,0,0,0.15)',
		duration: 250
	},
	iconSpin: {
		rotate: 360,
		duration: 500
	},
	bounce: {
		y: [-10, 0],
		duration: 600,
		easing: elasticOut
	},
	shake: {
		x: [-10, 10, -10, 10, 0],
		duration: 500
	}
};

// CSS custom properties for smooth animations
export const animationCSS = `
:root {
	--animation-duration: 300ms;
	--animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
	--animation-delay: 0ms;
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
	:root {
		--animation-duration: 150ms;
	}
	
	*,
	*::before,
	*::after {
		animation-duration: var(--animation-duration) !important;
		animation-delay: 0ms !important;
		transition-duration: var(--animation-duration) !important;
		transition-delay: 0ms !important;
	}
}

/* Base transition classes */
.transition-smooth {
	transition: all var(--animation-duration) var(--animation-easing);
}

.transition-colors {
	transition: color var(--animation-duration) var(--animation-easing),
				background-color var(--animation-duration) var(--animation-easing),
				border-color var(--animation-duration) var(--animation-easing);
}

.transition-transform {
	transition: transform var(--animation-duration) var(--animation-easing);
}

/* Loading animations */
.loading-pulse {
	animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.loading-bounce {
	animation: bounce 1s infinite;
}

.loading-spin {
	animation: spin 1s linear infinite;
}

@keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.5; }
}

@keyframes bounce {
	0%, 100% {
		transform: translateY(-25%);
		animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
	}
	50% {
		transform: none;
		animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
	}
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

/* Hover animations */
.hover-lift:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hover-scale:hover {
	transform: scale(1.02);
}

.hover-glow:hover {
	box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
}

/* Page transition classes */
.page-transition {
	transition: opacity var(--animation-duration) var(--animation-easing),
				transform var(--animation-duration) var(--animation-easing);
}

.page-entering {
	opacity: 0;
	transform: translateY(20px);
}

.page-entered {
	opacity: 1;
	transform: translateY(0);
}
`;

// Inject animation CSS into the document
export function injectAnimationCSS() {
	if (browser && typeof document !== 'undefined' && !document.getElementById('animation-styles')) {
		const style = document.createElement('style');
		style.id = 'animation-styles';
		style.textContent = animationCSS;
		document.head.appendChild(style);
	}
}