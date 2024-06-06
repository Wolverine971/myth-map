<script lang="ts">
	import { Heading, P, Button } from 'flowbite-svelte';
	import type { PageData } from './$types';
	export let data: PageData;
	console.log(data);
</script>

<Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold  md:text-5xl">Blog</Heading>
