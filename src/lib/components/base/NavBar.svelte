<!-- src/lib/components/base/NavBar.svelte -->
<script lang="ts">
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { afterNavigate } from '$app/navigation';

	let dropdownNavOpen = false;
	let navMenuButton: HTMLElement;

	afterNavigate(() => {
		dropdownNavOpen = false;
	});

	const toggleDropdownNavItems = () => {
		dropdownNavOpen = !dropdownNavOpen;
	};
</script>

<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
>
	Skip to main content
</a>

<div class="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md transition-all duration-300 dark:bg-primary-900/80">
	<div class="flex w-full justify-center">
		<Navbar class="relative w-full max-w-[1350px] px-4 py-2 sm:px-6 lg:px-8" role="navigation" aria-label="Main navigation">
			<div class="flex w-full items-center justify-between">
				<NavBrand href="/" class="flex flex-shrink-0 items-center transition-all duration-300">
					<img src="/myth-map-small.svg" class="h-10 transition-all duration-300 sm:h-12" alt="Tiny Tribe Adventures" />
					<span class="ml-2 hidden self-center whitespace-nowrap text-lg font-semibold text-primary-700 transition-all duration-300 sm:block dark:text-white">
						Tiny Tribe Adventures
					</span>
				</NavBrand>

				<div class="flex flex-shrink-0 items-center space-x-2">
					<NavHamburger
						bind:this={navMenuButton}
						class="text-primary-700 transition-all duration-300 hover:text-primary-600 md:hidden"
						aria-haspopup="true"
						aria-expanded={dropdownNavOpen}
						aria-label="Toggle mobile navigation menu"
						on:click={toggleDropdownNavItems}
					/>
					<Dropdown open={dropdownNavOpen} class="mt-2 w-48 md:hidden" placement="bottom-end" role="menu">
						<DropdownItem href="/" class="flex items-center text-primary-700 hover:bg-primary-50">Home</DropdownItem>
						<DropdownItem href="/locations" class="flex items-center text-primary-700 hover:bg-primary-50">Locations</DropdownItem>
						<DropdownItem href="/about" class="flex items-center text-primary-700 hover:bg-primary-50">About us</DropdownItem>
					</Dropdown>
				</div>
			</div>

			<NavUl class="hidden md:absolute md:left-1/2 md:top-1/2 md:flex md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:transform md:flex-row md:items-center md:justify-center md:space-x-8">
				<NavLi href="/" class="text-gray-700 transition-all duration-300 hover:text-primary-600">Home</NavLi>
				<NavLi href="/locations" class="text-gray-700 transition-all duration-300 hover:text-primary-600">Locations</NavLi>
				<NavLi href="/about" class="text-gray-700 transition-all duration-300 hover:text-primary-600">About us</NavLi>
			</NavUl>
		</Navbar>
	</div>
</div>
