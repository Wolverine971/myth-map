<script lang="ts">
	import type { PageData } from './$types';
	import { Select, Button, Card, Accordion } from 'flowbite-svelte';
	import { notifications } from '$lib/components/shared/notifications';
	import ContentCard from '$lib/components/content/contentCard.svelte';

	export let data: PageData;
	console.log(data);

	let expandedBlogTitle: string | null = null;
	let activeSelection = 'locations';

	const contentTypes = ['locations'];
	const stages = [
		'Needs Info',
		'Not written',
		'Prioritized',
		'Written',
		'Sent out for review',
		'Reviewed',
		'Socialized',
		'Growing',
		'Needs Work'
	];

	// things to add

	// open and closing times

	// offerings

	$: {
		contentTypes.forEach((type) => {
			data[type].forEach((blog) => {
				blog.stage = stages.indexOf(blog.stageName);
				if (!blog.published && blog.stageName !== 'Prioritized') {
					blog.stage = 0;
				}
			});
		});
	}

	function expand(blog: App.BlogPost) {
		expandedBlogTitle = expandedBlogTitle === blog.title ? null : blog.title;
	}

	function dragStart(event: DragEvent, blogTitle: string) {
		event.dataTransfer?.setData('text/plain', blogTitle);
	}

	function dragOver(event: DragEvent) {
		event.preventDefault();
	}

	async function drop(event: DragEvent, stageIndex: number, blogType: string) {
		event.preventDefault();
		const blogTitle = event.dataTransfer?.getData('text/plain');
		if (!blogTitle || !data[blogType]) return;

		const blogIndex = data[blogType].findIndex((b) => b.title === blogTitle);
		if (blogIndex === -1 || data[blogType][blogIndex].stage === stageIndex) return;

		const blog = data[blogType][blogIndex];
		blog.stage = stageIndex;
		blog.stageName = stages[stageIndex];

		if (!blog.published && blog.stageName !== 'Prioritized' && blog.stageName !== 'Not written') {
			notifications.warning('Blog not published', 3000);
			return;
		}

		data[blogType] = [...data[blogType]];
		await updateStage(blog, blogType);
	}

	async function updateStage(blog: App.BlogPost, blogType: string) {
		const body = new FormData();
		Object.entries(blog).forEach(([key, value]) => {
			body.append(key, value?.toString() || '');
		});
		body.append('content_type', blogType);

		const response = await fetch(`/content-board?/updateStage`, { method: 'POST', body });
		const { data: responseData, error } = await response.json();

		if (responseData) {
			notifications.info('Content Updated', 3000);
		} else {
			notifications.warning('Content Update error', 3000);
		}
	}
</script>

<div class="container mx-auto p-4">
	<Select class="mb-4" bind:value={activeSelection}>
		{#each contentTypes as type}
			<option value={type}>{type.toUpperCase()}</option>
		{/each}
	</Select>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
		{#each stages as stage, stageIndex}
			<div
				class="rounded-lg bg-gray-100 p-4"
				on:dragover={dragOver}
				on:drop={async (event) => await drop(event, stageIndex, activeSelection)}
				role="list"
				aria-label={`${stage} stage`}
			>
				<h3 id={`stage-${stageIndex}-heading`} class="mb-4 text-lg font-semibold">{stage}</h3>
				{#if activeSelection && data[activeSelection]}
					{#each data[activeSelection].filter((blog) => blog.stage === stageIndex) as blog, index}
						{#if blog.title}
							<div
								class="mb-4 flex w-full max-w-sm cursor-move flex-col divide-gray-200 rounded-lg border border-gray-200 bg-white p-4 text-gray-500 shadow-md sm:p-6 dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
								draggable={expandedBlogTitle !== blog.title}
								on:dragstart={(event) => dragStart(event, blog.title)}
								role="listitem"
								aria-labelledby={`blog-title-${stageIndex}-${index}`}
							>
								<h4 id={`blog-title-${stageIndex}-${index}`} class="text-md mb-2 font-medium">
									{blog.title}
								</h4>
								<Button size="xs" on:click={() => expand(blog)}>
									{expandedBlogTitle === blog.title ? 'Collapse' : 'Expand'}
								</Button>
								{#if expandedBlogTitle === blog.title}
									<Accordion class="mt-4">
										<ContentCard blogContent={blog} />
									</Accordion>
								{/if}
							</div>
						{/if}
					{/each}
				{/if}
			</div>
		{/each}
	</div>
</div>
