import { Config } from './index.d';

export function clear(state: Config, param: any) {
  state.token = '';
  localStorage.clear();
}
