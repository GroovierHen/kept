// What the promise step sends: one of the plan's actions, or a Typed promise,
// and when in the day (GLOSSARY.md). Defined once for the web and the app in
// @kept/contract; MAX_PROMISE_LENGTH is the same limit as an action's wording
// (src/lib/learn/plan.ts).
export {
	MAX_PROMISE_LENGTH,
	PROMISE_MOMENTS,
	promiseChoice,
	type PromiseChoice,
	type PromiseMoment
} from '@kept/contract'
