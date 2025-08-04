import { Type } from '@google/genai';
import { DateTime } from 'luxon';

// Define the function declarations for the model
export const sendEmail = {
	name: 'wpai-chatbot_sendEmail',
	description:
		'send migration kit on email to the user. Whenever user talks about migration service, ask them to send the kit.',
	parameters: {
		type: Type.OBJECT,
		properties: {
			email: {
				type: Type.STRING,
				description:
					'Business Email address. Note: Ask user for a business email address.',
			},
			firstName: {
				type: Type.STRING,
				description: 'first name of the person',
			},
			lastName: {
				type: Type.STRING,
				description: 'last name of the person',
			},
		},
		required: ['email', 'firstName'],
	},
};

export const submitContactForm = {
	name: 'wpai-chatbot_submitContactForm',
	description: `Submit a business inquiry (contact) form on behalf of the user. Whenever user talks about a problem that we can solve or services that we offer, ask them the required details and submit the form.
    Note: Ask one parameter at a time and ask fullname and email after the user has provided other details.
    Note: Only fill form for business related queries. Do not fill for career related queries.
    Note: If user is not sure about the budget, select "Undecided/Not Applicable" option without asking user.
    Note: When asking for project budget, ask it at the end, after you have asked for all other details.`,
	parameters: {
		type: Type.OBJECT,
		properties: {
			fullName: {
				type: Type.STRING,
				description: 'Full name of the person',
			},
			emailAddress: {
				type: Type.STRING,
				description: 'Email address of the person',
			},
			organisationWebsite: {
				type: Type.STRING,
				description:
					'The website of the organisation/user. Optional, but explicitly ask user if they can provide the website url.',
			},
			projectBudget: {
				type: Type.STRING,
				description:
					'The expected budget for the project. Show user all the available values.',
				enum: [
					'USD 20,000 - 50,000',
					'USD 50,000 - 100,000',
					'USD 100,000 - 250,000',
					'Above USD 250,000',
					'Undecided/Not Applicable',
				],
			},
			details: {
				type: Type.STRING,
				description:
					'Any additonal details or comments from the user. Do not force the user to provide this information, but if they do, then add it here.',
			},
		},
		required: ['fullName', 'emailAddress', 'projectBudget', 'details'],
	},
};

// export const getMeetingSlots = {
//   name: 'get_meeting_time_slots',
//   description: `Fetch the time slots for a date that user can choose between to book a meeting call. The response of this function will be JSON containing array of slots (start_time and end_time) and available_days.
//   Note: Each time slot should be enclosed within <li> tag and presented to user in am/pm format.
//   Example response:
//   {
//     "slots": [
//       {
//         "start_time": "2025-05-10 09:30:00+00:00",
//         "end_time": "2025-05-10 10:00:00+00:00"
//       },
//       {
//         "start_time": "2025-05-10 10:00:00+00:00",
//         "end_time": "2025-05-10 10:30:00+00:00"
//       }
//     ],
//     "available_day": [ "Tuesday", "Friday" ]
//   }
//   `,
//   parameters: {
//     type: Type.OBJECT,
//     /* Model is asking for specific timezone */
//     properties: {
//       date: {
//         type: Type.STRING,
//         description:
//           'Date in (YYYY-MM-DD) format to get slots. User can provide date in human readable form like tommorrow, next friday etc. Model needs to convert it into YYYY-MM-DD format.',
//         pattern: '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
//       },
//     },
//   },
// };

export const getMeetingSlots = {
	name: 'get_meeting_time_slots',
	description: `Fetch available meeting time slots. By default, shows slots for the next 5-7 business days starting from 2 days ahead.
  If a user expresses a date preference (e.g., "next Friday", "tomorrow", "May 25th"), use that as the start date.

  Business Rules:
  - Only show business days (Mon-Fri)
  - Only suggest slots for business related queries
  - Do not entertain career related queries
  - Always ask user if they have a preferred date or if they want to see the next available slots.

  Response Format (Markdown):
  [
  **Wed, 21 May**
  * 02:30 PM (GMT+5:30)
  * 03:30 PM (GMT+5:30)

  **Fri, 23 May**
  * 01:00 AM (GMT+5:30)
  * 2:00 AM (GMT+5:30)
  ]
  `,
	parameters: {
		type: Type.OBJECT,
		/* Model is asking for specific timezone */
		properties: {
			start_date: {
				type: Type.STRING,
				description:
					'Optional. The start date from which to fetch slots in YYYY-MM-DD format. Only pass this if user explicitly mentions a preferred date. The model should convert human-readable dates (e.g., "tomorrow", "next Friday", "May 25th") into YYYY-MM-DD format.',
				pattern: '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
			},
		},
	},
};

