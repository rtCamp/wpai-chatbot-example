import path from 'path';

import { NextRequest, NextResponse } from 'next/server';
import { Reader } from '@maxmind/geoip2-node';

async function getLocation(ip: string) {
	try {
		const dbPath = path.resolve(
			process.cwd() + '/src/constants/mmdb/GeoLite2-City.mmdb',
		);
		const geoipReader = await Reader.open(dbPath);
		const response = geoipReader.city(ip);
		return response?.country?.isoCode; // Fetch the country for the provided IP.
	} catch (error) {
		console.error('Error opening GeoIP database:', error);
		throw new Error('Failed to open GeoIP database');
	}
}

export async function GET(req: NextRequest) {
	try {
		const ip =
			req.headers.get('X-REAL-IP') ||
			req.headers.get('X-FORWARDED-FOR')?.split(',')[0];
		if (!ip) {
			return NextResponse.json(
				{ error: 'IP address missing' },
				{ status: 400 },
			);
		}

		const location = await getLocation(ip);
		const locationData = { country: location };
		return NextResponse.json(locationData);
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to get country: ' + error },
			{ status: 500 },
		);
	}
}
