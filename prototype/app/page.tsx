'use client';

import {
  ArrowRight,
  Check,
  ChevronLeft,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  HardHat,
  Image as ImageIcon,
  Moon,
  MoreHorizontal,
  Sun,
} from 'lucide-react';
import { useState } from 'react';

import demoProject from '../data/demo-project.json';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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
  const selectedStage = demoProject.stages.find(
    (stage) => stage.id === selectedStageId,
  )!;

  function toggleTheme() {
    const root = document.documentElement;
    const nextTheme = root.classList.contains('dark') ? 'light' : 'dark';
    root.classList.toggle('dark', nextTheme === 'dark');
    localStorage.setItem('stagepaid-theme', nextTheme);
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
                Provider workspace
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
            <Button
              variant="ghost"
              size="icon"
              aria-label="More project options"
            >
              <MoreHorizontal />
            </Button>
            <div
              className="grid size-8 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white"
              aria-label="Signed in as Jordan Lee"
            >
              JL
            </div>
          </div>
        </div>
      </header>

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
    </main>
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
