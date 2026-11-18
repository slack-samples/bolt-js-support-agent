import { handler } from '../../app-vercel.js';

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export const POST = (request) => handler(request);
