import { error, json } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import type { Actions, RequestHandler } from '@sveltejs/kit';
// import { supabase } from '$lib/supabase';
// import { joinEmail2 } from '../../emails';
import { getLocations, ingestAndCreateLocations, ingestBlogs } from './googleSpreadsheet';

// import { google } from 'googleapis';

export const load: PageServerLoad = async (event) => {
	const locations = await getLocations();
	return {
		locations: locations
	};
};

export const actions: Actions = {
	createOrUpdateLocations: async ({ request, locals: { supabase, getUser } }) => {
		try {
			// const body = Object.fromEntries(await request.formData());

			await ingestAndCreateLocations();

			return { success: true };
		} catch (e) {
			throw error(404, {
				message: `Failed to ingest, ${JSON.stringify(e)}`
			});
		}
	},
	ingestBlogs: async ({ request, locals: { supabase, getUser } }) => {
		try {
			// const body = Object.fromEntries(await request.formData());

			await ingestBlogs();

			return { success: true };
		} catch (e) {
			throw error(404, {
				message: `Failed to ingest blogs, ${JSON.stringify(e)}`
			});
		}
	},
	ingestGeographies: async ({ request, locals }) => {
		try {
			// const body = Object.fromEntries(await request.formData());

			const { data: locationCoords, error: locationCoordsError } = await locals.supabase
				.from('locations')
				.select('*');

			if (locationCoordsError) {
				console.error(locationCoordsError);
			}

			const mapData = locationCoords?.map((location) => {
				return {
					name: location.name,
					location_id: location.id,
					location: `POINT(${location.lng} ${location.lat})`
				};
			});

			const { error: insertError } = await locals.supabase.from('location_coordinates').insert(mapData);

			if (insertError) {
				console.error(insertError);
			}

			return { success: true };
		} catch (e) {
			throw error(404, {
				message: `Failed to ingest blogs, ${JSON.stringify(e)}`
			});
		}
	}
};

const makeBody = ({
	toEmails,
	fromEmail,
	subject,
	message
}: {
	toEmails: string[];
	fromEmail: string;
	subject: string;
	message: string;
}) => {
	const str = [
		'Content-Type: text/html; charset="UTF-8"\n',
		'MIME-Version: 1.0\n',
		'Content-Transfer-Encoding: 7bit\n',
		`to: ${toEmails.join(',')}\n`,
		`from: ${fromEmail}\n`,
		`subject: ${subject}\n\n`,
		message
	].join('');

	return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
};
