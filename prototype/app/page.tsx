'use client';

import {
  ArrowRight,
  CheckCircle2,
  Check,
  ChevronLeft,
  CircleDollarSign,
  Clock3,
  FileText,
  FileCheck2,
  HardHat,
  Image as ImageIcon,
  Moon,
  MoreHorizontal,
  RotateCcw,
  Send,
  ShieldCheck,
  Sun,
  UserRoundCheck,
} from 'lucide-react';
import { useState } from 'react';

import demoProject from '../data/demo-project.json';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

const stateStyles: Record<string, string> = {
  Paid: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:ring-teal-800',
  Approved:
    'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800',
  'Ready to submit':
    'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800',
  Planned:
    'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
};

export default function Home() {
  const [selectedStageId, setSelectedStageId] = useState(
    demoProject.currentStageId,
  );
  const [screen, setScreen] = useState<
    | 'overview'
    | 'workspace'
    | 'confirm'
    | 'submitted'
    | 'client-review'
    | 'revision1-approved'
    | 'change-request'
    | 'request-sent'
    | 'provider-response'
    | 'revision2-confirm'
    | 'revision2-submitted'
    | 'client-review-2'
    | 'revision2-approved'
    | 'invoice-review'
    | 'invoice-issued'
    | 'client-invoice'
    | 'pay-balance'
    | 'payment-processing'
    | 'payment-receipt'
  >('overview');
  const [changeRequest, setChangeRequest] = useState(
    'Could you add a closer photo of the plumbing inspection sticker and confirm which supply line serves the refrigerator?',
  );
  const [providerResponse, setProviderResponse] = useState(
    'Added a close-up of the passed plumbing inspection sticker. The refrigerator supply is the labeled braided line on the right side of the appliance opening.',
  );
  const [approvedRevision, setApprovedRevision] = useState<1 | 2>(2);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ach'>('card');
  const selectedStage = demoProject.stages.find(
    (stage) => stage.id === selectedStageId,
  )!;
  const isClientScreen = [
    'client-review',
    'revision1-approved',
    'change-request',
    'request-sent',
    'client-review-2',
    'revision2-approved',
    'client-invoice',
    'pay-balance',
    'payment-processing',
    'payment-receipt',
  ].includes(screen);

  function toggleTheme() {
    const root = document.documentElement;
    const nextTheme = root.classList.contains('dark') ? 'light' : 'dark';
    root.classList.toggle('dark', nextTheme === 'dark');
    localStorage.setItem('stagepaid-theme', nextTheme);
  }

  function resetDemo() {
    setSelectedStageId(demoProject.currentStageId);
    setScreen('overview');
    setChangeRequest(
      'Could you add a closer photo of the plumbing inspection sticker and confirm which supply line serves the refrigerator?',
    );
    setProviderResponse(
      'Added a close-up of the passed plumbing inspection sticker. The refrigerator supply is the labeled braided line on the right side of the appliance opening.',
    );
    setApprovedRevision(2);
    setPaymentMethod('card');
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <HardHat className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-heading text-[15px] font-bold tracking-tight">
                StagePaid
              </p>
              <p className="text-[11px] font-medium text-muted-foreground">
                {isClientScreen ? 'Client review' : 'Provider workspace'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="hidden border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 sm:inline-flex"
            >
              Prototype · synthetic data
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            >
              <Moon className="dark:hidden" />
              <Sun className="hidden dark:block" />
            </Button>
            {screen !== 'overview' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={resetDemo}
                aria-label="Reset demo"
                title="Reset demo"
              >
                <RotateCcw />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="More project options"
            >
              <MoreHorizontal />
            </Button>
            <div
              className="grid size-8 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white"
              aria-label={
                isClientScreen
                  ? 'Reviewing as Morgan and Casey R.'
                  : 'Signed in as Jordan Lee'
              }
            >
              {isClientScreen ? 'MR' : 'JL'}
            </div>
          </div>
        </div>
      </header>

      {screen === 'overview' ? (
        <Overview
          selectedStageId={selectedStageId}
          setSelectedStageId={setSelectedStageId}
          onOpenStage={() => setScreen('workspace')}
        />
      ) : screen === 'client-review' ||
        screen === 'revision1-approved' ||
        screen === 'change-request' ||
        screen === 'request-sent' ? (
        <ClientReview
          stage={selectedStage}
          screen={screen}
          message={changeRequest}
          onMessageChange={setChangeRequest}
          onRequestChanges={() => setScreen('change-request')}
          onApprove={() => {
            setApprovedRevision(1);
            setScreen('revision1-approved');
          }}
          onBack={() => setScreen('client-review')}
          onSend={() => setScreen('request-sent')}
          onContinueAsProvider={() => setScreen('provider-response')}
          onReset={resetDemo}
        />
      ) : screen === 'provider-response' ||
        screen === 'revision2-confirm' ||
        screen === 'revision2-submitted' ? (
        <ProviderResponse
          stage={selectedStage}
          screen={screen}
          request={changeRequest}
          response={providerResponse}
          onResponseChange={setProviderResponse}
          onBack={() =>
            setScreen(
              screen === 'provider-response'
                ? 'request-sent'
                : 'provider-response',
            )
          }
          onContinue={() => setScreen('revision2-confirm')}
          onSubmit={() => setScreen('revision2-submitted')}
          onContinueAsClient={() => setScreen('client-review-2')}
        />
      ) : screen === 'client-review-2' || screen === 'revision2-approved' ? (
        <RevisionTwoReview
          stage={selectedStage}
          screen={screen}
          request={changeRequest}
          response={providerResponse}
          onApprove={() => {
            setApprovedRevision(2);
            setScreen('revision2-approved');
          }}
          onContinueAsProvider={() => setScreen('invoice-review')}
          onReset={resetDemo}
        />
      ) : screen === 'invoice-review' ||
        screen === 'invoice-issued' ||
        screen === 'client-invoice' ||
        screen === 'pay-balance' ||
        screen === 'payment-processing' ||
        screen === 'payment-receipt' ? (
        <InvoiceFlow
          stage={selectedStage}
          screen={screen}
          approvedRevision={approvedRevision}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onIssue={() => setScreen('invoice-issued')}
          onContinueAsClient={() => setScreen('client-invoice')}
          onPayBalance={() => setScreen('pay-balance')}
          onStartPayment={() => setScreen('payment-processing')}
          onCompletePayment={() => setScreen('payment-receipt')}
          onReset={resetDemo}
        />
      ) : (
        <StageWorkspace
          stage={selectedStage}
          screen={screen}
          onBack={() =>
            setScreen(screen === 'workspace' ? 'overview' : 'workspace')
          }
          onContinue={() => setScreen('confirm')}
          onSubmit={() => setScreen('submitted')}
          onContinueAsClient={() => setScreen('client-review')}
          onReset={resetDemo}
        />
      )}
    </main>
  );
}

function Overview({
  selectedStageId,
  setSelectedStageId,
  onOpenStage,
}: {
  selectedStageId: string;
  setSelectedStageId: (id: string) => void;
  onOpenStage: () => void;
}) {
  const selectedStage = demoProject.stages.find(
    (stage) => stage.id === selectedStageId,
  )!;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
        <Button variant="ghost" size="sm" className="mb-5 -ml-2 text-slate-500">
          <ChevronLeft /> Projects
        </Button>

        <section className="mb-7 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
              <span className="text-xs font-medium text-muted-foreground">
                {demoProject.reference}
              </span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-[-0.035em] text-slate-950 dark:text-slate-50 sm:text-4xl">
              {demoProject.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {demoProject.client.displayName} · {demoProject.location.display}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-500">
              Contract value
            </span>
            <span className="text-xs font-medium text-slate-500">
              Paid to date
            </span>
            <strong className="font-heading text-xl text-slate-950 dark:text-slate-50">
              {demoProject.contractValue.display}
            </strong>
            <strong className="font-heading text-xl text-teal-700 dark:text-teal-400">
              {demoProject.paidToDate.display}
            </strong>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Project progress
              </p>
              <p className="mt-1 font-heading text-lg font-semibold text-slate-950 dark:text-slate-50">
                2 of 4 stages approved
              </p>
            </div>
            <span className="font-mono text-sm font-semibold text-primary">
              50%
            </span>
          </div>
          <Progress
            value={50}
            className="[&_[data-slot=progress-indicator]]:bg-primary"
          />
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section aria-labelledby="stages-title">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Staged agreement
                </p>
                <h2
                  id="stages-title"
                  className="mt-1 font-heading text-xl font-bold text-slate-950 dark:text-slate-50"
                >
                  Project stages
                </h2>
              </div>
              <span className="text-sm text-slate-500">4 stages</span>
            </div>
            <div className="space-y-3">
              {demoProject.stages.map((stage, index) => {
                const selected = stage.id === selectedStageId;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setSelectedStageId(stage.id)}
                    className={`group grid w-full grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:bg-slate-900 dark:focus-visible:ring-offset-slate-950 sm:p-5 ${selected ? 'border-primary/40 ring-1 ring-primary/15 dark:border-cyan-600/60' : 'border-slate-200 dark:border-slate-700'}`}
                    aria-pressed={selected}
                  >
                    <span
                      className={`grid size-10 place-items-center rounded-xl text-sm font-bold ${stage.state === 'Paid' ? 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' : selected ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {stage.state === 'Paid' ? (
                        <Check className="size-5" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-heading text-base font-semibold text-slate-950 dark:text-slate-50">
                        {stage.name}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                        {stage.summary}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-2">
                      <strong className="font-mono text-sm text-slate-900 dark:text-slate-100">
                        {stage.amount.display}
                      </strong>
                      <Badge
                        variant="outline"
                        className={
                          stateStyles[stage.state] ?? stateStyles.Planned
                        }
                      >
                        {stage.state}
                      </Badge>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="sticky top-22 rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Selected stage
                </p>
                <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">
                  {selectedStage.name}
                </h2>
              </div>
              <Badge className="bg-white/10 text-white ring-1 ring-white/15">
                {selectedStage.state}
              </Badge>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/6 p-3">
                <dt className="text-[11px] font-medium text-slate-400">
                  Stage amount
                </dt>
                <dd className="mt-1 font-mono text-base font-semibold">
                  {selectedStage.amount.display}
                </dd>
              </div>
              <div className="rounded-xl bg-white/6 p-3">
                <dt className="text-[11px] font-medium text-slate-400">
                  Target date
                </dt>
                <dd className="mt-1 text-sm font-semibold">
                  {selectedStage.targetDate}
                </dd>
              </div>
            </dl>
            <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
              <StageFact
                icon={<FileCheck2 />}
                title="Acceptance criteria"
                detail={`${selectedStage.acceptanceCriteria.length} items documented`}
              />
              <StageFact
                icon={<ImageIcon />}
                title="Evidence ready"
                detail={`${selectedStage.evidenceCount} files attached`}
              />
              <StageFact
                icon={
                  selectedStage.state === 'Paid' ? (
                    <CircleDollarSign />
                  ) : (
                    <Clock3 />
                  )
                }
                title="Next action"
                detail={selectedStage.nextAction}
              />
            </div>
            <Button
              size="lg"
              className="mt-6 h-11 w-full bg-teal-500 font-bold text-white hover:bg-teal-400"
              disabled={selectedStage.state === 'Paid'}
              onClick={onOpenStage}
            >
              {selectedStage.state === 'Ready to submit'
                ? 'Review submission'
                : selectedStage.state === 'Paid'
                  ? 'Stage complete'
                  : 'Open stage'}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </aside>
        </div>
      </div>
  );
}

function StageWorkspace({
  stage,
  screen,
  onBack,
  onContinue,
  onSubmit,
  onContinueAsClient,
  onReset,
}: {
  stage: (typeof demoProject.stages)[number];
  screen: 'workspace' | 'confirm' | 'submitted';
  onBack: () => void;
  onContinue: () => void;
  onSubmit: () => void;
  onContinueAsClient: () => void;
  onReset: () => void;
}) {
  const evidence =
    'evidence' in stage && Array.isArray(stage.evidence) ? stage.evidence : [];
  const completionSummary =
    'completionSummary' in stage && typeof stage.completionSummary === 'string'
      ? stage.completionSummary
      : stage.summary;

  if (screen === 'submitted') {
    return (
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-2xl place-items-center px-4 py-12 sm:px-6">
        <section className="w-full rounded-3xl border border-teal-200 bg-white p-6 text-center shadow-xl shadow-teal-950/5 dark:border-teal-900 dark:bg-slate-900 sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </span>
          <Badge className="mt-5 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
            Revision 1 submitted
          </Badge>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Ready for client review
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
            Morgan &amp; Casey R. can now review this exact revision. StagePaid
            has simulated the passwordless review notification for this demo.
          </p>
          <div className="mt-7 rounded-2xl bg-slate-50 p-4 text-left dark:bg-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Submitted record
            </p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-heading font-semibold text-slate-950 dark:text-white">
                  {stage.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Revision 1 · 3 evidence items shown
                </p>
              </div>
              <strong className="font-mono text-sm">{stage.amount.display}</strong>
            </div>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" size="lg" onClick={onReset}>
              Return to project
            </Button>
            <Button size="lg" className="bg-teal-600 text-white hover:bg-teal-500" onClick={onContinueAsClient}>
              Continue as client <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
          <p className="mt-5 text-xs text-slate-500">
            Prototype only — no notification was sent and no data was saved.
          </p>
        </section>
      </div>
    );
  }

  if (screen === 'confirm') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
          <ChevronLeft /> Back to evidence
        </Button>
        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-6 dark:border-slate-700 sm:p-8">
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Final check
            </Badge>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Submit revision 1?
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              The client will review this completion summary, acceptance criteria,
              and evidence as one fixed revision.
            </p>
          </div>
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_240px]">
            <div>
              <h2 className="font-heading text-lg font-bold">What the client receives</h2>
              <ul className="mt-4 space-y-3">
                {[
                  `${stage.acceptanceCriteria.length} acceptance criteria marked complete`,
                  `${evidence.length} selected evidence items`,
                  'Completion summary and stage amount',
                  'A clear choice to approve or send a Change Request',
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <Check className="mt-0.5 size-4 shrink-0 text-teal-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400" />
                  <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">
                    After submission, revision 1 stays unchanged for the decision
                    record. Any response to a Change Request becomes a new revision.
                  </p>
                </div>
              </div>
            </div>
            <dl className="space-y-4 rounded-2xl bg-slate-950 p-5 text-white">
              <div>
                <dt className="text-xs text-slate-400">Stage</dt>
                <dd className="mt-1 text-sm font-semibold">{stage.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Amount</dt>
                <dd className="mt-1 font-mono text-lg font-semibold">{stage.amount.display}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Client</dt>
                <dd className="mt-1 text-sm font-semibold">{demoProject.client.displayName}</dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/60 sm:flex-row sm:justify-end">
            <Button variant="outline" size="lg" onClick={onBack}>Keep editing</Button>
            <Button size="lg" className="bg-teal-600 text-white hover:bg-teal-500" onClick={onSubmit}>
              <Send /> Submit for client review
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
        <ChevronLeft /> Project overview
      </Button>
      <div className="mt-5 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-700 sm:flex-row sm:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Ready to submit
            </Badge>
            <span className="text-xs text-slate-500">Revision 1 · Draft</span>
          </div>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {stage.name}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Review exactly what the client will receive before submitting.
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium text-slate-500">Stage amount</p>
          <p className="mt-1 font-mono text-2xl font-bold">{stage.amount.display}</p>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <WorkspaceSection eyebrow="Completion summary" title="Work completed">
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              {completionSummary}
            </p>
          </WorkspaceSection>

          <WorkspaceSection eyebrow="Agreement" title="Acceptance criteria">
            <ul className="space-y-3">
              {stage.acceptanceCriteria.map((criterion) => (
                <li key={criterion} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-teal-600 text-white">
                    <Check className="size-3.5" />
                  </span>
                  <span className="text-sm font-medium">{criterion}</span>
                </li>
              ))}
            </ul>
          </WorkspaceSection>

          <WorkspaceSection eyebrow="Client record" title="Selected evidence">
            <div className="grid gap-3 sm:grid-cols-2">
              {evidence.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      {item.type === 'PDF' ? <FileText className="size-5" /> : <ImageIcon className="size-5" />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              3 of {stage.evidenceCount} prepared files selected for this revision.
            </p>
          </WorkspaceSection>
        </div>

        <aside className="rounded-2xl bg-slate-950 p-5 text-white shadow-xl lg:sticky lg:top-22">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Readiness</p>
          <h2 className="mt-2 font-heading text-xl font-bold">Ready for review</h2>
          <div className="mt-5 space-y-3">
            <StageFact icon={<CheckCircle2 />} title="Criteria complete" detail={`${stage.acceptanceCriteria.length} of ${stage.acceptanceCriteria.length} marked complete`} />
            <StageFact icon={<ImageIcon />} title="Evidence selected" detail={`${evidence.length} items included in revision 1`} />
            <StageFact icon={<FileCheck2 />} title="Summary included" detail="Client-facing completion note ready" />
          </div>
          <Button size="lg" className="mt-6 h-11 w-full bg-teal-500 font-bold text-white hover:bg-teal-400" onClick={onContinue}>
            Continue to confirmation <ArrowRight data-icon="inline-end" />
          </Button>
          <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
            Nothing is sent until you confirm the submission.
          </p>
        </aside>
      </div>
    </div>
  );
}

function ClientReview({
  stage,
  screen,
  message,
  onMessageChange,
  onRequestChanges,
  onApprove,
  onBack,
  onSend,
  onContinueAsProvider,
  onReset,
}: {
  stage: (typeof demoProject.stages)[number];
  screen: 'client-review' | 'revision1-approved' | 'change-request' | 'request-sent';
  message: string;
  onMessageChange: (message: string) => void;
  onRequestChanges: () => void;
  onApprove: () => void;
  onBack: () => void;
  onSend: () => void;
  onContinueAsProvider: () => void;
  onReset: () => void;
}) {
  const evidence =
    'evidence' in stage && Array.isArray(stage.evidence) ? stage.evidence : [];
  const completionSummary =
    'completionSummary' in stage && typeof stage.completionSummary === 'string'
      ? stage.completionSummary
      : stage.summary;

  if (screen === 'revision1-approved') {
    return (
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-2xl place-items-center px-4 py-12 sm:px-6">
        <section className="w-full rounded-3xl border border-teal-200 bg-white p-6 text-center shadow-xl shadow-teal-950/5 dark:border-teal-900 dark:bg-slate-900 sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><CheckCircle2 className="size-7" /></span>
          <Badge className="mt-5 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">Revision 1 approved</Badge>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Stage approved</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">The approval record points to revision 1. StagePaid prepared a draft invoice for provider review—nothing has been issued yet.</p>
          <div className="mt-7 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-5 text-left dark:bg-slate-950"><div><p className="text-xs text-slate-500">Approved revision</p><p className="mt-1 font-semibold">Revision 1</p></div><div><p className="text-xs text-slate-500">Draft invoice</p><p className="mt-1 font-mono font-semibold">{stage.amount.display}</p></div></div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2"><Button variant="outline" size="lg" onClick={onReset}>Reset demo</Button><Button size="lg" className="bg-teal-600 text-white hover:bg-teal-500" onClick={onContinueAsProvider}>Continue as provider <ArrowRight data-icon="inline-end" /></Button></div>
        </section>
      </div>
    );
  }

  if (screen === 'request-sent') {
    return (
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-2xl place-items-center px-4 py-12 sm:px-6">
        <section className="w-full rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-xl shadow-amber-950/5 dark:border-amber-900 dark:bg-slate-900 sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Send className="size-6" aria-hidden="true" />
          </span>
          <Badge className="mt-5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Change Request sent
          </Badge>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Jordan has what they need
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
            Revision 1 remains unchanged. Northline Residential can respond with
            clarification and submit revision 2 for another review.
          </p>
          <blockquote className="mt-7 rounded-2xl bg-slate-50 p-5 text-left text-sm leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
            “{message}”
          </blockquote>
          <div className="mt-6 rounded-2xl border border-slate-200 p-4 text-left dark:border-slate-700">
            <p className="text-sm font-semibold">Agreement remains unchanged</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              This request does not change the stage price, scope, or schedule.
              The provider can propose an agreement change separately if needed.
            </p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" size="lg" onClick={onReset}>Reset demo</Button>
            <Button size="lg" className="bg-teal-600 text-white hover:bg-teal-500" onClick={onContinueAsProvider}>
              Continue as provider <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
          <p className="mt-5 text-xs text-slate-500">
            Prototype only — no message was sent and no data was saved.
          </p>
        </section>
      </div>
    );
  }

  if (screen === 'change-request') {
    const canSend = message.trim().length >= 10;
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
          <ChevronLeft /> Back to review
        </Button>
        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-6 dark:border-slate-700 sm:p-8">
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Change Request
            </Badge>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              What needs clarification?
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Give the provider a specific, actionable message. They can reply
              with updated information and submit a new revision.
            </p>
          </div>
          <form
            className="p-6 sm:p-8"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSend) onSend();
            }}
          >
            <label className="block text-sm font-semibold" htmlFor="change-request-message">
              Message to Northline Residential
            </label>
            <Textarea
              id="change-request-message"
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              className="mt-2 min-h-36"
              placeholder="Describe what you need the provider to clarify or update…"
              aria-describedby="change-request-help"
            />
            <div id="change-request-help" className="mt-2 flex justify-between gap-4 text-xs text-slate-500">
              <span>Be specific so the provider can respond quickly.</span>
              <span>{message.trim().length} characters</span>
            </div>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                This is not an agreement change
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-300">
                Sending this request does not alter the agreed scope, price, or
                schedule, and it does not approve the stage.
              </p>
            </div>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" size="lg" onClick={onBack}>Cancel</Button>
              <Button type="submit" size="lg" className="bg-amber-600 text-white hover:bg-amber-500" disabled={!canSend}>
                Send Change Request <Send data-icon="inline-end" />
              </Button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-9">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 dark:border-teal-900 dark:bg-teal-950/50">
        <div className="flex items-center gap-3">
          <UserRoundCheck className="size-5 text-teal-700 dark:text-teal-300" />
          <div>
            <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">Secure client review</p>
            <p className="text-xs text-teal-700 dark:text-teal-300">Opened from a simulated passwordless link · No account required</p>
          </div>
        </div>
        <Badge variant="outline" className="border-teal-300 text-teal-800 dark:border-teal-800 dark:text-teal-300">
          Reviewing as Morgan &amp; Casey R.
        </Badge>
      </div>

      <div className="border-b border-slate-200 pb-6 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Client review</Badge>
          <span className="text-xs text-slate-500">Revision 1 · Submitted Sep 15, 2026</span>
        </div>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{stage.name}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{demoProject.name} · Submitted by Northline Residential</p>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <WorkspaceSection eyebrow="Provider summary" title="Work completed">
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{completionSummary}</p>
          </WorkspaceSection>
          <WorkspaceSection eyebrow="Agreed outcome" title="Acceptance criteria">
            <ul className="space-y-3">
              {stage.acceptanceCriteria.map((criterion) => (
                <li key={criterion} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-teal-600" />
                  {criterion}
                </li>
              ))}
            </ul>
          </WorkspaceSection>
          <WorkspaceSection eyebrow="Revision 1" title="Evidence from the provider">
            <div className="grid gap-3 sm:grid-cols-2">
              {evidence.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      {item.type === 'PDF' ? <FileText className="size-5" /> : <ImageIcon className="size-5" />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </WorkspaceSection>
        </div>

        <aside className="rounded-2xl bg-slate-950 p-5 text-white shadow-xl lg:sticky lg:top-22">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Your decision</p>
          <h2 className="mt-2 font-heading text-xl font-bold">Is this stage complete?</h2>
          <p className="mt-2 text-xs leading-5 text-slate-400">Approval applies to revision 1 and prepares a draft invoice for {stage.amount.display}.</p>
          <Button size="lg" className="mt-6 h-11 w-full bg-teal-500 font-bold text-white hover:bg-teal-400" onClick={onApprove}>
            <Check /> Approve revision 1
          </Button>
          <Button variant="outline" size="lg" className="mt-3 h-11 w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={onRequestChanges}>
            Request a change
          </Button>
          <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">Neither choice issues an invoice or sends payment.</p>
        </aside>
      </div>
    </div>
  );
}

function ProviderResponse({
  stage,
  screen,
  request,
  response,
  onResponseChange,
  onBack,
  onContinue,
  onSubmit,
  onContinueAsClient,
}: {
  stage: (typeof demoProject.stages)[number];
  screen: 'provider-response' | 'revision2-confirm' | 'revision2-submitted';
  request: string;
  response: string;
  onResponseChange: (response: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onSubmit: () => void;
  onContinueAsClient: () => void;
}) {
  if (screen === 'revision2-submitted') {
    return (
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-2xl place-items-center px-4 py-12 sm:px-6">
        <section className="w-full rounded-3xl border border-teal-200 bg-white p-6 text-center shadow-xl shadow-teal-950/5 dark:border-teal-900 dark:bg-slate-900 sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <CheckCircle2 className="size-7" />
          </span>
          <Badge className="mt-5 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
            Revision 2 submitted
          </Badge>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Clarification sent for review
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
            The client can compare the response with their original request.
            Revision 1 remains preserved in the stage history.
          </p>
          <div className="mt-7 rounded-2xl bg-slate-50 p-5 text-left dark:bg-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Provider response</p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{response}</p>
          </div>
          <Button size="lg" className="mt-7 w-full bg-teal-600 text-white hover:bg-teal-500" onClick={onContinueAsClient}>
            Continue as client <ArrowRight data-icon="inline-end" />
          </Button>
          <p className="mt-5 text-xs text-slate-500">Prototype only — no notification was sent and no data was saved.</p>
        </section>
      </div>
    );
  }

  if (screen === 'revision2-confirm') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}><ChevronLeft /> Back to response</Button>
        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-6 dark:border-slate-700 sm:p-8">
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Final check</Badge>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Submit revision 2?</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">This revision links the client’s request, your response, and the added evidence without replacing revision 1.</p>
          </div>
          <div className="grid gap-4 p-6 sm:p-8">
            <RevisionEvent label="Client request" detail={request} tone="amber" />
            <RevisionEvent label="Provider response" detail={response} tone="teal" />
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <ImageIcon className="size-5 text-teal-600" />
                <div><p className="text-sm font-semibold">Plumbing inspection sticker close-up</p><p className="text-xs text-slate-500">New evidence · Revision 2</p></div>
              </div>
              <Badge variant="outline">Photo</Badge>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/60 sm:flex-row sm:justify-end">
            <Button variant="outline" size="lg" onClick={onBack}>Keep editing</Button>
            <Button size="lg" className="bg-teal-600 text-white hover:bg-teal-500" onClick={onSubmit}><Send /> Submit revision 2</Button>
          </div>
        </section>
      </div>
    );
  }

  const canContinue = response.trim().length >= 10;
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-9">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}><ChevronLeft /> Change Request record</Button>
      <div className="mt-5 border-b border-slate-200 pb-6 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Response needed</Badge>
          <span className="text-xs text-slate-500">Revision 2 · Draft</span>
        </div>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Respond to the Change Request</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{stage.name}</p>
      </div>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <WorkspaceSection eyebrow="Client request" title="Clarification requested">
            <blockquote className="border-l-2 border-amber-400 pl-4 text-sm leading-7 text-slate-700 dark:text-slate-200">“{request}”</blockquote>
            <p className="mt-4 text-xs text-slate-500">Sent by Morgan &amp; Casey R. · Revision 1 retained</p>
          </WorkspaceSection>
          <WorkspaceSection eyebrow="Your response" title="Explain what changed">
            <label className="block text-sm font-semibold" htmlFor="provider-response">Response to the client</label>
            <Textarea id="provider-response" className="mt-2 min-h-36" value={response} onChange={(event) => onResponseChange(event.target.value)} aria-describedby="provider-response-help" />
            <p id="provider-response-help" className="mt-2 text-xs text-slate-500">Answer the request directly and identify any new evidence.</p>
          </WorkspaceSection>
          <WorkspaceSection eyebrow="New evidence" title="Added for revision 2">
            <article className="flex items-center justify-between gap-4 rounded-2xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900 dark:bg-teal-950/30">
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><ImageIcon className="size-5" /></span><div><p className="text-sm font-semibold">Plumbing inspection sticker close-up</p><p className="mt-1 text-xs text-slate-500">Synthetic photo · Added to revision 2</p></div></div>
              <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">Added</Badge>
            </article>
          </WorkspaceSection>
        </div>
        <aside className="rounded-2xl bg-slate-950 p-5 text-white shadow-xl lg:sticky lg:top-22">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Revision history</p>
          <div className="mt-4 space-y-4 border-l border-white/15 pl-4">
            <div><p className="text-sm font-semibold">Revision 2 · Draft</p><p className="mt-1 text-xs text-slate-400">Response and new evidence</p></div>
            <div><p className="text-sm font-semibold text-slate-300">Revision 1 · Changes requested</p><p className="mt-1 text-xs text-slate-500">Preserved decision record</p></div>
          </div>
          <Button size="lg" className="mt-6 h-11 w-full bg-teal-500 font-bold text-white hover:bg-teal-400" disabled={!canContinue} onClick={onContinue}>Review revision 2 <ArrowRight data-icon="inline-end" /></Button>
        </aside>
      </div>
    </div>
  );
}

function RevisionTwoReview({
  stage,
  screen,
  request,
  response,
  onApprove,
  onContinueAsProvider,
  onReset,
}: {
  stage: (typeof demoProject.stages)[number];
  screen: 'client-review-2' | 'revision2-approved';
  request: string;
  response: string;
  onApprove: () => void;
  onContinueAsProvider: () => void;
  onReset: () => void;
}) {
  if (screen === 'revision2-approved') {
    return (
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-2xl place-items-center px-4 py-12 sm:px-6">
        <section className="w-full rounded-3xl border border-teal-200 bg-white p-6 text-center shadow-xl shadow-teal-950/5 dark:border-teal-900 dark:bg-slate-900 sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><CheckCircle2 className="size-7" /></span>
          <Badge className="mt-5 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">Revision 2 approved</Badge>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Stage approved</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">The approval record points to revision 2. StagePaid has prepared a draft invoice for the provider to review—nothing has been issued yet.</p>
          <div className="mt-7 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-5 text-left dark:bg-slate-950"><div><p className="text-xs text-slate-500">Approved revision</p><p className="mt-1 font-semibold">Revision 2</p></div><div><p className="text-xs text-slate-500">Draft invoice</p><p className="mt-1 font-mono font-semibold">{stage.amount.display}</p></div></div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2"><Button variant="outline" size="lg" onClick={onReset}>Reset demo</Button><Button size="lg" className="bg-teal-600 text-white hover:bg-teal-500" onClick={onContinueAsProvider}>Continue as provider <ArrowRight data-icon="inline-end" /></Button></div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-9">
      <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 dark:border-teal-900 dark:bg-teal-950/50"><p className="text-sm font-semibold text-teal-900 dark:text-teal-100">Secure client review · Revision 2</p><p className="mt-1 text-xs text-teal-700 dark:text-teal-300">Reviewing as Morgan &amp; Casey R. from a simulated passwordless link</p></div>
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-700 sm:flex-row sm:items-end"><div><Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Updated review</Badge><h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{stage.name}</h1><p className="mt-2 text-sm text-slate-500">Revision 2 answers your Change Request</p></div><strong className="font-mono text-xl">{stage.amount.display}</strong></div>
      <div className="mt-6 space-y-4">
        <RevisionEvent label="Your Change Request" detail={request} tone="amber" />
        <RevisionEvent label="Provider response" detail={response} tone="teal" />
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">New in revision 2</p><div className="mt-3 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><ImageIcon className="size-5" /></span><div><p className="text-sm font-semibold">Plumbing inspection sticker close-up</p><p className="mt-1 text-xs text-slate-500">Synthetic evidence · Added by provider</p></div></div></section>
        <section className="rounded-2xl bg-slate-950 p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-6"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Your decision</p><h2 className="mt-2 font-heading text-xl font-bold">Approve revision 2?</h2><p className="mt-1 text-xs leading-5 text-slate-400">Approval prepares a draft invoice. It does not issue or pay it.</p></div><Button size="lg" className="mt-5 w-full bg-teal-500 font-bold text-white hover:bg-teal-400 sm:mt-0 sm:w-auto" onClick={onApprove}><Check /> Approve revision 2</Button></section>
      </div>
    </div>
  );
}

function InvoiceFlow({
  stage,
  screen,
  approvedRevision,
  paymentMethod,
  onPaymentMethodChange,
  onIssue,
  onContinueAsClient,
  onPayBalance,
  onStartPayment,
  onCompletePayment,
  onReset,
}: {
  stage: (typeof demoProject.stages)[number];
  screen: 'invoice-review' | 'invoice-issued' | 'client-invoice' | 'pay-balance' | 'payment-processing' | 'payment-receipt';
  approvedRevision: 1 | 2;
  paymentMethod: 'card' | 'ach';
  onPaymentMethodChange: (method: 'card' | 'ach') => void;
  onIssue: () => void;
  onContinueAsClient: () => void;
  onPayBalance: () => void;
  onStartPayment: () => void;
  onCompletePayment: () => void;
  onReset: () => void;
}) {
  const invoiceNumber = 'SP-2026-014-03';

  if (screen === 'payment-receipt') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="rounded-3xl border border-teal-200 bg-white p-6 shadow-xl shadow-teal-950/5 dark:border-teal-900 dark:bg-slate-900 sm:p-9">
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><CheckCircle2 className="size-7" /></span>
            <Badge className="mt-5 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">Payment successful</Badge>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Payment received</h1>
            <p className="mt-2 text-sm text-slate-500">Receipt {invoiceNumber}-R1 · Sep 15, 2026</p>
          </div>
          <div className="mx-auto mt-8 max-w-xl divide-y divide-slate-200 rounded-2xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            <ReceiptRow label="Invoice" value={invoiceNumber} />
            <ReceiptRow label="Payment method" value={paymentMethod === 'card' ? 'Visa •••• 4242' : 'Bank account •••• 6789'} />
            <ReceiptRow label="Amount paid" value={stage.amount.display} strong />
            <ReceiptRow label="Balance due" value="$0.00" strong />
          </div>
          <div className="mt-7 grid gap-4 border-t border-slate-200 pt-7 dark:border-slate-700 sm:grid-cols-3">
            <Metric label="Project progress" value="3 of 4 stages" />
            <Metric label="Paid to date" value="$26,000" accent />
            <Metric label="Invoice state" value="Paid" accent />
          </div>
          <div className="mt-7 rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Project history updated</p>
            <p className="mt-2 text-sm font-semibold">Payment succeeded and {stage.name} moved to Paid.</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">The successful payment—not the earlier attempt—created the receipt and reduced the balance to zero.</p>
          </div>
          <Button variant="outline" size="lg" className="mt-7 w-full" onClick={onReset}>Finish and reset demo</Button>
          <p className="mt-4 text-center text-xs text-slate-500">Prototype only — no payment was processed and no financial record was created.</p>
        </section>
      </div>
    );
  }

  if (screen === 'payment-processing') {
    return (
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-xl place-items-center px-4 py-12 sm:px-6">
        <section className="w-full rounded-3xl border border-blue-200 bg-white p-6 text-center shadow-xl shadow-blue-950/5 dark:border-blue-900 dark:bg-slate-900 sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Clock3 className="size-7" /></span>
          <Badge className="mt-5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Payment processing</Badge>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Payment submitted</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">A payment attempt exists, but the invoice is not Paid until the processor confirms success.</p>
          <div className="mt-7 rounded-2xl bg-slate-50 p-5 text-left dark:bg-slate-950"><ReceiptRow label="Attempt amount" value={stage.amount.display} /><ReceiptRow label="Method" value={paymentMethod === 'card' ? 'Visa •••• 4242' : 'Bank account •••• 6789'} /></div>
          <Button size="lg" className="mt-7 w-full bg-teal-600 text-white hover:bg-teal-500" onClick={onCompletePayment}>Simulate successful confirmation <ArrowRight data-icon="inline-end" /></Button>
          <p className="mt-4 text-xs text-slate-500">In production, Stripe—not this button—provides the authoritative result.</p>
        </section>
      </div>
    );
  }

  if (screen === 'pay-balance') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={onContinueAsClient}><ChevronLeft /> Invoice</Button>
        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-6 dark:border-slate-700 sm:p-8"><Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Secure payment</Badge><h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">Pay balance</h1><p className="mt-2 text-sm text-slate-500">Full outstanding balance for invoice {invoiceNumber}</p></div>
          <div className="p-6 sm:p-8">
            <fieldset><legend className="text-sm font-semibold">Payment method</legend><div className="mt-3 grid gap-3 sm:grid-cols-2"><PaymentChoice selected={paymentMethod === 'card'} title="Card" detail="Visa •••• 4242" onClick={() => onPaymentMethodChange('card')} /><PaymentChoice selected={paymentMethod === 'ach'} title="Bank account" detail="Checking •••• 6789" onClick={() => onPaymentMethodChange('ach')} /></div></fieldset>
            <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-slate-950"><ReceiptRow label="Invoice balance" value={stage.amount.display} /><ReceiptRow label="Client payment fee" value="$0.00" /><ReceiptRow label="Total payment" value={stage.amount.display} strong /></div>
            <p className="mt-4 text-xs leading-5 text-slate-500">StagePaid does not add a card surcharge or convenience fee to this MVP invoice. Provider processing costs are not included in the client total.</p>
            <Button size="lg" className="mt-6 w-full bg-teal-600 text-white hover:bg-teal-500" onClick={onStartPayment}>Pay {stage.amount.display}</Button>
          </div>
        </section>
      </div>
    );
  }

  if (screen === 'client-invoice') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-9">
        <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 dark:border-teal-900 dark:bg-teal-950/50"><p className="text-sm font-semibold text-teal-900 dark:text-teal-100">Secure client invoice</p><p className="mt-1 text-xs text-teal-700 dark:text-teal-300">Opened from a simulated passwordless link · No account required</p></div>
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-700 sm:flex-row sm:items-end"><div><Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Issued · Unpaid</Badge><h1 className="mt-3 font-heading text-3xl font-bold tracking-tight">Invoice {invoiceNumber}</h1><p className="mt-2 text-sm text-slate-500">Northline Residential · Due Sep 22, 2026</p></div><div className="sm:text-right"><p className="text-xs text-slate-500">Balance due</p><p className="mt-1 font-mono text-2xl font-bold">{stage.amount.display}</p></div></div>
        <InvoiceDocument stage={stage} approvedRevision={approvedRevision} invoiceNumber={invoiceNumber} client />
        <Button size="lg" className="mt-6 w-full bg-teal-600 text-white hover:bg-teal-500" onClick={onPayBalance}>Pay balance · {stage.amount.display}</Button>
        <p className="mt-3 text-center text-xs text-slate-500">Pay balance requests the full outstanding amount.</p>
      </div>
    );
  }

  if (screen === 'invoice-issued') {
    return (
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-2xl place-items-center px-4 py-12 sm:px-6">
        <section className="w-full rounded-3xl border border-teal-200 bg-white p-6 text-center shadow-xl shadow-teal-950/5 dark:border-teal-900 dark:bg-slate-900 sm:p-10"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><FileCheck2 className="size-7" /></span><Badge className="mt-5 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">Invoice issued</Badge><h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">Client invoice is ready</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">Invoice {invoiceNumber} is now an immutable issued snapshot. A simulated notification is ready for Morgan &amp; Casey R.</p><div className="mt-7 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-5 text-left dark:bg-slate-950"><Metric label="Amount due" value={stage.amount.display} /><Metric label="Due date" value="Sep 22, 2026" /></div><Button size="lg" className="mt-7 w-full bg-teal-600 text-white hover:bg-teal-500" onClick={onContinueAsClient}>Continue as client <ArrowRight data-icon="inline-end" /></Button></section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-9">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={onReset}><ChevronLeft /> Project overview</Button>
      <div className="mt-5 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-700 sm:flex-row sm:items-end"><div><Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Draft · Not issued</Badge><h1 className="mt-3 font-heading text-3xl font-bold tracking-tight">Review draft invoice</h1><p className="mt-2 text-sm text-slate-500">Prepared from the client’s approval of revision {approvedRevision}.</p></div><div className="sm:text-right"><p className="text-xs text-slate-500">Invoice total</p><p className="mt-1 font-mono text-2xl font-bold">{stage.amount.display}</p></div></div>
      <InvoiceDocument stage={stage} approvedRevision={approvedRevision} invoiceNumber={invoiceNumber} />
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Provider fee disclosure</p><div className="mt-3 space-y-2"><ReceiptRow label="Gross client payment" value={stage.amount.display} /><ReceiptRow label="StagePaid platform fee (1%)" value="−$112.00" /><ReceiptRow label="Stripe processing costs" value="Shown from actual settlement" /></div><p className="mt-3 text-xs leading-5 text-slate-500">The client pays the invoice total. Provider fees are itemized separately and do not reduce the amount applied to the invoice.</p></section>
      <Button size="lg" className="mt-6 w-full bg-teal-600 text-white hover:bg-teal-500" onClick={onIssue}>Issue invoice · {stage.amount.display}</Button>
      <p className="mt-3 text-center text-xs text-slate-500">Issuance creates a fixed invoice snapshot and makes it payable.</p>
    </div>
  );
}

function InvoiceDocument({ stage, approvedRevision, invoiceNumber, client = false }: { stage: (typeof demoProject.stages)[number]; approvedRevision: 1 | 2; invoiceNumber: string; client?: boolean }) {
  return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6"><div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-700"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{client ? 'Invoice' : 'Stage invoice'}</p><h2 className="mt-2 font-heading text-xl font-bold">{stage.name}</h2><p className="mt-1 text-xs text-slate-500">Approved revision {approvedRevision} · {invoiceNumber}</p></div><FileText className="size-6 text-teal-600" /></div><div className="flex items-center justify-between gap-4 py-5"><div><p className="text-sm font-semibold">Completed stage</p><p className="mt-1 text-xs text-slate-500">Client-approved work and evidence record</p></div><strong className="font-mono text-sm">{stage.amount.display}</strong></div><div className="flex items-center justify-between border-t border-slate-200 pt-5 dark:border-slate-700"><strong>Total due</strong><strong className="font-mono text-xl">{stage.amount.display}</strong></div></section>;
}

function PaymentChoice({ selected, title, detail, onClick }: { selected: boolean; title: string; detail: string; onClick: () => void }) {
  return <label className={`relative cursor-pointer rounded-2xl border p-4 text-left transition has-focus-visible:outline-none has-focus-visible:ring-2 has-focus-visible:ring-primary ${selected ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500/20 dark:bg-teal-950/40' : 'border-slate-200 dark:border-slate-700'}`}><input className="sr-only" type="radio" name="payment-method" checked={selected} onChange={onClick} /><span className="flex items-center justify-between"><span className="text-sm font-semibold">{title}</span><span className={`size-4 rounded-full border-4 ${selected ? 'border-teal-600 bg-white' : 'border-slate-300'}`} /></span><span className="mt-1 block text-xs text-slate-500">{detail}</span></label>;
}

function ReceiptRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><span className="text-slate-500">{label}</span><span className={strong ? 'font-mono font-bold' : 'font-medium'}>{value}</span></div>;
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 font-heading font-bold ${accent ? 'text-teal-700 dark:text-teal-300' : ''}`}>{value}</p></div>;
}

function RevisionEvent({ label, detail, tone }: { label: string; detail: string; tone: 'amber' | 'teal' }) {
  return <section className={`rounded-2xl border p-5 ${tone === 'amber' ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30' : 'border-teal-200 bg-teal-50/60 dark:border-teal-900 dark:bg-teal-950/30'}`}><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{detail}</p></section>;
}

function WorkspaceSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-1 mb-4 font-heading text-lg font-bold text-slate-950 dark:text-white">{title}</h2>
      {children}
    </section>
  );
}

function StageFact({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-teal-400 [&>svg]:size-4">{icon}</span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-400">{detail}</p>
      </div>
    </div>
  );
}
