<!-- src/routes/contact/+page.svelte -->
<script lang="ts">
	import { Heading, P, Button } from 'flowbite-svelte';
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<SEOHead
	title="Contact"
	description="Get in touch with Tiny Tribe Adventures — share a location tip, suggest a guide, or say hello."
	canonical="/contact"
/>

<div class="page-container">
	<Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold  md:text-5xl">Contact</Heading>
</div>
