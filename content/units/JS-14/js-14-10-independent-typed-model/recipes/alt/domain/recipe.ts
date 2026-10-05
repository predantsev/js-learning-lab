export type Course = "main" | "dessert";

export type Recipe = {
  readonly id: string;
  title: string;
  servings: number;
  tags: string[];
  rating: 1 | 2 | 3 | 4 | 5 | null;
  course: Course;
};
