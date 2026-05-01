<!-- src/lib/components/shared/SkeletonCard.svelte -->
<script lang="ts">
	export let variant: 'card' | 'list' | 'detail' = 'card';
</script>

{#if variant === 'card'}
	<div class="flex h-full animate-pulse flex-col overflow-hidden border border-subtle bg-surface">
		<div class="relative aspect-video w-full bg-sunken">
			<div class="absolute left-2 top-2">
				<div class="h-5 w-16 rounded-sm bg-secondary-200 dark:bg-primary-800"></div>
			</div>
		</div>

		<div class="flex flex-1 flex-col space-y-3 p-4">
			<div class="h-5 w-4/5 rounded-sm bg-secondary-200 dark:bg-secondary-700"></div>
			<div class="h-3 w-3/5 rounded-sm bg-sunken"></div>
			<div class="flex flex-wrap gap-1">
				<div class="h-4 w-12 rounded-sm bg-sunken"></div>
				<div class="h-4 w-16 rounded-sm bg-sunken"></div>
				<div class="h-4 w-10 rounded-sm bg-sunken"></div>
			</div>
			<div class="h-8 w-full rounded-sm bg-sunken"></div>
			<div class="mt-auto flex flex-col gap-2 pt-2">
				<div class="h-8 w-full rounded-sm bg-secondary-200 dark:bg-secondary-700"></div>
			</div>
		</div>
	</div>
{:else if variant === 'list'}
	<div class="h-full animate-pulse overflow-hidden border border-subtle bg-surface">
		<div class="flex h-full flex-col sm:flex-row">
			<div class="relative h-40 w-full bg-sunken sm:h-auto sm:w-32 md:w-40">
				<div class="absolute left-2 top-2">
					<div class="h-5 w-16 rounded-sm bg-secondary-200 dark:bg-primary-800"></div>
				</div>
			</div>
			<div class="flex flex-1 flex-col space-y-2 p-4">
				<div class="h-5 w-4/5 rounded-sm bg-secondary-200 dark:bg-secondary-700"></div>
				<div class="flex items-center gap-1">
					<div class="h-3 w-3 rounded-sm bg-sunken"></div>
					<div class="h-3 w-2/3 rounded-sm bg-sunken"></div>
				</div>
				<div class="flex flex-wrap gap-1">
					<div class="h-4 w-12 rounded-sm bg-sunken"></div>
					<div class="h-4 w-16 rounded-sm bg-sunken"></div>
				</div>
				<div class="mt-auto flex gap-2">
					<div class="h-7 flex-1 rounded-sm bg-secondary-200 dark:bg-secondary-700"></div>
					<div class="h-7 w-20 rounded-sm bg-sunken"></div>
				</div>
			</div>
		</div>
	</div>
{:else if variant === 'detail'}
	<div class="animate-pulse">
		<header class="border-b border-subtle bg-surface">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="py-4 sm:py-6 md:py-8">
					<div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
						<div class="lg:col-span-5 xl:col-span-4">
							<div class="aspect-video w-full rounded-sm bg-sunken"></div>
						</div>
						<div class="space-y-6 lg:col-span-7 xl:col-span-8">
							<div class="space-y-3">
								<div class="h-8 w-4/5 rounded-sm bg-secondary-200 dark:bg-secondary-700"></div>
								<div class="flex flex-wrap gap-2">
									<div class="h-5 w-16 rounded-sm bg-sunken"></div>
									<div class="h-5 w-20 rounded-sm bg-sunken"></div>
								</div>
							</div>
							<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
								<div class="h-20 rounded-sm bg-sunken"></div>
								<div class="h-20 rounded-sm bg-sunken"></div>
								<div class="h-20 rounded-sm bg-sunken"></div>
								<div class="h-20 rounded-sm bg-sunken"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>

		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
			<div class="space-y-12">
				<div class="space-y-4">
					<div class="h-6 w-48 rounded-sm bg-secondary-200 dark:bg-secondary-700"></div>
					<div class="space-y-2">
						<div class="h-4 w-full rounded-sm bg-sunken"></div>
						<div class="h-4 w-5/6 rounded-sm bg-sunken"></div>
						<div class="h-4 w-4/5 rounded-sm bg-sunken"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.55;
		}
	}
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
