import {defineField} from 'sanity'

// ─── "Text style" picker ──────────────────────────────────────────────────────
// One dropdown, reused beside every editorial text field in the schema. The
// values are the 14 named styles of the site's type system (see the style
// guide / repos/frontend/TYPOGRAPHY.md); the frontend resolves a value through
// an allowlist to a `.ts-role-*` class, so an editor can retune any single
// piece of text without ever leaving the scale. 'default' (or no value) means
// "as designed" — the element keeps the style the page was built with.
//
// Convention: the picker for a text field `foo` is a sibling field `fooStyle`,
// placed in the object's collapsed "Text styles" fieldset (textStylesFieldset)
// so it never crowds the editing form. Text that comes from a referenced
// document (a person's name, a partner, a press item) gets a block-level
// picker on the block that renders it, named after the text kind
// (e.g. `nameStyle`), never on the referenced document.

export const TEXT_STYLE_OPTIONS = [
  {title: 'As designed', value: 'default'},
  {title: 'Hero · 97 px', value: 'hero'},
  {title: 'Page title · 86 px', value: 'h1'},
  {title: 'Statement heading · 65 px', value: 'h2-xl'},
  {title: 'Section heading · 53 px', value: 'h2'},
  {title: 'Sub-heading · 38 px', value: 'h3'},
  {title: 'Card title, large · 27 px', value: 'h4'},
  {title: 'Card title · 22 px', value: 'h5'},
  {title: 'Name · 18 px', value: 'h6'},
  {title: 'Serif fine print · 15 px', value: 'serif-xs'},
  {title: 'Lede · 20 px', value: 'body-l'},
  {title: 'Body · 18 px', value: 'body'},
  {title: 'Caption · 15 px', value: 'caption'},
  {title: 'Eyebrow · 13 px, uppercase', value: 'label'},
  {title: 'Data label · 12 px, uppercase', value: 'label-s'},
]

export const textStylesFieldset = {
  name: 'textStyles',
  title: 'Text styles',
  description: 'Optional. Change the style of one piece of text in this section. Every option is one of the site\'s 14 named styles (sizes shown at desktop), so the page always stays on the system.',
  options: {collapsible: true, collapsed: true},
}

/** The picker for text field `<name minus "Style">`. Pass the plain-English
 *  name of the text it controls as the title, e.g. textStyleField('headingStyle', 'Heading'). */
export const textStyleField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'string',
    options: {list: TEXT_STYLE_OPTIONS},
    initialValue: 'default',
    fieldset: 'textStyles',
  })
