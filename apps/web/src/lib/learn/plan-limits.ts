// Plain values shared by the plan step's forms and the server's checks, kept
// free of Zod so the forms don't pull it into the browser. Defined once for
// the web and the app (the plan_actions table's VarChar(160) columns).
export { MAX_ACTION_LENGTH } from '@kept/contract/limits'
