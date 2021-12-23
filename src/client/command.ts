export enum CommandKey {
  changeHistory = 'changeHistory',
  getState = 'getState',
  navigateAnchor = 'navigateAnchor',
  newPage = 'newPage',
  setState = 'setState',
}

export type Command = {
  commandType: CommandKey;
  payload?: any;
};
