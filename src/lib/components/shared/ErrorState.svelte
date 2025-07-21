<!-- src/lib/components/shared/ErrorState.svelte -->
<script lang="ts">
	import { Card, Button } from 'flowbite-svelte';
	import { 
		ExclamationCircleOutline, 
		RefreshOutline, 
		CloseCircleOutline,
		ServerOutline
	} from 'flowbite-svelte-icons';
	
	export let error: Error | string | null = null;
	export let variant: 'card' | 'inline' | 'page' = 'card';
	export let title = 'Something went wrong';
	export let showRetry = true;
	export let retryLabel = 'Try again';
	export let onRetry: (() => void) | null = null;
	
	// Determine error type and messaging
	$: errorType = getErrorType(error);
	$: ({ icon, message, suggestion } = getErrorDetails(errorType));
	
	function getErrorType(err: Error | string | null): 'network' | 'server' | 'not-found' | 'generic' {
		if (!err) return 'generic';
		
		const errorString = typeof err === 'string' ? err : err.message;
		const lowerError = errorString.toLowerCase();
		
		if (lowerError.includes('fetch') || lowerError.includes('network') || lowerError.includes('connection')) {
			return 'network';
		}
		if (lowerError.includes('404') || lowerError.includes('not found')) {
			return 'not-found';
		}
		if (lowerError.includes('500') || lowerError.includes('server')) {
			return 'server';
		}
		return 'generic';
	}
	
	function getErrorDetails(type: string) {
		switch (type) {
			case 'network':
				return {
					icon: CloseCircleOutline,
					message: 'Unable to connect to our servers',
					suggestion: 'Please check your internet connection and try again.'
				};
			case 'server':
				return {
					icon: ServerOutline,
					message: 'Our servers are experiencing issues',
					suggestion: 'We\'re working to fix this. Please try again in a few moments.'
				};
			case 'not-found':
				return {
					icon: ExclamationCircleOutline,
					message: 'Content not found',
					suggestion: 'The content you\'re looking for might have been moved or deleted.'
				};
			default:
				return {
					icon: ExclamationCircleOutline,
					message: 'An unexpected error occurred',
					suggestion: 'Please try refreshing the page or contact support if the problem persists.'
				};
		}
	}
	
	function handleRetry() {
		if (onRetry) {
			onRetry();
		} else {
			window.location.reload();
		}
	}
</script>

{#if variant === 'page'}
	<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
		<div class="w-full max-w-lg text-center">
			<svelte:component this={icon} class="mx-auto mb-6 h-16 w-16 text-gray-400" />
			<h1 class="mb-4 text-2xl font-bold text-gray-900">{title}</h1>
			<p class="mb-2 text-lg text-gray-700">{message}</p>
			<p class="mb-8 text-gray-500">{suggestion}</p>
			
			{#if showRetry}
				<div class="space-x-4">
					<Button color="primary" on:click={handleRetry}>
						<RefreshOutline class="mr-2 h-4 w-4" />
						{retryLabel}
					</Button>
					<Button color="light" href="/">Go Home</Button>
				</div>
			{/if}
		</div>
	</div>

{:else if variant === 'card'}
	<Card class="text-center">
		<div class="py-8">
			<svelte:component this={icon} class="mx-auto mb-4 h-12 w-12 text-gray-400" />
			<h3 class="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
			<p class="mb-2 text-gray-700">{message}</p>
			<p class="mb-6 text-sm text-gray-500">{suggestion}</p>
			
			{#if showRetry}
				<Button color="primary" size="sm" on:click={handleRetry}>
					<RefreshOutline class="mr-2 h-4 w-4" />
					{retryLabel}
				</Button>
			{/if}
		</div>
	</Card>

{:else}
	<!-- Inline variant -->
	<div class="rounded-lg border border-red-200 bg-red-50 p-4">
		<div class="flex items-start">
			<svelte:component this={icon} class="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
			<div class="flex-1">
				<h4 class="text-sm font-medium text-red-800">{message}</h4>
				<p class="mt-1 text-xs text-red-600">{suggestion}</p>
				{#if showRetry}
					<div class="mt-3">
						<Button color="light" size="xs" on:click={handleRetry}>
							<RefreshOutline class="mr-1 h-3 w-3" />
							{retryLabel}
						</Button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}