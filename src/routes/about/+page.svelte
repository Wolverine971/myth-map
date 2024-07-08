<script lang="ts">
	import { Heading, P, Button } from 'flowbite-svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<div style="text-align: start;">
	<Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold md:text-5xl">Mission</Heading>
	<P class="mb-4">
		Tiny Tribe Adventures is on a quest to help families create unforgettable memories through
		adventuring.
	</P>
	<P class="mb-4">
		Parenting is hard, we get it, but it doesn't have to be lonely. Creating experiences with your
		family and building connections with others should be easy and fun. We want to help every family
		do just that by making it easier to find adventures that speak to everyone in the family, not
		just the kids.
	</P>
	<P class="mb-4">Find your next adventure spot, put down your phone, and explore together!</P>

	<Heading tag="h2" class="mb-4" customSize="text-4xl font-extrabold md:text-5xl">About Us</Heading>
	<P class="mb-4">
		We are two families that met randomly at a kid's birthday party and became fast friends. Many
		stars aligned for us to meet and engage with each other, inspiring us to help other families
		expand their own tribe.
	</P>
	<P class="mb-4">This is a project by Zach and Kerry, DJ and Anna 👋</P>
	<!-- <P class="mb-4">
		Zach(left) and DJ(right) are former Marines turned software engineers and entrepreneurs with a
		passion for building engaging experiences. Kerry(left) is a former dolphin trainer and
		Anna(right) a marketing guru both now focused on raising their incredible kids Jack, Lily, and
		Walter (left to right). We are all now committed to helping you create incredible experiences
		with your families.
	</P> -->
</div>
