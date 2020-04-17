import { Config } from './config/index.d'
import { PR } from './pullRequests/index.d'
import { Info } from './info/index.d'

interface StoreRoot {
  config: Config;
  pullRequests: PR;
  info: Info;
}
