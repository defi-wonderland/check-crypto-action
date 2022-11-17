import { InputOptions } from '@actions/core';

export type Args = {
  branch: string;
  onlyNotify?: boolean;
  reportPublicKeys?: boolean;

  notifications?: {
    token: string;
    label?: string;
    issue: boolean;
    check: boolean;
  };
};

export type GetInput = (name: string, options?: InputOptions | undefined) => string;
