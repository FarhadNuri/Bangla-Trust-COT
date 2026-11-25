"use client";

import { useState, useEffect } from "react";
import {
  saveParticipantUuid,
  loadParticipantUuid,
  clearParticipantUuid,
} from "@/lib/participantStorage";
import {
  startSession,
  getSession,
  saveDemographics,
  saveResponse,
  completeSession,
  ApiError,
} from "@/lib/apiClient";
import ConsentScreen from "@/components/ConsentScreen";
import DemographicsScreen from "@/components/DemographicsScreen";
import BlockTransitionScreen from "@/components/BlockTransitionScreen";
import TrialScreen from "@/components/TrialScreen";
import CompletionScreen from "@/components/CompletionScreen";
import PageShell from "@/components/PageShell";

export default function Home() {
  const [screen, setScreen] = useState("LOADING");
  const [session, setSession] = useState(null); // { participant_uuid, form_id, block_order }
  const [trials, setTrials] = useState([]); // sanitized 34 trials
  const [currentTrialIndex, setCurrentTrialIndex] = useState(1); // 1..34
  const [completion, setCompletion] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resume or restore participant session on page load
  useEffect(() => {
    async function restoreSession() {
      const storedUuid = loadParticipantUuid();
      if (!storedUuid) {
        setScreen("CONSENT");
        return;
      }

      try {
        const data = await getSession(storedUuid);

        setSession({
          participant_uuid: data.participant_uuid,
          form_id: data.form_id,
          block_order: data.block_order,
        });

        // 1. Session is completed: show completion screen
        if (data.status === "COMPLETED") {
          setCompletion(data.completion);
          setScreen("COMPLETE");
          return;
        }

        setTrials(data.trials || []);

        // 2. Demographics not yet completed: direct to demographics
        if (!data.demographics_completed) {
          setScreen("DEMOGRAPHICS");
          return;
        }

        // 3. All 34 trials answered but session not yet finalized
        if (data.next_trial_index === null && data.answered_count === 34) {
          try {
            const completionResult = await completeSession(data.participant_uuid);
            setCompletion(completionResult);
            setScreen("COMPLETE");
          } catch (completeErr) {
            setErrorMessage(completeErr.message || "Failed to finalize session.");
            setScreen("COMPLETE");
          }
          return;
        }

        // 4. In-progress: start of block 1 (trial 1) or block 2 (trial 18)
        const nextIdx = data.next_trial_index || 1;
        setCurrentTrialIndex(nextIdx);

        if (nextIdx === 1 || nextIdx === 18) {
          setScreen("BLOCK_INTRO");
        } else {
          setScreen("TRIAL");
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          // Unknown or wiped UUID in database: reset local storage and start fresh
          clearParticipantUuid();
          setScreen("CONSENT");
        } else {
          setErrorMessage(err.message || "Failed to restore session. Please try again.");
          setScreen("CONSENT");
        }
      }
    }

    restoreSession();
  }, []);

  // Handler: Start Study (Consent Screen)
  async function handleStart() {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const data = await startSession();
      saveParticipantUuid(data.participant_uuid);
      setSession({
        participant_uuid: data.participant_uuid,
        form_id: data.form_id,
        block_order: data.block_order,
      });
      setTrials(data.trials);
      setCurrentTrialIndex(1);
      setScreen("DEMOGRAPHICS");
    } catch (err) {
      setErrorMessage(err.message || "Failed to start study.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handler: Submit Demographics
  async function handleDemographicsSubmit(demographicsData) {
    if (!session?.participant_uuid) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await saveDemographics(session.participant_uuid, demographicsData);
      setScreen("BLOCK_INTRO");
    } catch (err) {
      setErrorMessage(err.message || "Failed to save demographics.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handler: Begin Block Section
  function handleBeginSection() {
    setErrorMessage("");
    setScreen("TRIAL");
  }

  // Handler: Submit Trial Response
  async function handleTrialSubmit(trialData) {
    if (!session?.participant_uuid) return;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await saveResponse({
        participant_uuid: session.participant_uuid,
        trial_index: currentTrialIndex,
        ...trialData,
      });

      // If the participant just completed the 34th trial, finalize the study
      if (currentTrialIndex === 34) {
        const completionResult = await completeSession(session.participant_uuid);
        setCompletion(completionResult);
        setScreen("COMPLETE");
        return;
      }

      // Advance to next trial
      const nextIndex = currentTrialIndex + 1;
      setCurrentTrialIndex(nextIndex);

      // Block boundary: show BlockTransitionScreen before entering Block 2 (trial 18)
      if (nextIndex === 18) {
        setScreen("BLOCK_INTRO");
      } else {
        setScreen("TRIAL");
      }
    } catch (err) {
      setErrorMessage(err.message || "Could not save response. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Current trial object derived safely from index
  const currentTrial = trials[currentTrialIndex - 1] || null;
  const currentBlockNumber = currentTrialIndex <= 17 ? 1 : 2;
  const currentLanguage = currentTrial?.language || (session?.block_order === "BN_FIRST" ? (currentBlockNumber === 1 ? "Bangla" : "English") : (currentBlockNumber === 1 ? "English" : "Bangla"));

  return (
    <>
      {screen === "LOADING" && (
        <PageShell>
          <div className="text-center text-slate-600 animate-pulse text-base font-medium">
            Loading study session...
          </div>
        </PageShell>
      )}

      {screen === "CONSENT" && (
        <PageShell>
          <ConsentScreen
            onStart={handleStart}
            isLoading={isSubmitting}
            errorMessage={errorMessage}
          />
        </PageShell>
      )}

      {screen === "DEMOGRAPHICS" && (
        <PageShell>
          <DemographicsScreen
            onSubmit={handleDemographicsSubmit}
            isSaving={isSubmitting}
            errorMessage={errorMessage}
          />
        </PageShell>
      )}

      {screen === "BLOCK_INTRO" && (
        <PageShell>
          <BlockTransitionScreen
            blockNumber={currentBlockNumber}
            language={currentLanguage}
            trialCount={17}
            onBegin={handleBeginSection}
          />
        </PageShell>
      )}

      {screen === "TRIAL" && currentTrial && (
        <PageShell wide>
          <TrialScreen
            key={currentTrial.trial_index}
            trial={currentTrial}
            totalTrials={34}
            onSubmit={handleTrialSubmit}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
          />
        </PageShell>
      )}

      {screen === "COMPLETE" && (
        <PageShell>
          <CompletionScreen completion={completion} />
        </PageShell>
      )}
    </>
  );
}
