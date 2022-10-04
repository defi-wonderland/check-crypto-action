export type Args = {
  branch: string;
  onlyNotify?: string;

  notifications?: {
    token: string;
    label?: string;
    issue: boolean;
    check: boolean;
  };
};
