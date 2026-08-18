/**
 * @module utils/constants
 *
 * Client constants inventory (§11.5) — mirrors the shared business
 * sets consumed by the UI. Freeze rules are identical to the backend
 * (§11.2): compound values are frozen on export, mutation of imported
 * constants is forbidden.
 */

/**
 * Domain — report state machine (mirror of §11.4).
 * @type {readonly string[]}
 */
export const REPORT_STATUSES = Object.freeze([
  'draft',
  'audio_attached',
  'transcribed',
  'generated',
]);

/**
 * Domain — English status labels (mirror of §11.4; chrome copy,
 * §7.6). The single label surface for §49.4 and the §46.13 badge —
 * one occurrence per string (§48.6).
 * @type {readonly Object<string, string>}
 */
export const REPORT_STATUS_LABELS = Object.freeze({
  draft: 'Draft',
  audio_attached: 'Audio attached',
  transcribed: 'Transcribed',
  generated: 'Generated',
});

/**
 * Domain — item row types (mirror of §11.4; §24A).
 * @type {readonly string[]}
 */
export const ITEM_TYPES = Object.freeze(['activity', 'issue', 'comment']);

/**
 * Domain — item status vocabulary (mirror of §11.4; §24A).
 * @type {readonly string[]}
 */
export const ITEM_STATUSES = Object.freeze(['reported', 'in_progress', 'completed']);

/**
 * Domain — per-type item status sets (mirror of §11.4; §24A.3):
 * the members an item of each type may take; `comment` has none.
 * @type {readonly Object<string, readonly string[]>}
 */
export const ITEM_STATUSES_BY_TYPE = Object.freeze({
  activity: Object.freeze(['completed', 'in_progress']),
  issue: Object.freeze(['reported', 'in_progress', 'completed']),
  comment: Object.freeze([]),
});

/**
 * Domain — provider ids (mirror of §11.4).
 * @type {readonly string[]}
 */
export const AI_PROVIDERS = Object.freeze(['addis', 'gemini', 'nvidia']);

/**
 * Domain — provider display labels (mirror of §11.4; the §16.2 model
 * registry shows the provider's default model, this map names the
 * provider itself for the correction dialog's selector). The NVIDIA
 * wire id renders as its hosted model's name ("deepseek flash 4",
 * §16.2) — chrome-only, the wire id stays `nvidia` (round-7
 * amendment).
 * @type {readonly Object<string, string>}
 */
export const AI_PROVIDER_LABELS = Object.freeze({
  addis: 'Addis',
  gemini: 'Gemini',
  nvidia: 'Deepseek',
});

/**
 * Domain — a selectable model entry (mirror of §11.4, §16.2).
 * @typedef {Object} ModelEntry
 * @property {string} id - Provider-native model id.
 * @property {boolean} default - True for the provider's default model.
 * @property {boolean} reasoning - True when the model supports reasoning efforts.
 */

/**
 * Domain — per-provider model registry (mirror of §11.4).
 * @type {readonly Object<string, readonly ModelEntry[]>}
 */
export const AI_MODELS = Object.freeze({
  addis: Object.freeze([
    Object.freeze({ id: 'Addis-፩-አሌፍ', default: true, reasoning: false }),
  ]),
  gemini: Object.freeze([
    Object.freeze({ id: 'gemini-3.1-flash-lite', default: true, reasoning: true }),
  ]),
  nvidia: Object.freeze([
    Object.freeze({ id: 'deepseek flash 4', default: true, reasoning: true }),
  ]),
});

/**
 * Domain — reasoning effort levels (mirror of §11.4).
 * @type {readonly string[]}
 */
export const AI_REASONING_EFFORTS = Object.freeze(['off', 'low', 'medium', 'high']);

/**
 * Pagination defaults (mirror of §11.3).
 * @type {number}
 */
export const PAGINATION_DEFAULT_PAGE = 1;

/**
 * @type {number}
 */
