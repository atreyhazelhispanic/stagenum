export type ReadinessCheckName = 'database' | 'schema';

export interface ReadinessCheck {
  readonly name: ReadinessCheckName;
  readonly status: 'pass' | 'fail';
}

export type ReadinessResult =
  | {
      readonly ready: true;
      readonly checks: readonly ReadinessCheck[];
    }
  | {
      readonly ready: false;
      readonly checks: readonly ReadinessCheck[];
    };
