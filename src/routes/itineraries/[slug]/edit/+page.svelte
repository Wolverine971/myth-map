<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { Card, Button, Label, Input, Heading, P } from 'flowbite-svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	export let data: PageData;

	let name = data.itinerary.name;
	let startDate = data.itinerary.start_date;
	let endDate = data.itinerary.end_date;
	let items = data.itinerary.items.sort((a, b) => a.order_index - b.order_index);

	function roundToNearestQuarter(time: string): string {
		if (!time) return '';
		const [hours, minutes] = time.split(':').map(Number);
		const totalMinutes = hours * 60 + minutes;
		const roundedMinutes = Math.round(totalMinutes / 15) * 15;
		const newHours = Math.floor(roundedMinutes / 60);
		const newMinutes = roundedMinutes % 60;
		return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
	}

	async function saveChanges() {
		try {
			const response = await fetch(`/itineraries/${data.itinerary.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name,
					startDate,
					endDate,
					items: items.map((item) => ({
						...item,
						start_time: roundToNearestQuarter(item.start_time),
						end_time: item.end_time ? roundToNearestQuarter(item.end_time) : null
					}))
				})
			});

			if (!response.ok) {
				throw new Error('Failed to update itinerary');
			}

			goto(`/itineraries/${data.itinerary.id}`);
		} catch (error) {
			console.error('Failed to save changes:', error);
			// Handle error (e.g., show error message to user)
		}
	}

	function removeLocation(id: string) {
		items = items.filter((item) => item.id !== id);
	}

	function handleDndConsider(e: CustomEvent<{ items: typeof items }>) {
		items = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<{ items: typeof items }>) {
		items = e.detail.items;
	}

	function handleTimeInput(item: any, timeType: 'start' | 'end', newTime: string) {
		const roundedTime = roundToNearestQuarter(newTime);
		items = items.map((i) => {
			if (i.id === item.id) {
				if (timeType === 'start') {
					return { ...i, start_time: roundedTime };
				} else if (timeType === 'end') {
					return { ...i, end_time: roundedTime };
				}
			}
			return i;
		});
	}
</script>

<div class="container mx-auto bg-secondary-50 px-4 py-8">
	<Card class="mx-auto mb-4 max-w-3xl bg-white shadow-lg">
		<form on:submit|preventDefault={saveChanges} class="space-y-6">
			<Heading tag="h1" class="mb-6 text-center text-2xl font-bold text-primary-700 md:text-3xl"
				>Edit Itinerary</Heading
			>

			<div>
				<Label for="name" class="mb-2 block text-neutral-700">Itinerary Name</Label>
				<Input id="name" bind:value={name} required class="w-full" />
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<Label for="startDate" class="mb-2 block text-neutral-700">Start Date</Label>
					<Input id="startDate" type="date" bind:value={startDate} required class="w-full" />
				</div>
				<div>
					<Label for="endDate" class="mb-2 block text-neutral-700">End Date</Label>
					<Input
						id="endDate"
						type="date"
						bind:value={endDate}
						required
						class="w-full"
						min={startDate}
					/>
				</div>
			</div>

			<div>
				<Heading tag="h2" class="mb-4 text-xl font-semibold text-primary-600 md:text-2xl"
					>Locations</Heading
				>
				{#if items.length === 0}
					<P class="text-center text-neutral-500">No locations added to this itinerary yet.</P>
				{:else}
					<section
						use:dndzone={{ items }}
						on:consider={handleDndConsider}
						on:finalize={handleDndFinalize}
						class="space-y-4"
					>
						{#each items as item (item.id)}
							<div animate:flip={{ duration: 200 }}>
								<Card class="w-full max-w-lg bg-secondary-100 p-4">
									<div
										class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
									>
										<span class="text-lg font-medium text-primary-700">{item.location.name}</span>
										<div
											class="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0"
										>
											<div class="flex items-center space-x-2">
												<Input
													type="time"
													value={item.start_time}
													on:input={(e) => handleTimeInput(item, 'start', e.target.value)}
													class="w-24 sm:w-32"
													step="900"
												/>
												<span class="text-neutral-500">to</span>
												<Input
													type="time"
													value={item.end_time}
													on:input={(e) => handleTimeInput(item, 'end', e.target.value)}
													class="w-24 sm:w-32"
													step="900"
												/>
											</div>
											<Button
												color="red"
												size="sm"
												class="w-full sm:w-auto"
												on:click={() => removeLocation(item.id)}
											>
												Remove
											</Button>
										</div>
									</div>
								</Card>
							</div>
						{/each}
					</section>
				{/if}
			</div>

			<div class="flex flex-col justify-end space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
				<Button color="secondary" href="/itineraries/{data.itinerary.id}" class="w-full sm:w-auto"
					>Cancel</Button
				>
				<Button type="submit" color="primary" class="w-full sm:w-auto">Save Changes</Button>
			</div>
		</form>
	</Card>
</div>

<style lang="scss">
	.input-time {
		-webkit-appearance: none;
		-moz-appearance: textfield;

		&::-webkit-calendar-picker-indicator {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.card {
			padding: 1rem !important;
		}

		.input {
			font-size: 0.875rem !important;
			padding: 0.5rem !important;
		}

		.button {
			font-size: 0.875rem !important;
			padding: 0.5rem 1rem !important;
		}
	}
</style>
