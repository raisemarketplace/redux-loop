import { Action, ActionCreator, AnyAction, StoreEnhancer, Store } from 'redux';

export interface StoreCreator {
  <S, A extends Action>(
    reducer: LoopReducer<S, A>,
    preloadedState: S | undefined,
    enhancer: StoreEnhancer<S>
  ): Store<S>;
}

type WithDefaultActionHandling<T extends AnyAction> =
  | T
  | Action<'@@REDUX_LOOP/ENFORCE_DEFAULT_HANDLING'>;

export type Loop<S> = [S, CmdType];

export interface LoopReducer<S, A extends Action = AnyAction> {
  (state: S | undefined, action: WithDefaultActionHandling<A>, ...args: any[]):
    | S
    | Loop<S>;
}

export interface LoopReducerWithDefinedState<S, A extends Action = AnyAction> {
  (state: S, action: WithDefaultActionHandling<A>, ...args: any[]): S | Loop<S>;
}

export interface LiftedLoopReducer<S, A extends Action = AnyAction> {
  (
    state: S | undefined,
    action: WithDefaultActionHandling<A>,
    ...args: any[]
  ): Loop<S>;
}

export type CmdSimulation = {
  result: any;
  success: boolean;
};
export interface MultiCmdSimulation {
  [index: number]: CmdSimulation | MultiCmdSimulation;
}

export interface NoneCmd {
  readonly type: 'NONE';
  simulate(): null;
}

export interface ListCmd {
  readonly type: 'LIST';
  readonly cmds: CmdType[];
  readonly sequence?: boolean;
  readonly batch?: boolean;
  simulate(simulations: MultiCmdSimulation): AnyAction[];
}

export interface ActionCmd<A extends Action> {
  readonly type: 'ACTION';
  readonly actionToDispatch: A;
  simulate(): A;
}

export interface MapCmd<A extends Action = never> {
  readonly type: 'MAP';
  readonly tagger: ActionCreator<A>;
  readonly nestedCmd: CmdType;
  readonly args: any[];
  simulate(simulations?: CmdSimulation | MultiCmdSimulation): A[] | A | null;
}

export interface RunCmd<
  SuccessAction extends Action = never,
  FailAction extends Action = never
> {
  readonly type: 'RUN';
  readonly func: (...args: any[]) => any;
  readonly args?: any[];
  readonly failActionCreator?: ActionCreator<FailAction>;
  readonly successActionCreator?: ActionCreator<SuccessAction>;
  readonly forceSync?: boolean;
  simulate(simulation: CmdSimulation): SuccessAction | FailAction;
}

type UnknownAction = AnyAction | never;

export type CmdType =
  | ActionCmd<UnknownAction>
  | ListCmd
  | MapCmd<UnknownAction>
  | NoneCmd
  | RunCmd<UnknownAction, UnknownAction>;

export interface LoopConfig {
  readonly DONT_LOG_ERRORS_ON_HANDLED_FAILURES: boolean;
}

export function install<S>(config?: LoopConfig): StoreEnhancer<S>;

export function loop<S>(state: S, cmd: CmdType): Loop<S>;

export namespace Cmd {
  export const dispatch: unique symbol;
  export const getState: unique symbol;
  export const none: NoneCmd;
  export type Dispatch = <A extends Action>(a: A) => Promise<A>;
  export type GetState = <S>() => S;

  export function action<A extends Action>(action: A): ActionCmd<A>;

  export function list(
    cmds: CmdType[],
    options?: {
      batch?: boolean;
      sequence?: boolean;
      testInvariants?: boolean;
    }
  ): ListCmd;

  export function list(
    cmds: CmdType[],
    options?: {
      batch?: boolean;
      sequence?: boolean;
      testInvariants?: boolean;
    }
  ): ListCmd;

  export function map<A extends Action, B extends Action>(
    cmd: CmdType,
    tagger: (subAction: B) => A,
    args?: any[]
  ): MapCmd<A>;

  // Allow the use of special dispatch | getState symbols
  type ArgOrSymbol<T> = {
    [K in keyof T]: T[K] extends GetState
      ? typeof getState
      : T[K] extends Dispatch
      ? typeof dispatch
      : T[K];
  };

  export type PromiseResult<T> = T extends Promise<infer U> ? U : T;

  type RunFunc = (...args: any[]) => Promise<any> | any;

  type RunOptions<
    Func extends RunFunc,
    SuccessAction extends Action = never,
    FailAction extends Action = never,
    FailReason = unknown
  > = {
    args?: ArgOrSymbol<Parameters<Func>>;
    forceSync?: boolean;
    testInvariants?: boolean;
    successActionCreator: (
      value: PromiseResult<ReturnType<Func>>
    ) => SuccessAction;
    failActionCreator: (error: FailReason) => FailAction;
  };

  export function run<Func extends RunFunc>(
    f: Func,
    options?: Omit<
      RunOptions<Func>,
      'successActionCreator' | 'failActionCreator'
    >
  ): RunCmd<never, never>;

  export function run<
    Func extends (...args: any[]) => Promise<any> | any,
    SuccessAction extends Action
  >(
    f: Func,
    options: Omit<RunOptions<Func, SuccessAction>, 'failActionCreator'>
  ): RunCmd<SuccessAction, never>;

  export function run<
    Func extends (...args: any[]) => Promise<any> | any,
    FailAction extends Action,
    FailReason = unknown
  >(
    f: Func,
    options: Omit<
      RunOptions<Func, never, FailAction, FailReason>,
      'successActionCreator'
    >
  ): RunCmd<never, FailAction>;

  export function run<
    Func extends (...args: any[]) => Promise<any> | any,
    SuccessAction extends Action = never,
    FailAction extends Action = never,
    FailReason = unknown
  >(
    f: Func,
    options: RunOptions<Func, SuccessAction, FailAction, FailReason>
  ): RunCmd<SuccessAction, FailAction>;
}

export type ReducerMapObject<S> = {
  [K in keyof S]: LoopReducer<S[K]>;
};

export function combineReducers<S>(
  reducers: ReducerMapObject<S>
): LiftedLoopReducer<S>;

export function mergeChildReducers<S>(
  parentResult: S | Loop<S>,
  action: AnyAction,
  childMap: ReducerMapObject<S>
): Loop<S>;

export function reduceReducers<S, A extends Action = AnyAction>(
  initialReducer: LoopReducer<S, A>,
  ...reducers: Array<LoopReducerWithDefinedState<S, A>>
): LiftedLoopReducer<S, A>;

export function liftState<S, A extends Action>(state: S | Loop<S>): Loop<S>;

export function isLoop(test: any): boolean;

export function getModel<S>(loop: S | Loop<S>): S;

export function getCmd<A extends Action, B extends Action = never>(
  a: any
): CmdType | null;
export function getCmd(a: any): CmdType | null;
