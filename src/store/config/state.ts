
export interface Config {
  repo: string;
  owner: string;
  token: string;
}

const state: Config = {
  repo: '',
  owner: '',
  token: '',
};

export default state;
