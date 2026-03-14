import { createClient } from '@hosteddb/hosteddb-js';

// External Hosted DB project credentials
const HOSTED_DB_URL = 'https://yfxmbzgkuejiazkudtsf.hosteddb.co';
const HOSTED_DB_PUBLISHABLE_KEY = 'sb_publishable_maki1WCPN7qp2sm5w1g7pA_HHY5TY31';

export const hosteddb = createClient(HOSTED_DB_URL, HOSTED_DB_PUBLISHABLE_KEY);

export { HOSTED_DB_URL, HOSTED_DB_PUBLISHABLE_KEY };
