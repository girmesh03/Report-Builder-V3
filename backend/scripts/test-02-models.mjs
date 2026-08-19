/**
 * Sub-phase 2 — Models verification suite (§63.10).
 *
 * Terminal-visible contract: every check prints a labeled `MODEL
 * CHECK` line with the assertion, then a PASS/FAIL verdict. The suite
 * ends with PASS=N FAIL=M and exits non-zero on any failure. Output
 * goes through process.stdout.write (no console.log literal —
 * §9.5/§63.4 grep-gate clean). Zero new dependencies (Node 24,
 * built-in imports only).
 *
 * Run: from backend/ — NO server required (models are verified
 * in-memory: document construction, validate(), toJSON, bcrypt).
 *   node scripts/test-02-models.mjs
 *   node scripts/test-02-models.mjs --only=user
 *
 * Scope: the seven §19–§24A models — path sets, required/defaults,
 * enum membership against the §11 constants, exact index
 * declarations, the single TTL index, transforms (id/__v/filePath/
 * password exposure), User hashing + fullName + comparePassword,
 * Item per-type validators, ChatConversation message surface.
 */
import process from 'node:process';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Branch from '../models/branch.model.js';
import Report from '../models/report.model.js';
import Audio from '../models/audio.model.js';
import Transcription from '../models/transcription.model.js';
import ChatConversation from '../models/chatConversation.model.js';
import Item from '../models/item.model.js';
import {
  ARCHIVED_TTL_SECONDS,
  AUDIO_ALLOWED_MIME_TYPES,
  AI_PROVIDERS,
  AI_REASONING_DEFAULT,
  AI_REASONING_EFFORTS,
  BCRYPT_SALT_ROUNDS,
  ITEM_STATUSES,
  ITEM_STATUSES_BY_TYPE,
  ITEM_TYPES,
  LANGUAGE_CODES,
  MESSAGE_ROLES,
  REPORT_STATUSES,
} from '../utils/constants.js';

const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7);

let pass = 0;
let fail = 0;

function out(line = '') {
  process.stdout.write(`${line}\n`);
}

function verdict(name, ok, detail = '') {
  if (ok) {
    pass += 1;
    out(`  PASS \u2713 ${name}`);
  } else {
    fail += 1;
    out(`  FAIL \u2717 ${name}${detail ? ` \u2014 ${detail}` : ''}`);
  }
}

