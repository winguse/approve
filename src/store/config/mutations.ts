import { Config } from './state';

export function clear(state: Config, param: any) {
  state.token = '';
  state.repo = '';
  state.owner = '';
  localStorage.clear();
}
