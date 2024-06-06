<script>
	import { Card, Button } from 'flowbite-svelte';
	let hCard = false;
	export let name;
	export let address;
	export let website;
	export let tag;
</script>

<Card img={`/tag-images/${tag}.png`} href="/" horizontal size="md" reverse={hCard}>
	<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
		{name}
	</h5>
	<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
		{address}
	</p>
	<a href={website} target="_blank" rel="noopener noreferrer">
		<Button color="primary" size="md" block>Visit Website</Button>
	</a>
</Card>
