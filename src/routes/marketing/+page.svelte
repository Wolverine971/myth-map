<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	// import { onMount } from 'svelte';
	import Calendar from '$lib/components/marketing/Calendar.svelte';
	import CampaignManager from '$lib/components/marketing/CampaignManager.svelte';
	import ContentManager from '$lib/components/marketing/ContentManager.svelte';
	import TemplateManager from '$lib/components/marketing/TemplateManager.svelte';
	import { Tabs, TabItem, A, Button, Heading } from 'flowbite-svelte';

	let activeTab: 'calendar' | 'campaigns' | 'content' | 'templates' = 'calendar';

	function setActiveTab(tab: typeof activeTab) {
		activeTab = tab;
	}
	export let data;
</script>

{#if data.user.admin}
	<div class="mx-auto flex w-full max-w-3xl gap-1 p-4">
		<A href="/admin/users" outline>
			<Button outline>Manage Users</Button></A
		>
		<A href="/content-board" outline>
			<Button outline>Manage Content</Button></A
		>
		<A href="/locations/add" outline>
			<Button outline>Add/ Update Locations</Button></A
		>
		<A href="/marketing" outline>
			<Button outline>Marketing Dashboard</Button></A
		>
	</div>
{/if}

<main class="container mx-auto mt-4 p-4">
	<Heading tag="h1" customSize="text-3xl md:text-4xl font-extrabold mb-4"
		>Social Media Scheduler</Heading
	>

	<Tabs tabStyle="underline" contentClass="py-4 bg-transparent">
		<TabItem open title="Calendar" on:click={() => setActiveTab('calendar')}>
			<Calendar
				contentItems={data.content}
				campaigns={data.campaigns}
				templates={data.templates}
				on:calendarUpdated={() => invalidateAll()}
			/>
		</TabItem>

		<TabItem title="Campaigns" on:click={() => setActiveTab('campaigns')}>
			<CampaignManager campaigns={data.campaigns} />
		</TabItem>

		<TabItem title="Content" on:click={() => setActiveTab('content')}>
			<ContentManager
				contentItems={data.content}
				campaigns={data.campaigns}
				templates={data.templates}
			/>
		</TabItem>
		<TabItem title="Templates" on:click={() => setActiveTab('templates')}>
			<TemplateManager templates={data.templates} />
		</TabItem>
	</Tabs>
</main>