export const PAGINATION_DEFAULT_LIMIT = 10;

/**
 * @type {number}
 */
export const PAGINATION_MAX_LIMIT = 100;

/**
 * Audio upload constraints (mirror of §11.3).
 * @type {number}
 */
export const AUDIO_MAX_DURATION_SEC = 900;

/**
 * @type {number}
 */
export const AUDIO_MAX_SIZE_BYTES = 52428800;

/**
 * @type {readonly string[]}
 */
export const AUDIO_ALLOWED_MIME_TYPES = Object.freeze([
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/webm',
]);

/**
 * Editor font-size option menu (round-8 amendment: the 10–16px
 * preset ladder, §46.16). `value: 0` is the unset sentinel — the
 * editor clears the selection's font size (the inherited ~17px
 * writing size). Values are applied with a `px` suffix by the
 * toolbar (the text-style extension emits the inline style bare).
 * @type {readonly Array<readonly {value: number, label: string}>}
 */
export const FONT_SIZES = Object.freeze([
  Object.freeze({ value: 0, label: 'Default' }),
  Object.freeze({ value: 10, label: '10' }),
  Object.freeze({ value: 11, label: '11' }),
  Object.freeze({ value: 12, label: '12' }),
  Object.freeze({ value: 14, label: '14' }),
  Object.freeze({ value: 16, label: '16' }),
]);

/**
 * Toast — the §60.6 catalogue, single-sourced (one occurrence per
 * string). Chrome copy in English (§7.6). The `{query}` placeholder
 * is substituted by callers at trigger time.
 * @type {readonly Object<string, readonly Object<string, string>>}
 */
export const TOAST_CATALOGUE = Object.freeze({
  report: Object.freeze({
    created: 'Report created',
    archived: 'Report archived',
    restored: 'Report restored',
    deleted: 'Report deleted',
    saved: 'Report content saved',
    reverted: 'Report reverted to the original',
  }),
  branch: Object.freeze({
    created: 'Branch created',
    updated: 'Branch updated',
    archived: 'Branch archived — reports keep their data',
    restored: 'Branch restored',
    deleted: 'Branch deleted — it will be removed after the retention period',
  }),
  clip: Object.freeze({ deleted: 'Clip deleted' }),
  audio: Object.freeze({
    permissionDenied: 'Microphone unavailable — attach an audio file instead',
    cap: 'Recording stopped at the 15-minute cap',
    uploadFailed: 'The take failed to upload — try again',
    attachFailed: 'The takes could not be attached — they are kept',
    attached: 'Takes attached to the report',
    rejectedMime: 'Unsupported audio format — MP3, WAV, MP4 or WebM only',
    rejectedSize: 'That audio is larger than the 50 MB cap',
    rejectedDuration: 'That audio is longer than the 15-minute cap',
  }),
  transcription: Object.freeze({
    ready: 'Transcription ready',
    retried: 'Take re-transcribed',
    saved: 'Transcription saved',
    reverted: 'Reverted to the original',
  }),
  generation: Object.freeze({ ready: 'Report generated — please review' }),
  correction: Object.freeze({
    generated: 'Correction generated — review and save',
  }),
  export: Object.freeze({ ready: 'Export ready' }),
  auth: Object.freeze({
    loggedOut: 'You have been logged out',
    loggedIn: 'Welcome back',
    accountCreated: 'Account created — please log in',
  }),
  session: Object.freeze({ ended: 'Session ended' }),
  error: Object.freeze({
    generic: 'Something went wrong — please try again',
    offline: 'You appear to be offline',
  }),
  search: Object.freeze({ noResults: 'No results for "{query}"' }),
});

/**
 * Avatar upload constraints (mirror of §11.3, §29 chain).
 * @type {number}
 */
export const AVATAR_MAX_SIZE_BYTES = 5242880;

/**
 * @type {readonly string[]}
 */