function section(title) {
  out(`\u2500\u2500\u2500 ${title} \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
}

function expect(ok, label) {
  return [ok, label];
}

function modelCheck(id, name, fn) {
  out(`MODEL CHECK [${id}] ${name}`);
  try {
    const failures = fn();
    const problems = failures.filter(([ok]) => !ok);
    verdict(name, problems.length === 0, problems.length ? `failed: ${problems.map(([, l]) => l).join('; ')}` : '');
  } catch (err) {
    fail += 1;
    out(`  FAIL \u2717 ${name} \u2014 threw ${err.message}`);
  }
}

const checks = [];
function addCheck(group, id, name, fn) {
  checks.push({ group, id, name, fn });
}

// ---------------------------------------------------------------------------
// §19 User
// ---------------------------------------------------------------------------

addCheck('user', 1, 'user paths match §19.2 registry', () =>
  modelCheck(1, 'user paths match §19.2 registry', () => {
    const paths = User.schema.paths;
    const expected = ['_id', 'email', 'password', 'firstName', 'lastName', 'avatar', 'position', 'createdAt', 'updatedAt'];
    const actual = Object.keys(paths).filter((p) => p !== '__v').sort();
    const missing = expected.filter((p) => !actual.includes(p));
    const extra = actual.filter((p) => !expected.includes(p));
    const checks = [];
    checks.push(expect(missing.length === 0 && extra.length === 0, `paths ${missing.length ? `missing ${missing.join(',')}` : ''}${extra.length ? ` extra ${extra.join(',')}` : ''}`));
    checks.push(expect(paths.email.instance === 'String' && paths.email.isRequired, 'email String required'));
    checks.push(expect(paths.password.instance === 'String' && !paths.password.isRequired && paths.password.options.select === false, 'password String optional select:false'));
    checks.push(expect(paths.firstName.instance === 'String' && paths.firstName.isRequired, 'firstName String required'));
    checks.push(expect(paths.lastName.instance === 'String' && paths.lastName.isRequired, 'lastName String required'));
    checks.push(expect(paths.avatar.instance === 'String' && paths.avatar.defaultValue === null, 'avatar String null default'));
    checks.push(expect(paths.position.instance === 'String' && paths.position.defaultValue === null, 'position String null default'));
    checks.push(expect(!('user' in paths), 'no user field (ownership root §18.7)'));
    return checks;
  }));

addCheck('user', 2, 'user indexes: unique email only (§19.3)', () =>
  modelCheck(2, 'user indexes: unique email only (§19.3)', () => {
    const idx = User.schema.indexes().map(([spec, opts]) => ({ spec, opts }));
    const checks = [];
    checks.push(expect(idx.length === 1, `exactly 1 index, got ${idx.length}`));
    const email = idx[0];
    checks.push(expect(JSON.stringify(email.spec) === JSON.stringify({ email: 1 }), `email spec, got ${JSON.stringify(email.spec)}`));
    checks.push(expect(email.opts.unique === true, 'unique true'));
    checks.push(expect(email.opts.sparse === undefined, 'not sparse'));
    return checks;
  }));

addCheck('user', 3, 'user pre-save hashing hook exists (§19.4)', () =>
  modelCheck(3, 'user pre-save hashing hook exists (§19.4)', () => {
    const hooks = User.schema.s?.hooks;
    const saveHooks = hooks?._pres?.get?.('save') || [];
    return [expect(saveHooks.length >= 1, `save pre-hook registered, got ${saveHooks.length}`)];
  }));

addCheck('user', 4, 'user fullName virtual (§19.4)', () =>
  modelCheck(4, 'user fullName virtual (§19.4)', () => {
    const doc = new User({ email: 'beza.ayalew@example.com', firstName: 'beza', lastName: 'ayalew' });
    const checks = [];
    checks.push(expect(doc.fullName === 'beza ayalew', `fullName = ${doc.fullName}`));
    const json = doc.toJSON();
    checks.push(expect(json.fullName === 'beza ayalew', 'fullName serialized'));
    return checks;
  }));

addCheck('user', 5, 'user comparePassword true/false/no-password (§19.4)', async () => {
  const hash = await bcrypt.hash('secret-42', BCRYPT_SALT_ROUNDS);
  const withPass = new User({ email: 'a@b.c', firstName: 'a', lastName: 'b', password: hash });
  const noPass = new User({ email: 'x@y.z', firstName: 'x', lastName: 'y' });
  const t = await withPass.comparePassword('secret-42');
  const f = await withPass.comparePassword('wrong');
  const n = await noPass.comparePassword('anything');
  out(`MODEL CHECK [5] user comparePassword — hash rounds=${BCRYPT_SALT_ROUNDS}`);
  verdict('user comparePassword true/false/no-password (§19.4)', t === true && f === false && n === false, `got ${t}/${f}/${n}`);
});

addCheck('user', 6, 'user transforms strip id/__v, never password (§19.5)', () =>
  modelCheck(6, 'user transforms strip id/__v, never password (§19.5)', () => {
    const doc = new User({ email: 'a@b.c', firstName: 'a', lastName: 'b', password: 'plaintext-never-serialized' });
    const json = doc.toJSON();
    const obj = doc.toObject();
    const checks = [];
    checks.push(expect(!('id' in json) && !('__v' in json), 'toJSON no id/__v'));
    checks.push(expect(!('password' in json), 'toJSON no password'));
    checks.push(expect(!('id' in obj) && !('__v' in obj), 'toObject no id/__v'));
    checks.push(expect(json._id !== undefined, '_id present'));
    return checks;
  }));

// ---------------------------------------------------------------------------
// §20 Branch
// ---------------------------------------------------------------------------

addCheck('branch', 7, 'branch paths match §20.2 registry', () =>
  modelCheck(7, 'branch paths match §20.2 registry', () => {
    const paths = Branch.schema.paths;
    const expected = ['_id', 'user', 'name', 'location', 'isArchived', 'archivedAt', 'createdAt', 'updatedAt'];
    const actual = Object.keys(paths).filter((p) => p !== '__v').sort();
    const missing = expected.filter((p) => !actual.includes(p));
    const extra = actual.filter((p) => !expected.includes(p));
    const checks = [];
    checks.push(expect(missing.length === 0 && extra.length === 0, `paths ${missing.length ? `missing ${missing.join(',')}` : ''}${extra.length ? ` extra ${extra.join(',')}` : ''}`));
    checks.push(expect(paths.user.instance === 'ObjectId' && paths.user.isRequired && paths.user.options.ref === 'User', 'user ObjectId required ref User'));
    checks.push(expect(paths.name.instance === 'String' && paths.name.isRequired, 'name String required'));
    checks.push(expect(paths.location.instance === 'String' && paths.location.isRequired, 'location String required'));
    checks.push(expect(paths.isArchived.instance === 'Boolean' && paths.isArchived.defaultValue === false, 'isArchived Boolean default false'));
    checks.push(expect(paths.archivedAt.instance === 'Date' && paths.archivedAt.defaultValue === null, 'archivedAt Date null default'));
    return checks;
  }));

addCheck('branch', 8, 'branch index { user, isArchived, name } and no TTL (§20.3)', () =>
  modelCheck(8, 'branch index { user, isArchived, name } and no TTL (§20.3)', () => {
    const idx = Branch.schema.indexes().map(([spec, opts]) => ({ spec, opts }));
    const checks = [];
    checks.push(expect(idx.length === 1, `exactly 1 index, got ${idx.length}`));
    const main = idx[0];
    checks.push(expect(JSON.stringify(main.spec) === JSON.stringify({ user: 1, isArchived: 1, name: 1 }), `spec, got ${JSON.stringify(main.spec)}`));
    checks.push(expect(main.opts.expireAfterSeconds === undefined, 'no TTL index'));
    return checks;
  }));

addCheck('branch', 9, 'branch transforms strip id/__v (§20.7)', () =>
  modelCheck(9, 'branch transforms strip id/__v (§20.7)', () => {
    const doc = new Branch({ user: new mongoose.Types.ObjectId(), name: 'limu', location: 'AA' });
    const json = doc.toJSON();
    return [expect(!('id' in json) && !('__v' in json) && json._id !== undefined, 'no id/__v, _id present')];
  }));

// ---------------------------------------------------------------------------
// §21 Report
// ---------------------------------------------------------------------------

addCheck('report', 10, 'report paths match §21.2 registry', () =>
  modelCheck(10, 'report paths match §21.2 registry', () => {
    const paths = Report.schema.paths;
    const expected = ['_id', 'user', 'date', 'branch', 'clockIn', 'clockOut', 'visits', 'status', 'transcription', 'isArchived', 'archivedAt', 'createdAt', 'updatedAt'];
    const actual = Object.keys(paths).filter((p) => p !== '__v').sort();
    const missing = expected.filter((p) => !actual.includes(p));
    const extra = actual.filter((p) => !expected.includes(p));
    const checks = [];
    checks.push(expect(missing.length === 0 && extra.length === 0, `paths ${missing.length ? `missing ${missing.join(',')}` : ''}${extra.length ? ` extra ${extra.join(',')}` : ''}`));
    checks.push(expect(paths.user.instance === 'ObjectId' && paths.user.isRequired, 'user ObjectId required'));
    checks.push(expect(paths.date.instance === 'Date' && paths.date.defaultValue === null, 'date Date null default'));
    checks.push(expect(paths.branch.instance === 'ObjectId' && paths.branch.isRequired && paths.branch.options.ref === 'Branch', 'branch ObjectId required ref Branch'));
    checks.push(expect(paths.clockIn.instance === 'String' && paths.clockIn.isRequired, 'clockIn String required'));
    checks.push(expect(paths.clockOut.instance === 'String' && paths.clockOut.isRequired, 'clockOut String required'));
    checks.push(expect(paths.visits.instance === 'Array' && paths.visits.isRequired, 'visits Array required'));
    checks.push(expect(paths.status.instance === 'String' && paths.status.isRequired, 'status String required'));
    checks.push(expect(paths.status.defaultValue === REPORT_STATUSES[0], `status default ${paths.status.defaultValue} vs ${REPORT_STATUSES[0]}`));
    checks.push(expect(paths.transcription.instance === 'ObjectId' && paths.transcription.defaultValue === null, 'transcription ObjectId null default'));
    checks.push(expect(paths.isArchived.instance === 'Boolean' && paths.isArchived.defaultValue === false, 'isArchived Boolean default false'));
    checks.push(expect(paths.archivedAt.instance === 'Date' && paths.archivedAt.defaultValue === null, 'archivedAt Date null default'));
    return checks;
  }));

addCheck('report', 11, 'report visits subdocs: _id:false, { branch, clockIn, clockOut } required (§21.2)', () =>
  modelCheck(11, 'report visits subdocs: _id:false, { branch, clockIn, clockOut } required (§21.2)', () => {
    const visitPath = Report.schema.path('visits');
    const schema = visitPath?.schema;
    const checks = [];
    checks.push(expect(!!schema, 'visits subdocument schema exists'));
    if (schema) {
      checks.push(expect(schema.options._id === false, 'visits _id:false'));
      const vp = schema.paths;
      checks.push(expect(vp.branch?.instance === 'ObjectId' && vp.branch.isRequired && vp.branch.options.ref === 'Branch', 'visit branch ObjectId required'));
      checks.push(expect(vp.clockIn?.instance === 'String' && vp.clockIn.isRequired, 'visit clockIn String required'));
      checks.push(expect(vp.clockOut?.instance === 'String' && vp.clockOut.isRequired, 'visit clockOut String required'));
      const keys = Object.keys(vp);
      checks.push(expect(keys.length === 3, `visit fields exactly 3, got ${keys.join(',')}`));
    }
    return checks;
  }));

addCheck('report', 12, 'report status enum = REPORT_STATUSES (§21.2)', () =>
  modelCheck(12, 'report status enum = REPORT_STATUSES (§21.2)', () => {
    const enums = Report.schema.path('status').enumValues;
    return [expect(JSON.stringify([...enums].sort()) === JSON.stringify([...REPORT_STATUSES].sort()), `enum ${JSON.stringify(enums)} vs ${JSON.stringify(REPORT_STATUSES)}`)];
  }));

addCheck('report', 13, 'report indexes match §21.3 (6 + TTL)', () =>
  modelCheck(13, 'report indexes match §21.3 (6 + TTL)', () => {
    const idx = Report.schema.indexes().map(([spec, opts]) => ({ spec, opts }));
    const specs = idx.map((i) => JSON.stringify(i.spec)).sort();
    const expectedSpecs = [
      JSON.stringify({ user: 1, isArchived: 1, date: -1, createdAt: -1 }),
      JSON.stringify({ user: 1, branch: 1 }),
      JSON.stringify({ user: 1, 'visits.branch': 1 }),
      JSON.stringify({ user: 1, date: 1 }),
      JSON.stringify({ user: 1, status: 1 }),
      JSON.stringify({ transcription: 1 }),
      JSON.stringify({ archivedAt: 1 }),
    ].sort();
    const checks = [];
    checks.push(expect(idx.length === 7, `7 indexes, got ${idx.length}`));
    checks.push(expect(JSON.stringify(specs) === JSON.stringify(expectedSpecs), `specs ${specs.join(' | ')}`));
    const trans = idx.find((i) => JSON.stringify(i.spec) === JSON.stringify({ transcription: 1 }));
    checks.push(expect(trans?.opts.unique === true && trans?.opts.sparse === true, 'transcription unique sparse'));
    const ttl = idx.find((i) => JSON.stringify(i.spec) === JSON.stringify({ archivedAt: 1 }));
    checks.push(expect(ttl?.opts.expireAfterSeconds === ARCHIVED_TTL_SECONDS, `TTL expireAfterSeconds=${ttl?.opts.expireAfterSeconds} vs ${ARCHIVED_TTL_SECONDS}`));
    return checks;
  }));

addCheck('report', 14, 'report transforms strip id/__v, visits serialize plainly (§21.9)', () =>
  modelCheck(14, 'report transforms strip id/__v, visits serialize plainly (§21.9)', () => {
    const oid = () => new mongoose.Types.ObjectId();
    const doc = new Report({
      user: oid(), branch: oid(), clockIn: '08:00', clockOut: '17:00',
      visits: [{ branch: oid(), clockIn: '08:00', clockOut: '17:00' }],
    });
    const json = doc.toJSON();
    const checks = [];
    checks.push(expect(!('id' in json) && !('__v' in json) && json._id !== undefined, 'no id/__v, _id present'));
    checks.push(expect(Array.isArray(json.visits) && json.visits.length === 1, 'visits serialized as array'));
    checks.push(expect(json.visits[0]._id === undefined, 'visit entry has no _id'));
    checks.push(expect(json.visits[0].branch !== undefined && json.visits[0].clockIn === '08:00', 'visit fields intact'));
    return checks;
  }));

// ---------------------------------------------------------------------------
// §22 Audio
// ---------------------------------------------------------------------------

addCheck('audio', 15, 'audio paths match §22.2 registry', () =>
  modelCheck(15, 'audio paths match §22.2 registry', () => {
    const paths = Audio.schema.paths;
    const expected = ['_id', 'user', 'report', 'filePath', 'mimeType', 'sizeBytes', 'durationSec', 'createdAt', 'updatedAt'];
    const actual = Object.keys(paths).filter((p) => p !== '__v').sort();
    const missing = expected.filter((p) => !actual.includes(p));
    const extra = actual.filter((p) => !expected.includes(p));
    const checks = [];
    checks.push(expect(missing.length === 0 && extra.length === 0, `paths ${missing.length ? `missing ${missing.join(',')}` : ''}${extra.length ? ` extra ${extra.join(',')}` : ''}`));
    checks.push(expect(paths.user.instance === 'ObjectId' && paths.user.isRequired, 'user ObjectId required'));
    checks.push(expect(paths.report.instance === 'ObjectId' && paths.report.isRequired && paths.report.options.ref === 'Report', 'report ObjectId required ref Report'));
    checks.push(expect(paths.filePath.instance === 'String' && paths.filePath.isRequired, 'filePath String required'));
    checks.push(expect(paths.mimeType.instance === 'String' && paths.mimeType.isRequired, 'mimeType String required'));
    checks.push(expect(paths.sizeBytes.instance === 'Number' && paths.sizeBytes.isRequired, 'sizeBytes Number required'));
    checks.push(expect(paths.durationSec.instance === 'Number' && paths.durationSec.isRequired, 'durationSec Number required'));
    checks.push(expect(!('status' in paths) && !('isArchived' in paths) && !('deletedAt' in paths), 'no status/isArchived/deletedAt'));
    return checks;
  }));

addCheck('audio', 16, 'audio mimeType enum = AUDIO_ALLOWED_MIME_TYPES (§22.2)', () =>
  modelCheck(16, 'audio mimeType enum = AUDIO_ALLOWED_MIME_TYPES (§22.2)', () => {
    const enums = Audio.schema.path('mimeType').enumValues;
    return [expect(JSON.stringify([...enums].sort()) === JSON.stringify([...AUDIO_ALLOWED_MIME_TYPES].sort()), `enum ${JSON.stringify(enums)} vs ${JSON.stringify(AUDIO_ALLOWED_MIME_TYPES)}`)];
  }));

addCheck('audio', 17, 'audio indexes { user } + { user, report }, no TTL (§22.3)', () =>
  modelCheck(17, 'audio indexes { user } + { user, report }, no TTL (§22.3)', () => {
    const idx = Audio.schema.indexes().map(([spec, opts]) => ({ spec, opts }));
    const specs = idx.map((i) => JSON.stringify(i.spec)).sort();
    const expected = [JSON.stringify({ user: 1 }), JSON.stringify({ user: 1, report: 1 })].sort();
    const checks = [];
    checks.push(expect(idx.length === 2, `2 indexes, got ${idx.length}`));
    checks.push(expect(JSON.stringify(specs) === JSON.stringify(expected), `specs ${specs.join(' | ')}`));
    checks.push(expect(idx.every((i) => i.opts.expireAfterSeconds === undefined), 'no TTL index'));
    return checks;
  }));

addCheck('audio', 18, 'audio transforms strip id/__v AND filePath (§22.7)', () =>
  modelCheck(18, 'audio transforms strip id/__v AND filePath (§22.7)', () => {
    const doc = new Audio({
      user: new mongoose.Types.ObjectId(), report: new mongoose.Types.ObjectId(),
      filePath: 'backend/uploads/audio/secret.wav', mimeType: 'audio/wav', sizeBytes: 1024, durationSec: 12,
    });
    const json = doc.toJSON();
    const checks = [];
    checks.push(expect(!('id' in json) && !('__v' in json), 'no id/__v'));
    checks.push(expect(!('filePath' in json), 'filePath stripped'));
    checks.push(expect(json._id !== undefined && json.mimeType === 'audio/wav' && json.sizeBytes === 1024, 'metadata surface intact'));
    return checks;
  }));

// ---------------------------------------------------------------------------
// §23 Transcription
// ---------------------------------------------------------------------------

addCheck('transcription', 19, 'transcription paths match §23.2 registry', () =>
  modelCheck(19, 'transcription paths match §23.2 registry', () => {
    const paths = Transcription.schema.paths;
    const expected = ['_id', 'user', 'report', 'raw', 'latest', 'language', 'stt', 'createdAt', 'updatedAt'];
    const actual = Object.keys(paths).filter((p) => p !== '__v').sort();
    const missing = expected.filter((p) => !actual.includes(p));
    const extra = actual.filter((p) => !expected.includes(p));
    const checks = [];
    checks.push(expect(missing.length === 0 && extra.length === 0, `paths ${missing.length ? `missing ${missing.join(',')}` : ''}${extra.length ? ` extra ${extra.join(',')}` : ''}`));
    checks.push(expect(paths.user.instance === 'ObjectId' && paths.user.isRequired, 'user ObjectId required'));
    checks.push(expect(paths.report.instance === 'ObjectId' && paths.report.isRequired, 'report ObjectId required'));
    checks.push(expect(paths.raw.instance === 'String' && paths.raw.isRequired, 'raw String required'));
    checks.push(expect(paths.latest.instance === 'String' && paths.latest.isRequired, 'latest String required'));
    checks.push(expect(paths.language.instance === 'String' && paths.language.isRequired, 'language String required'));
    checks.push(expect(paths.language.defaultValue === LANGUAGE_CODES.am, `language default ${paths.language.defaultValue} vs ${LANGUAGE_CODES.am}`));
    checks.push(expect(!('status' in paths) && !('deletedAt' in paths), 'no status/deletedAt'));
    return checks;
  }));

addCheck('transcription', 20, 'transcription language enum = LANGUAGE_CODES (§23.2)', () =>
  modelCheck(20, 'transcription language enum = LANGUAGE_CODES (§23.2)', () => {
    const enums = Transcription.schema.path('language').enumValues;
    const expected = Object.values(LANGUAGE_CODES);
    return [expect(JSON.stringify([...enums].sort()) === JSON.stringify([...expected].sort()), `enum ${JSON.stringify(enums)} vs ${JSON.stringify(expected)}`)];
  }));

addCheck('transcription', 21, 'transcription stt subdoc { requestId, model } _id:false (§23.2)', () =>
  modelCheck(21, 'transcription stt subdoc { requestId, model } _id:false (§23.2)', () => {
    const sttPath = Transcription.schema.path('stt');
    const schema = sttPath?.schema;
    const checks = [];
    checks.push(expect(!!schema, 'stt subdocument schema exists'));
    if (schema) {
      checks.push(expect(schema.options._id === false, 'stt _id:false'));
      const sp = schema.paths;
      checks.push(expect(sp.requestId?.instance === 'String' && sp.requestId.defaultValue === null, 'stt.requestId String null default'));
      checks.push(expect(sp.model?.instance === 'String' && sp.model.defaultValue === null, 'stt.model String null default'));
      checks.push(expect(Object.keys(sp).length === 2, `stt fields exactly 2, got ${Object.keys(sp).join(',')}`));
    }
    return checks;
  }));

addCheck('transcription', 22, 'transcription indexes { user } + { report } unique sparse (§23.3)', () =>
  modelCheck(22, 'transcription indexes { user } + { report } unique sparse (§23.3)', () => {
    const idx = Transcription.schema.indexes().map(([spec, opts]) => ({ spec, opts }));
    const specs = idx.map((i) => JSON.stringify(i.spec)).sort();
    const expected = [JSON.stringify({ user: 1 }), JSON.stringify({ report: 1 })].sort();
    const checks = [];
    checks.push(expect(idx.length === 2, `2 indexes, got ${idx.length}`));
    checks.push(expect(JSON.stringify(specs) === JSON.stringify(expected), `specs ${specs.join(' | ')}`));
    const one = idx.find((i) => JSON.stringify(i.spec) === JSON.stringify({ report: 1 }));
    checks.push(expect(one?.opts.unique === true && one?.opts.sparse === true, 'report unique sparse (the 1:1 edge)'));
    checks.push(expect(idx.every((i) => i.opts.expireAfterSeconds === undefined), 'no TTL index'));
    return checks;
  }));

addCheck('transcription', 23, 'transcription transforms strip id/__v (§23.7)', () =>
  modelCheck(23, 'transcription transforms strip id/__v (§23.7)', () => {
    const doc = new Transcription({
      user: new mongoose.Types.ObjectId(), report: new mongoose.Types.ObjectId(),
      raw: 'raw', latest: 'latest', stt: { requestId: 'req-1', model: 'aleph-audio-am' },
    });
    const json = doc.toJSON();
    const checks = [];
    checks.push(expect(!('id' in json) && !('__v' in json) && json._id !== undefined, 'no id/__v, _id present'));
    checks.push(expect(json.raw === 'raw' && json.latest === 'latest' && json.language === LANGUAGE_CODES.am, 'content slots + language intact'));
    checks.push(expect(json.stt?.requestId === 'req-1' && json.stt?.model === 'aleph-audio-am', 'stt metadata intact'));
    return checks;
  }));

// ---------------------------------------------------------------------------
// §24 ChatConversation
// ---------------------------------------------------------------------------

addCheck('conversation', 24, 'conversation paths match §24.2 registry', () =>
  modelCheck(24, 'conversation paths match §24.2 registry', () => {
    const paths = ChatConversation.schema.paths;
    const expected = ['_id', 'user', 'report', 'reasoning', 'messages', 'createdAt', 'updatedAt'];
    const actual = Object.keys(paths).filter((p) => p !== '__v').sort();
    const missing = expected.filter((p) => !actual.includes(p));
    const extra = actual.filter((p) => !expected.includes(p));
    const checks = [];
    checks.push(expect(missing.length === 0 && extra.length === 0, `paths ${missing.length ? `missing ${missing.join(',')}` : ''}${extra.length ? ` extra ${extra.join(',')}` : ''}`));
    checks.push(expect(paths.user.instance === 'ObjectId' && paths.user.isRequired, 'user ObjectId required'));
    checks.push(expect(paths.report.instance === 'ObjectId' && paths.report.isRequired, 'report ObjectId required'));
    checks.push(expect(paths.reasoning.instance === 'String' && paths.reasoning.isRequired, 'reasoning String required'));
    checks.push(expect(paths.reasoning.defaultValue === AI_REASONING_DEFAULT, `reasoning default ${paths.reasoning.defaultValue} vs ${AI_REASONING_DEFAULT}`));
    checks.push(expect(paths.messages.instance === 'Array' && paths.messages.isRequired, 'messages Array required'));
    checks.push(expect(!('status' in paths) && !('deletedAt' in paths), 'no status/deletedAt'));
    return checks;
  }));

addCheck('conversation', 25, 'conversation enums resolve to §11.4 constants (§24.2)', () =>
  modelCheck(25, 'conversation enums resolve to §11.4 constants (§24.2)', () => {
    const reasoning = ChatConversation.schema.path('reasoning').enumValues;
    const msgSchema = ChatConversation.schema.path('messages').schema;
    const checks = [];
    checks.push(expect(JSON.stringify([...reasoning].sort()) === JSON.stringify([...AI_REASONING_EFFORTS].sort()), `reasoning enum ${JSON.stringify(reasoning)}`));
    if (msgSchema) {
      checks.push(expect(JSON.stringify([...msgSchema.path('role').enumValues].sort()) === JSON.stringify([...MESSAGE_ROLES].sort()), 'role enum = MESSAGE_ROLES'));
      checks.push(expect(JSON.stringify([...msgSchema.path('provider').enumValues].sort()) === JSON.stringify([...AI_PROVIDERS].sort()), 'provider enum = AI_PROVIDERS'));
      checks.push(expect(JSON.stringify([...msgSchema.path('reasoning').enumValues].sort()) === JSON.stringify([...AI_REASONING_EFFORTS].sort()), 'message reasoning enum = AI_REASONING_EFFORTS'));
      checks.push(expect(msgSchema.path('model').instance === 'String' && !(msgSchema.path('model').enumValues || []).length, 'model plain String (registry check is §36/§29)'));
    }
    return checks;
  }));

addCheck('conversation', 26, 'message subdoc: _id:false + 6-field surface (§24.2, §24.7)', () =>
  modelCheck(26, 'message subdoc: _id:false + 6-field surface (§24.2, §24.7)', () => {
    const msgSchema = ChatConversation.schema.path('messages').schema;
    const checks = [];
    checks.push(expect(!!msgSchema, 'messages subdocument schema exists'));
    if (msgSchema) {
      checks.push(expect(msgSchema.options._id === false, 'messages _id:false'));
      const mp = msgSchema.paths;
      const keys = Object.keys(mp).sort();
      checks.push(expect(JSON.stringify(keys) === JSON.stringify(['content', 'createdAt', 'model', 'provider', 'reasoning', 'role']), `message fields ${keys.join(',')}`));
      checks.push(expect(mp.role.isRequired && mp.content.isRequired && mp.provider.isRequired && mp.model.isRequired && mp.reasoning.isRequired, 'role/content/provider/model/reasoning required'));
      checks.push(expect(mp.createdAt.instance === 'Date', 'createdAt Date'));
    }
    const doc = new ChatConversation({
      user: new mongoose.Types.ObjectId(), report: new mongoose.Types.ObjectId(),
      messages: [{ role: 'user', content: 'hello', provider: 'gemini', model: 'gemini-3.1-flash-lite', reasoning: 'off' }],
    });
    const json = doc.toJSON();
    const msgKeys = Object.keys(json.messages[0]).sort();
    checks.push(expect(JSON.stringify(msgKeys) === JSON.stringify(['content', 'createdAt', 'model', 'provider', 'reasoning', 'role']), `serialized message surface ${msgKeys.join(',')}`));
    return checks;
  }));

addCheck('conversation', 27, 'conversation indexes: 3 per §24.3, no TTL', () =>
  modelCheck(27, 'conversation indexes: 3 per §24.3, no TTL', () => {
    const idx = ChatConversation.schema.indexes().map(([spec, opts]) => ({ spec, opts }));
    const specs = idx.map((i) => JSON.stringify(i.spec)).sort();
    const expected = [
      JSON.stringify({ user: 1 }),
      JSON.stringify({ report: 1 }),
      JSON.stringify({ report: 1, 'messages.createdAt': 1 }),
    ].sort();
    const checks = [];
    checks.push(expect(idx.length === 3, `3 indexes, got ${idx.length}`));
    checks.push(expect(JSON.stringify(specs) === JSON.stringify(expected), `specs ${specs.join(' | ')}`));
    const one = idx.find((i) => JSON.stringify(i.spec) === JSON.stringify({ report: 1 }));
    checks.push(expect(one?.opts.unique === true && one?.opts.sparse === true, 'report unique sparse (one per report)'));
    checks.push(expect(idx.every((i) => i.opts.expireAfterSeconds === undefined), 'no TTL index'));
    return checks;
  }));

addCheck('conversation', 28, 'conversation transforms strip id/__v, no reasoning text (§24.7)', () =>
  modelCheck(28, 'conversation transforms strip id/__v, no reasoning text (§24.7)', () => {
    const doc = new ChatConversation({
      user: new mongoose.Types.ObjectId(), report: new mongoose.Types.ObjectId(),
      messages: [{ role: 'assistant', content: 'body', provider: 'addis', model: 'Addis-፩-አሌፍ', reasoning: 'low' }],
    });
    const json = doc.toJSON();
    const checks = [];
    checks.push(expect(!('id' in json) && !('__v' in json) && json._id !== undefined, 'no id/__v, _id present'));
    checks.push(expect(!('reasoning_content' in json.messages[0]) && !('reasoning_content' in json), 'no reasoning_content anywhere'));
    checks.push(expect(json.reasoning === AI_REASONING_DEFAULT, `standing reasoning default ${json.reasoning}`));
    return checks;
  }));

// ---------------------------------------------------------------------------
// §24A Item
// ---------------------------------------------------------------------------

addCheck('item', 29, 'item paths match §24A.2 registry', () =>
  modelCheck(29, 'item paths match §24A.2 registry', () => {
    const paths = Item.schema.paths;
    const expected = ['_id', 'user', 'report', 'branch', 'date', 'type', 'text', 'status', 'rating', 'createdAt', 'updatedAt'];
    const actual = Object.keys(paths).filter((p) => p !== '__v').sort();
    const missing = expected.filter((p) => !actual.includes(p));
    const extra = actual.filter((p) => !expected.includes(p));
    const checks = [];
    checks.push(expect(missing.length === 0 && extra.length === 0, `paths ${missing.length ? `missing ${missing.join(',')}` : ''}${extra.length ? ` extra ${extra.join(',')}` : ''}`));
    checks.push(expect(paths.user.instance === 'ObjectId' && paths.user.isRequired, 'user ObjectId required'));
    checks.push(expect(paths.report.instance === 'ObjectId' && paths.report.isRequired, 'report ObjectId required'));
    checks.push(expect(paths.branch.instance === 'ObjectId' && paths.branch.isRequired && paths.branch.options.ref === 'Branch', 'branch ObjectId required ref Branch'));
    checks.push(expect(paths.date.instance === 'Date' && paths.date.isRequired, 'date Date required'));
    checks.push(expect(paths.type.instance === 'String' && paths.type.isRequired, 'type String required'));
    checks.push(expect(paths.status.defaultValue === null && paths.rating.defaultValue === null, 'status/rating null defaults (generation writes them)'));
    checks.push(expect(!('deletedAt' in paths) && !('attributionBasis' in paths) && !('sourceClip' in paths) && !('visitNo' in paths) && !('itemId' in paths), 'no retired/forbidden fields'));
    return checks;
  }));

addCheck('item', 30, 'item type/status enums = §11.4 constants (§24A.2)', () =>
  modelCheck(30, 'item type/status enums = §11.4 constants (§24A.2)', () => {
    const typeEnum = Item.schema.path('type').enumValues;
    const statusEnum = Item.schema.path('status').enumValues;
    const checks = [];
    checks.push(expect(JSON.stringify([...typeEnum].sort()) === JSON.stringify([...ITEM_TYPES].sort()), `type enum ${JSON.stringify(typeEnum)} vs ${JSON.stringify(ITEM_TYPES)}`));
    checks.push(expect(JSON.stringify([...statusEnum].sort()) === JSON.stringify([...ITEM_STATUSES].sort()), `status enum ${JSON.stringify(statusEnum)} vs ${JSON.stringify(ITEM_STATUSES)}`));
    return checks;
  }));

addCheck('item', 31, 'item indexes match §24A.3 (5)', () =>
  modelCheck(31, 'item indexes match §24A.3 (5)', () => {
    const idx = Item.schema.indexes().map(([spec, opts]) => ({ spec, opts }));
    const specs = idx.map((i) => JSON.stringify(i.spec)).sort();
    const expected = [
      JSON.stringify({ user: 1 }),
      JSON.stringify({ user: 1, report: 1 }),
      JSON.stringify({ user: 1, branch: 1, date: 1, type: 1, status: 1 }),
      JSON.stringify({ user: 1, type: 1, status: 1, date: 1 }),
      JSON.stringify({ report: 1 }),
    ].sort();
    const checks = [];
    checks.push(expect(idx.length === 5, `5 indexes, got ${idx.length}`));
    checks.push(expect(JSON.stringify(specs) === JSON.stringify(expected), `specs ${specs.join(' | ')}`));
    const comment = idx.find((i) => JSON.stringify(i.spec) === JSON.stringify({ report: 1 }));
    checks.push(expect(comment?.opts.unique === true, 'report unique'));
    checks.push(expect(JSON.stringify(comment?.opts.partialFilterExpression) === JSON.stringify({ type: 'comment' }), `partialFilterExpression ${JSON.stringify(comment?.opts.partialFilterExpression)}`));
    checks.push(expect(idx.every((i) => i.opts.expireAfterSeconds === undefined), 'no TTL index'));
    return checks;
  }));

addCheck('item', 32, 'item transforms strip id/__v, flat rows (§24A.5)', () =>
  modelCheck(32, 'item transforms strip id/__v, flat rows (§24A.5)', () => {
    const doc = new Item({
      user: new mongoose.Types.ObjectId(), report: new mongoose.Types.ObjectId(), branch: new mongoose.Types.ObjectId(),
      date: new Date('2026-08-19T00:00:00.000Z'), type: 'activity', text: 'did the rounds',
    });
    const json = doc.toJSON();
    const checks = [];
    checks.push(expect(!('id' in json) && !('__v' in json) && json._id !== undefined, 'no id/__v, _id present'));
    checks.push(expect(json.status === null && json.rating === null, 'status/rating null when unwritten'));
    checks.push(expect(json.type === 'activity' && json.text === 'did the rounds', 'type/text intact'));
    return checks;
  }));

addCheck('item', 33, 'item per-type validators accept valid rows (§24A.3)', async () => {
  const oid = () => new mongoose.Types.ObjectId();
  const base = { user: oid(), report: oid(), branch: oid(), date: new Date('2026-08-19T00:00:00.000Z') };
  const results = [];
  const run = async (name, doc, wantOk) => {
    try {
      await doc.validate();
      results.push([name, wantOk === true]);
    } catch {
      results.push([name, wantOk === false]);
    }
  };
  await run('activity completed', new Item({ ...base, type: 'activity', text: 'a', status: 'completed' }), true);
  await run('activity in_progress', new Item({ ...base, type: 'activity', text: 'a', status: 'in_progress' }), true);
  await run('issue reported/in_progress/completed', new Item({ ...base, type: 'issue', text: 'i', status: 'reported' }), true);
  await run('issue in_progress', new Item({ ...base, type: 'issue', text: 'i', status: 'in_progress' }), true);
  await run('issue completed', new Item({ ...base, type: 'issue', text: 'i', status: 'completed' }), true);
  await run('comment null status/rating', new Item({ ...base, type: 'comment', text: null, status: null, rating: null }), true);
  await run('comment rating 4', new Item({ ...base, type: 'comment', text: 'c', rating: 4 }), true);
  await run('comment rating 0', new Item({ ...base, type: 'comment', text: 'c', rating: 0 }), true);
  await run('activity rejects issue-only status', new Item({ ...base, type: 'activity', text: 'a', status: 'reported' }), false);
  await run('comment rejects any status', new Item({ ...base, type: 'comment', text: 'c', status: 'reported' }), false);
  await run('rating on activity rejected', new Item({ ...base, type: 'activity', text: 'a', rating: 4 }), false);
  await run('rating 6 rejected', new Item({ ...base, type: 'comment', text: 'c', rating: 6 }), false);
  await run('rating -1 rejected', new Item({ ...base, type: 'comment', text: 'c', rating: -1 }), false);
  await run('rating 2.5 rejected (non-integer)', new Item({ ...base, type: 'comment', text: 'c', rating: 2.5 }), false);
  await run('text required for activity', new Item({ ...base, type: 'activity' }), false);
  await run('type enum rejects unknown', new Item({ ...base, type: 'visit', text: 'x' }), false);
  const failed = results.filter(([, ok]) => !ok).map(([n]) => n);
  const summary = results.map(([n]) => n).join(' | ');
  out(`MODEL CHECK [33] item per-type validators — ${results.length} cases`);
  verdict('item per-type validators accept valid rows (§24A.3)', failed.length === 0, failed.length ? `mismatched: ${failed.join(', ')}` : '');
  out(`    cases : ${summary}`);
});

// ---------------------------------------------------------------------------
// Cross-model gates (§17, §18)
// ---------------------------------------------------------------------------

const MODELS = {
  user: User,
  branch: Branch,
  report: Report,
  audio: Audio,
  transcription: Transcription,
  conversation: ChatConversation,
  item: Item,
};

addCheck('cross', 34, 'exactly ONE TTL index in the spec — Report archivedAt (§18.3)', () =>
  modelCheck(34, 'exactly ONE TTL index in the spec — Report archivedAt (§18.3)', () => {
    const ttl = [];
    for (const [name, Model] of Object.entries(MODELS)) {
      for (const [spec, opts] of Model.schema.indexes()) {
        if (opts.expireAfterSeconds !== undefined) ttl.push(`${name}:${JSON.stringify(spec)}:${opts.expireAfterSeconds}`);
      }
    }
    return [
      expect(ttl.length === 1, `1 TTL index total, got ${ttl.length} (${ttl.join(', ')})`),
      expect(ttl[0] === 'report:{"archivedAt":1}:' + ARCHIVED_TTL_SECONDS, `the one TTL is report.archivedAt=${ARCHIVED_TTL_SECONDS}, got ${ttl[0]}`),
    ];
  }));

addCheck('cross', 35, 'every non-root model carries required user ObjectId (§18.7)', () =>
  modelCheck(35, 'every non-root model carries required user ObjectId (§18.7)', () => {
    const checks = [];
    for (const [name, Model] of Object.entries(MODELS)) {
      if (name === 'user') continue;
      const p = Model.schema.paths.user;
      checks.push(expect(!!p && p.instance === 'ObjectId' && p.isRequired, `${name}.user ObjectId required`));
    }
    return checks;
  }));

addCheck('cross', 36, 'no deletedAt anywhere; status only on report/item (§17.7, §22.10)', () =>
  modelCheck(36, 'no deletedAt anywhere; status only on report/item (§17.7, §22.10)', () => {
    const checks = [];
    for (const [name, Model] of Object.entries(MODELS)) {
      checks.push(expect(!('deletedAt' in Model.schema.paths), `${name} has no deletedAt`));
    }
    checks.push(expect(!('status' in Audio.schema.paths), 'audio has no status'));
    checks.push(expect(!('status' in Transcription.schema.paths), 'transcription has no status'));
    checks.push(expect(!('status' in ChatConversation.schema.paths), 'conversation has no status'));
    checks.push(expect('status' in Report.schema.paths && 'status' in Item.schema.paths, 'status on report + item only'));
    return checks;
  }));

addCheck('cross', 37, 'isArchived/archivedAt only on branch and report (§20.4, §21.6)', () =>
  modelCheck(37, 'isArchived/archivedAt only on branch and report (§20.4, §21.6)', () => {
    const checks = [];
    for (const [name, Model] of Object.entries(MODELS)) {
      const has = 'isArchived' in Model.schema.paths || 'archivedAt' in Model.schema.paths;
      const allowed = name === 'branch' || name === 'report';
      checks.push(expect(has === allowed, `${name} archivable=${allowed}, got ${has}`));
    }
    return checks;
  }));

addCheck('cross', 38, 'no snapshot/tombstone vocabulary in model field names (§17.7)', () =>
  modelCheck(38, 'no snapshot/tombstone vocabulary in model field names (§17.7)', () => {
    const checks = [];
    for (const [name, Model] of Object.entries(MODELS)) {
      const fields = Object.keys(Model.schema.paths);
      checks.push(expect(!fields.some((f) => f === 'branchName' || f === 'branches' || f === 'supervisorName'), `${name} no snapshot fields`));
    }
    return checks;
  }));

addCheck('cross', 39, 'unique/sparse declarations match §17.3 edges', () =>
  modelCheck(39, 'unique/sparse declarations match §17.3 edges', () => {
    const uniques = [];
    for (const [name, Model] of Object.entries(MODELS)) {
      for (const [spec, opts] of Model.schema.indexes()) {
        if (opts.unique) uniques.push(`${name}:${JSON.stringify(spec)}:sparse=${opts.sparse === true}:partial=${JSON.stringify(opts.partialFilterExpression ?? null)}`);
      }
    }
    const expected = [
      'user:{"email":1}:sparse=false:partial=null',
      'report:{"transcription":1}:sparse=true:partial=null',
      'transcription:{"report":1}:sparse=true:partial=null',
      'conversation:{"report":1}:sparse=true:partial=null',
      'item:{"report":1}:sparse=false:partial={"type":"comment"}',
    ];
    return [
      expect(uniques.length === expected.length, `5 uniques total, got ${uniques.length} (${uniques.join(' | ')})`),
      expect(JSON.stringify([...uniques].sort()) === JSON.stringify([...expected].sort()), `uniques ${uniques.join(' | ')}`),
    ];
  }));

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function main() {
  out('');
  out('=== Stage 4 \u00b7 Sub-phase 2 \u2014 Models (\u00a719\u2013\u00a724A) ===');
  out(`no server required (in-memory model checks)${ONLY ? ` | --only=${ONLY}` : ''} | started ${new Date().toISOString()}`);

  const groups = ['user', 'branch', 'report', 'audio', 'transcription', 'conversation', 'item', 'cross'];
  const active = ONLY ? checks.filter((c) => c.group === ONLY || c.id === Number(ONLY)) : checks;
  const activeGroups = [...new Set(active.map((c) => c.group))];

  for (const group of activeGroups) {
    const groupChecks = active.filter((c) => c.group === group);
    section(group === 'cross' ? 'Cross-model gates (\u00a717/\u00a718)' : `\u00a7${group.toUpperCase()} model`);
    for (const c of groupChecks) {
      try {
        await c.fn();
      } catch (err) {
        fail += 1;
        out(`  FAIL \u2717 ${c.name} \u2014 threw ${err.message}`);
      }
    }
  }

  out('');
  out('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  out(`SUMMARY  PASS=${pass}  FAIL=${fail}`);
  out(fail === 0 ? 'RESULT   ALL GREEN \u2014 sub-phase 2 models verified' : 'RESULT   FAILURES PRESENT \u2014 see above');
  process.exitCode = fail === 0 ? 0 : 1;
}

main();