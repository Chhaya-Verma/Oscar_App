export type RootStackParamList = {
  Landing: undefined;
  Auth: undefined;
  Recording: undefined;
  Processing: { rawText: string };
  Result: { rawText: string; formattedText: string; title?: string };
  Notes: undefined;
  NoteDetail: { noteId: string };
  Settings: undefined;
};