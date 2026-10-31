// Plain values shared by the plan step's forms and the server's checks, kept
// free of Zod so the forms don't pull it into the browser.

// The plan_actions table's VarChar(160) columns.
export const MAX_ACTION_LENGTH = 160
