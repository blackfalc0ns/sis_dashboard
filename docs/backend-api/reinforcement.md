# Reinforcement API Contract

Status: `Service-derived`

Base path: `/reinforcement`

## Main Response Models

```ts
type ReinforcementSource = "teacher" | "parent" | "system";
type ReinforcementStatus =
  | "draft"
  | "active"
  | "in_progress"
  | "under_review"
  | "completed"
  | "rejected"
  | "archived";
type ReinforcementProofType = "image" | "video" | "document" | "none";
type ReinforcementRewardType = "moral" | "financial" | "xp" | "badge";

interface ReinforcementStage {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  proofType: ReinforcementProofType;
  isCompleted: boolean;
  isApproved: boolean;
  submittedAt?: string;
  proofUrl?: string;
}

interface ReinforcementTask {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  studentId: string;
  studentName: string;
  classId?: string;
  className?: string;
  source: ReinforcementSource;
  status: ReinforcementStatus;
  rewardType: ReinforcementRewardType;
  rewardValue: string;
  dueDate?: string;
  assignedById?: string;
  assignedByName?: string;
  createdAt: string;
  updatedAt: string;
  stages: ReinforcementStage[];
}

interface ReinforcementTemplate {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  rewardType: ReinforcementRewardType;
  rewardValue: string;
  stages: Array<Omit<ReinforcementStage, "isCompleted" | "isApproved" | "submittedAt" | "proofUrl">>;
  isActive: boolean;
  createdAt: string;
}

interface ReinforcementReward {
  id: string;
  nameAr: string;
  nameEn: string;
  type: ReinforcementRewardType;
  defaultValue: string;
  isActive: boolean;
}

interface ReinforcementReviewItem {
  id: string;
  taskId: string;
  taskTitleAr: string;
  taskTitleEn: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  proofType: ReinforcementProofType;
  source: ReinforcementSource;
  status: "under_review";
  stageCountCompleted: number;
}
```

## Request DTOs

```ts
interface ReinforcementTaskFilters {
  search?: string;
  student?: string;
  className?: string;
  source?: ReinforcementSource | "all";
  status?: ReinforcementStatus | "all";
  rewardType?: ReinforcementRewardType | "all";
  dueDate?: string;
}

type CreateReinforcementTemplatePayload = Omit<ReinforcementTemplate, "id" | "createdAt">;
type CreateReinforcementRewardPayload = Omit<ReinforcementReward, "id">;
```

## Endpoints

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/reinforcement/overview` | none | `ReinforcementOverview` |
| `GET` | `/reinforcement/tasks` | query from `ReinforcementTaskFilters` | `ReinforcementTask[]` |
| `GET` | `/reinforcement/tasks/:id` | none | `ReinforcementTask \| null` |
| `POST` | `/reinforcement/tasks/:id/approve` | optional `{ decisionNote? }` | `ReinforcementTask \| null` |
| `POST` | `/reinforcement/tasks/:id/reject` | optional `{ decisionNote? }` | `ReinforcementTask \| null` |
| `POST` | `/reinforcement/tasks/:id/request-resubmission` | optional `{ decisionNote? }` | `ReinforcementTask \| null` |
| `POST` | `/reinforcement/tasks/:id/duplicate` | empty body | `ReinforcementTask \| null` |
| `POST` | `/reinforcement/tasks/:id/archive` | empty body | `ReinforcementTask \| null` |
| `GET` | `/reinforcement/templates` | none | `ReinforcementTemplate[]` |
| `POST` | `/reinforcement/templates` | `CreateReinforcementTemplatePayload` | `ReinforcementTemplate` |
| `PATCH` | `/reinforcement/templates/:id` | `Partial<CreateReinforcementTemplatePayload>` | `ReinforcementTemplate \| null` |
| `GET` | `/reinforcement/rewards` | none | `ReinforcementReward[]` |
| `POST` | `/reinforcement/rewards` | `CreateReinforcementRewardPayload` | `ReinforcementReward` |
| `PATCH` | `/reinforcement/rewards/:id` | `Partial<CreateReinforcementRewardPayload>` | `ReinforcementReward \| null` |
| `GET` | `/reinforcement/review-queue` | none | `ReinforcementReviewItem[]` |
| `GET` | `/reinforcement/summary-card` | none | `{ activeTasks: number, underReview: number, completionRate: number }` |
| `GET` | `/reinforcement/filter-options` | none | `{ students, classes }` |

## Recommended Future Endpoint

The task model already contains proof-driven stages, so the backend will likely also need:

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/reinforcement/tasks/:taskId/stages/:stageId/submit` | `multipart/form-data` or `{ proofUrl, proofType }` | `ReinforcementTask` |

## Notes

- The current frontend already supports review actions, templates, rewards, and overview data.
- If students or parents will submit proof directly, add ownership and permission checks at the stage-submission level.
