<!-- src/lib/components/locations/LocationCardSmall.svelte -->
<script lang="ts">
	import { getLocationIcon } from '../../../utils/locationPhotos';
	import SimpleImage from '$lib/components/shared/SimpleImage.svelte';
	import {
		MapPinAltSolid,
		ArrowUpRightFromSquareOutline,
		ArrowRightOutline
	} from 'flowbite-svelte-icons';
	import { hrefForId } from '$lib/content/loader';

	export let name: string;
	export let address: string = '';
	export let website: string = '';
	export let tags: Array<{ tags: { name: string } }> = [];
	export let contentLocation: { id?: number; location?: { id?: number } } | null = null;

	$: detailsHref = (() => {
		const id = contentLocation?.location?.id ?? contentLocation?.id;
		return typeof id === 'number' ? hrefForId(id) : null;
	})();

	$: addressParts = address ? address.split(',') : [];
	$: cityStateZip = addressParts.length > 1 ? addressParts.slice(1).join(',').trim() : '';
	$: displayName =
		name && name.length > 40 ? name.slice(0, 40) + '...' : name || 'Unknown Location';
	$: locationIcon = name ? getLocationIcon(name) : 'mythmap';
	$: primaryTag = tags?.[0]?.tags?.name;
	$: extraTags = tags?.slice(1, 4) ?? [];
</script>

<article
	class="group h-full overflow-hidden border border-subtle bg-surface transition-colors duration-fast hover:border-strong hover:shadow-md"
>
	<div class="flex h-full flex-col sm:flex-row">
		<!-- Image -->
		<div
			class="relative h-40 w-full border-b border-subtle sm:h-auto sm:w-32 sm:border-b-0 sm:border-r md:w-40"
		>
			<SimpleImage
				src="/map/{locationIcon}.png"
				alt={name || 'Location'}
				fallbackSrc="/map/mythmap.png"
				aspectRatio="h-full"
				className="sm:h-auto sm:w-32 md:w-40"
			/>

			{#if primaryTag}
				<!-- Survival-orange route marker for primary tag -->
				<div class="absolute left-2 top-2">
					<span
						class="inline-flex items-center rounded-sm bg-tertiary-500 px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wide text-white"
					>
						{primaryTag}
					</span>
				</div>
			{/if}
		</div>

		<!-- Content -->
		<div class="flex flex-1 flex-col p-4">
			<div class="mb-2">
				<h3
					class="line-clamp-1 font-display text-lg font-bold text-default group-hover:text-primary-700 dark:group-hover:text-primary-300"
				>
					{displayName}
				</h3>

				{#if cityStateZip}
					<div class="mt-1 flex items-center gap-1 text-sm text-muted">
						<MapPinAltSolid class="h-3 w-3 flex-shrink-0 text-tertiary-500" />
						<span class="line-clamp-1">{cityStateZip}</span>
					</div>
				{/if}
			</div>

			<!-- Stamped secondary tags -->
			{#if extraTags.length > 0}
				<div class="mb-3 flex flex-wrap gap-1">
					{#each extraTags as tag}
						{#if tag?.tags?.name}
							<span class="stamped-tag">{tag.tags.name}</span>
						{/if}
					{/each}
					{#if tags.length > 4}
						<span class="stamped-tag !text-subtle">+{tags.length - 4}</span>
					{/if}
				</div>
			{/if}

			<!-- Action -->
			{#if detailsHref || website}
				<div class="mt-auto flex gap-2">
					{#if detailsHref}
						<a href={detailsHref} class="flex-1">
							<button
								class="flex w-full items-center justify-between rounded-sm bg-primary-700 px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-primary-600 dark:bg-primary-500 dark:text-primary-50 dark:hover:bg-primary-400"
							>
								<span>Details</span>
								<ArrowRightOutline class="ml-1 h-3 w-3" />
							</button>
						</a>
					{/if}
					{#if website}
						<a href={website} target="_blank" rel="noopener noreferrer" class={detailsHref ? '' : 'flex-1'}>
							<button
								class="flex w-full items-center justify-between rounded-sm border border-primary-700 bg-surface px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-primary-700 transition-colors duration-fast hover:bg-primary-50 dark:border-primary-300 dark:text-primary-300 dark:hover:bg-primary-900"
							>
								<span>Website</span>
								<ArrowUpRightFromSquareOutline class="ml-1 h-3 w-3" />
							</button>
						</a>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</article>
