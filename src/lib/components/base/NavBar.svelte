<script>
	import { page } from '$app/stores';
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger } from 'flowbite-svelte';
	$: activeUrl = $page.url.pathname;
</script>

<Navbar>
	<NavBrand href="/">
		<img src="/myth-map-small.svg" class="me-3 h-6 sm:h-20" alt="Tiny Tribe Adventures" />
		{#if $page.url.pathname !== '/'}
			<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"
				>Tiny Tribe Adventures</span
			>
		{/if}
	</NavBrand>
	<NavHamburger />
	<NavUl {activeUrl}>
		<NavLi href="/">Home</NavLi>
		<NavLi href="/blog">Blog</NavLi>
		<NavLi href="/about">About us</NavLi>
		<NavLi href="/contact">Contact</NavLi>
	</NavUl>
</Navbar>
