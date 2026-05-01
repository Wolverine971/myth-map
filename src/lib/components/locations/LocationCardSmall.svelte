<!-- src/lib/components/locations/LocationCardSmall.svelte -->
<script lang="ts">
	import { Card, Button, Badge } from 'flowbite-svelte';
	import { getLocationIcon } from '../../../utils/locationPhotos';
	import SimpleImage from '$lib/components/shared/SimpleImage.svelte';
	import { MapPinOutline, GlobeOutline } from 'flowbite-svelte-icons';

	export let name: string;
	export let address: string = '';
	export let website: string = '';
	export let tags: Array<{ tags: { name: string } }> = [];

	$: addressParts = address ? address.split(',') : [];
	$: cityStateZip = addressParts.length > 1 ? addressParts.slice(1).join(',').trim() : '';
	$: displayName = name && name.length > 40 ? name.slice(0, 40) + '...' : name || 'Unknown Location';
	$: locationIcon = name ? getLocationIcon(name) : 'mythmap';
</script>

<Card padding="none" class="group h-full overflow-hidden transition-smooth hover-lift hover:shadow-md">
	<div class="flex h-full flex-col sm:flex-row">
		<!-- Image Section -->
		<div class="relative h-40 w-full sm:h-auto sm:w-32 md:w-40">
			<SimpleImage
				src="/map/{locationIcon}.png"
				alt={name || 'Location'}
				fallbackSrc="/map/mythmap.png"
				aspectRatio="h-full"
				className="sm:h-auto sm:w-32 md:w-40"
			/>
			
			<!-- Category Badge -->
			{#if tags?.[0]?.tags?.name}
				<div class="absolute left-2 top-2">
					<Badge color="primary" class="bg-white/90 text-xs font-semibold text-primary-700 shadow-sm">
						{tags[0].tags.name}
					</Badge>
				</div>
			{/if}
		</div>

		<!-- Content Section -->
		<div class="flex flex-1 flex-col p-4">
			<!-- Header -->
			<div class="mb-2">
				<h3 class="line-clamp-1 text-base font-bold text-gray-900 group-hover:text-primary-700 sm:text-lg">
					{displayName}
				</h3>
				
				<!-- Address -->
				{#if cityStateZip}
					<div class="mt-1 flex items-center gap-1 text-sm text-gray-600">
						<MapPinOutline class="h-3 w-3 flex-shrink-0" />
						<span class="line-clamp-1">{cityStateZip}</span>
					</div>
				{/if}
			</div>

			<!-- Tags -->
			{#if tags.length > 1}
				<div class="mb-3 flex flex-wrap gap-1">
					{#each tags.slice(1, 4) as tag}
						{#if tag?.tags?.name}
							<Badge color="light" class="text-xs">
								{tag.tags.name}
							</Badge>
						{/if}
					{/each}
					{#if tags.length > 4}
						<Badge color="light" class="text-xs text-gray-500">
							+{tags.length - 4}
						</Badge>
					{/if}
				</div>
			{/if}

			<!-- Action Buttons -->
			{#if website}
				<div class="mt-auto flex gap-2">
					<a href={website} target="_blank" rel="noopener noreferrer" class="flex-1">
						<Button color="primary" size="xs" class="w-full justify-between">
							<span class="text-xs sm:text-sm">Visit Website</span>
							<GlobeOutline class="ml-1 h-3 w-3" />
						</Button>
					</a>
				</div>
			{/if}
		</div>
	</div>
</Card>