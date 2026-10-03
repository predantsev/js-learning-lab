import { createContext } from "react";

// { selectedId, select(id), savePrice(id, price) } — provided by the board.
export const BoardContext = createContext(null);
