<script lang="ts">
	import { Button, Input, Label, Modal } from 'flowbite-svelte';
	import { createEventDispatcher } from 'svelte';
	import { notifications } from '../shared/notifications';

	export let itineraryId: string;
	export let itineraryName: string;
	export let startDate: string;
	export let endDate: string;
	export let places: any;

	let emails: string[] = [''];
	let isModalOpen = false;
	let isLoading = false;
	let result: { success: boolean; message: string } | null = null;

	const dispatch = createEventDispatcher();

	function addEmailInput() {
		emails = [...emails, ''];
	}

	function removeEmailInput(index: number) {
		emails = emails.filter((_, i) => i !== index);
	}

	async function sendInvites() {
		isLoading = true;
		result = null;

		try {
			const response = await fetch(`/api/send-invites`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					itineraryId,
					itineraryName,
					startDate,
					endDate,
					itineraryBody: createBody(),
					emails: emails.filter((email) => email.trim() !== '')
				})
			});

			const data = await response.json();

			if (response.ok) {
				result = { success: true, message: 'Invites sent successfully!' };
				notifications.info('Invites sent successfully!', 3000);
				closeModal();
			} else {
				result = { success: false, message: data.error || 'Failed to send invites.' };
			}
		} catch (error) {
			console.error('Error sending invites:', error);
			result = { success: false, message: 'An error occurred while sending invites.' };
		} finally {
			isLoading = false;
		}
	}

	function closeModal() {
		isModalOpen = false;
		if (result?.success) {
			dispatch('invitesSent');
		}
	}

	const createBody = () => {
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${itineraryName} Invite</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #434C56;
            max-width: 800px;
            margin: 0 auto;
            padding: 15px;
            background-color: #FCF9F5;
        }
        h1 {
            color: #014421;
            text-align: center;
            font-size: 28px;
            margin: 15px 0;
        }
        a {
            color: #014421;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .cta-button {
            display: inline-block;
            margin: 15px 0;
            padding: 10px 20px;
            background-color: #B3BBC2;
            color: #FCF9F5;
            text-align: center;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
        }
        .date-info {
            background-color: #E6F0EA;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            font-size: 14px;
        }
        .location {
            background-color: #FFFFFF;
            border: 1px solid #C2DAC9;
            border-radius: 5px;
            padding: 12px;
            margin-bottom: 15px;
        }
        .location h2 {
            color: #014421;
            margin: 0 0 10px 0;
            font-size: 18px;
        }
        .location p {
            margin: 5px 0;
            font-size: 14px;
        }
        .date-time {
            background-color: #E3F3FA;
            padding: 8px;
            border-radius: 3px;
            margin-bottom: 8px;
            font-size: 14px;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            .location {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
<div style: max-width:800px>
    <h1>${itineraryName}</h1>

    <div class="date-info">
        <strong>Start:</strong> ${new Date(startDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        ${endDate ? ` | <strong>End:</strong> ${new Date(endDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}` : ''}
    </div>

    <a href="https://www.tinytribeadventures.com/itineraries/${itineraryId}" class="cta-button" target="_blank">
        View Full Itinerary Details 👉
    </a>
    
    ${places
			.map(
				(place) => `
            <div class="location">
                <h2>${place.order_index + 1}. ${place.location.name}</h2>
                <div class="date-time">
                    <strong>Time:</strong> ${place.start_time || 'TBD'} - ${place.end_time || 'TBD'}
                </div>
                <p><strong>Address:</strong> ${place.location.address_line_1}${place.location.address_line_2 ? ', ' + place.location.address_line_2 : ''}, ${place.location.city}, ${place.location.state} ${place.location.zip_code}</p>
                ${place.location.website ? `<p><strong>Website:</strong> <a href="${place.location.website}" target="_blank">${place.location.website}</a></p>` : ''}
            </div>
            `
			)
			.join('')}

    <p style="text-align: center; color: #014421; font-weight: bold; margin-top: 20px;">Hope to see you there!</p>
</div>
    </body>
</html>`;
	};
</script>

<Button on:click={() => (isModalOpen = true)}>Send Invites</Button>

<Modal bind:open={isModalOpen} size="md" autoclose={false} class="w-full">
	<h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Send Invites</h3>
	<form on:submit|preventDefault={sendInvites} class="space-y-4">
		{#each emails as email, index}
			<div class="flex items-center space-x-2">
				<Input type="email" placeholder="Enter email address" bind:value={emails[index]} required />
				{#if index > 0}
					<Button color="red" size="sm" on:click={() => removeEmailInput(index)}>Remove</Button>
				{/if}
			</div>
		{/each}
		<Button type="button" on:click={addEmailInput}>Add Another Email</Button>

		<div class="flex justify-end space-x-2">
			<Button color="alternative" on:click={closeModal}>Cancel</Button>
			<Button type="submit" disabled={isLoading}>
				{#if isLoading}
					Sending...
				{:else}
					Send
				{/if}
			</Button>
		</div>
	</form>

	{#if result}
		<div class="mt-4 text-center">
			<p class={result.success ? 'text-green-600' : 'text-red-600'}>{result.message}</p>
		</div>
	{/if}
</Modal>
