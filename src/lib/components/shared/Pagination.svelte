<!-- src/lib/components/shared/Pagination.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { ChevronLeftOutline, ChevronRightOutline } from 'flowbite-svelte-icons';

	export let currentPage = 1;
	export let totalPages = 1;
	export let totalItems = 0;
	export let itemsPerPage = 20;
	export let showInfo = true;
	export let showPreviousNext = true;
	export let maxVisiblePages = 5;

	const dispatch = createEventDispatcher();

	$: startItem = (currentPage - 1) * itemsPerPage + 1;
	$: endItem = Math.min(currentPage * itemsPerPage, totalItems);

	$: visiblePages = (() => {
		const pages = [];
		let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
		let end = Math.min(totalPages, start + maxVisiblePages - 1);
		if (end - start < maxVisiblePages - 1) {
			start = Math.max(1, end - maxVisiblePages + 1);
		}
		for (let i = start; i <= end; i++) pages.push(i);
		return pages;
	})();

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages && page !== currentPage) {
			dispatch('pageChange', page);
		}
	}

	function previousPage() {
		goToPage(currentPage - 1);
	}
	function nextPage() {
		goToPage(currentPage + 1);
	}

	function handleKeydown(event: KeyboardEvent, page: number) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			goToPage(page);
		}
	}
</script>

{#if totalPages > 1}
	<nav
		class="flex flex-col items-center justify-between gap-4 sm:flex-row"
		aria-label="Pagination navigation"
	>
		{#if showInfo}
			<div class="font-mono text-xs uppercase tracking-wide text-muted">
				<span class="font-semibold text-default">{startItem}</span>–<span
					class="font-semibold text-default">{endItem}</span
				>
				of <span class="font-semibold text-default">{totalItems}</span>
			</div>
		{/if}

		<div class="flex items-center gap-1">
			{#if showPreviousNext}
				<button
					class="flex h-9 w-9 items-center justify-center rounded-sm border border-subtle bg-surface text-muted transition-colors duration-fast hover:border-strong hover:text-default disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
					disabled={currentPage === 1}
					on:click={previousPage}
					aria-label="Go to previous page"
				>
					<ChevronLeftOutline class="h-4 w-4" />
				</button>
			{/if}

			{#if visiblePages[0] > 1}
				<button
					class="flex h-9 w-9 items-center justify-center rounded-sm border border-subtle bg-surface font-mono text-sm font-medium text-default transition-colors duration-fast hover:border-strong sm:h-10 sm:w-10"
					on:click={() => goToPage(1)}
					on:keydown={(e) => handleKeydown(e, 1)}
					aria-label="Go to page 1"
				>
					1
				</button>
				{#if visiblePages[0] > 2}
					<span
						class="flex h-9 w-9 items-center justify-center font-mono text-sm text-subtle sm:h-10 sm:w-10"
					>
						…
					</span>
				{/if}
			{/if}

			{#each visiblePages as page}
				<button
					class="flex h-9 w-9 items-center justify-center rounded-sm border font-mono text-sm font-medium transition-colors duration-fast sm:h-10 sm:w-10 {page ===
					currentPage
						? 'border-primary-700 bg-primary-700 text-white'
						: 'border-subtle bg-surface text-default hover:border-strong'}"
					on:click={() => goToPage(page)}
					on:keydown={(e) => handleKeydown(e, page)}
					aria-label={page === currentPage ? `Current page, page ${page}` : `Go to page ${page}`}
					aria-current={page === currentPage ? 'page' : undefined}
				>
					{page}
				</button>
			{/each}

			{#if visiblePages[visiblePages.length - 1] < totalPages}
				{#if visiblePages[visiblePages.length - 1] < totalPages - 1}
					<span
						class="flex h-9 w-9 items-center justify-center font-mono text-sm text-subtle sm:h-10 sm:w-10"
					>
						…
					</span>
				{/if}
				<button
					class="flex h-9 w-9 items-center justify-center rounded-sm border border-subtle bg-surface font-mono text-sm font-medium text-default transition-colors duration-fast hover:border-strong sm:h-10 sm:w-10"
					on:click={() => goToPage(totalPages)}
					on:keydown={(e) => handleKeydown(e, totalPages)}
					aria-label="Go to page {totalPages}"
				>
					{totalPages}
				</button>
			{/if}

			{#if showPreviousNext}
				<button
					class="flex h-9 w-9 items-center justify-center rounded-sm border border-subtle bg-surface text-muted transition-colors duration-fast hover:border-strong hover:text-default disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
					disabled={currentPage === totalPages}
					on:click={nextPage}
					aria-label="Go to next page"
				>
					<ChevronRightOutline class="h-4 w-4" />
				</button>
			{/if}
		</div>
	</nav>
{/if}
