<script lang="ts">
	import { enhance } from '$app/forms';

	import {
		A,
		Button,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Modal,
		Label,
		Input,
		Checkbox,
		Accordion,
		AccordionItem
	} from 'flowbite-svelte';

	export let data;
	let users = data.users;
	let selectedUser = null;
	let showModal = false;
	let showDetailsModal = false;

	function openEditModal(user) {
		selectedUser = { ...user };
		showModal = true;
	}

	function openDetailsModal(user) {
		selectedUser = { ...user };
		showDetailsModal = true;
	}

	function formatDate(date) {
		return date ? new Date(date).toLocaleString() : 'N/A';
	}
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

<div class="container mx-auto px-4 py-8">
	<h1 class="mb-6 text-3xl font-bold">User Management</h1>

	<Table striped={true} hoverable={true} class="mb-8">
		<TableHead>
			<TableHeadCell>Username</TableHeadCell>
			<TableHeadCell>Name</TableHeadCell>
			<TableHeadCell>Email</TableHeadCell>
			<TableHeadCell>Admin</TableHeadCell>
			<TableHeadCell>Last Sign In</TableHeadCell>
			<TableHeadCell>Actions</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each users as user}
				<TableBodyRow>
					<TableBodyCell>{user.username}</TableBodyCell>
					<TableBodyCell>{user.first_name} {user.last_name}</TableBodyCell>
					<TableBodyCell>{user.email}</TableBodyCell>
					<TableBodyCell>{user.admin ? 'Yes' : 'No'}</TableBodyCell>
					<TableBodyCell>{formatDate(user.last_sign_in_at)}</TableBodyCell>
					<TableBodyCell>
						<Button size="sm" class="mr-2" on:click={() => openEditModal(user)}>Edit</Button>
						<Button size="sm" color="light" on:click={() => openDetailsModal(user)}>Details</Button>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>

	<Modal bind:open={showModal} size="md" autoclose={false} class="w-full">
		<h2 class="mb-4 text-xl font-bold">Edit User</h2>
		<form
			method="POST"
			action="?/updateUser"
			use:enhance={() => {
				return ({ result }) => {
					if (result.type === 'success') {
						showModal = false;
						users = users.map((u) => (u.id === selectedUser.id ? { ...u, ...selectedUser } : u));
					}
				};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="id" value={selectedUser?.id} />
			<Label class="space-y-2">
				<span>Username</span>
				<Input type="text" name="username" bind:value={selectedUser.username} required />
			</Label>
			<Label class="space-y-2">
				<span>First Name</span>
				<Input type="text" name="first_name" bind:value={selectedUser.first_name} />
			</Label>
			<Label class="space-y-2">
				<span>Last Name</span>
				<Input type="text" name="last_name" bind:value={selectedUser.last_name} />
			</Label>
			<Label class="space-y-2">
				<span>Email</span>
				<Input type="email" name="email" bind:value={selectedUser.email} disabled />
			</Label>
			<Label class="space-y-2">
				<span>Phone</span>
				<Input type="tel" name="phone" bind:value={selectedUser.phone} />
			</Label>
			<Label class="flex items-center space-x-2">
				<Checkbox name="admin" bind:checked={selectedUser.admin} />
				<span>Admin</span>
			</Label>
			<div class="flex justify-end space-x-2">
				<Button type="button" color="alternative" on:click={() => (showModal = false)}
					>Cancel</Button
				>
				<Button type="submit">Save</Button>
			</div>
		</form>
	</Modal>

	<Modal bind:open={showDetailsModal} size="lg" autoclose={false} class="w-full">
		<h2 class="mb-4 text-xl font-bold">User Details</h2>
		{#if selectedUser}
			<Accordion>
				<AccordionItem open>
					<span slot="header">Basic Information</span>
					<div class="space-y-2">
						<p><strong>Username:</strong> {selectedUser.username}</p>
						<p><strong>Name:</strong> {selectedUser.first_name} {selectedUser.last_name}</p>
						<p><strong>Email:</strong> {selectedUser.email}</p>
						<p><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</p>
						<p><strong>Admin:</strong> {selectedUser.admin ? 'Yes' : 'No'}</p>
						<p><strong>Role:</strong> {selectedUser.role || 'N/A'}</p>
					</div>
				</AccordionItem>
				<AccordionItem>
					<span slot="header">System Information</span>
					<div class="space-y-2">
						<p><strong>ID:</strong> {selectedUser.id}</p>
						<p><strong>External ID:</strong> {selectedUser.external_id}</p>
						<p><strong>Created At:</strong> {formatDate(selectedUser.created_at)}</p>
						<p><strong>Audience:</strong> {selectedUser.aud}</p>
					</div>
				</AccordionItem>
				<AccordionItem>
					<span slot="header">Authentication Information</span>
					<div class="space-y-2">
						<p><strong>Invited At:</strong> {formatDate(selectedUser.invited_at)}</p>
						<p>
							<strong>Confirmation Sent At:</strong>
							{formatDate(selectedUser.confirmation_sent_at)}
						</p>
						<p><strong>Confirmed At:</strong> {formatDate(selectedUser.confirmed_at)}</p>
						<p><strong>Last Sign In At:</strong> {formatDate(selectedUser.last_sign_in_at)}</p>
					</div>
				</AccordionItem>
			</Accordion>
		{/if}
		<div class="mt-4 flex justify-end">
			<Button on:click={() => (showDetailsModal = false)}>Close</Button>
		</div>
	</Modal>
</div>
