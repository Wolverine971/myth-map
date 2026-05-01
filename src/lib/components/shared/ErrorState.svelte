<!-- src/lib/components/shared/ErrorState.svelte -->
<script lang="ts">
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

	$: errorType = getErrorType(error);
	$: ({ icon, message, suggestion } = getErrorDetails(errorType));

	function getErrorType(
		err: Error | string | null
	): 'network' | 'server' | 'not-found' | 'generic' {
		if (!err) return 'generic';
		const errorString = typeof err === 'string' ? err : err.message;
		const lower = errorString.toLowerCase();
		if (lower.includes('fetch') || lower.includes('network') || lower.includes('connection')) {
			return 'network';
		}
		if (lower.includes('404') || lower.includes('not found')) return 'not-found';
		if (lower.includes('500') || lower.includes('server')) return 'server';
		return 'generic';
	}

	function getErrorDetails(type: string) {
		switch (type) {
			case 'network':
				return {
					icon: CloseCircleOutline,
					message: 'Unable to connect',
					suggestion: 'Check your internet connection and try again.'
				};
			case 'server':
				return {
					icon: ServerOutline,
					message: 'Server trouble',
					suggestion: 'We are working on it. Try again in a moment.'
				};
			case 'not-found':
				return {
					icon: ExclamationCircleOutline,
					message: 'Not found',
					suggestion: 'This page may have moved or been removed.'
				};
			default:
				return {
					icon: ExclamationCircleOutline,
					message: 'Something went wrong',
					suggestion: 'Try refreshing, or get in touch if the problem sticks around.'
				};
		}
	}

	function handleRetry() {
		if (onRetry) onRetry();
		else window.location.reload();
	}
</script>

{#if variant === 'page'}
	<div class="flex min-h-screen items-center justify-center bg-page px-4">
		<div class="w-full max-w-lg border border-subtle bg-surface px-8 py-12 text-center">
			<svelte:component this={icon} class="mx-auto mb-6 h-12 w-12 text-danger-500" />
			<div class="mb-2 font-mono text-xs uppercase tracking-wide text-tertiary-600">
				Error · {errorType}
			</div>
			<h1 class="mb-3 font-display text-2xl text-default">{title}</h1>
			<p class="mb-2 text-base text-default">{message}</p>
			<p class="mb-8 text-sm text-muted">{suggestion}</p>

			{#if showRetry}
				<div class="flex items-center justify-center gap-2">
					<button
						type="button"
						class="inline-flex items-center gap-1.5 rounded-sm bg-primary-700 px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-primary-600 dark:bg-primary-500 dark:text-primary-50 dark:hover:bg-primary-400"
						on:click={handleRetry}
					>
						<RefreshOutline class="h-3.5 w-3.5" />
						{retryLabel}
					</button>
					<a
						href="/"
						class="inline-flex items-center gap-1.5 rounded-sm border border-subtle bg-surface px-4 py-2 font-mono text-xs uppercase tracking-wide text-default transition-colors duration-fast hover:border-strong"
					>
						Go home
					</a>
				</div>
			{/if}
		</div>
	</div>
{:else if variant === 'card'}
	<div class="border border-subtle bg-surface px-6 py-8 text-center">
		<svelte:component this={icon} class="mx-auto mb-3 h-10 w-10 text-danger-500" />
		<div class="mb-1 font-mono text-xs uppercase tracking-wide text-tertiary-600">
			Error · {errorType}
		</div>
		<h3 class="mb-2 font-display text-lg text-default">{title}</h3>
		<p class="mb-1 text-sm text-default">{message}</p>
		<p class="mb-5 text-xs text-muted">{suggestion}</p>

		{#if showRetry}
			<button
				type="button"
				class="inline-flex items-center gap-1.5 rounded-sm bg-primary-700 px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-primary-600"
				on:click={handleRetry}
			>
				<RefreshOutline class="h-3.5 w-3.5" />
				{retryLabel}
			</button>
		{/if}
	</div>
{:else}
	<!-- Inline -->
	<div
		class="rounded-sm border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20"
	>
		<div class="flex items-start gap-3">
			<svelte:component this={icon} class="mt-0.5 h-5 w-5 flex-shrink-0 text-danger-500" />
			<div class="flex-1">
				<h4 class="text-sm font-semibold text-danger-700 dark:text-danger-300">{message}</h4>
				<p class="mt-1 text-xs text-danger-600 dark:text-danger-300/80">{suggestion}</p>
				{#if showRetry}
					<button
						type="button"
						class="mt-3 inline-flex items-center gap-1 rounded-sm border border-danger-300 bg-surface px-2.5 py-1 font-mono text-xs uppercase tracking-wide text-default transition-colors duration-fast hover:border-danger-500"
						on:click={handleRetry}
					>
						<RefreshOutline class="h-3 w-3" />
						{retryLabel}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
