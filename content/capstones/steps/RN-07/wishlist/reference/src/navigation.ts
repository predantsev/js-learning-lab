// The screens of the stack and the params each one receives. A screen gets only the id of a record
// and reads the record itself, so a link, a back step or a restart never carries stale data.
export type RootStackParamList = {
  List: undefined;
  Detail: { id: string };
  Edit: { id: string };
  NotFound: undefined;
  Service: undefined;
};
