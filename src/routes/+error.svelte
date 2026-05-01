<!-- src/routes/+error.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from 'flowbite-svelte';
	import { HomeOutline, MapPinAltOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import { fade, fly } from 'svelte/transition';

	$: status = $page.status;
	$: message = $page.error?.message;

	// Determine error type and content based on status
	$: errorContent = getErrorContent(status);

	function getErrorContent(status: number) {
		switch (status) {
			case 404:
				return {
					title: 'Page Not Found',
					heading: '404 - Adventure Not Found!',
					description:
						"Looks like you've wandered off the beaten path. The page you're looking for doesn't exist.",
					suggestion: "Don't worry - there are plenty of other adventures waiting for you!",
					showSuggestions: true
				};
			case 403:
				return {
					title: 'Access Forbidden',
					heading: '403 - Access Denied',
					description: "You don't have permission to access this page.",
					suggestion: 'If you think this is a mistake, please contact support.',
					showSuggestions: false
				};
			case 500:
				return {
					title: 'Server Error',
					heading: '500 - Something Went Wrong',
					description: 'Our servers are experiencing technical difficulties.',
					suggestion: "We're working to fix this issue. Please try again later.",
					showSuggestions: false
				};
			default:
				return {
					title: 'Error',
					heading: `${status} - Unexpected Error`,
					description: 'An unexpected error has occurred.',
					suggestion: 'Please try refreshing the page or go back to the homepage.',
					showSuggestions: true
				};
		}
	}

	// Popular sections to suggest when 404
	const suggestions = [
		{
			title: 'Family Activities',
			description: 'Discover amazing places for your next adventure',
			href: '/',
			icon: HomeOutline
		},
		{
			title: 'Explore Maryland',
			description: 'Find great locations in Maryland',
			href: '/locations/md',
			icon: MapPinAltOutline
		},
		{
			title: 'Virginia Adventures',
			description: 'Check out Virginia family activities',
			href: '/locations/va',
			icon: MapPinAltOutline
		}
	];
</script>

<SEOHead
	title="{errorContent.title} | Tiny Tribe Adventures"
	description={errorContent.description}
	noIndex={true}
/>

<main id="main-content" class="min-h-screen bg-page">
	<div class="flex min-h-screen items-center justify-center px-4 py-16">
		<div class="w-full max-w-2xl text-center" in:fade={{ duration: 600 }}>
			<!-- Error Icon and Status -->
			<div
				class="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full border border-subtle bg-surface shadow-md"
				in:fly={{ y: -50, duration: 800, delay: 200 }}
			>
				<ExclamationCircleOutline class="h-16 w-16 text-primary-500 dark:text-primary-300" />
			</div>

			<!-- Error Heading -->
			<h1
				class="md:text-6xl mb-4 text-4xl font-extrabold tracking-tight text-primary-700 dark:text-primary-300 sm:text-5xl"
				in:fly={{ y: 30, duration: 800, delay: 400 }}
			>
				{errorContent.heading}
			</h1>

			<!-- Error Description -->
			<p
				class="mb-2 text-lg text-default sm:text-xl"
				in:fly={{ y: 30, duration: 800, delay: 600 }}
			>
				{errorContent.description}
			</p>

			<p class="mb-8 text-muted sm:text-lg" in:fly={{ y: 30, duration: 800, delay: 800 }}>
				{errorContent.suggestion}
			</p>

			<!-- Action Buttons -->
			<div
				class="mb-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
				in:fly={{ y: 30, duration: 800, delay: 1000 }}
			>
				<Button color="primary" size="lg" href="/" class="w-full sm:w-auto">
					<HomeOutline class="mr-2 h-5 w-5" />
					Go Home
				</Button>

				<Button
					color="alternative"
					size="lg"
					on:click={() => window.history.back()}
					class="w-full sm:w-auto"
				>
					Go Back
				</Button>
			</div>

			<!-- Suggestions for 404 -->
			{#if errorContent.showSuggestions}
				<div class="border-t border-subtle pt-8" in:fly={{ y: 30, duration: 800, delay: 1200 }}>
					<h2 class="mb-6 font-display text-2xl font-bold text-default">Popular Destinations</h2>

					<div class="grid gap-4 sm:grid-cols-3">
						{#each suggestions as suggestion, i}
							<a
								href={suggestion.href}
								class="group rounded-md border border-subtle bg-surface p-4 transition duration-fast hover:border-strong hover:shadow-md dark:hover:bg-elevated"
								in:fly={{ y: 30, duration: 600, delay: 1400 + i * 100 }}
							>
								<div class="mb-3 flex justify-center">
									<div
										class="rounded-sm border border-primary-200 bg-primary-50 p-3 transition-colors duration-fast group-hover:border-primary-300 dark:border-primary-700 dark:bg-primary-900 dark:group-hover:border-primary-600"
									>
										<svelte:component
											this={suggestion.icon}
											class="h-6 w-6 text-primary-700 dark:text-primary-300"
										/>
									</div>
								</div>
								<h3
									class="mb-2 font-display text-lg font-semibold text-default transition-colors duration-fast group-hover:text-primary-700 dark:group-hover:text-primary-300"
								>
									{suggestion.title}
								</h3>
								<p class="text-sm text-muted">
									{suggestion.description}
								</p>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Debug info for development -->
			{#if message}
				<div class="mt-8 rounded-md border border-subtle bg-sunken p-4 text-left">
					<details class="text-sm text-muted">
						<summary class="cursor-pointer font-medium text-default">Technical Details</summary>
						<pre class="mt-2 overflow-auto font-mono text-xs">{message}</pre>
					</details>
				</div>
			{/if}
		</div>
	</div>
</main>

<style>
	:global(body) {
		overflow-x: hidden;
	}
</style>
