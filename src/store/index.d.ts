import { Config } from './config/index.d';
import { PR } from './pullRequests/index.d';

interface StoreRoot {
  config: Config;
  pullRequests: PR;
}
