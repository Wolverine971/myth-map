<script>
	import { page } from '$app/stores';
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Button } from 'flowbite-svelte';
	import { UserSolid } from 'flowbite-svelte-icons';
	$: activeUrl = $page.url.pathname;
</script>

<div
	class="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md transition-all duration-300 dark:bg-gray-900/80"
>
	<div class="flex w-full justify-center">
		<Navbar let:hidden let:toggle class="relative w-full max-w-[1350px] px-4 py-2 sm:px-6 lg:px-8">
			<div class="flex w-full items-center justify-between">
				<NavBrand href="/" class="flex flex-shrink-0 items-center transition-all duration-300">
					<img
						src="/myth-map-small.svg"
						class="h-10 transition-all duration-300 sm:h-14"
						alt="Tiny Tribe Adventures"
					/>
					<span
						class="invisible ml-2 max-w-0 self-center overflow-hidden whitespace-nowrap text-lg font-semibold transition-all duration-300 sm:max-w-xs lg:visible dark:text-white"
					>
						Tiny Tribe Adventures
					</span>
				</NavBrand>

				<div class="flex flex-shrink-0 items-center space-x-2">
					<Button
						href="/account"
						color="light"
						class="!p-2 transition-transform duration-300 hover:scale-110"
					>
						<UserSolid class="h-5 w-5" />
					</Button>
					<NavHamburger
						on:click={toggle}
						class="transition-transform duration-300 hover:scale-110 md:hidden"
					/>
				</div>
			</div>

			<div
				class="absolute left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 transform"
			>
				<NavUl
					{activeUrl}
					{hidden}
					class="flex-col justify-center space-y-2 transition-all duration-300 md:flex md:flex-row md:space-x-4 md:space-y-0 {hidden
						? 'hidden'
						: 'flex'}"
				>
					<NavLi href="/" class="transition-transform duration-300 hover:scale-105">Home</NavLi>
					<NavLi href="/locations" class="transition-transform duration-300 hover:scale-105"
						>Locations</NavLi
					>
					<NavLi href="/about" class="transition-transform duration-300 hover:scale-105"
						>About us</NavLi
					>
					<NavLi href="/contact" class="transition-transform duration-300 hover:scale-105"
						>Contact</NavLi
					>
				</NavUl>
			</div>
		</Navbar>
	</div>
</div>
