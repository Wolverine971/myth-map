import { PRIVATE_GOOGLE_KEY } from '$env/static/private';
import {
	PUBLIC_GOOGLE_CLIENT_ID,
	PUBLIC_GOOGLE_KEY_ID,
	PUBLIC_GOOGLE_PUBLIC_ID
} from '$env/static/public';
import { Impersonated } from 'google-auth-library';
import { google } from 'googleapis';
import {
	BaseExternalAccountClient,
	Compute,
	GoogleAuth,
	JWT,
	UserRefreshClient
} from 'googleapis-common';

import { getAndUpdateLatLng } from '../../utils/locations';

const locationsSpreadsheetId = '1qwosSmGUG9f8pwIyl8AfUWrJAy5eGahbfl51V6JRMjs';
export const getToken = async (): Promise<
	UserRefreshClient | Compute | JWT | Impersonated | BaseExternalAccountClient | null
> => {
	try {
		const { privateKey } = JSON.parse(PRIVATE_GOOGLE_KEY);
		const creds = {
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

		const auth: GoogleAuth = new google.auth.GoogleAuth({
			// keyFile: creds,
			credentials: creds,
			scopes: 'https://www.googleapis.com/auth/spreadsheets'
		});

		const client = await auth.getClient();
		return client;
	} catch (error) {
		return null;
	}
};

const addRows = async (rows, sheets) => {
	if (rows) {
		const rowsAdded = await sheets.spreadsheets.values.append({
			range: 'Sheet1!A:H',
			resource: {
				values: [rows]
			},
			spreadsheetId: locationsSpreadsheetId, //'1atjE0Yk951bxr3f8nlYG3Q73WTrX9WS8NSiJz66JGd8',
			valueInputOption: 'USER_ENTERED'
		});
		if (!rowsAdded) {
			return console.log('failed to add rows');
		} else {
			return console.log('successfully added rows');
		}
	} else {
		return console.log('no rows added');
	}
};

// https://developers.google.com/sheets/api/guides/values
const updateRows = async (rows, sheets) => {
	if (rows.length) {
		const updatedRows = await sheets.spreadsheets.values.batchUpdate({
			resource: {
				data: rows
			},
			spreadsheetId: locationsSpreadsheetId,
			valueInputOption: 'USER_ENTERED'
		});
		if (!updatedRows) {
			return console.log('failed to update status');
		} else {
			return console.log('successfully updated status');
		}
	} else {
		return console.log('no rows updated');
	}
};

export const updateSpreadsheet = async (vals) => {
	if (vals && vals.length) {
		const client = await getToken();
		const sheets = google.sheets({ auth: client, version: 'v4' });
		const resp = await addRows(vals, sheets);
		console.log('finished adding rows');
	}
};

export const updateSpreadsheetWToken = async (vals, token) => {
	if (vals) {
		const client = token;
		const sheets = google.sheets({ auth: client, version: 'v4' });
		const resp = await addRows(vals, sheets);
		console.log('finished adding rows');
	}
};

export const getRowMap = async (token) => {
	const client = token;
	const sheets = google.sheets({ auth: client, version: 'v4' });
	const urlRows = await sheets.spreadsheets.values.get({
		range: 'Sheet1!H:H',
		spreadsheetId: locationsSpreadsheetId
	});
	const map = {};
	urlRows.data.values.forEach((r) => {
		map[r[0]] = 1;
	});
	return map;
};

export const getLocations = async () => {
	const client = await getToken();
	const sheets = google.sheets({ auth: client, version: 'v4' });
	const rows = await sheets.spreadsheets.values.get({
		range: 'Sheet1!A:H',
		spreadsheetId: locationsSpreadsheetId
	});
	if (rows.data) {
		return rows.data.values;
	}
	throw new Error('failed to get spreadsheet data');
};

export const getCity = async () => {
	const client = await getToken();
	const sheets = google.sheets({ auth: client, version: 'v4' });
	const urlRows = await sheets.spreadsheets.values.get({
		range: 'Sheet1!A:H',
		spreadsheetId: locationsSpreadsheetId
	});
	const cities = [];
	urlRows.data.values.forEach((r) => {
		let valToExtract = '';
		if (r[0].includes('&')) {
			const parts = r[0].toLowerCase().replace('&', 'and').split('and');
			parts.forEach((p) => {
				p.trim();
			});
			valToExtract = parts
				.join('and')
				.replace(/[^A-Za-z0-9\s!?]/g, '')
				.split(' ')
				.join('-');
		} else {
			valToExtract = r[0]
				.toLowerCase()
				.replace(/[^A-Za-z0-9\s!?]/g, '')
				.split(' ')
				.join('-');
		}

		const city1 = r[7] ? r[7].replace('?page_src=related_bizes', '').split('/') : '';
		const city2 =
			city1.length >= 2
				? city1[2]
						.replace(`${valToExtract}-`, '')
						.replace('-', ' ')
						.replace(/[0-9]/g, '')
						.replace('-', '')
						.trim()
				: '';
		cities.push(city2);
	});
};

export const ingestAndCreateLocations = async () => {
	const client = await getToken();
	const sheets = google.sheets({ auth: client, version: 'v4' });
	const rows = await sheets.spreadsheets.values.get({
		range: 'Sheet1!A:H',
		spreadsheetId: locationsSpreadsheetId
	});

	for await (const row of rows?.data?.values) {
		const fullAddress = row[7]; // 497 Ritchie Hwy, Severna Park, MD 21146
		if (!fullAddress) {
			continue;
		}
		const fullAddressParts = fullAddress.split(',');
		if (fullAddressParts.length !== 3) {
			console.log('skipping row', row);
			continue;
		}

		const address_line_1 = fullAddressParts[0].trim();
		const city = fullAddressParts[1].trim();
		const stateZip = fullAddressParts[2].trim();
		const state = stateZip.split(' ')[0];
		const zip = stateZip.split(' ')[1];
		const link = row[5];
		const name = row[0];
		const tags = [
			...row[2].split(',').map((r) => r.trim()),
			...row[3].split(',').map((r) => r.trim()),
			row[1]
		];

		const { data: existingLocationData, error: existingLocationDataError } = await supabase
			.from('locations')
			.select('*')
			.eq('address_line_1', address_line_1)
			.eq('city', city)
			.eq('state', state)
			.eq('zip_code', zip);

		if (existingLocationDataError) {
			console.error(existingLocationDataError);
		}
		if (existingLocationData?.[0]) {
			if (!existingLocationData[0].lat) {
				await getAndUpdateLatLng(existingLocationData[0].id, address_line_1, city, state, zip);
			}
			await tagLocation(existingLocationData?.[0].id, tags);
			console.log('existing location data', existingLocationData);
		} else {
			const { data: locationData, error: locationDataError } = await supabase
				.from('locations')
				.insert({
					address_line_1,
					city,
					state,
					zip_code: zip,
					name,
					website: link
				})
				.select();
			if (locationDataError) {
				console.error(locationDataError);
			}
			if (locationData?.[0]) {
				await getAndUpdateLatLng(locationData?.[0].id, address_line_1, city, state, zip);
				await tagLocation(locationData?.[0].id, tags);
			}
		}
	}
};

export const ingestBlogs = async () => {
	const client = await getToken();
	const sheets = google.sheets({ auth: client, version: 'v4' });
	const rows = await sheets.spreadsheets.values.get({
		range: 'Sheet1!A:H',
		spreadsheetId: locationsSpreadsheetId
	});

	for await (const row of rows?.data?.values) {
		const fullAddress = row[7]; // 497 Ritchie Hwy, Severna Park, MD 21146
		if (!fullAddress) {
			continue;
		}
		const fullAddressParts = fullAddress.split(',');
		if (fullAddressParts.length !== 3) {
			console.log('skipping row', row);
			continue;
		}

		const address_line_1 = fullAddressParts[0].trim();
		const city = fullAddressParts[1].trim();
		const stateZip = fullAddressParts[2].trim();
		const state = stateZip.split(' ')[0];
		const zip = stateZip.split(' ')[1];
		const link = row[5];
		const name = row[0];
		const tags = [
			...row[2].split(',').map((r) => r.trim()),
			...row[3].split(',').map((r) => r.trim()),
			row[1]
		];

		const { data: existingLocationData, error: existingLocationDataError } = await supabase
			.from('content_locations')
			.select('*')
			.eq('title', name);

		if (existingLocationDataError) {
			console.error(existingLocationDataError);
		}
		if (existingLocationData?.[0]) {
			// if (!existingLocationData[0].lat) {
			//   await getAndUpdateLatLng(existingLocationData[0].id, address_line_1, city, state, zip)
			// }
			// await tagLocation(existingLocationData?.[0].id, tags)
			// console.log('existing location data', existingLocationData)
			continue;
		} else {
			const { data: locationData, error: locationDataError } = await supabase
				.from('content_locations')
				.insert({
					title: name,
					published: false,
					loc: name.split(' ').join('-')
				})
				.select();
			if (locationDataError) {
				console.error(locationDataError);
			}
			// if (locationData?.[0]) {
			//   await getAndUpdateLatLng(locationData?.[0].id, address_line_1, city, state, zip)
			//   await tagLocation(locationData?.[0].id, tags)
			// }
		}
	}
};

const tagLocation = async (locationId: string, tags: string[]) => {
	for await (const tag of tags) {
		const { data: tagData, error: tagDataError } = await supabase
			.from('tags')
			.select('*')
			.eq('name', tag);
		if (tagDataError) {
			console.error(tagDataError);
		}
		if (tagData?.[0]) {
			const { data: existinglocationTagData, error: existinglocationTagDataError } = await supabase
				.from('location_tags')
				.select('*')
				.eq('location_id', locationId)
				.eq('tag_id', tagData?.[0].id);
			if (existinglocationTagDataError) {
				console.error(existinglocationTagDataError);
			}
			if (!existinglocationTagData?.[0]) {
				const { data: locationTagData, error: locationTagDataError } = await supabase
					.from('location_tags')
					.insert({
						location_id: locationId,
						tag_id: tagData?.[0].id
					})
					.select();
				if (locationTagDataError) {
					console.error(locationTagDataError);
				}
			}
		} else {
			const { data: newTagData, error: newTagDataError } = await supabase
				.from('tags')
				.insert({
					name: tag
				})
				.select();
			if (newTagDataError) {
				console.error(newTagDataError);
			}
			if (newTagData?.[0]) {
				const { data: locationTagData, error: locationTagDataError } = await supabase
					.from('location_tags')
					.insert({
						location_id: locationId,
						tag_id: newTagData?.[0].id
					})
					.select();
				if (locationTagDataError) {
					console.error(locationTagDataError);
				}
			}
		}
	}
};
