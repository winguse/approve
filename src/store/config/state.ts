
export interface Config {
  repo: string;
  owner: string;
  token: string;
}

const state: Config = {
  repo: 'winguse.github.io',
  owner: 'winguse',
  token: 'original',
};

export default state;
