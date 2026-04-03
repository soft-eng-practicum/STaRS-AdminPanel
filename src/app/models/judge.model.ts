export interface SurveyList {
  answers: string[];
  groupName: string;
  groupId: string | number;
  advisor: string;
  students: string;
}

export interface JudgeDoc {
  _id: string;
  username?: string;
  password?: string;
  surveys?: SurveyList[];
}

export interface JudgeSummary {
  id: string;
  name: string;
  surveyLength: number;
  groupsSurveyed: { id: string; name: string }[];
  surveys?: SurveyList[];
}

export interface SurveyResult {
  judgeName: string;
  answers: string[];
  total: number;
}
