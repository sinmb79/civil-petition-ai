export interface Petition {
  id: string;
  raw_text: string;
  processing_type: string;
  budget_related: boolean;
  discretionary: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PetitionCreateInput {
  raw_text: string;
  processing_type: string;
  budget_related?: boolean;
  discretionary?: boolean;
}

export interface PetitionUpdateInput {
  raw_text?: string;
  processing_type?: string;
  budget_related?: boolean;
  discretionary?: boolean;
}

export interface PetitionListOptions {
  limit: number;
  offset: number;
}

export interface PetitionListResult {
  items: Petition[];
  nextOffset: number | null;
}

export interface PetitionRepository {
  create(data: Required<PetitionCreateInput>): Promise<Petition>;
  list(options: PetitionListOptions): Promise<PetitionListResult>;
  findById(id: string): Promise<Petition | null>;
  update(id: string, data: PetitionUpdateInput): Promise<Petition | null>;
  delete(id: string): Promise<boolean>;
}
