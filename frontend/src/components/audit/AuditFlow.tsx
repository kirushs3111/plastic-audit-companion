"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuditFlow } from "@/components/audit/useAuditFlow";
import WelcomeStep from "@/components/audit/steps/WelcomeStep";
import HouseInfoStep from "@/components/audit/steps/HouseInfoStep";
import RoomSelectStep from "@/components/audit/steps/RoomSelectStep";
import ItemSelectStep from "@/components/audit/steps/ItemSelectStep";
import KnowTypeStep from "@/components/audit/steps/KnowTypeStep";
import KnownTypeStep from "@/components/audit/steps/KnownTypeStep";
import PhotoUploadStep from "@/components/audit/steps/PhotoUploadStep";
import QuantityStep from "@/components/audit/steps/QuantityStep";
import SummaryStep from "@/components/audit/steps/SummaryStep";
import SubmittedStep from "@/components/audit/steps/SubmittedStep";

export default function AuditFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeSessionId = searchParams.get("session");
  const { user, isLoading: authLoading } = useAuth();
  const { state, dispatch, actions } = useAuditFlow(resumeSessionId);
  const { phase, household, entries, currentRoom, currentItem, currentPhotos, error, isSaving } = state;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800">Sign in to start an audit</h1>
          <p className="text-gray-600 mt-3">
            Guest mode takes one tap and no signup - your audit still gets saved.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 transition"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col">
      <header className="w-full py-5 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-green-700">
            🌿 Plastic Audit Companion
          </Link>
          {phase !== "welcome" && phase !== "submitted" && (
            <span className="text-sm text-gray-500">Saved to your account as you go</span>
          )}
        </div>
      </header>

      {error && (
        <div className="max-w-2xl mx-auto w-full px-6">
          <p className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</p>
        </div>
      )}

      <main className="flex-1 flex items-start justify-center px-6 pb-20">
        <div className="w-full mt-6">
          {phase === "welcome" && (
            <WelcomeStep onBegin={() => dispatch({ type: "GO_TO", phase: "house-info" })} />
          )}

          {phase === "house-info" && (
            <HouseInfoStep
              initial={household}
              isSubmitting={isSaving}
              onSubmit={actions.submitHouseInfo}
            />
          )}

          {phase === "room-select" && (
            <RoomSelectStep
              entryCount={entries.length}
              onSelect={(room) => dispatch({ type: "SELECT_ROOM", room })}
              onViewSummary={() => dispatch({ type: "GO_TO", phase: "summary" })}
            />
          )}

          {phase === "item-select" && currentRoom && (
            <ItemSelectStep
              room={currentRoom}
              entriesInRoom={entries.filter((e) => e.room === currentRoom)}
              onSelect={(item) => dispatch({ type: "SELECT_ITEM", item })}
              onChangeRoom={() => dispatch({ type: "CHANGE_ROOM" })}
              onViewSummary={() => dispatch({ type: "GO_TO", phase: "summary" })}
            />
          )}

          {phase === "know-type" && currentItem && (
            <KnowTypeStep
              item={currentItem}
              onBack={() => dispatch({ type: "GO_TO", phase: "item-select" })}
              onYes={() => dispatch({ type: "GO_TO", phase: "known-type-pick" })}
              onNo={() => dispatch({ type: "CHOOSE_UNKNOWN" })}
            />
          )}

          {phase === "known-type-pick" && (
            <KnownTypeStep
              onBack={() => dispatch({ type: "GO_TO", phase: "know-type" })}
              onChoose={(code) => dispatch({ type: "CHOOSE_KNOWN_TYPE", code })}
            />
          )}

          {phase === "photo-upload" && (
            <PhotoUploadStep
              photos={currentPhotos}
              uploadingSlot={state.isUploadingSlot}
              onBack={() => dispatch({ type: "GO_TO", phase: "know-type" })}
              onSelectFile={actions.uploadPhoto}
              onRemovePhoto={(slot) => dispatch({ type: "REMOVE_PHOTO", slot })}
              onNext={() => dispatch({ type: "CONTINUE_TO_QUANTITY" })}
            />
          )}

          {phase === "quantity" && currentItem && (
            <QuantityStep
              item={currentItem}
              code={state.currentPlasticCode}
              isSaving={isSaving}
              onBack={() =>
                dispatch({
                  type: "GO_TO",
                  phase: state.currentMethod === "known" ? "known-type-pick" : "photo-upload",
                })
              }
              onSave={actions.saveEntry}
            />
          )}

          {phase === "summary" && (
            <SummaryStep
              entries={entries}
              householdName={household.householdName}
              isSubmitting={isSaving}
              onBack={() => dispatch({ type: "GO_TO", phase: "room-select" })}
              onAddMore={() => dispatch({ type: "GO_TO", phase: "room-select" })}
              onDeleteEntry={actions.deleteEntry}
              onSubmit={actions.submit}
            />
          )}

          {phase === "submitted" && (
            <SubmittedStep
              entries={entries}
              householdName={household.householdName}
              onStartNew={() => dispatch({ type: "RESTART" })}
            />
          )}
        </div>
      </main>
    </div>
  );
}
