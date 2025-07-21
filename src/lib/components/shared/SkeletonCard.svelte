<!-- src/lib/components/shared/SkeletonCard.svelte -->
<script lang="ts">
	import { Card } from 'flowbite-svelte';
	
	export let variant: 'card' | 'list' | 'detail' = 'card';
</script>

{#if variant === 'card'}
	<!-- Standard LocationCard skeleton -->
	<Card padding="none" class="group flex h-full flex-col overflow-hidden animate-pulse">
		<!-- Image skeleton -->
		<div class="relative aspect-video w-full bg-gray-200">
			<!-- Category badge skeleton -->
			<div class="absolute left-2 top-2">
				<div class="h-5 w-16 rounded-full bg-gray-300"></div>
			</div>
		</div>

		<!-- Content skeleton -->
		<div class="flex flex-1 flex-col p-4 space-y-3">
			<!-- Title skeleton -->
			<div class="h-5 w-4/5 rounded bg-gray-300"></div>
			
			<!-- Address skeleton -->
			<div class="h-3 w-3/5 rounded bg-gray-200"></div>
			
			<!-- Tags skeleton -->
			<div class="flex flex-wrap gap-1">
				<div class="h-4 w-12 rounded-full bg-gray-200"></div>
				<div class="h-4 w-16 rounded-full bg-gray-200"></div>
				<div class="h-4 w-10 rounded-full bg-gray-200"></div>
			</div>
			
			<!-- Distance info skeleton -->
			<div class="h-8 w-full rounded-lg bg-gray-100"></div>
			
			<!-- Action buttons skeleton -->
			<div class="mt-auto flex flex-col gap-2 pt-2">
				<div class="h-8 w-full rounded bg-gray-300"></div>
				<div class="h-8 w-full rounded bg-gray-200"></div>
			</div>
		</div>
	</Card>

{:else if variant === 'list'}
	<!-- LocationCardSmall skeleton -->
	<Card padding="none" class="h-full overflow-hidden animate-pulse">
		<div class="flex h-full flex-col sm:flex-row">
			<!-- Image skeleton -->
			<div class="h-40 w-full sm:h-auto sm:w-32 md:w-40 bg-gray-200">
				<!-- Category badge skeleton -->
				<div class="absolute left-2 top-2">
					<div class="h-5 w-16 rounded-full bg-gray-300"></div>
				</div>
			</div>

			<!-- Content skeleton -->
			<div class="flex flex-1 flex-col p-4 space-y-2">
				<!-- Title skeleton -->
				<div class="h-5 w-4/5 rounded bg-gray-300"></div>
				
				<!-- Address skeleton -->
				<div class="flex items-center gap-1">
					<div class="h-3 w-3 rounded bg-gray-200"></div>
					<div class="h-3 w-2/3 rounded bg-gray-200"></div>
				</div>
				
				<!-- Tags skeleton -->
				<div class="flex flex-wrap gap-1">
					<div class="h-4 w-12 rounded bg-gray-200"></div>
					<div class="h-4 w-16 rounded bg-gray-200"></div>
				</div>
				
				<!-- Buttons skeleton -->
				<div class="mt-auto flex gap-2">
					<div class="flex-1 h-7 rounded bg-gray-300"></div>
					<div class="h-7 w-20 rounded bg-gray-200"></div>
				</div>
			</div>
		</div>
	</Card>

{:else if variant === 'detail'}
	<!-- Location detail page skeleton -->
	<div class="animate-pulse">
		<!-- Header skeleton -->
		<header class="border-b bg-white shadow-sm">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="py-4 sm:py-6 md:py-8">
					<div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
						<!-- Image skeleton -->
						<div class="lg:col-span-5 xl:col-span-4">
							<div class="aspect-video w-full bg-gray-200 rounded-lg"></div>
						</div>
						
						<!-- Content skeleton -->
						<div class="space-y-6 lg:col-span-7 xl:col-span-8">
							<!-- Title skeleton -->
							<div class="space-y-3">
								<div class="h-8 w-4/5 bg-gray-300 rounded"></div>
								<!-- Tags skeleton -->
								<div class="flex flex-wrap gap-2">
									<div class="h-5 w-16 bg-gray-200 rounded"></div>
									<div class="h-5 w-20 bg-gray-200 rounded"></div>
								</div>
							</div>
							
							<!-- Info grid skeleton -->
							<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
								<div class="h-20 bg-gray-100 rounded-lg"></div>
								<div class="h-20 bg-gray-100 rounded-lg"></div>
								<div class="h-20 bg-gray-100 rounded-lg"></div>
								<div class="h-20 bg-gray-100 rounded-lg"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
		
		<!-- Content sections skeleton -->
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
			<div class="space-y-12">
				<!-- About section skeleton -->
				<div class="space-y-4">
					<div class="h-6 w-48 bg-gray-300 rounded"></div>
					<div class="space-y-2">
						<div class="h-4 w-full bg-gray-200 rounded"></div>
						<div class="h-4 w-5/6 bg-gray-200 rounded"></div>
						<div class="h-4 w-4/5 bg-gray-200 rounded"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>