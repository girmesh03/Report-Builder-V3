/**
 * @module components/reusable/MuiEditor
 *
 * The single rich-text editing surface (§46.16 — report content §51/§52
 * and transcription review §54; also renders read-only content through
 * the same sanitized surface). TipTap + DOMPurify (ADR-038, §14.4).
 *
 * Zero-lag contract (§53.3, round-5 amendment): the editor owns its
 * document state. `onUpdate` writes only a dirty flag — never the
 * HTML — so typing costs nothing in React (no parent state, no
 * serialization; `shouldRerenderOnTransaction: false` keeps React out
 * of the typing path entirely; toolbar actives read through
 * `useEditorState`). The host reads the live document at controlled
 * boundaries through the imperative `getContent()` (Save, Revert, mode
 * switch, step leave) and learns divergence through `onDirtyChange`
 * (fires once on the first keystroke, once on re-seed). The external
 * `value` seed applies only when the editor is unfocused; a seed that
 * arrives mid-typing is deferred and applied on blur — never while
 * typing, never clobbering the user.
 *
 * Toolbar (round-7 amendment, editor.md §5/§18-1; round-8
 * amendment, §46.16): Bold, Italic, Underline (registered once —
 * StarterKit v3 ships it) · Paragraph/Heading option menu (a compact
 * toolbar control — shared `toolbarSelectSx` styling, §46.16) ·
 * font-size option menu (Default/10/11/12/14/16 — round-8 ladder;
 * selection-level, `@tiptap/extension-text-style` reinstated for
 * `setFontSize`/`unsetFontSize`, round-7; values apply with a `px`
 * suffix because the extension renders the inline style bare; text
 * color stays out of scope) · bullet & numbered lists · alignment
 * (left/center/right/justify) · Undo/Redo. The toolbar runs a
 * single swipeable row below sm (the xs scroll rail: nowrap,
 * overflow-x auto, dividers hidden, compact font-size select),
 * WRAPS at sm/md, and runs a single row from lg up (§46.16).
 *
 * The `borderless` variant (round-7, the transcription card host)
 * drops the content-box border entirely — the host's card supplies
 * the frame and the toolbar's bottom rule is the only separator;
 * keyboard focus is reported through the toolbar actives and the
 * caret, never a box outline (§46.16).
 *
 * Typography follows the §43.5 content stack: Noto Serif Ethiopic →
 * Inter fallback, line-height 1.75 (round-6 amendment); the writing
 * size stays at the comfortable 1.0625rem (editing surface, not the
 * 0.875rem reading size of §43.5 `contentBody`).
 *
 * OQ-007 (closed 2026-08-15): `raw` stays plain text, `latest` is rich
 * HTML — MuiEditor emits and consumes HTML either way; the slots stay
 * `String` (§21.2). Sanitize-on-write and sanitize-on-render (§61.3)
 * both run through the single §61.4 configuration
 * (`utils/sanitizeHtml`).
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Divider from "@mui/material/Divider";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import { WIZARD, FONT_SIZES } from "../../utils/constants";
import { sanitizeHtml } from "../../utils/sanitizeHtml";

const BLOCK_OPTIONS = [
  { value: "paragraph", label: WIZARD.toolbar.paragraph },
  { value: "h1", label: WIZARD.toolbar.heading1 },
  { value: "h2", label: WIZARD.toolbar.heading2 },
  { value: "h3", label: WIZARD.toolbar.heading3 },
];

// The compact toolbar option-menu styling shared by the block and
// font-size menus (round-7, §46.16): 28px tall like the icon
// buttons, transparent until hover (the same affordance as an icon
// button), radius 1.5, no underline (the theme kills the standard
// variant's before/after).
const toolbarSelectSx = {
  height: 28,
  fontSize: "0.8125rem",
  minWidth: 112,
  px: 1.25,
  borderRadius: 1.5,
  border: "1px solid transparent",
  backgroundColor: "transparent",
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "action.hover",
  },
  "& .MuiSelect-select": {
    py: 0,
    display: "flex",
    alignItems: "center",
  },
  "&:before, &:after": { display: "none" },
};

const ALIGNMENTS = [
  { value: "left", label: WIZARD.toolbar.alignLeft, icon: FormatAlignLeftIcon },
  { value: "center", label: WIZARD.toolbar.alignCenter, icon: FormatAlignCenterIcon },
  { value: "right", label: WIZARD.toolbar.alignRight, icon: FormatAlignRightIcon },
  { value: "justify", label: WIZARD.toolbar.alignJustify, icon: FormatAlignJustifyIcon },
];

/**
 * @param {Object} props
 * @param {string} props.value - External HTML seed (sanitized on render).
 * @param {Function} [props.onDirtyChange] - Fires `true` on the first
 *   divergence from the seed, `false` when the seed is re-applied.
 * @param {boolean} [props.readOnly] - Hides the toolbar and makes the
 *   document read-only (details-body viewer, §51; story presentation,
 *   §54).
 * @param {string|number|Object} [props.minHeight] - Minimum content
 *   height (a MUI responsive object is accepted by the system).
 * @param {boolean} [props.borderless] - Drops the content-box border
 *   (the host's card frames the surface; the toolbar's bottom rule is
 *   the only separator — §46.16).
 * @param {string} [props.id] - Editor instance id for the form integration.
 * @param {string|null} [props.fieldError] - Field-level validation message
 *   (round-8.2, §53.5): the content box turns `error.main` and the
 *   message renders as a caption line below it — the "check the
 *   highlighted fields" contract. Works in `borderless` mode too.
 * @param {import("react").Ref} ref - Exposes `getContent()` (live HTML,
 *   single serialization at the host's boundary; the EMPTY STRING when
 *   the document has no text — an empty doc serializes as `<p></p>`,
 *   a truthy string, so the boundary read text-empties it, round-8.4
 *   §53.3) and `applyCandidate()` (fills the live document with the
 *   unpersisted correction candidate, marking it dirty).
 */
