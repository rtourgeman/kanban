import { useEffect, useState } from 'react';
import { DEFECT_SEVERITY_LABELS, DEFECT_STATUS_LABELS } from '../../domain/defaults';
import type { Defect, DefectSeverity, DefectStatus, PhotoAttachment, PhotoDraft } from '../../domain/types';
import { validateDefectInput } from '../../domain/validation';
import { imageFileToPhotoDraft } from '../../utils/images';

export type DefectFormValues = {
  title: string;
  description?: string;
  location?: string;
  trade?: string;
  status: DefectStatus;
  severity: DefectSeverity;
  responsibleParty?: string;
  dueDate?: string;
  photos: PhotoDraft[];
};

type DefectFormProps = {
  initialDefect?: Defect;
  submitLabel?: string;
  onSave: (values: DefectFormValues) => Promise<void>;
  onCancel?: () => void;
};

function photoAttachmentToDraft(photo: PhotoAttachment): PhotoDraft {
  return {
    id: photo.id,
    dataUrl: photo.dataUrl,
    fileName: photo.fileName,
    mimeType: photo.mimeType,
    width: photo.width,
    height: photo.height,
    createdAt: photo.createdAt
  };
}

export function DefectForm({
  initialDefect,
  submitLabel = 'שמור ליקוי',
  onSave,
  onCancel
}: DefectFormProps): JSX.Element {
  const [title, setTitle] = useState(initialDefect?.title ?? '');
  const [description, setDescription] = useState(initialDefect?.description ?? '');
  const [location, setLocation] = useState(initialDefect?.location ?? '');
  const [trade, setTrade] = useState(initialDefect?.trade ?? '');
  const [status, setStatus] = useState<DefectStatus>(initialDefect?.status ?? 'open');
  const [severity, setSeverity] = useState<DefectSeverity>(initialDefect?.severity ?? 'medium');
  const [responsibleParty, setResponsibleParty] = useState(initialDefect?.responsibleParty ?? '');
  const [dueDate, setDueDate] = useState(initialDefect?.dueDate ?? '');
  const [photos, setPhotos] = useState<PhotoDraft[]>(() => initialDefect?.photos.map(photoAttachmentToDraft) ?? []);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(initialDefect?.title ?? '');
    setDescription(initialDefect?.description ?? '');
    setLocation(initialDefect?.location ?? '');
    setTrade(initialDefect?.trade ?? '');
    setStatus(initialDefect?.status ?? 'open');
    setSeverity(initialDefect?.severity ?? 'medium');
    setResponsibleParty(initialDefect?.responsibleParty ?? '');
    setDueDate(initialDefect?.dueDate ?? '');
    setPhotos(initialDefect?.photos.map(photoAttachmentToDraft) ?? []);
  }, [initialDefect]);

  async function handleSave(): Promise<void> {
    const validation = validateDefectInput({ title });
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSave({
        title,
        description,
        location,
        trade,
        status,
        severity,
        responsibleParty,
        dueDate,
        photos
      });

      if (!initialDefect) {
        setTitle('');
        setDescription('');
        setLocation('');
        setTrade('');
        setStatus('open');
        setSeverity('medium');
        setResponsibleParty('');
        setDueDate('');
        setPhotos([]);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(fileList: FileList | null): Promise<void> {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    setImageError('');
    try {
      const draft = await imageFileToPhotoDraft(file);
      setPhotos((current) => [...current, draft]);
    } catch {
      setImageError('לא ניתן לשמור את התמונה. אפשר לנסות תמונה אחרת.');
    }
  }

  return (
    <form
      className="defect-form"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
    >
      <div className="sticky-save-row">
        <strong>{initialDefect ? 'עריכת ליקוי' : 'הוסף ליקוי'}</strong>
        <button className="primary-button" type="submit" disabled={saving}>
          {submitLabel}
        </button>
      </div>

      <label className="field">
        <span>כותרת ליקוי</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="לדוגמה: סדק בקיר צפוני"
          autoFocus={!initialDefect}
        />
      </label>

      <label className="field">
        <span>תיאור</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="מה נראה בשטח?"
        />
      </label>

      <label className="field">
        <span>מיקום</span>
        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="קומה, דירה, חדר, חזית"
        />
      </label>

      <label className="field file-field">
        <span>צילום</span>
        <input type="file" accept="image/*" capture="environment" onChange={(event) => void handlePhotoChange(event.target.files)} />
      </label>

      {photos.length > 0 && (
        <div className="photo-grid" aria-label="תמונות מצורפות">
          {photos.map((photo, index) => (
            <figure key={`${photo.id ?? photo.fileName ?? 'photo'}-${index}`}>
              <img src={photo.dataUrl} alt={photo.fileName || `צילום ${index + 1}`} />
              <figcaption>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))}
                >
                  הסר
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <details className="advanced-fields">
        <summary>פרטים נוספים</summary>
        <div className="form-grid">
          <label className="field">
            <span>סטטוס</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as DefectStatus)}>
              {Object.entries(DEFECT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>חומרה</span>
            <select value={severity} onChange={(event) => setSeverity(event.target.value as DefectSeverity)}>
              {Object.entries(DEFECT_SEVERITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>אחראי</span>
            <input
              value={responsibleParty}
              onChange={(event) => setResponsibleParty(event.target.value)}
              placeholder="קבלן / ספק / צוות"
            />
          </label>
          <label className="field">
            <span>מקצוע</span>
            <input value={trade} onChange={(event) => setTrade(event.target.value)} placeholder="לדוגמה: חשמל" />
          </label>
          <label className="field">
            <span>תאריך יעד</span>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
        </div>
      </details>

      {(error || imageError) && <p className="form-error">{error || imageError}</p>}

      {onCancel && (
        <button type="button" className="ghost-button" onClick={onCancel}>
          ביטול
        </button>
      )}
    </form>
  );
}
