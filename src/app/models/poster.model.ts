export interface Poster {
  email: string;
  id: number;
  judges: string[];
  countJudges: number;
  group: string;
  subject: string;
  students: string;
  advisor: string;
  advisorEmail: string;
  score?: number;
}
