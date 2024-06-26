
import { error, json } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Actions, RequestHandler } from '@sveltejs/kit';
// import { supabase } from '$lib/supabase';
// import { joinEmail2 } from '../../emails';
import { getLocations, ingest, updateSpreadsheet } from './googleSpreadsheet';

// import { google } from 'googleapis';

export const load: PageServerLoad = async (event) => {

    const locations = await getLocations();
    // console.log('locations', locations);
    return {
        // session: await getServerSession(event),
        locations: locations
    };
};



export const actions: Actions = {
    ingest: async ({ request, locals: { supabase, getSession } }) => {
        try {
            // const body = Object.fromEntries(await request.formData());


            await ingest();

            return { success: true };
        } catch (e) {
            throw error(404, {
                message: `Failed to submit email, ${JSON.stringify(e)}`
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

