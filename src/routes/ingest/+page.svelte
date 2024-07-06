<script lang="ts">
	// import { joinEmail, joinEmail2, signupEmail, forgotPass } from '../../emails';
	import type { PageData } from './$types';
	import { dev } from '$app/environment';
	import { notifications } from '$lib/components/shared/notifications';

	export let data: PageData;

	const ingest = async () => {
		const { data, error: emailError } = await (
			await fetch(`/ingest?/ingest`, {
				method: 'POST',
				body: JSON.stringify({})
			})
		).json();

		if (data) {
			notifications.info('ingested', 3000);
		} else {
			notifications.warning('ingested Failed', 3000);
		}
	};

	import { A, Card, Button } from 'flowbite-svelte';
</script>

{#if dev}
	<Button
		type="button"
		on:click={async () => {
			await ingest();
		}}>Ingest</Button
	>
	{#each data?.locations as location, i}
		{#if i !== 0}
			<Card>
				<A href={location[4]} class="" style="display: block">
					<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
						Name: {location[0]}
					</h5>
					<br />
					<p class="font-normal leading-tight text-gray-700 dark:text-gray-400">
						Address: {location[7]}
					</p>
					<!-- {JSON.stringify(location)} -->
				</A>
			</Card>
		{/if}
	{/each}
{:else}
	Protected route
{/if}

<style>
	.display-emails {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
</style>
