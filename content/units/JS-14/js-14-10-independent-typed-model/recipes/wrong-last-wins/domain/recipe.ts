export type Course = "main" | "dessert";

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Recipe {
  readonly id: string;
  title: string;
  servings: number;
  tags: string[];
  rating: Rating | null;
  course: Course;
}
