import { createContext, useContext, useId, useRef, useState, type ReactNode } from 'react';
import { icons } from '../icons';
import { uploadImage, useImageUrl } from '../data';
import type { FirebaseServices } from '../firebase';
import { iconOptions, type Field, type Option } from '../schemas';

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

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item as T);
  return copy;
}

export function SchemaForm({ fields, value, onChange }: { fields: Field[]; value: Obj; onChange: (v: Obj) => void }) {
  return (
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

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'url':
      return (
        <Row label={field.label} help={field.help} required={field.required} htmlFor={id}>
          <input id={id} type={field.type} value={asText(value)} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
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
            <option value="">Choose…</option>
            {field.options.map((o) => (
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
      return <ObjectsField field={field} value={asList<Obj>(value)} onChange={onChange} />;
  }
}

function ObjectsField({ field, value, onChange }: { field: Extract<Field, { type: 'objects' }>; value: Obj[]; onChange: (v: Value) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const summaryOf = (item: Obj, i: number) => {
    const s = field.summary ? asText(item[field.summary]) : '';
    return s ? (s.length > 70 ? `${s.slice(0, 70)}…` : s) : `${field.itemLabel} ${i + 1}`;
  };
  return (
    <fieldset className="group objects">
      <legend>{field.label}</legend>
      {field.help && <p className="help">{field.help}</p>}
      {value.map((item, i) => (
        <div className={`object ${open === i ? 'open' : ''}`} key={i}>
          <div className="object-head">
            <button type="button" className="object-toggle" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <Icon name={open === i ? 'ChevronDown' : 'ChevronRight'} size={16} />
              {typeof item.icon === 'string' && <Icon name={item.icon} size={16} />}
              <span>{summaryOf(item, i)}</span>
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

function ImageField({ folder, value, onChange }: { folder: string; value: string; onChange: (v: Value) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, busy, error } = useUpload(folder);
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
          if (path) onChange(path);
        }}
      />
    </div>
  );
}

function ImagesField({ folder, value, onChange }: { folder: string; value: string[]; onChange: (v: Value) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, busy, error } = useUpload(folder);
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
          if (paths.length) onChange([...value, ...paths]);
        }}
      />
    </div>
  );
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
      asList<Obj>(v).forEach((item, i) => out.push(...missingRequired(field.fields, item, `${field.label} ${i + 1} › `)));
    else if (field.required && (v === undefined || v === null || asText(v).trim() === '' || (Array.isArray(v) && !v.length))) out.push(label);
  }
  return out;
}
