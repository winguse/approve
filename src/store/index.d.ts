import { Config } from './config/index.d'
import { PR } from './pullRequest/index.d'
import { Info } from './info/index.d'

interface StoreRoot {
  config: Config;
  pullRequest: PR;
  info: Info;
}
