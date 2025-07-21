<!-- src/lib/components/shared/ErrorBoundary.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Card, Button } from 'flowbite-svelte';
	import { RefreshOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
	
	export let fallback: 'card' | 'page' | 'inline' = 'card';
	export let showRetry = true;
	export let retryLabel = 'Try Again';
	export let onRetry: (() => void) | null = null;
	
	let hasError = false;
	let errorMessage = '';
	
	function handleError(event: ErrorEvent) {
		hasError = true;
		errorMessage = event.message || 'An unexpected error occurred';
		console.error('ErrorBoundary caught error:', event.error);
	}
	
	function handleUnhandledRejection(event: PromiseRejectionEvent) {
		hasError = true;
		errorMessage = event.reason?.message || 'An unexpected error occurred';
		console.error('ErrorBoundary caught promise rejection:', event.reason);
	}
	
	function retry() {
		hasError = false;
		errorMessage = '';
		if (onRetry) {
			onRetry();
		} else {
			window.location.reload();
		}
	}
	
	onMount(() => {
		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);
	});
	
	onDestroy(() => {
		window.removeEventListener('error', handleError);
		window.removeEventListener('unhandledrejection', handleUnhandledRejection);
	});
</script>

{#if hasError}
	{#if fallback === 'page'}
		<!-- Full page error -->
		<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<div class="w-full max-w-md text-center">
				<div class="mb-6">
					<ExclamationCircleOutline class="mx-auto h-16 w-16 text-red-500" />
				</div>
				<h1 class="mb-4 text-2xl font-bold text-gray-900">Oops! Something went wrong</h1>
				<p class="mb-6 text-gray-600">
					We encountered an unexpected error. Please try refreshing the page.
				</p>
				<div class="space-y-2 text-sm text-gray-500">
					<p>Error: {errorMessage}</p>
				</div>
				{#if showRetry}
					<div class="mt-6">
						<Button color="primary" on:click={retry} class="mr-2">
							<RefreshOutline class="mr-2 h-4 w-4" />
							{retryLabel}
						</Button>
						<Button color="light" href="/">Go Home</Button>
					</div>
				{/if}
			</div>
		</div>
	{:else if fallback === 'card'}
		<!-- Card error -->
		<Card class="text-center">
			<div class="py-8">
				<ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-red-500" />
				<h3 class="mb-2 text-lg font-semibold text-gray-900">Unable to Load Content</h3>
				<p class="mb-4 text-gray-600">
					We're having trouble loading this content right now.
				</p>
				{#if showRetry}
					<Button color="primary" size="sm" on:click={retry}>
						<RefreshOutline class="mr-2 h-4 w-4" />
						{retryLabel}
					</Button>
				{/if}
			</div>
		</Card>
	{:else}
		<!-- Inline error -->
		<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
			<div class="flex items-center justify-center">
				<ExclamationCircleOutline class="mr-2 h-5 w-5 text-red-500" />
				<span class="text-red-700">Failed to load content</span>
				{#if showRetry}
					<Button color="light" size="xs" class="ml-2" on:click={retry}>
						<RefreshOutline class="mr-1 h-3 w-3" />
						Retry
					</Button>
				{/if}
			</div>
		</div>
	{/if}
{:else}
	<slot />
{/if}