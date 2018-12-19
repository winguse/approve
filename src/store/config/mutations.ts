import { Config } from './state';

export function someMutation(state: Config, param: any) {
  state.token = 'after mutation';
}