export const bookMeetingSlot = {
	name: 'book_meeting_slot',
	description: `Book a meeting from available time slots. Always show available slots from "get_meeting_time_slots" to user before booking the meeting. Do not ask for formatted date from user, extract these parameters from user's selected time slot.
  Note: Only book slot for business related queries. Do not entertain any career related queries.
  Note: Never ask user to confirm the year. You should be able to fetch year based on today's date.`,
	parameters: {
		type: Type.OBJECT,
		/* Model is asking for specific timezone */
		properties: {
			date: {
				type: Type.STRING,
				description: 'Date in (YYYY-MM-DD)',
				pattern: '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
			},
			time: {
				type: Type.STRING,
				description: 'Time of the slot in HH:mm format',
				// eslint-disable-next-line no-useless-escape
				pattern: '^([01]\d|2[0-3]):[0-5]\d$',
			},
			email: {
				type: Type.STRING,
				description: 'email address of the user to send an invite.',
			},
			name: {
				type: Type.STRING,
				description: 'Name of the user.',
			},
		},
		required: ['date', 'time', 'email', 'name'],
	},
};

export const execute = async (
	toolName: string,
	args: any,
	extraArgs?: any,
): Promise<boolean | any> => {
	try {
		switch (toolName) {
			case sendEmail.name:
				return await executeSendEmail(
					args.email,
					args.firstName,
					args.lastName,
				);
			case submitContactForm.name:
				return await executeSubmitContactForm(
					args.fullName,
					args.emailAddress,
					args.organisationWebsite,
					args.projectBudget,
					args.details,
					extraArgs.dashboardUrl,
					extraArgs.conversationHistory,
				);
			case getMeetingSlots.name:
				return await executeGetMeetingSlots(
					args.start_date,
					extraArgs.user_timezone,
				);

			case bookMeetingSlot.name:
				return await executeBookMeetingSlot(
					args.date,
					args.time,
					args.email,
					args.name,
					extraArgs.user_timezone,
				);
			default:
				throw new Error(`Tool ${toolName} not found`);
		}
	} catch (error) {
		console.error('Error executing tool:', error);
		return false;
	}
};

export default { sendEmail, execute };

// Executors
async function executeSendEmail(
	email: string,
	firstName: string,
	lastName?: string,
): Promise<boolean | any> {
	const formId = 214;
	const url = `${process.env.FORM_ORIGIN}/wp-json/gf/v2/forms/${formId}/submissions`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			input_1: firstName,
			input_3: lastName,
			input_4: email,
		}),
	});

	if (!response.ok) {
		console.error('Error submitting the form:', response.statusText);

		const data = await response.json();

		if (!data.is_valid && data.validation_messages) {
			const validationMessages = [];
			Object.values(data.validation_messages).forEach((message) =>
				validationMessages.push(message),
			);
			return `Validation Failed: ${JSON.stringify(validationMessages)}`;
		}
		return false;
	}

	return true;
}

async function executeSubmitContactForm(
	fullName: string,
	emailAddress: string,
	organisationWebsite: string,
	projectBudget: string,
	details: string,
	dashboardUrl: string,
	conversationHistory: string,
): Promise<boolean> {
	const formId = 116;
	const url = `${process.env.FORM_ORIGIN}/wp-json/gf/v2/forms/${formId}/submissions`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			input_36: fullName,
			input_2: emailAddress,
			input_22: organisationWebsite,
			input_16: projectBudget,
			input_4: `${details}\n\n\nConversation History: \n${dashboardUrl}\n\n${conversationHistory}`,
		}),
	});

	if (!response.ok) {
		console.error('Error submitting the form:', response.statusText);
		return false;
	}

	return true;
}

