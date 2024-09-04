<script lang="ts">
	import { currentItinerary } from '$lib/stores/itineraryStore';
	import type { ItineraryItem } from '$lib/types/itinerary';
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import { Input, Button, Modal, Label } from 'flowbite-svelte';
	import {
		formatTime,
		formatDateTimeRange,
		getCurrentTime,
		ensureTimeNotBeforeCurrent
	} from '../../../utils/dateUtils';
	import { notifications } from '$lib/components/shared/notifications';
	import { derived } from 'svelte/store';
	import { invalidateAll } from '$app/navigation';

	export let isOpen = false;

	let itineraryName = '';
	let editingName = false;
	let startDate: Date;
	let endDate: Date;
	let hasUnsavedChanges = false;
	let initialLoad = true;

	function initializeItineraryData(currentIt) {
		if (currentIt) {
			itineraryName = currentIt.name;
			startDate = currentIt.start_date;
			endDate = currentIt.end_date;
		}
	}

	$: {
		if ($currentItinerary && initialLoad) {
			initializeItineraryData($currentItinerary);
			initialLoad = false;
		}
	}

	// Derived store for displayed items
	const displayItems = derived(
		currentItinerary,
		($currentItinerary) =>
			$currentItinerary?.items
				?.sort((a, b) => a.order_index - b.order_index)
				.map((item) => ({
					...item,
					displayStartTime: item.start_time || roundToNearestQuarter(getCurrentTime()),
					displayEndTime: item.end_time || null
				})) || []
	);

	// $: {
	// 	if ($currentItinerary) {
	// 		itineraryName = $currentItinerary.name;
	// 		startDate = $currentItinerary.start_date
	// 			? new Date($currentItinerary.start_date)
	// 			: new Date();
	// 		endDate = $currentItinerary.end_date ? new Date($currentItinerary.end_date) : new Date();
	// 	}
	// }

	$: dateRangeDisplay = formatDateTimeRange(
		startDate
			? new Date(startDate).toISOString().split('T')[0]
			: new Date().toISOString().split('T')[0],
		endDate ? new Date(endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
	);

	// Watch for changes in startDate and update endDate
	$: if (startDate && (!endDate || startDate > endDate)) {
		endDate = new Date(startDate);
		hasUnsavedChanges = true;
	}

	function roundToNearestQuarter(time: string): string {
		if (!time) return '';
		const [hours, minutes] = time.split(':').map(Number);
		const totalMinutes = hours * 60 + minutes;
		const roundedMinutes = Math.round(totalMinutes / 15) * 15;
		const newHours = Math.floor(roundedMinutes / 60);
		const newMinutes = roundedMinutes % 60;
		return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
	}

	function handleDndConsider(e: CustomEvent<{ items: ItineraryItem[] }>) {
		currentItinerary.update((current) => ({
			...current,
			items: e.detail.items
		}));
		hasUnsavedChanges = true;
	}

	function handleDndFinalize(e: CustomEvent<{ items: ItineraryItem[] }>) {
		currentItinerary.update((current) => ({
			...current,
			items: e.detail.items
		}));
		hasUnsavedChanges = true;
	}

	function removeLocation(id: string) {
		currentItinerary.update((current) => ({
			...current,
			items: current.items.filter((item) => item.location.id !== id)
		}));
		hasUnsavedChanges = true;
	}

	function handleNameChange() {
		currentItinerary.update((current) => ({
			...current,
			name: itineraryName
		}));
		hasUnsavedChanges = true;
	}

	function handleDateChange() {
		let startDateUpdate = startDate
			? new Date(startDate).toISOString().split('T')[0]
			: new Date().toISOString().split('T')[0];

		let endDateUpdate = endDate
			? new Date(endDate).toISOString().split('T')[0]
			: new Date().toISOString().split('T')[0];

		if (startDateUpdate > endDateUpdate) {
			endDateUpdate = new Date(startDate).toISOString().split('T')[0];
			endDate = new Date(startDate).toISOString().split('T')[0];
		}

		currentItinerary.update((current) => ({
			...current,
			start_date: startDateUpdate,
			end_date: endDateUpdate
		}));
		hasUnsavedChanges = true;
	}

	function handleTimeInput(item: ItineraryItem, timeType: 'start' | 'end', newTime: string) {
		const roundedTime = roundToNearestQuarter(newTime);
		currentItinerary.update((current) => ({
			...current,
			items: current.items.map((i) => {
				if (i.id === item.id) {
					if (timeType === 'start') {
						return { ...i, start_time: roundedTime, displayStartTime: roundedTime };
					} else if (timeType === 'end') {
						return { ...i, end_time: roundedTime, displayEndTime: roundedTime };
					}
				}
				return i;
			})
		}));
		hasUnsavedChanges = true;
	}

	async function saveItinerary() {
		try {
			await currentItinerary.updateItinerary({
				id: $currentItinerary.id,
				name: $currentItinerary.name,
				startDate: $currentItinerary.start_date,
				endDate: $currentItinerary.end_date,
				items: $currentItinerary.items
			});

			hasUnsavedChanges = false;
			notifications.success('Itinerary saved successfully', 3000);
			await invalidateAll();
		} catch (error) {
			notifications.danger('Failed to save itinerary', 3000);
		}
	}
</script>

<Modal bind:open={isOpen} size="xl" autoclose={false} class="w-full">
	<div class="p-4 md:p-6">
		<h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">
			{#if editingName}
				<Input
					bind:value={itineraryName}
					on:input={() => (hasUnsavedChanges = true)}
					on:blur={() => {
						editingName = false;
						handleNameChange();
					}}
					on:keydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							editingName = false;
							handleNameChange();
						}
					}}
					autofocus
				/>
			{:else}
				<span on:click={() => (editingName = true)} class="cursor-pointer hover:underline">
					{itineraryName}
				</span>
			{/if}
		</h3>
		<p class="mb-4 text-sm text-gray-600">{dateRangeDisplay}</p>
		<div class="mb-6 grid gap-4 sm:grid-cols-2">
			<div>
				<Label for="startDate" class="mb-2 block">Start Date</Label>
				<Input
					id="startDate"
					type="date"
					bind:value={startDate}
					on:change={handleDateChange}
					format="yyyy-MM-dd"
					required
					class="w-full"
				/>
			</div>
			<div>
				<Label for="endDate" class="mb-2 block">End Date</Label>
				<Input
					id="endDate"
					type="date"
					bind:value={endDate}
					on:change={handleDateChange}
					format="yyyy-MM-dd"
					min={startDate ? startDate : ''}
					required
					class="w-full"
				/>
			</div>
		</div>
		{#if $displayItems.length === 0}
			<p class="text-center text-gray-500">Your itinerary is empty!</p>
		{:else}
			<section
				use:dndzone={{ items: $displayItems }}
				on:consider={handleDndConsider}
				on:finalize={handleDndFinalize}
				class="space-y-4"
			>
				{#each $displayItems as item (item.id)}
					<div
						animate:flip={{ duration: 200 }}
						class="flex flex-col items-center justify-between rounded-lg bg-gray-100 p-4 shadow sm:flex-row"
					>
						<div class="mb-2 flex flex-col sm:mb-0">
							<span class="text-lg font-medium">{item.location.name}</span>
							<span class="text-sm text-gray-600">
								{item.displayStartTime} - {item.displayEndTime || 'No end time'}
							</span>
						</div>
						<div class="flex flex-col items-center space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
							<Input
								type="time"
								value={item.displayStartTime}
								on:input={(e) => handleTimeInput(item, 'start', e.target.value)}
								label="Start"
								min={ensureTimeNotBeforeCurrent(item.displayStartTime)}
								step="900"
							/>
							<Input
								type="time"
								value={item.displayEndTime}
								on:input={(e) => handleTimeInput(item, 'end', e.target.value)}
								label="End"
								step="900"
							/>
							<Button size="sm" color="red" on:click={() => removeLocation(item.location.id)}>
								Remove
							</Button>
						</div>
					</div>
				{/each}
			</section>
		{/if}

		<div class="mt-6 flex justify-end">
			<Button color="green" on:click={saveItinerary} disabled={!hasUnsavedChanges}>
				Save Itinerary
			</Button>
		</div>
	</div>
</Modal>

<style>
	:global(.modal-background) {
		background-color: rgba(0, 0, 0, 0.5) !important;
	}

	:global(.date-input) {
		--date-picker-background: #ffffff;
		--date-picker-foreground: #374151;
		--date-input-width: 100%;
		--date-picker-highlight-border: #3b82f6;
		--date-picker-highlight-shadow: rgba(59, 130, 246, 0.5);
		--date-picker-selected-color: #ffffff;
		--date-picker-selected-background: #3b82f6;
	}

	:global(.dark .date-input) {
		--date-picker-background: #1f2937;
		--date-picker-foreground: #f3f4f6;
	}
</style>
