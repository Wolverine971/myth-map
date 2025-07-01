<!-- src/lib/components/base/NavBar.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import {
		Navbar,
		NavBrand,
		NavLi,
		NavUl,
		NavHamburger,
		Button,
		Dropdown,
		DropdownItem
	} from 'flowbite-svelte';
	import { UserSolid } from 'flowbite-svelte-icons';
	import { invalidateAll } from '$app/navigation';
	import { applyAction, deserialize } from '$app/forms';
	import { afterNavigate } from '$app/navigation';

	export let user: any = null;

	let dropdownOpen = false;
	let dropdownNavOpen = false;

	afterNavigate(() => {
		closeDropdown();
	});

	const handleLogout = async () => {
		try {
			const body = new FormData();
			const response = await fetch('/account?/logout', { method: 'POST', body });

			/** @type {import('@sveltejs/kit').ActionResult} */
			const result = deserialize(await response.text());

			if (result.type === 'success') {
				// rerun all `load` functions, following the successful update
				await invalidateAll();
			}

			applyAction(result);
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			closeDropdown();
		}
	};

	const toggleDropdown = () => {
		dropdownOpen = !dropdownOpen;
	};

	const closeDropdown = () => {
		dropdownOpen = false;
	};

	const toggleDropdownNavItems = () => {
		dropdownNavOpen = !dropdownNavOpen;
	};

	const closeNavDropdown = () => {
		dropdownNavOpen = false;
	};
</script>

<div
	class="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md transition-all duration-300 dark:bg-primary-900/80"
>
	<div class="flex w-full justify-center">
		<Navbar class="relative w-full max-w-[1350px] px-4 py-2 sm:px-6 lg:px-8">
			<div class="flex w-full items-center justify-between">
				<NavBrand href="/" class="flex flex-shrink-0 items-center transition-all duration-300">
					<img
						src="/myth-map-small.svg"
						class="h-10 transition-all duration-300 sm:h-14"
						alt="Tiny Tribe Adventures"
					/>
					<span
						class="invisible ml-2 max-w-0 self-center overflow-hidden whitespace-nowrap text-lg font-semibold text-primary-700 transition-all duration-300 sm:max-w-xs lg:visible dark:text-white"
					>
						Tiny Tribe Adventures
					</span>
				</NavBrand>

				<div class="flex flex-shrink-0 items-center space-x-2">
					{#if user}
						<div class="relative">
							<Button
								color="primary"
								class="!p-2 transition-all duration-300 hover:bg-primary-600"
								id="account-menu-button"
								on:click={toggleDropdown}
							>
								<UserSolid class="h-5 w-5" />
							</Button>
							<Dropdown open={dropdownOpen} class="w-44" on:click={closeDropdown}>
								<DropdownItem href="/account" class="flex items-center text-primary-700">
									<UserSolid class="mr-2 h-4 w-4" />
									Account
								</DropdownItem>
								<DropdownItem on:click={handleLogout} class="text-primary-700">Logout</DropdownItem>
							</Dropdown>
						</div>
					{:else}
						<div class="flex space-x-2">
							<Button
								href="/login"
								color="primary"
								class="transition-all duration-300 hover:bg-primary-600"
							>
								Login / Register
							</Button>
						</div>
					{/if}
					<!-- <NavHamburger
						on:click={() => (hidden = !hidden)}
						class="text-primary-700 transition-all duration-300 hover:text-primary-600 md:hidden"
					/> -->
					<NavHamburger
						color="primary"
						class="md:hidde text-primary-700 transition-all duration-300 hover:text-primary-600"
						id="account-menu-button"
						on:click={toggleDropdownNavItems}
					></NavHamburger>
					<Dropdown open={dropdownNavOpen} class="w-44" on:click={closeNavDropdown}>
						<DropdownItem href="/" class="flex items-center text-primary-700">Home</DropdownItem>

						<DropdownItem href="/locations" class="flex items-center text-primary-700"
							>locations
						</DropdownItem>

						<DropdownItem href="/about" class="flex items-center text-primary-700"
							>about</DropdownItem
						>

						<!-- <DropdownItem href="/contact" class="flex items-center text-primary-700"
							>contact
						</DropdownItem> -->
					</Dropdown>
				</div>
			</div>

			<NavUl
				style="justify-content: center;"
				class="mt-4 flex-col space-y-2 md:absolute md:left-1/2 md:top-1/2 md:mt-0 md:flex md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:transform md:flex-row md:space-x-4 md:space-y-0"
			>
				<NavLi href="/" class="transition-all duration-300 hover:text-primary-600">Home</NavLi>
				<NavLi href="/locations" class="transition-all duration-300 hover:text-primary-600"
					>Locations</NavLi
				>
				<NavLi href="/about" class="transition-all duration-300 hover:text-primary-600"
					>About us</NavLi
				>
				<!-- <NavLi href="/contact" class="transition-all duration-300 hover:text-primary-600"
					>Contact</NavLi
				> -->
			</NavUl>
		</Navbar>
	</div>
</div>
