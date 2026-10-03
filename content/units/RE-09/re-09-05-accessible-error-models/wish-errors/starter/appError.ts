// Every failure of the wish form, as one typed model.
export type AppError =
  | { kind: "field"; field: "name" | "price"; message: string } // next to its field
  | { kind: "form"; message: string } // about the whole form, in the summary
  | { kind: "request"; message: string }; // the save failed; announced, the draft stays
