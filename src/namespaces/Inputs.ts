export type Args = {
  branch: string;
  // output?: string;
  onlyNotify?: string;

  notifications?: {
    token: string;
    label?: string;
    issue: boolean;
    check: boolean;
  };
};
