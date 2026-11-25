-- CreateTable
CREATE TABLE "participants" (
    "id" SERIAL NOT NULL,
    "participant_uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "form_id" VARCHAR(10) NOT NULL,
    "block_order" VARCHAR(10) NOT NULL,
    "participant_name" VARCHAR(100),
    "age" INTEGER,
    "gender" VARCHAR(40),
    "native_language" VARCHAR(40),
    "english_proficiency" INTEGER,
    "education_medium" VARCHAR(40),
    "ai_usage" VARCHAR(40),
    "assigned_queue" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    "attention_checks_passed" INTEGER NOT NULL DEFAULT 0,
    "consent_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" SERIAL NOT NULL,
    "participant_uuid" UUID NOT NULL,
    "trial_index" INTEGER NOT NULL,
    "block_number" INTEGER NOT NULL,
    "is_attention_check" BOOLEAN NOT NULL DEFAULT false,
    "item_id" INTEGER NOT NULL,
    "condition" VARCHAR(20) NOT NULL,
    "language" VARCHAR(15) NOT NULL,
    "fidelity" VARCHAR(15) NOT NULL,
    "ft_code" VARCHAR(15) NOT NULL,
    "ai_predicted_answer" TEXT NOT NULL,
    "ground_truth_answer" TEXT NOT NULL,
    "presented_options" JSONB NOT NULL,
    "trust_score" INTEGER NOT NULL,
    "user_selected_answer" TEXT NOT NULL,
    "accepted_ai_answer" BOOLEAN NOT NULL,
    "user_correct" BOOLEAN NOT NULL,
    "spotted_flaw" BOOLEAN NOT NULL,
    "flaw_category" VARCHAR(40),
    "flaw_note" TEXT,
    "response_time_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "participants_participant_uuid_key" ON "participants"("participant_uuid");

-- CreateIndex
CREATE INDEX "idx_responses_participant" ON "responses"("participant_uuid");

-- CreateIndex
CREATE INDEX "idx_responses_item_condition" ON "responses"("item_id", "condition");

-- CreateIndex
CREATE UNIQUE INDEX "responses_participant_uuid_trial_index_key" ON "responses"("participant_uuid", "trial_index");

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_participant_uuid_fkey" FOREIGN KEY ("participant_uuid") REFERENCES "participants"("participant_uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- CHECK constraints (from docs/04_DATABASE.md section 3)

-- participants
ALTER TABLE "participants"
  ADD CONSTRAINT participants_form_id_check
    CHECK (form_id IN ('Form_A', 'Form_B', 'Form_C', 'Form_D')),
  ADD CONSTRAINT participants_block_order_check
    CHECK (block_order IN ('BN_FIRST', 'EN_FIRST')),
  ADD CONSTRAINT participants_english_proficiency_check
    CHECK (english_proficiency IS NULL OR english_proficiency BETWEEN 1 AND 7),
  ADD CONSTRAINT participants_age_check
    CHECK (age IS NULL OR age BETWEEN 18 AND 99),
  ADD CONSTRAINT participants_status_check
    CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
  ADD CONSTRAINT participants_attention_check
    CHECK (attention_checks_passed BETWEEN 0 AND 2);

-- responses
ALTER TABLE "responses"
  ADD CONSTRAINT responses_trial_index_check
    CHECK (trial_index BETWEEN 1 AND 34),
  ADD CONSTRAINT responses_block_number_check
    CHECK (block_number IN (1, 2)),
  ADD CONSTRAINT responses_trust_score_check
    CHECK (trust_score BETWEEN 1 AND 7),
  ADD CONSTRAINT responses_flaw_category_check
    CHECK (flaw_category IS NULL OR flaw_category IN
      ('INTRINSIC_CONTRADICTION', 'EXTRINSIC_HALLUCINATION', 'REASONING_LEAP')),
  ADD CONSTRAINT responses_response_time_check
    CHECK (response_time_ms >= 0);