const MuiEditor = forwardRef(function MuiEditor(
  { value = "", onDirtyChange, readOnly = false, minHeight = 220, borderless = false, id, fieldError = null },
  ref,
) {
  const dirtyRef = useRef(false);
  const seedingRef = useRef(false);
  const pendingSeedRef = useRef(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  // Round-8.4 (§46.16): the picked font size for an EMPTY paragraph —
  // the stored-mark path's re-assertion (any selection transaction
  // wipes `storedMarks` before typing, snapping the select back to
  // Default). The re-assertion applies only while the caret sits in an
  // empty paragraph; foreign text is never touched; Default clears it.
  const [fontSizeIntent, setFontSizeIntent] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "…",
      }),
    ],
    content: sanitizeHtml(value),
    editable: !readOnly,
    shouldRerenderOnTransaction: false,
    onUpdate: () => {
      if (seedingRef.current) {
        seedingRef.current = false;
        return;
      }
      if (!dirtyRef.current) {
        dirtyRef.current = true;
        if (onDirtyChange) onDirtyChange(true);
      }
    },
  });

  const applyExternal = useCallback(
    (next) => {
      if (!editor) return;
      pendingSeedRef.current = null;
      seedingRef.current = true;
      dirtyRef.current = false;
      editor.commands.setContent(sanitizeHtml(next), { emitUpdate: false });
      if (onDirtyChange) onDirtyChange(false);
    },
    [editor, onDirtyChange],
  );

  // External seed sync at controlled boundaries: never while the user
  // is typing. A seed that arrives mid-typing is deferred and applied
  // on blur; a seed that arrives while unfocused applies immediately.
  useEffect(() => {
    if (!editor) return;
    if (editor.isFocused) {
      pendingSeedRef.current = value;
      return;
    }
    if (value !== editor.getHTML()) {
      applyExternal(value);
    }
  }, [value, editor, applyExternal]);

  useEffect(() => {
    if (!editor) return;
    const handleBlur = () => {
      if (pendingSeedRef.current == null) return;
      const next = pendingSeedRef.current;
      pendingSeedRef.current = null;
      if (next !== editor.getHTML()) {
        applyExternal(next);
      }
    };
    editor.on("blur", handleBlur);
    return () => {
      editor.off("blur", handleBlur);
    };
  }, [editor, applyExternal]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  // Round-8.4 (§46.16): while a font-size intent is active, re-assert
  // the stored mark when the selection lands in an EMPTY paragraph —
  // the stored mark rides the chain's transaction, but any later
  // selection transaction dispatches with `storedMarks: null` and
  // wipes it (the round-8.3 "always shows Default" snap on empty
  // paragraphs). `selectionUpdate` only fires on selection changes, and
  // `setStoredMarks` never changes the selection — no dispatch loop.
  useEffect(() => {
    if (!editor || !fontSizeIntent) {
      return;
    }
    const reassert = () => {
      const { $cursor } = editor.state.selection;
      if (!$cursor || $cursor.parent.content.size > 0) {
        return;
      }
      const current = editor.getAttributes("textStyle").fontSize;
      if (current !== fontSizeIntent) {
        editor.view.dispatch(
          editor.state.tr.setStoredMarks([
            editor.schema.mark("textStyle", { fontSize: fontSizeIntent }),
          ]),
        );
      }
    };
    editor.on("selectionUpdate", reassert);
    return () => {
      editor.off("selectionUpdate", reassert);
    };
  }, [editor, fontSizeIntent]);

  useImperativeHandle(
    ref,
    () => ({
      getContent: () => {
        if (!editor) {
          return "";
        }
        // Round-8.4 (§53.3): an empty document serializes as `<p></p>`
        // — a TRUTHY string that sailed past every `.trim()` guard. The
        // boundary read therefore text-empties: no document text → the
        // empty string, so hosts can block honestly (the step's local
        // "Write the story before saving" pre-validation, §53.5).
        return editor.getText().trim() ? editor.getHTML() : "";
      },
      // Round-6 amendment: the correction candidate lands here — the
      // generated HTML fills the live document and is marked DIRTY
      // (unpersisted — the host must Save). Distinct from the clean
      // `value` seed, which represents persisted ground truth.
      applyCandidate: (next) => {
        if (!editor) return;
        pendingSeedRef.current = null;
        seedingRef.current = true;
        dirtyRef.current = true;
        editor.commands.setContent(sanitizeHtml(next), { emitUpdate: false });
        if (onDirtyChange) onDirtyChange(true);
      },
    }),
    [editor, onDirtyChange],
  );

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      const { editor: ed } = ctx;
      const fontSizeAttr = ed.getAttributes("textStyle").fontSize;
      const fontSize = typeof fontSizeAttr === "string"
        ? Number.parseInt(fontSizeAttr, 10) || 0
        : 0;
      return {
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        underline: ed.isActive("underline"),
        block: ed.isActive("heading", { level: 1 })
          ? "h1"
          : ed.isActive("heading", { level: 2 })
            ? "h2"
            : ed.isActive("heading", { level: 3 })
              ? "h3"
              : "paragraph",
        fontSize,
        bulletList: ed.isActive("bulletList"),
        orderedList: ed.isActive("orderedList"),
        textAlign: ed.isActive({ textAlign: "center" })
          ? "center"
          : ed.isActive({ textAlign: "right" })
            ? "right"
            : ed.isActive({ textAlign: "justify" })
              ? "justify"
              : "left",
        canUndo: ed.can().undo(),
        canRedo: ed.can().redo(),
      };
    },
  });

  const toolbarButtonSx = { p: 0.75 };

  return (
    <Box id={id} sx={{ width: "100%" }}>
      {!readOnly && editor ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 1,
            py: 0.5,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.default",
            borderRadius: "8px 8px 0 0",
            flexWrap: { xs: "nowrap", md: "wrap", lg: "nowrap" },
            rowGap: 0.25,
            overflowX: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            "& > *": { flexShrink: 0 },
          }}
        >
          <Tooltip title={WIZARD.toolbar.bold}>
            <span>
              <IconButton
                size="small"
                aria-label={WIZARD.toolbar.bold}
                aria-pressed={editorState.bold}
                onClick={() => editor.chain().focus().toggleBold().run()}
                color={editorState.bold ? "primary" : "default"}
                sx={toolbarButtonSx}
              >
                <FormatBoldIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={WIZARD.toolbar.italic}>
            <span>
              <IconButton
                size="small"
                aria-label={WIZARD.toolbar.italic}
                aria-pressed={editorState.italic}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                color={editorState.italic ? "primary" : "default"}
                sx={toolbarButtonSx}
              >
                <FormatItalicIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={WIZARD.toolbar.underline}>
            <span>
              <IconButton
                size="small"
                aria-label={WIZARD.toolbar.underline}
                aria-pressed={editorState.underline}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                color={editorState.underline ? "primary" : "default"}
                sx={toolbarButtonSx}
              >
                <FormatUnderlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: "none", md: "inline-flex" } }} />
          <Select
            value={editorState.block}
            onChange={(event) => {
              const level = Number(event.target.value.slice(1));
              if (event.target.value === "paragraph") {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level }).run();
              }
            }}
            size="small"
            variant="standard"
            aria-label={WIZARD.toolbar.paragraph}
            sx={toolbarSelectSx}
          >
            {BLOCK_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value} sx={{ fontSize: "0.8125rem" }}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={editorState.fontSize}
            onChange={(event) => {
              const next = Number(event.target.value);
              // Round-8.4 (§46.16): the size applies through a RAW
              // transaction that never changes the selection — the
              // round-8.2/8.3 paragraph expansion made the editor
              // SELECT the whole paragraph (the reported "focus on
              // the text" instead of a font change). The mark lands
              // on the enclosing paragraph's text range, the caret
              // stays put, and the toolbar reads the size at the
              // caret (`$head.marks()` on a collapsed selection). An
              // EMPTY paragraph has no text range (start === end):
              // the size rides the stored-marks path, kept alive by
              // the `fontSizeIntent` re-assertion so later selection
              // transactions cannot wipe it before typing.
              const { $from } = editor.state.selection;
              const nextValue = `${next}px`;
              const tr = editor.state.tr;
              const emptyParagraph = $from.start() === $from.end();
              if (next > 0) {
                if (emptyParagraph) {
                  tr.setStoredMarks([
                    editor.schema.mark("textStyle", { fontSize: nextValue }),
                  ]);
                } else {
                  tr.addMark(
                    $from.start(),
                    $from.end(),
                    editor.schema.mark("textStyle", { fontSize: nextValue }),
                  );
                }
                setFontSizeIntent(nextValue);
              } else {
                if (emptyParagraph) {
                  tr.setStoredMarks([]);
                } else {
                  tr.removeMark($from.start(), $from.end(), editor.schema.marks.textStyle);
                }
                setFontSizeIntent(null);
              }
              editor.view.dispatch(tr);
            }}
            size="small"
            variant="standard"
            aria-label={WIZARD.toolbar.fontSize}
            sx={{ ...toolbarSelectSx, minWidth: { xs: 68, sm: 84 } }}
          >
            {FONT_SIZES.map((option) => (
              <MenuItem key={option.label} value={option.value} sx={{ fontSize: "0.8125rem" }}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: "none", md: "inline-flex" } }} />
          <Tooltip title={WIZARD.toolbar.bulletList}>
            <span>
              <IconButton
                size="small"
                aria-label={WIZARD.toolbar.bulletList}
                aria-pressed={editorState.bulletList}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                color={editorState.bulletList ? "primary" : "default"}
                sx={toolbarButtonSx}
              >
                <FormatListBulletedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={WIZARD.toolbar.orderedList}>
            <span>
              <IconButton
                size="small"
                aria-label={WIZARD.toolbar.orderedList}
                aria-pressed={editorState.orderedList}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                color={editorState.orderedList ? "primary" : "default"}
                sx={toolbarButtonSx}
              >
                <FormatListNumberedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: "none", md: "inline-flex" } }} />
          <ToggleButtonGroup
            exclusive
            value={editorState.textAlign}
            size="small"
            onChange={(_event, align) => {
              if (!align || align === "left") {
                editor.chain().focus().unsetTextAlign().run();
              } else {
                editor.chain().focus().setTextAlign(align).run();
              }
            }}
            aria-label={WIZARD.toolbar.alignLeft}
          >
            {ALIGNMENTS.map(({ value, label, icon: AlignIcon }) => (
              <Tooltip key={value} title={label}>
                <ToggleButton
                  value={value}
                  aria-label={label}
                  selected={editorState.textAlign === value}
                  sx={{ p: 0.75, border: 0, borderRadius: 1 }}
                >
                  <AlignIcon fontSize="small" />
                </ToggleButton>
              </Tooltip>
            ))}
          </ToggleButtonGroup>
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              mx: 0.5,
              ml: { xs: 0, md: "auto" },
              display: { xs: "none", md: "inline-flex" },
            }}
          />
          <Tooltip title={WIZARD.toolbar.undo}>
            <span>
              <IconButton
                size="small"
                aria-label={WIZARD.toolbar.undo}
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editorState.canUndo}
                sx={toolbarButtonSx}
              >
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={WIZARD.toolbar.redo}>
            <span>
              <IconButton
                size="small"
                aria-label={WIZARD.toolbar.redo}
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editorState.canRedo}
                sx={toolbarButtonSx}
              >
                <RedoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ) : null}
      <Box
        sx={{
          minHeight,
          maxHeight: 480,
          overflowY: "auto",
          px: { xs: 1.5, md: 2 },
          py: 1.5,
          ...(fieldError
            ? {
                // Round-8.2 (§53.5): the highlighted-field contract —
                // the border takes the error tone in both variants (the
                // `borderless` host keeps its frame otherwise).
                border: 1,
                borderTop: readOnly ? 1 : 0,
                borderColor: "error.main",
                borderTopColor: "error.main",
              }
            : borderless
              ? {
                  border: 0,
                  borderTop: 0,
                  borderTopColor: "divider",
                }
              : {
                  border: 1,
                  borderColor: "divider",
                  borderTop: readOnly ? 1 : 0,
                  borderTopColor: "divider",
                  "&:focus-within": {
                    borderColor: "primary.main",
                    borderTopColor: readOnly ? "primary.main" : "divider",
                  },
                }),
          borderRadius: readOnly ? "8px" : "0 0 8px 8px",
          bgcolor: "background.paper",
          "& .tiptap": {
            outline: "none",
            fontSize: "1.0625rem",
            lineHeight: 1.75,
            color: "text.primary",
            fontFamily: '"Noto Serif Ethiopic", "Inter", sans-serif',
          },
          "& .tiptap p": { margin: 0 },
          "& .tiptap p.is-editor-empty:first-of-type::before": {
            content: '"…"',
            float: "left",
            color: "text.disabled",
            pointerEvents: "none",
          },
          "& .tiptap p.is-editor-empty:first-of-type::after": {
            content: '" "',
            display: "inline",
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
      {fieldError ? (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: "block", px: 0.5, pt: 0.5 }}
        >
          {fieldError}
        </Typography>
      ) : null}
    </Box>
  );
});

MuiEditor.propTypes = {
  value: PropTypes.string,
  onDirtyChange: PropTypes.func,
  readOnly: PropTypes.bool,
  minHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
  borderless: PropTypes.bool,
  id: PropTypes.string,
  fieldError: PropTypes.string,
};

export default MuiEditor;