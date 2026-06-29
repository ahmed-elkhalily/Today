import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { css } from '../css'

// Rich-text note editor (TipTap). Mounted with a `key` per note by the parent,
// so switching notes remounts with fresh content — no manual content syncing.
// Body is stored/returned as HTML to match the existing note model + migration.

const tbBtn = (active) => css(
  'min-width:34px;height:34px;padding:0 8px;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font:700 14px var(--font-brand);'
  + (active ? 'background:var(--app-accent);color:var(--app-accent-on);' : 'background:transparent;color:var(--app-text);')
)
const serif = (active, extra) => css('width:34px;height:34px;border:none;border-radius:8px;cursor:pointer;font:700 16px Georgia,serif;' + (active ? 'background:var(--app-accent);color:var(--app-accent-on);' : 'background:transparent;color:var(--app-text);') + (extra || ''))

export default function NoteEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { dir: 'rtl', class: 'note-prose' } },
  })

  if (!editor) return null
  const A = (name, attrs) => editor.isActive(name, attrs)
  const run = (fn) => (e) => { e.preventDefault(); fn(editor.chain().focus()).run() }

  return (
    <div style={css('flex:1;min-height:0;display:flex;flex-direction:column;')}>
      <div style={css('display:flex;align-items:center;flex-wrap:wrap;gap:3px;margin:0 22px 4px;padding:4px;background:var(--app-surface-2);border-radius:11px;align-self:flex-start;')}>
        <button onMouseDown={run(c => c.toggleBold())} title="عريض" style={serif(A('bold'), 'font-weight:800;')}>B</button>
        <button onMouseDown={run(c => c.toggleItalic())} title="مائل" style={serif(A('italic'), 'font-style:italic;')}>I</button>
        <button onMouseDown={run(c => c.toggleUnderline())} title="تسطير" style={serif(A('underline'), 'text-decoration:underline;font-weight:600;')}>U</button>
        <button onMouseDown={run(c => c.toggleStrike())} title="شطب" style={serif(A('strike'), 'text-decoration:line-through;font-weight:600;')}>S</button>
        <div style={css('width:1px;height:20px;background:var(--app-border);margin:0 5px;')}></div>
        <button onMouseDown={run(c => c.toggleHeading({ level: 1 }))} title="عنوان كبير" style={tbBtn(A('heading', { level: 1 }))}>عنوان</button>
        <button onMouseDown={run(c => c.toggleHeading({ level: 2 }))} title="عنوان فرعي" style={tbBtn(A('heading', { level: 2 }))}>فرعي</button>
        <div style={css('width:1px;height:20px;background:var(--app-border);margin:0 5px;')}></div>
        <button onMouseDown={run(c => c.toggleBulletList())} title="قائمة نقطية" style={tbBtn(A('bulletList'))}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="5" cy="7" r="1.5" fill="currentColor"></circle><circle cx="5" cy="17" r="1.5" fill="currentColor"></circle><path d="M10 7h10"></path><path d="M10 17h10"></path></svg>
        </button>
        <button onMouseDown={run(c => c.toggleOrderedList())} title="قائمة مرقّمة" style={tbBtn(A('orderedList'))}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 7h10"></path><path d="M10 17h10"></path><path d="M4 6h1.5v3"></path><path d="M4 9h2"></path><path d="M4 14.5h2v1.5H4v1.5h2"></path></svg>
        </button>
        <button onMouseDown={run(c => c.toggleBlockquote())} title="اقتباس" style={tbBtn(A('blockquote'))}>❝</button>
        <button onMouseDown={run(c => c.toggleCodeBlock())} title="كود" style={tbBtn(A('codeBlock'))}>&lt;/&gt;</button>
        <div style={css('width:1px;height:20px;background:var(--app-border);margin:0 5px;')}></div>
        <button onMouseDown={run(c => c.unsetAllMarks().clearNodes())} title="إزالة التنسيق" style={tbBtn(false)}>↺</button>
        <button onMouseDown={run(c => c.undo())} title="تراجع" style={tbBtn(false)}>↶</button>
        <button onMouseDown={run(c => c.redo())} title="إعادة" style={tbBtn(false)}>↷</button>
      </div>
      <div style={css('flex:1;overflow:auto;min-height:0;')}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
