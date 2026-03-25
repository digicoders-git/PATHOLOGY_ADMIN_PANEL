import React, { useRef, useEffect, useCallback } from "react";

const TOOLS = [
  { cmd: "bold",          label: <b>B</b>,          title: "Bold" },
  { cmd: "italic",        label: <i>I</i>,           title: "Italic" },
  { cmd: "underline",     label: <u>U</u>,           title: "Underline" },
  { cmd: "insertOrderedList",  label: "OL",          title: "Ordered List" },
  { cmd: "insertUnorderedList",label: "UL",          title: "Unordered List" },
];

/**
 * RichEditor – lightweight contentEditable-based editor.
 * Props:
 *   value    {string}  – HTML string
 *   onChange {fn}      – called with new HTML string on every input
 *   placeholder {string}
 *   minHeight   {number} – min height in px (default 120)
 */
const RichEditor = ({ value = "", onChange, placeholder = "Write here…", minHeight = 120 }) => {
  const editorRef = useRef(null);
  // track whether the last update came from the user (avoid cursor-jump loop)
  const internalChange = useRef(false);

  // Sync external `value` → DOM only when it comes from outside
  useEffect(() => {
    if (!editorRef.current) return;
    if (internalChange.current) { internalChange.current = false; return; }
    const cur = editorRef.current.innerHTML;
    if (cur !== value) editorRef.current.innerHTML = value || "";
  }, [value]);

  const exec = useCallback((cmd) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, null);
    // emit updated html
    internalChange.current = true;
    onChange?.(editorRef.current.innerHTML);
  }, [onChange]);

  const handleInput = () => {
    internalChange.current = true;
    onChange?.(editorRef.current.innerHTML);
  };

  const btnCls = "px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded hover:bg-slate-100 transition-all text-slate-600";

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50 flex-wrap">
        {TOOLS.map(t => (
          <button key={t.cmd} type="button" title={t.title} onMouseDown={e => { e.preventDefault(); exec(t.cmd); }}
            className={btnCls}>
            {t.label}
          </button>
        ))}
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="px-4 py-3 text-sm text-slate-700 outline-none leading-relaxed
                   empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300
                   empty:before:pointer-events-none"
      />
    </div>
  );
};

export default RichEditor;
