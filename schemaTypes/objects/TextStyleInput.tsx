import React, {useCallback} from 'react'
import {set, unset, type StringInputProps} from 'sanity'
import {TEXT_STYLE_OPTIONS} from './textStyle'

/**
 * The "Text style" picker. A plain select whose empty state reads "As designed"
 * instead of a blank row: `initialValue` only applies to objects created after
 * the field existed, so on every existing block the default select showed
 * nothing and editors read it as "not set up". Choosing "As designed" clears the
 * value (the frontend treats missing and 'default' the same).
 */
export function TextStyleInput(props: StringInputProps) {
  const {value, onChange, elementProps} = props
  const handle = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.currentTarget.value
      onChange(v === 'default' || v === '' ? unset() : set(v))
    },
    [onChange],
  )
  return (
    <select
      id={elementProps.id}
      ref={elementProps.ref as React.Ref<HTMLSelectElement>}
      onFocus={elementProps.onFocus}
      onBlur={elementProps.onBlur}
      value={value && value !== 'default' ? value : 'default'}
      onChange={handle}
      style={{
        width: '100%',
        font: 'inherit',
        padding: '8px 10px',
        borderRadius: 3,
        border: '1px solid var(--card-border-color, #ccc)',
        background: 'var(--card-bg-color, #fff)',
        color: 'var(--card-fg-color, inherit)',
      }}
    >
      {TEXT_STYLE_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.title}
        </option>
      ))}
    </select>
  )
}
