import { json } from '@sveltejs/kit';
import type { RequestHandler } from '../$types';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { PRIVATE_GOOGLE_KEY } from '$env/static/private';
import {
	PUBLIC_GOOGLE_CLIENT_ID,
	PUBLIC_GOOGLE_KEY_ID,
	PUBLIC_GOOGLE_PUBLIC_ID
} from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
	const { itineraryId, itineraryName, startDate, endDate, emails } = await request.json();

	// Load the service account key JSON file.
	// const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}');

	const { privateKey } = JSON.parse(PRIVATE_GOOGLE_KEY);
	const serviceAccount = {
		type: 'service_account',
		project_id: PUBLIC_GOOGLE_PUBLIC_ID,
		private_key_id: PUBLIC_GOOGLE_KEY_ID,
		private_key: privateKey,
		client_email: `tacemus-sheets@${PUBLIC_GOOGLE_PUBLIC_ID}.iam.gserviceaccount.com`,
		client_id: PUBLIC_GOOGLE_CLIENT_ID,
		auth_uri: 'https://accounts.google.com/o/oauth2/auth',
		token_uri: 'https://oauth2.googleapis.com/token',
		auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
		client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/tacemus-sheets%40${PUBLIC_GOOGLE_PUBLIC_ID}.iam.gserviceaccount.com`,
		universe_domain: 'googleapis.com'
	};

	// Create a JWT client with the service account credentials
	const jwtClient = new JWT({
		email: serviceAccount.client_email,
		key: serviceAccount.private_key,
		scopes: ['https://www.googleapis.com/auth/calendar']
	});

	// Create a Calendar client instance
	const calendar = google.calendar({ version: 'v3', auth: jwtClient });

	// Create the calendar event
	const event = {
		summary: itineraryName,
		description: `Itinerary ID: ${itineraryId}`,
		start: {
			date: startDate,
			timeZone: 'UTC'
		},
		end: {
			date: endDate,
			timeZone: 'UTC'
		},
		attendees: emails.map((email: string) => ({ email }))
	};

	try {
		const response = await calendar.events.insert({
			calendarId: 'dj@9takes.com',
			requestBody: event,
			sendUpdates: 'all'
		});

		return json({ success: true, eventId: response.data.id });
	} catch (error) {
		console.error('Error creating calendar event:', error);
		return json(
			{ success: false, error: error.message || 'Failed to create calendar event' },
			{ status: 500 }
		);
	}
};
