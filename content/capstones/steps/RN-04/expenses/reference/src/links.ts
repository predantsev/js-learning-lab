// Deep links to one expense. Two forms lead to the same screen:
//   courselab://expense/e-02                     (a separate build of the app, with "scheme" in app.json)
//   exp://192.168.1.20:8081/--/expense/e-02      (Expo Go: the address of the dev server, then /--/)
// parseRecordLink never throws: an address without a path is no link at all (null), a link of another
// form or with a broken id leads to the not-found screen. Whether the expense exists is decided by the
// detail screen, which reads the stored list.
export type RecordLink = { screen: "Detail"; params: { id: string } } | { screen: "NotFound" };

const LINK_PATH = /^(?:courselab:\/\/|exps?:\/\/[^/]+\/--\/)(.*)$/;
const RECORD_PATH = /^expense\/([^/]+)$/;

export function parseRecordLink(url: string): RecordLink | null {
  const match = LINK_PATH.exec(url.split(/[?#]/)[0]);
  if (match === null || match[1] === "") {
    return null;
  }
  const record = RECORD_PATH.exec(match[1]);
  if (record === null) {
    return { screen: "NotFound" };
  }
  let id: string;
  try {
    id = decodeURIComponent(record[1]);
  } catch {
    return { screen: "NotFound" };
  }
  return /^e-\d+$/.test(id) ? { screen: "Detail", params: { id: id } } : { screen: "NotFound" };
}
