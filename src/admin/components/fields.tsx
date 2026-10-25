import { createContext, useContext, useId, useRef, useState, type ReactNode } from 'react';
import { icons } from '../icons';
import { uploadImage, useImageUrl } from '../data';
import type { FirebaseServices } from '../firebase';
import { iconOptions, templateOptions, type Field, type Option } from '../schemas';

type Value = unknown;
type Obj = Record<string, unknown>;

export interface FormContextValue {
  services: FirebaseServices;
  programOptions: Option[];
}
export const FormContext = createContext<FormContextValue | null>(null);
const useForm = () => {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('FormContext missing');
  return ctx;
};

export function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const svg = icons[name];
  if (!svg) return null;
  const html = svg.replace(/width="24"/, `width="${size}"`).replace(/height="24"/, `height="${size}"`);
  return <span className={`icon ${className ?? ''}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}

const asObj = (v: Value): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});
const asList = <T,>(v: Value): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asText = (v: Value) => (v == null ? '' : String(v));
/** An objects field's items, reading any stored as text through the field's `fromText`. */
const itemsOf = (field: Extract<Field, { type: 'objects' }>, v: Value): Obj[] =>
  asList<Value>(v).map((item) => (typeof item === 'string' && field.fromText ? field.fromText(item) : asObj(item)));

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item as T);
  return copy;
}

/** The whole document being edited, for fields that depend on another field (a batch's program on the branch's `programs`). */
const RootContext = createContext<Obj | null>(null);

/**
 * A select's choices. A value that is no longer offered stays listed, marked with why, so it isn't shown
 * as unchosen. `short`: the brief mark for a collapsed item's summary.
 */
function selectOptions(field: Extract<Field, { type: 'select' }>, value: string, root: Obj | null, programOptions: Option[], short = false): Option[] {
  let options = field.optionsFrom === 'programs' ? programOptions : (field.options ?? []);
  const offered = root?.programs;
  if (field.offeredOnly) options = options.filter((o) => !o.hidden && (!Array.isArray(offered) || offered.includes(o.value)));
  if (value && !options.some((o) => o.value === value)) {
    const known = programOptions.find((o) => o.value === value);
    const hidden = known?.hidden && (!Array.isArray(offered) || offered.includes(value));
    const why = hidden ? 'hidden on the website' : short ? 'not offered here' : 'not offered here, so not shown on the website';
    options = [...options, { value, label: `${known?.label ?? value} (${why})` }];
  }
  return options;
}

/** `root`: the document the form belongs to, when it holds more than `value` (defaults to `value`). */
export function SchemaForm({ fields, value, onChange, root }: { fields: Field[]; value: Obj; onChange: (v: Obj) => void; root?: Obj }) {
  const outer = useContext(RootContext);
  const form = (
    <div className="schema-form">
      {fields.map((field, i) =>
        field.type === 'heading' ? (
          <div className="form-heading" key={`h${i}`}>
            <h3>{field.label}</h3>
            {field.help && <p className="help">{field.help}</p>}
          </div>
        ) : (
          <FieldEditor
            key={field.key}
            field={field}
            value={value[field.key]}
            onChange={(v) => onChange({ ...value, [field.key]: v })}
          />
        ),
      )}
    </div>
  );
  return outer && !root ? form : <RootContext.Provider value={root ?? value}>{form}</RootContext.Provider>;
}

function Row({ label, help, required, htmlFor, children }: { label: string; help?: string; required?: boolean; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={htmlFor}>
          {label}
          {required && <span className="req"> *</span>}
        </label>
      )}
      {children}
      {help && <p className="help">{help}</p>}
    </div>
  );
}

function ArrowButtons({ index, count, onMove, onRemove, label }: { index: number; count: number; onMove: (to: number) => void; onRemove: () => void; label: string }) {
  return (
    <span className="row-actions">
      <button type="button" className="icon-btn" title="Move up" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(index - 1)}>
        <Icon name="ArrowUp" size={16} />
      </button>
      <button type="button" className="icon-btn" title="Move down" aria-label={`Move ${label} down`} disabled={index === count - 1} onClick={() => onMove(index + 1)}>
        <Icon name="ArrowDown" size={16} />
      </button>
      <button type="button" className="icon-btn danger" title="Remove" aria-label={`Remove ${label}`} onClick={onRemove}>
        <Icon name="Trash2" size={16} />
      </button>
    </span>
  );
}

export function FieldEditor({ field, value, onChange }: { field: Exclude<Field, { type: 'heading' }>; value: Value; onChange: (v: Value) => void }) {
  const id = useId();
  const { programOptions } = useForm();
  const root = useContext(RootContext);

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'url':
      return (
        <Row label={field.label} help={field.help} required={field.required} htmlFor={id}>
          <input
            id={id}
            type={field.type}
            value={asText(value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            onChange={(e) => onChange(e.target.value)}
          />
        </Row>
      );
    case 'textarea':
      return (
        <Row label={field.label} help={field.help} required={field.required} htmlFor={id}>
          <textarea id={id} rows={field.rows ?? 4} value={asText(value)} onChange={(e) => onChange(e.target.value)} />
        </Row>
      );
    case 'number':
      return (
        <Row label={field.label} help={field.help} required={field.required} htmlFor={id}>
          <input
            id={id}
            type="number"
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          />
        </Row>
      );
    case 'date':
      return (
        <Row label={field.label} help={field.help} required={field.required} htmlFor={id}>
          <input id={id} type="date" value={asText(value)} onChange={(e) => onChange(e.target.value)} />
        </Row>
      );
    case 'time':
      return (
        <Row label={field.label} help={field.help} required={field.required} htmlFor={id}>
          <input id={id} type="time" step={300} value={asText(value)} onChange={(e) => onChange(e.target.value)} />
        </Row>
      );
    case 'template':
      return (
        <Row label={field.label} help={field.help} required={field.required}>
          <div className="template-picker" role="radiogroup" aria-label={field.label}>
            {templateOptions.map((t) => (
              <label key={t.id} className={`template-option ${asText(value) === t.id ? 'on' : ''}`}>
                <input type="radio" name={id} value={t.id} checked={asText(value) === t.id} onChange={() => onChange(t.id)} />
                <TemplateSketch id={t.id} />
                <strong>{t.label}</strong>
                <span>{t.text}</span>
              </label>
            ))}
          </div>
        </Row>
      );
    case 'boolean':
      return (
        <label className="check">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /> {field.label}
        </label>
      );
    case 'select':
      return (
        <Row label={field.label} help={field.help} required={field.required} htmlFor={id}>
          <select id={id} value={asText(value)} onChange={(e) => onChange(e.target.value)}>
            <option value="">{field.emptyLabel ?? 'Choose…'}</option>
            {selectOptions(field, asText(value), root, programOptions).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Row>
      );
    case 'icon':
      return (
        <Row label={field.label} help={field.help} htmlFor={id}>
          <span className="icon-select">
            <Icon name={asText(value) || 'Star'} size={22} />
            <select id={id} value={asText(value)} onChange={(e) => onChange(e.target.value)}>
              {iconOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </span>
        </Row>
      );
    case 'checkboxes': {
      const options = field.optionsFrom === 'programs' ? programOptions : field.options ?? [];
      const selected = asList<string>(value);
      return (
        <Row label={field.label} help={field.help}>
          <div className="checks">
            {options.map((o) => (
              <label key={o.value} className="check">
                <input
                  type="checkbox"
                  checked={selected.includes(o.value)}
                  onChange={(e) =>
                    onChange(e.target.checked ? options.filter((x) => x.value === o.value || selected.includes(x.value)).map((x) => x.value) : selected.filter((v) => v !== o.value))
                  }
                />
                {o.label}
              </label>
            ))}
          </div>
        </Row>
      );
    }
    case 'list': {
      const items = asList<string>(value);
      return (
        <Row label={field.label} help={field.help} required={field.required}>
          <div className="list">
            {items.map((item, i) => (
              <div className="list-row" key={i}>
                {field.multiline ? (
                  <textarea rows={3} aria-label={`${field.itemLabel} ${i + 1}`} value={item} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
                ) : (
                  <input aria-label={`${field.itemLabel} ${i + 1}`} value={item} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
                )}
                <ArrowButtons
                  index={i}
                  count={items.length}
                  label={`${field.itemLabel.toLowerCase()} ${i + 1}`}
                  onMove={(to) => onChange(move(items, i, to))}
                  onRemove={() => onChange(items.filter((_, j) => j !== i))}
                />
              </div>
            ))}
            <button type="button" className="btn btn-light btn-sm" onClick={() => onChange([...items, ''])}>
              <Icon name="Plus" size={16} /> Add {field.itemLabel.toLowerCase()}
            </button>
          </div>
        </Row>
      );
    }
    case 'image':
      return (
        <Row label={field.label} help={field.help} required={field.required}>
          <ImageField folder={field.folder} value={asText(value)} onChange={onChange} />
        </Row>
      );
    case 'images':
      return (
        <Row label={field.label} help={field.help}>
          <ImagesField folder={field.folder} value={asList<string>(value)} onChange={onChange} />
        </Row>
      );
    case 'group':
      return (
        <fieldset className="group">
          {field.label && <legend>{field.label}</legend>}
          {field.help && <p className="help">{field.help}</p>}
          <SchemaForm fields={field.fields} value={asObj(value)} onChange={onChange} />
        </fieldset>
      );
    case 'objects':
      return <ObjectsField field={field} value={itemsOf(field, value)} onChange={onChange} />;
  }
}

/** A small drawing of each blog design's layout, for the design picker. */
function TemplateSketch({ id }: { id: string }) {
  const photo = 'sk-photo';
  const line = 'sk-line';
  const card = 'sk-card';
  const shapes: Record<string, ReactNode> = {
    classic: (
      <>
        <rect className={line} x="30" y="8" width="60" height="5" rx="2" />
        <rect className={line} x="38" y="16" width="44" height="3" rx="1.5" />
        <rect className={photo} x="18" y="24" width="84" height="26" rx="4" />
        <rect className={line} x="30" y="55" width="60" height="3" rx="1.5" />
        <rect className={line} x="30" y="61" width="54" height="3" rx="1.5" />
        <rect className={line} x="30" y="67" width="58" height="3" rx="1.5" />
      </>
    ),
    magazine: (
      <>
        <rect className={photo} x="8" y="6" width="104" height="40" rx="5" />
        <rect className={card} x="14" y="26" width="46" height="16" rx="3" />
        <rect className={line} x="18" y="30" width="34" height="4" rx="2" />
        <rect className={card} x="8" y="52" width="26" height="22" rx="3" />
        <rect className={line} x="42" y="53" width="66" height="3" rx="1.5" />
        <rect className={line} x="42" y="59" width="60" height="3" rx="1.5" />
        <rect className={line} x="42" y="65" width="64" height="3" rx="1.5" />
      </>
    ),
    story: (
      <>
        <rect className={photo} x="10" y="8" width="52" height="28" rx="4" />
        <rect className={line} x="68" y="16" width="38" height="4" rx="2" />
        <rect className={line} x="68" y="24" width="30" height="3" rx="1.5" />
        <rect className={line} x="14" y="50" width="38" height="4" rx="2" />
        <rect className={line} x="14" y="58" width="30" height="3" rx="1.5" />
        <rect className={photo} x="58" y="42" width="52" height="28" rx="4" />
      </>
    ),
    tips: (
      <>
        <rect className={line} x="10" y="8" width="56" height="5" rx="2" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect className={card} x={10 + i * 35} y="22" width="30" height="24" rx="3" />
            <text className="sk-num" x={14 + i * 35} y="33">
              {`0${i + 1}`}
            </text>
          </g>
        ))}
        <rect className={card} x="10" y="52" width="100" height="20" rx="3" />
        <rect className={line} x="16" y="58" width="50" height="3" rx="1.5" />
        <rect className={line} x="16" y="64" width="40" height="3" rx="1.5" />
      </>
    ),
    notice: (
      <>
        <rect className={card} x="22" y="6" width="76" height="68" rx="5" />
        <circle className={photo} cx="32" cy="16" r="5" />
        <rect className={card} x="80" y="11" width="12" height="11" rx="2" />
        <rect className={line} x="28" y="28" width="50" height="5" rx="2" />
        <rect className={line} x="28" y="38" width="62" height="3" rx="1.5" />
        <rect className={line} x="28" y="44" width="56" height="3" rx="1.5" />
        <rect className="sk-button" x="28" y="56" width="30" height="9" rx="4.5" />
      </>
    ),
    letter: (
      <>
        <rect className={card} x="20" y="6" width="80" height="68" rx="5" />
        <circle className={photo} cx="30" cy="16" r="5" />
        <rect className={line} x="38" y="14" width="30" height="3" rx="1.5" />
        <rect className={photo} x="68" y="24" width="24" height="26" rx="2" transform="rotate(4 80 37)" />
        <rect className={line} x="28" y="28" width="34" height="3" rx="1.5" />
        <rect className={line} x="28" y="34" width="32" height="3" rx="1.5" />
        <rect className={line} x="28" y="40" width="34" height="3" rx="1.5" />
        <path className="sk-sign" d="M28 62 q6 -8 12 0 t12 0 t10 -2" />
      </>
    ),
  };
  return (
    <svg className="template-sketch" viewBox="0 0 120 80" aria-hidden="true">
      {shapes[id]}
    </svg>
  );
}

function ObjectsField({ field, value, onChange }: { field: Extract<Field, { type: 'objects' }>; value: Obj[]; onChange: (v: Value) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const { programOptions } = useForm();
  const root = useContext(RootContext);
  /** An item's field as the editor shows it: the label of a chosen option rather than its value. */
  const shown = (item: Obj, key: string) => {
    const sub = field.fields.find((f) => f.key === key);
    const v = asText(item[key]);
    if (sub?.type !== 'select') return v;
    return selectOptions(sub, v, root, programOptions, true).find((o) => o.value === v)?.label ?? v;
  };
  /** What stops an item being saved, so the row can say so before Save is pressed. */
  const problemOf = (item: Obj) => {
    const missing = missingRequired(field.fields, item);
    return missing.length ? `fill in ${missing.join(', ')}` : field.check?.(item);
  };
  const summaryOf = (item: Obj, i: number) => {
    const s =
      typeof field.summary === 'function' ? field.summary(item, (key) => shown(item, key)) : field.summary ? asText(item[field.summary]) : '';
    return s ? (s.length > 70 ? `${s.slice(0, 70)}…` : s) : `${field.itemLabel} ${i + 1}`;
  };
  return (
    <fieldset className="group objects">
      <legend>{field.label}</legend>
      {field.help && <p className="help">{field.help}</p>}
      {value.map((item, i) => (
        <div className={`object ${open === i ? 'open' : ''} ${problemOf(item) ? 'needs-attention' : ''}`} key={i}>
          <div className="object-head">
            <button type="button" className="object-toggle" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <Icon name={open === i ? 'ChevronDown' : 'ChevronRight'} size={16} />
              {typeof item.icon === 'string' && <Icon name={item.icon} size={16} />}
              <span>
                {summaryOf(item, i)}
                {problemOf(item) && <em className="object-problem"> · {problemOf(item)}</em>}
              </span>
            </button>
            <ArrowButtons
              index={i}
              count={value.length}
              label={field.itemLabel.toLowerCase()}
              onMove={(to) => {
                onChange(move(value, i, to));
                setOpen(to);
              }}
              onRemove={() => {
                if (confirm(`Remove this ${field.itemLabel.toLowerCase()}?`)) onChange(value.filter((_, j) => j !== i));
              }}
            />
          </div>
          {open === i && (
            <div className="object-body">
              <SchemaForm fields={field.fields} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        className="btn btn-light btn-sm"
        onClick={() => {
          onChange([...value, {}]);
          setOpen(value.length);
        }}
      >
        <Icon name="Plus" size={16} /> Add {field.itemLabel.toLowerCase()}
      </button>
    </fieldset>
  );
}

function Thumb({ path, onClick }: { path: string; onClick?: () => void }) {
  const { services } = useForm();
  const url = useImageUrl(services, path);
  return (
    <span className="thumb" onClick={onClick}>
      {url ? <img src={url} alt="" /> : url === '' ? <span className="thumb-missing">Not uploaded</span> : <span className="thumb-loading" />}
    </span>
  );
}

function useUpload(folder: string) {
  const { services } = useForm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const upload = async (files: FileList | null) => {
    if (!files?.length) return [];
    setBusy(true);
    setError(undefined);
    try {
      const paths: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
        paths.push(await uploadImage(services, file, folder));
      }
      return paths;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return [];
    } finally {
      setBusy(false);
    }
  };
  return { upload, busy, error };
}

/** The newest `value`, for code that runs after an upload and would otherwise change the form as it was when the upload began. */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

function ImageField({ folder, value, onChange }: { folder: string; value: string; onChange: (v: Value) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, busy, error } = useUpload(folder);
  const latest = useLatest(onChange);
  return (
    <div className="image-field">
      {value ? <Thumb path={value} /> : <span className="thumb thumb-empty">No image</span>}
      <div className="image-actions">
        <button type="button" className="btn btn-light btn-sm" disabled={busy} onClick={() => input.current?.click()}>
          <Icon name="Upload" size={16} /> {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
        </button>
        {value && (
          <button type="button" className="btn btn-light btn-sm" onClick={() => onChange('')}>
            Remove
          </button>
        )}
        {error && <p className="error-text">{error}</p>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={async (e) => {
          const [path] = await upload(e.target.files);
          e.target.value = '';
          if (path) latest.current(path);
        }}
      />
    </div>
  );
}

function ImagesField({ folder, value, onChange }: { folder: string; value: string[]; onChange: (v: Value) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, busy, error } = useUpload(folder);
  const latest = useLatest({ value, onChange });
  return (
    <div className="images-field">
      <div className="images-grid">
        {value.map((path, i) => (
          <figure key={path + i} className="images-item">
            <Thumb path={path} />
            <figcaption>
              {i === 0 ? <strong>Cover</strong> : <span>Photo {i + 1}</span>}
              <ArrowButtons
                index={i}
                count={value.length}
                label={`photo ${i + 1}`}
                onMove={(to) => onChange(move(value, i, to))}
                onRemove={() => onChange(value.filter((_, j) => j !== i))}
              />
            </figcaption>
          </figure>
        ))}
        <button type="button" className="images-add" disabled={busy} onClick={() => input.current?.click()}>
          <Icon name="Upload" size={22} />
          {busy ? 'Uploading…' : 'Add photos'}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={async (e) => {
          const paths = await upload(e.target.files);
          e.target.value = '';
          if (paths.length) latest.current.onChange([...latest.current.value, ...paths]);
        }}
      />
    </div>
  );
}

/** A form's value as it is stored: the items of objects fields with `toText` become text. */
export function forStorage(fields: Field[], value: Obj): Obj {
  const out = { ...value };
  for (const field of fields) {
    if (field.type === 'heading') continue;
    const v = out[field.key];
    if (field.type === 'group' && v && typeof v === 'object' && !Array.isArray(v)) out[field.key] = forStorage(field.fields, v as Obj);
    else if (field.type === 'objects' && field.toText && Array.isArray(v)) {
      const toText = field.toText;
      out[field.key] = v.map((item) => (typeof item === 'string' ? item : toText(asObj(item))));
    }
  }
  return out;
}

/** What stops a form being saved, as one message: required fields left empty, then items that fail their `check`. */
export function formProblem(fields: Field[], value: Obj): string | undefined {
  const missing = missingRequired(fields, value);
  const wrong = (list: Field[], v: Obj): string[] =>
    list.flatMap((field) =>
      field.type === 'group'
        ? wrong(field.fields, asObj(v[field.key]))
        : field.type === 'objects' && field.check
          ? itemsOf(field, v[field.key]).flatMap((item, i) => {
              const message = field.check!(item);
              return message ? [`${field.label} ${i + 1} › ${message}`] : [];
            })
          : [],
    );
  const problems = [missing.length ? `Please fill in: ${missing.join(', ')}` : '', ...wrong(fields, value)].filter(Boolean);
  return problems.length ? `${problems.join('. ')}.` : undefined;
}

/** Lists required fields that are still empty. */
export function missingRequired(fields: Field[], value: Obj, prefix = ''): string[] {
  const out: string[] = [];
  for (const field of fields) {
    if (field.type === 'heading') continue;
    const v = value[field.key];
    const label = `${prefix}${field.label}`;
    if (field.type === 'group') out.push(...missingRequired(field.fields, asObj(v), field.label ? `${field.label} › ` : prefix));
    else if (field.type === 'objects')
      itemsOf(field, v).forEach((item, i) => out.push(...missingRequired(field.fields, item, `${field.label} ${i + 1} › `)));
    else if (field.required && (v === undefined || v === null || asText(v).trim() === '' || (Array.isArray(v) && !v.length))) out.push(label);
  }
  return out;
}
