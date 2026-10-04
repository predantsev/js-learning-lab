// Deep links to one wish. Two forms lead to the same screen:
//   courselab://wish/w-03                     (a separate build of the app, with "scheme" in app.json)
//   exp://192.168.1.20:8081/--/wish/w-03      (Expo Go: the address of the dev server, then /--/)
// parseRecordLink never throws: an address without a path is no link at all (null), a link of another
// form or with a broken id leads to the not-found screen. Whether the wish exists is decided by the
// detail screen, which reads the stored list.
export type RecordLink = { screen: "Detail"; params: { id: string } } | { screen: "NotFound" };

const LINK_PATH = /^(?:courselab:\/\/|exps?:\/\/[^/]+\/--\/)(.*)$/;
const WISH_PATH = /^wish\/([^/]+)$/;

export function parseRecordLink(url: string): RecordLink | null {
  const match = LINK_PATH.exec(url.split(/[?#]/)[0]);
  if (match === null || match[1] === "") {
    return null;
  }
  const wish = WISH_PATH.exec(match[1]);
  if (wish === null) {
    return { screen: "NotFound" };
  }
  let id: string;
  try {
    id = decodeURIComponent(wish[1]);
  } catch {
    return { screen: "NotFound" };
  }
  return /^w-\d+$/.test(id) ? { screen: "Detail", params: { id: id } } : { screen: "NotFound" };
}
