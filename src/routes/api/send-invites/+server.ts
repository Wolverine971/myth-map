// src/routes/api/send-invites/+server.ts
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '../$types';
import { google } from 'googleapis';
import { PRIVATE_gmail_private_key } from '$env/static/private';



export const POST: RequestHandler = async ({ request }) => {
    const { itineraryId, itineraryName, startDate, endDate, emails, itineraryBody } = await request.json();

    try {
        const attendees = emails.map((email: string) => ({ email }))
        for await (const attendee of attendees) {
            const { email } = attendee;

            sendEmail({
                to: email, subject: `${itineraryName} invite @ ${startDate}`, body: itineraryBody
            })
        }

        // Create the calendar event


        return json({ success: true });
    } catch (e) {
        console.error('Error sending invite:', e);
        return json(
            { success: false, error: e.message || 'Failed to send invite' },
            { status: 500 }
        );
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

const sendEmail = async ({ to, subject, body }: { to: string; subject: string; body: string }) => {
    try {
        const { privateKey } = JSON.parse(PRIVATE_gmail_private_key);
        const authClient = new google.auth.JWT(
            'id-takes-gmail-service-account@smart-mark-302504.iam.gserviceaccount.com',
            null,
            privateKey,
            ['https://www.googleapis.com/auth/gmail.send'],
            'usersup@9takes.com'
        );
        const gmail = google.gmail({
            auth: authClient,
            version: 'v1'
        });

        return await gmail.users.messages.send({
            requestBody: {
                raw: makeBody({ toEmails: [to], fromEmail: 'usersup@9takes.com', subject, message: body })
            },
            userId: 'me'
        });
    } catch (e) {
        throw error(404, {
            message: `Failed send email, ${JSON.stringify(e)}`
        });
    }
};
