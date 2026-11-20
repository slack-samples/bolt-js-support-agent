import { receiver } from '../../app-vercel.js';

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export const GET = (request) => receiver.handleCallback(request);