export const AVATAR_ALLOWED_MIME_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * Domain — the official-text token prefix (mirror of §11.3
 * `OFFICIAL_TOKEN_PREFIX`): marks entitled text the user must not
 * freely alias (§35.3). The client renders `±` strings verbatim —
 * never resolves, strips, or translates them (resolution is
 * server-side at export, §37/§64).
 * @type {string}
 */
export const OFFICIAL_TOKEN_PREFIX = '±';

/**
 * Toast — auto-dismiss durations in ms (§60.5: success 5s, error and
 * warning 8s; info follows the success cadence; loading never
 * auto-dismisses — the caller dismisses it on completion).
 * @type {readonly Object<string, number>}
 */
export const TOAST_AUTO_DISMISS_MS = Object.freeze({
  success: 5000,
  info: 5000,
  error: 8000,
  warning: 8000,
});

/**
 * Pickers — display formats (§46.6): the Ethiopian date picker shows
 * `DD-MM-YY` (the adapter re-maps the tokens to Ethiopian parts) and
 * the time picker shows 24h `HH:mm` (the print convention, §43.6).
 * @type {string}
 */
export const PICKER_DATE_FORMAT = 'DD-MM-YY';
export const PICKER_TIME_FORMAT = 'HH:mm';

/**
 * Pickers — English chrome labels of the Ethiopian months (§43.6,
 * ADR-011): the 13 months map to English month names; Pagume renders
 * as "Pagume" and never as a Gregorian equivalent. Indexed by
 * Ethiopian month − 1.
 * @type {readonly string[]}
 */
export const ETHIOPIAN_MONTH_LABELS = Object.freeze([
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'Pagume',
]);

/**
 * Report-creation wizard — every copy string of the four-step
 * creation flow (the §52 wizard surface): the step labels and
 * headings, the nav-bar labels, the leave-flow confirmation, the
 * visited-branch picker copy, the step-1 field labels and validation
 * messages, the summary ribbon's block labels, and the placeholder
 * surface for the not-yet-built steps. No copy lives in the pages
 * (§60.7 copy-from-owning-section; §11 no magic literals).
 * @type {readonly Object}
 */