async function executeGetMeetingSlots(
	start_date: string,
	user_timezone: string,
): Promise<boolean | any> {
	let startDateTime: DateTime;

	if (start_date && user_timezone) {
		startDateTime = DateTime.fromFormat(start_date, 'yyyy-MM-dd', {
			zone: user_timezone,
		});
	} else {
		startDateTime = DateTime.now().setZone(user_timezone).plus({ days: 2 });
	}

	// Ensure the start date falls within a month from now
	const oneMonthFromNow = DateTime.now()
		.setZone(user_timezone)
		.plus({ months: 1 });
	if (startDateTime > oneMonthFromNow) {
		return {
			error: 'Booking date cannot be more than one month from now.',
		};
	}

	const endDateTime = startDateTime.plus({ days: 7 });
	const frappe_slots = [];

	for (
		let dateTime = startDateTime;
		dateTime < endDateTime;
		dateTime = dateTime.plus({ days: 1 })
	) {
		if (['Saturday', 'Sunday'].includes(dateTime.weekdayLong)) {
			continue;
		}

		const response = await getSlotsForDate(
			dateTime.toFormat('yyyy-MM-dd'),
			getOffset(user_timezone),
		);
		const slots = response.slots;

		slots.forEach((slot) => {
			frappe_slots.push(slot);
		});
	}

	const slotsInLocalTimeZone: Array<DateTime> = frappe_slots.map(
		(frappeSlot) => {
			const utcDateTime: DateTime = frappeToUTC(frappeSlot.start_time);
			// DateTime in local user's timezone
			return utcDateTime.setZone(user_timezone);
		},
	);

	const dateSlotMap: Map<string, Array<DateTime>> = new Map();

	slotsInLocalTimeZone.forEach((timeSlot) => {
		const date = timeSlot.toFormat('yyyy-MM-dd');
		const slots = dateSlotMap.get(date);

		if (slots) {
			slots.push(timeSlot);
		} else {
			dateSlotMap.set(date, [timeSlot]);
		}
	});

	const formattedSlots: Array<{
		weekday: string;
		date: string;
		slots: Array<any>;
	}> = [];

	for (const [, slots] of dateSlotMap) {
		if (slots.length < 1) {
			continue;
		}
		// slots is Array<DateTime>
		const weekday = slots[0].toFormat('ccc');
		const date = slots[0].toFormat('dd LLL');
		const todaySlots = slots.map(
			(slot) => `${slot.toFormat('hh:mm a')} (${slot.offsetNameShort})`,
		);

		const formattedSlot = {
			weekday: weekday,
			date: date,
			slots: [...todaySlots],
		};
		formattedSlots.push(formattedSlot);
	}

	return JSON.stringify(formattedSlots);
}

async function executeBookMeetingSlot(
	date: string,
	time: string,
	email: string,
	name: string,
	user_timezone: string,
): Promise<boolean | any> {
	const durationId = await getDurationId();

	if (!durationId) {
		return false;
	}

	const localStartTime = DateTime.fromFormat(
		`${date} ${time}`,
		'yyyy-MM-dd HH:mm',
		{
			zone: user_timezone,
		},
	);

	// These times are in UTC
	const startTime = localStartTime.setZone('utc');
	const endTime = startTime.plus({ minutes: 30 });

	const url =
		'https://erp.rtcamp.com/api/method/frappe_appointment.api.personal_meet.book_time_slot';

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			date,
			duration_id: durationId,
			user_timezone_offset: getOffset(user_timezone).toString(),
			start_time: toFrappeFormat(startTime),
			end_time: toFrappeFormat(endTime),
			user_name: name,
			user_email: email,
		}),
	});

	if (!response.ok) {
		console.error('Error booking slot:', response.statusText);
		return false;
	}

	return true;
}

async function getDurationId(): Promise<string> {
	const url = `https://erp.rtcamp.com/api/method/frappe_appointment.api.personal_meet.get_meeting_windows?slug=${process.env.FRAPPE_APPOINTMENT_SLUG}`;
	let durationId = '';

	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(response.statusText);
		}
		const data = await response.json();
		const durations = data?.message?.durations;

		durations.forEach((duration) => {
			if (duration.label === process.env.FRAPPE_DURATION_SLUG) {
				durationId = duration.id;
			}
		});
	} catch (error) {
		console.error(`Error fetching duration_id: ${error}`);
	}
	return durationId;
}

async function getSlotsForDate(date: string, user_timezone_offset = 0) {
	const emptyResponse = { slots: [], available_days: [] };
	const durationId = await getDurationId();

	if (!durationId) return emptyResponse;

	const url = new URL(
		'https://erp.rtcamp.com/api/method/frappe_appointment.api.personal_meet.get_time_slots',
	);

	url.searchParams.append('duration_id', durationId);
	url.searchParams.append('date', date);
	url.searchParams.append(
		'user_timezone_offset',
		user_timezone_offset.toString(),
	);

	const response = await fetch(url);

	if (!response.ok) {
		return emptyResponse;
	}

	const data = await response.json();
	const available_slots = data?.message?.all_available_slots_for_data || [];
	const available_days = data?.message?.available_days || [];

	return {
		slots: available_slots,
		available_days,
	};
}

function frappeToUTC(timeString: string): DateTime {
	return DateTime.fromFormat(timeString, FRAPPE_TIME_FORMAT).toUTC();
}

function toFrappeFormat(dateTime: DateTime): string {
	return dateTime.toFormat(FRAPPE_TIME_FORMAT);
}

function getOffset(timeZone: string): number {
	return DateTime.now().setZone(timeZone).offset;
}

const FRAPPE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ssZZ';
