<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Card, Input, Label, Textarea } from 'flowbite-svelte';
	import type { Campaign } from '$lib/types';

	export let campaigns: Campaign[];

	let editingCampaign: Campaign | null = null;

	function startEditing(campaign: Campaign) {
		editingCampaign = { ...campaign };
	}

	function cancelEditing() {
		editingCampaign = null;
	}

	function updateEditingCampaign(field: keyof Campaign, value: string) {
		if (editingCampaign) {
			editingCampaign = { ...editingCampaign, [field]: value };
		}
	}
</script>

<h2 class="mb-4 text-2xl font-bold">Campaigns</h2>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<div>
		<h3 class="mb-2 text-xl font-bold">Create New Campaign</h3>
		<form action="?/createCampaign" method="POST" use:enhance class="space-y-4">
			<Label>
				Name
				<Input type="text" name="name" required />
			</Label>
			<Label>
				Description
				<Textarea name="description" />
			</Label>
			<Label>
				Start Date
				<Input type="date" name="start_date" required />
			</Label>
			<Label>
				End Date
				<Input type="date" name="end_date" required />
			</Label>
			<Label>
				Color
				<Input type="color" name="color" required />
			</Label>
			<Label>
				Target Audience
				<Textarea name="target_audience" />
			</Label>
			<Label>
				Themes and Topics
				<Textarea name="themes_and_topics" />
			</Label>
			<Label>
				Target Hashtags
				<Input type="text" name="target_hashtags" />
			</Label>
			<Label>
				Campaign Hashtags
				<Input type="text" name="campaign_hashtags" placeholder="" />
			</Label>
			<Label>
				Campaign Promotion Accounts
				<Input type="text" name="campaign_promotion_accounts" />
			</Label>
			<Button type="submit">Create Campaign</Button>
		</form>
	</div>

	<div>
		<h3 class="mb-2 text-xl font-bold">Existing Campaigns</h3>
		{#each campaigns as campaign}
			<Card class="mb-2">
				{#if editingCampaign && editingCampaign.id === campaign.id}
					<form action="?/updateCampaign" method="POST" use:enhance class="space-y-2">
						<input type="hidden" name="id" value={editingCampaign.id} />
						<Input
							type="text"
							placeholder="Name"
							name="name"
							value={editingCampaign.name}
							on:input={(e) => updateEditingCampaign('name', e.currentTarget.value)}
							required
						/>
						<Textarea
							name="description"
							placeholder="Description"
							value={editingCampaign.description}
							on:input={(e) => updateEditingCampaign('description', e.currentTarget.value)}
						/>
						<Input
							type="date"
							placeholder="Start Date"
							name="start_date"
							value={editingCampaign.start_date}
							on:input={(e) => updateEditingCampaign('start_date', e.currentTarget.value)}
							required
						/>
						<Input
							type="date"
							placeholder="End Date"
							name="end_date"
							value={editingCampaign.end_date}
							on:input={(e) => updateEditingCampaign('end_date', e.currentTarget.value)}
							required
						/>
						<Input
							type="color"
							placeholder="Color"
							name="color"
							value={editingCampaign.color}
							on:input={(e) => updateEditingCampaign('color', e.currentTarget.value)}
							required
						/>
						<Textarea
							name="target_audience"
							placeholder="Target Audience"
							value={editingCampaign.target_audience}
							on:input={(e) => updateEditingCampaign('target_audience', e.currentTarget.value)}
						/>
						<Textarea
							name="themes_and_topics"
							placeholder="Themes and Topics"
							value={editingCampaign.themes_and_topics}
							on:input={(e) => updateEditingCampaign('themes_and_topics', e.currentTarget.value)}
						/>
						<Input
							type="text"
							placeholder="Target Hashtags"
							name="target_hashtags"
							value={editingCampaign.target_hashtags}
							on:input={(e) => updateEditingCampaign('target_hashtags', e.currentTarget.value)}
						/>
						<Input
							type="text"
							placeholder="Campaign Hashtags"
							name="campaign_hashtags"
							value={editingCampaign.campaign_hashtags}
							on:input={(e) => updateEditingCampaign('campaign_hashtags', e.currentTarget.value)}
						/>
						<Input
							type="text"
							placeholder="Campaign Promotion Accounts"
							name="campaign_promotion_accounts"
							value={editingCampaign.campaign_promotion_accounts}
							on:input={(e) =>
								updateEditingCampaign('campaign_promotion_accounts', e.currentTarget.value)}
						/>
						<Button type="submit">Save</Button>
						<Button on:click={cancelEditing}>Cancel</Button>
					</form>
				{:else}
					<h4 class="font-bold">{campaign.name}</h4>
					<p>{campaign.description}</p>
					<p>
						From {new Date(campaign.start_date).toLocaleDateString()} to {new Date(
							campaign.end_date
						).toLocaleDateString()}
					</p>
					<div class="h-6 w-6 rounded" style="background-color: {campaign.color}"></div>
					<p><strong>Target Audience:</strong> {campaign.target_audience}</p>
					<p><strong>Themes and Topics:</strong> {campaign.themes_and_topics}</p>
					<p><strong>Target Hashtags:</strong> {campaign.target_hashtags}</p>
					<p><strong>Campaign Hashtags:</strong> {campaign.campaign_hashtags}</p>
					<p><strong>Promotion Accounts:</strong> {campaign.campaign_promotion_accounts}</p>
					<Button on:click={() => startEditing(campaign)}>Edit</Button>
				{/if}
			</Card>
		{/each}
	</div>
</div>