export const WIZARD = Object.freeze({
  pageTitle: 'New report',
  closeLabel: 'Close',
  steps: Object.freeze([
    'Basic info & Visits',
    'Audio',
    'Transcription',
    'Report',
  ]),
  sectionSummaryLine: 'This section has issues, review them below',
  nav: Object.freeze({
    previous: 'Previous',
    next: 'Next',
  }),
  close: Object.freeze({
    title: 'Leave the flow?',
    message: 'The report is not created yet — nothing you entered will be saved.',
    confirm: 'Leave',
    cancel: 'Stay',
  }),
  visited: Object.freeze({
    button: 'Add visited branches',
    pickerTitle: 'Visited branches',
    apply: 'Apply',
    cancel: 'Cancel',
    loading: 'Loading branches…',
    emptyTitle: 'No branches yet',
    emptyDescription: 'Create a branch from the Branches page, then return here.',
    mainLockHint: 'The main branch is always part of the day',
  }),
  fieldLabels: Object.freeze({
    date: 'Report date',
    clockIn: 'Clock in',
    clockOut: 'Clock out',
    branch: 'Main branch',
    supervisor: 'Supervisor',
    visited: 'Visited branches',
  }),
  ribbon: Object.freeze({
    date: 'Report date',
    branch: 'Main branch',
    times: 'Day times',
    supervisor: 'Supervisor',
  }),
  step1: Object.freeze({
    dateRequired: 'Pick the report date',
    clockInRequired: 'Enter the time you got in',
    clockOutRequired: 'Enter the time you got out',
    clockOutAfterClockIn: 'Exit time must be later than entry time',
    branchRequired: 'Choose the main branch',
    branchPlaceholder: 'Choose a branch',
    supervisorRequired: 'Enter the supervisor\u2019s name',
    supervisorTooLong: 'The supervisor\u2019s name is too long (100 max)',
    visitTimesRequired: "Enter this branch's times",
    visitClockOutAfterClockIn:
      'Exit time must be later than entry time for this branch',
  }),
  audio: Object.freeze({
    inviteTitle: "Tell the day's story",
    inviteParts:
      'Record what happened at each visit, or attach audio you already have.',
    attach: 'Attach files',
    attachHint: 'Drop audio anywhere on this panel, or pick files',
    narrations: 'Narrations',
    orbStart: 'Start recording',
    orbStop: 'Stop recording',
    orbReplace: 'Re-record take {number}',
    replaceCancel: 'Cancel',
    takeNumber: 'Take {number}',
    reRecord: 'Re-record',
    deleteTake: 'Delete take',
    deleteTitle: 'Delete this take?',
    deleteMessage: 'The take is removed from the report — this cannot be undone.',
    deleteConfirm: 'Delete',
    deleteCancel: 'Keep',
    duplicateNote: 'Same file already in the report — skipped',
    mimeNote: 'Unsupported audio format — MP3, WAV, MP4 or WebM only',
    sizeNote: 'Larger than the 50 MB cap — not added',
    durationNote: 'Longer than the 15-minute cap — not added',
    uploading: 'Uploading…',
  }),
  transcription: Object.freeze({
    ledgerTitle: "The day's takes",
    ledgerSubtitle: 'Clips recorded in the audio step',
    transcribe: 'Transcribe',
    transcribing: 'Transcribing…',
    storyDivider: "The day's story",
    storySubtitle: "The day's account — corrected and saved",
    addCorrection: 'Add a correction instruction',
    failedLine: "Couldn't transcribe this take",
    retry: 'Retry',
    reTranscribe: 'Re-transcribe this take',
    storyChangeNotice: 'Content changed — please review',
    emptyTitle: 'Nothing here yet',
    emptyDescription:
      'Record at least one take in the audio step, then return here to transcribe.',
  }),
  modes: Object.freeze({
    revision: 'Refine the story',
    instructionPlaceholder: 'Type what should be corrected...',
    recordInstruction: 'Record the correction instruction',
    transcribingInstruction: 'Transcribing your instruction…',
    save: 'Save',
    revertToOriginal: 'Revert to original',
    apply: 'Apply',
    cancel: 'Cancel',
    aiProvider: 'AI Provider',
    savedAt: 'Saved {time}',
    savedJustNow: 'Saved just now',
    unsaved: 'Unsaved changes',
    saving: 'Saving…',
    noChanges: 'No changes yet',
  }),
  report: Object.freeze({
    title: 'The report',
    generate: 'Generate the report',
    generating: 'Writing the report…',
    generateHint:
      'The report is written from today\u2019s takes — generated content stays editable for review.',
    generateEmptyTitle: 'The day is heard',
    generateEmptyDescription:
      'Generate the report from the reviewed transcription, then edit it here.',
    generateFirst: 'Generate the report before finishing',
    emptyBlock: 'The report has no text yet — write or generate it first',
    tokenGuide:
      '\u00B1: leave this token untouched \u2014 it maps to official text',
    tokenGuideToggle: 'Show the official-token guidance',
    exportLabel: 'Export',
    exportMenu: Object.freeze({
      print: 'Print / Save as PDF',
      txt: 'Download TXT',
      xlsx: 'Download XLSX',
      xlsxComing: 'Coming with the export round',
      csv: 'Export selected table as CSV',
      csvComing: 'Available with the export round',
    }),
    finishLabel: 'Finish',
    createLabel: 'Create',
  }),
  toolbar: Object.freeze({
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    paragraph: 'Paragraph',
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    fontSize: 'Font size',
    bulletList: 'Bullet list',
    orderedList: 'Numbered list',
    alignLeft: 'Align left',
    alignCenter: 'Align center',
    alignRight: 'Align right',
    alignJustify: 'Justify',
    undo: 'Undo',
    redo: 'Redo',
  }),
});