export type URLSubmission = {
  url: string; // must be a valid absolute URL (FastAPI validates as HttpUrl)
};

export type FastApiError = {
  detail: string;
};

export type JobStatus = "QUEUED" | "RUNNING" | "DONE" | "FAILED";

export type JobCreateResponse = {
  job_id: string;
  status: JobStatus; // always QUEUED on creation
  created_at: string; // ISO8601
};

export type AWSService = {
  name: string;
  role: string;
  description: string;
};

export type AWSArchitecture = {
  title: string;
  summary: string;
  assumptions: string[];
  functional_reasoning: string;
  non_functional_reasoning: string;
  key_tradeoffs: string[];
  components: AWSService[];
  data_flow: string;
  benefits: string[];
};

export type DiagramArtifact = {
  png_path: string | null;
  s3_uri: string | null;
  url: string | null;
  diagram_code: string | null;
};

export type ArchLensResult = {
  architecture: AWSArchitecture;
  diagram: DiagramArtifact | null;
};

export type JobGetResponse = {
  job_id: string;
  status: JobStatus;

  input_url: string;

  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;

  error_message: string | null; // only when FAILED

  result: ArchLensResult | null;
  result_s3_uri: string | null;
  result_url: string | null;

  diagram_code_s3_uri: string | null;
};


