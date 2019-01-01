import { Info } from './index.d';

export function set(state: Info, { login, avatarUrl }: { login: string, avatarUrl: string }) {
  state.login = login;
  state.avatarUrl = avatarUrl;
}
