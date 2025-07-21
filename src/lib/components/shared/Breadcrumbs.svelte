<!-- src/lib/components/shared/Breadcrumbs.svelte -->
<script lang="ts">
	import { ChevronRightOutline, HomeOutline } from 'flowbite-svelte-icons';
	import { fade, fly } from 'svelte/transition';

	export interface BreadcrumbItem {
		label: string;
		href?: string;
		current?: boolean;
		icon?: any;
	}

	export let items: BreadcrumbItem[] = [];
	export let showHome: boolean = true;
	export let homeLabel: string = 'Home';
	export let homeHref: string = '/';
	export let separator: any = ChevronRightOutline;
	export let variant: 'default' | 'minimal' | 'compact' = 'default';

	// Build the complete breadcrumb list including home
	$: allItems = showHome 
		? [{ label: homeLabel, href: homeHref, icon: HomeOutline }, ...items]
		: items;

	// Styles based on variant
	$: containerClasses = {
		default: 'flex items-center space-x-1 text-sm sm:space-x-2 sm:text-base',
		minimal: 'flex items-center space-x-1 text-xs sm:text-sm',
		compact: 'flex items-center space-x-0.5 text-xs'
	};

	$: itemClasses = {
		default: 'flex items-center gap-1 transition-colors hover:text-primary-700',
		minimal: 'flex items-center gap-0.5 transition-colors hover:text-primary-600',
		compact: 'flex items-center transition-colors hover:text-primary-600'
	};

	$: linkClasses = {
		default: 'font-medium text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-1 py-0.5',
		minimal: 'text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-0.5',
		compact: 'text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded'
	};

	$: currentClasses = {
		default: 'font-semibold text-gray-900 cursor-default',
		minimal: 'font-medium text-gray-800 cursor-default',
		compact: 'font-medium text-gray-700 cursor-default'
	};

	$: separatorClasses = {
		default: 'h-4 w-4 text-gray-400 sm:h-5 sm:w-5',
		minimal: 'h-3 w-3 text-gray-400',
		compact: 'h-3 w-3 text-gray-300'
	};

	// Helper to truncate long labels
	function truncateLabel(label: string, maxLength: number = 25): string {
		if (label.length <= maxLength) return label;
		return label.slice(0, maxLength - 3) + '...';
	}
</script>

<nav aria-label="Breadcrumb" class="w-full">
	<ol class={containerClasses[variant]} in:fade={{ duration: 300 }}>
		{#each allItems as item, index (item.href || item.label)}
			<li class="flex items-center" in:fly={{ x: -10, duration: 300, delay: index * 50 }}>
				{#if item.current}
					<!-- Current page (no link) -->
					<span class="{currentClasses[variant]} {itemClasses[variant]}" aria-current="page">
						{#if item.icon && variant === 'default'}
							<svelte:component this={item.icon} class="h-4 w-4 flex-shrink-0" />
						{/if}
						<span class="truncate" title={item.label}>
							{variant === 'compact' ? truncateLabel(item.label, 20) : truncateLabel(item.label)}
						</span>
					</span>
				{:else if item.href}
					<!-- Linked breadcrumb item -->
					<a 
						href={item.href} 
						class="{linkClasses[variant]} {itemClasses[variant]}"
						aria-label="Go to {item.label}"
					>
						{#if item.icon && variant === 'default'}
							<svelte:component this={item.icon} class="h-4 w-4 flex-shrink-0" />
						{/if}
						<span class="truncate" title={item.label}>
							{variant === 'compact' ? truncateLabel(item.label, 20) : truncateLabel(item.label)}
						</span>
					</a>
				{:else}
					<!-- Non-linked item -->
					<span class="{currentClasses[variant]} {itemClasses[variant]}">
						{#if item.icon && variant === 'default'}
							<svelte:component this={item.icon} class="h-4 w-4 flex-shrink-0" />
						{/if}
						<span class="truncate" title={item.label}>
							{variant === 'compact' ? truncateLabel(item.label, 20) : truncateLabel(item.label)}
						</span>
					</span>
				{/if}

				{#if index < allItems.length - 1}
					<!-- Separator -->
					<svelte:component this={separator} class="{separatorClasses[variant]} mx-1 flex-shrink-0 sm:mx-2" />
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<!-- Structured data for better SEO -->
{@html `<script type="application/ld+json">${JSON.stringify({
	"@context": "https://schema.org",
	"@type": "BreadcrumbList",
	"itemListElement": allItems.map((item, index) => ({
		"@type": "ListItem",
		"position": index + 1,
		"name": item.label,
		"item": item.href ? `https://tinytribeadventures.com${item.href}` : undefined
	}))
})}</script>`}

<style>
	/* Ensure breadcrumbs work well on small screens */
	@media (max-width: 640px) {
		nav {
			overflow-x: auto;
			scrollbar-width: none;
			-ms-overflow-style: none;
		}
		
		nav::-webkit-scrollbar {
			display: none;
		}
		
		ol {
			white-space: nowrap;
			min-width: min-content;
		}
	}
	
	/* Enhanced focus states */
	a:focus {
		outline: 2px solid transparent;
		outline-offset: 2px;
	}
	
	/* Smooth transitions for all interactive elements */
	a, span {
		transition: all 0.2s ease-in-out;
	}
</style>