import convict from 'convict';
import { existsSync } from 'fs';

export const TonCenterApiEndpoint = 'https://toncenter.com/api/v2/jsonRPC';

const config = convict({
  apiKey: {
    doc: 'toncenter.com API key',
    format: String,
    default: undefined,
    env: 'TON_CLI_API_KEY',
    arg: 'api-key',
  },
  node: {
    doc: 'TON REST API endpoint (full URL, including protocol, port and path)',
    format: String,
    default: TonCenterApiEndpoint,
    env: 'TON_CLI_NODE',
    arg: 'node',
  },
  debug: {
    doc: 'Show debug logs.',
    format: Boolean,
    env: 'TRON_CLI_DEBUG',
    arg: 'debug',
    default: false,
  },
});

if (existsSync('./config.json')) {
  config.loadFile('./config.json');
}

config.validate({ allowed: 'strict' });

export default config;
