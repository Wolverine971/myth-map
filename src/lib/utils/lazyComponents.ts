// src/lib/utils/lazyComponents.ts
import { lazy } from '../../utils/lazy';

// Lazy load heavy components
export const LazyMap = lazy(() => import('$lib/components/map/map.svelte'));
export const LazyComments = lazy(() => import('$lib/components/comments/Comments.svelte'));
export const LazyItineraryModal = lazy(() => import('$lib/components/itinerary/ItineraryModal.svelte'));
export const LazyCampaignManager = lazy(() => import('$lib/components/marketing/CampaignManager.svelte'));
export const LazyContentManager = lazy(() => import('$lib/components/marketing/ContentManager.svelte'));
export const LazyCalendar = lazy(() => import('$lib/components/marketing/Calendar.svelte'));
export const LazyGoogleCalendarInvites = lazy(() => import('$lib/components/itinerary/GoogleCalendarInvites.svelte'));

// Lazy load form/editor components
export const LazyEditBlogModal = lazy(() => import('$lib/components/blog/EditBlogModal.svelte'));
export const LazyContentEditor = lazy(() => import('$lib/components/marketing/ContentEditor.svelte'));
export const LazyCreateContent = lazy(() => import('$lib/components/marketing/CreateContent.svelte'));

// Function to preload critical components
export function preloadCriticalComponents() {
	// Preload components likely to be needed soon
	if (typeof window !== 'undefined') {
		// Preload on user interaction or after initial load
		setTimeout(() => {
			LazyComments.load();
			LazyMap.load();
		}, 2000);
	}
}

// Function to preload components on user intent (hover, etc.)
export function preloadOnIntent() {
	return {
		map: LazyMap.load,
		comments: LazyComments.load,
		itinerary: LazyItineraryModal.load,
		calendar: LazyCalendar.load
	};
}