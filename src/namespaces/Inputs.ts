export type Args = {
  branch: string;
  onlyNotify?: boolean;

  notifications?: {
    token: string;
    label?: string;
    issue: boolean;
    check: boolean;
  };
};
