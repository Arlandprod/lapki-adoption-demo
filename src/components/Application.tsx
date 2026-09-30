import { useEffect, useRef, useState } from 'react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { compatibilityNotes, DEMO_DRAFT, EMPTY_DRAFT, validateStep } from '../domain';
import type { ApplicationDraft, DraftErrors, Pet, Receipt } from '../types';

export default function Application({ pet, onComplete, onClose }: {
  pet: Pet; onComplete: (receipt: Receipt) => boolean; onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ApplicationDraft>({ ...EMPTY_DRAFT });
  const [errors, setErrors] = useState<DraftErrors>({});
  const [result, setResult] = useState<{ receipt: Receipt; saved: boolean } | null>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  useEffect(() => { stepHeading.current?.focus(); }, [step, result]);
  function update<K extends keyof ApplicationDraft>(key: K, value: ApplicationDraft[K]) {
    setDraft(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined }));
  }
  function goNext(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateStep(draft, step);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { requestAnimationFrame(() => errorSummary.current?.focus()); return; }
    if (step < 2) { setStep(step + 1); return; }
    const receipt = { id: 'DEMO-' + crypto.randomUUID().toUpperCase(), petId: pet.id, createdAt: new Date().toISOString() };
    const saved = onComplete(receipt);
    setDraft({ ...EMPTY_DRAFT });
    setResult({ receipt, saved });
  }
  function fieldError(key: keyof ApplicationDraft) { return errors[key] ? <span className="field-error" id={'error-' + key}>{errors[key]}</span> : null; }
  function selectField(key: 'housing' | 'children' | 'otherPets' | 'experience' | 'away', label: string, options: [string, string][]) {
    return <div className="field"><label htmlFor={'draft-' + key}>{label}</label><select id={'draft-' + key} value={draft[key]} onChange={event => update(key, event.target.value as ApplicationDraft[typeof key])}
      aria-invalid={!!errors[key]} aria-describedby={errors[key] ? 'error-' + key : undefined}>
      <option value="">Выберите вариант</option>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
    </select>{fieldError(key)}</div>;
  }
  if (result) return <div className="application-success">
    <CheckCircle size={54} weight="light" aria-hidden="true" /><p className="eyebrow">Сценарий завершён</p>
    <h3 tabIndex={-1} ref={stepHeading}>Демо-заявка готова</h3>
    <p>{result.saved ? 'Подтверждение сохранено в этом браузере.' : 'Подтверждение доступно до перезагрузки: хранилище браузера недоступно.'} В приют ничего не отправлено.</p>
    <div className="receipt"><span>{pet.name} · учебная анкета</span><code>{result.receipt.id}</code><span>{new Date(result.receipt.createdAt).toLocaleString('ru-RU')}</span></div>
    <p className="muted">Имя, контакт и текст заявки не сохраняются. Подтверждение можно найти в «Демо-заявках».</p>
    <button type="button" className="button-primary" onClick={onClose}>Вернуться к каталогу</button>
  </div>;
  const notes = compatibilityNotes(pet, draft);
  return <form className="application" noValidate onSubmit={goNext}>
    <p className="demo-note">Учебная форма. Используйте вымышленные данные. Она ни с кем не связывается и ничего не отправляет.</p>
    <ol className="steps" aria-label="Шаги заявки">{['Ваш дом', 'Знакомство', 'Проверка'].map((label, index) =>
      <li key={label} className={index === step ? 'current' : index < step ? 'complete' : ''} aria-current={index === step ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    {Object.values(errors).some(Boolean) && <div className="form-errors" ref={errorSummary} tabIndex={-1} role="alert"><WarningCircle size={22} /><span>Проверьте поля, отмеченные ниже.</span></div>}
    <div className="step-heading"><h3 ref={stepHeading} tabIndex={-1}>{['Расскажите о вашем доме', 'Первое знакомство', 'Всё готово к проверке'][step]}</h3>
      {step < 2 && <button className="text-button" type="button" onClick={() => { setDraft({ ...DEMO_DRAFT }); setErrors({}); }}>Заполнить демо-данными</button>}
    </div>
    {step === 0 && <div className="form-grid">
      {selectField('housing', 'Где будет жить питомец', [['apartment', 'Квартира'], ['house', 'Дом с участком']])}
      {selectField('children', 'Есть ли дети дома', [['no', 'Нет'], ['yes', 'Да']])}
      {selectField('otherPets', 'Другие животные', [['none', 'Нет'], ['cat', 'Есть кошка'], ['dog', 'Есть собака']])}
      {selectField('experience', 'Ваш опыт', [['first', 'Первый питомец'], ['experienced', 'Уже есть опыт']])}
      {selectField('away', 'Сколько часов вас нет дома', [['0-4', 'До 4 часов'], ['4-8', 'От 4 до 8 часов'], ['8+', 'Больше 8 часов']])}
    </div>}
    {step === 1 && <div className="form-grid">
      <div className="field"><label htmlFor="draft-name">Имя для демо</label><input id="draft-name" value={draft.name} maxLength={60} autoComplete="off" placeholder="Тестовый посетитель" onChange={event => update('name', event.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'error-name' : undefined} />{fieldError('name')}</div>
      <div className="field"><label htmlFor="draft-email">Вымышленный email</label><input id="draft-email" type="email" inputMode="email" autoComplete="off" maxLength={100} value={draft.email} placeholder="friend@example.test" onChange={event => update('email', event.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'error-email' : 'email-hint'} />{fieldError('email')}<span className="field-hint" id="email-hint">Адрес нужен только для проверки формы. Письма не отправляются.</span></div>
      <div className="field full-width"><label htmlFor="draft-motivation">Почему хотите познакомиться с {pet.name}</label><textarea id="draft-motivation" rows={4} maxLength={500} value={draft.motivation} onChange={event => update('motivation', event.target.value)} aria-invalid={!!errors.motivation} aria-describedby={errors.motivation ? 'error-motivation' : 'motivation-hint'} />{fieldError('motivation')}<span className="field-hint" id="motivation-hint">От 20 до 500 символов · {draft.motivation.length}/500</span></div>
    </div>}
    {step === 2 && <>
      <dl className="review-list">
        <div><dt>Учебная анкета</dt><dd>{pet.name}</dd></div><div><dt>Жильё</dt><dd>{draft.housing === 'apartment' ? 'Квартира' : 'Дом с участком'}</dd></div>
        <div><dt>Дети</dt><dd>{draft.children === 'yes' ? 'Есть' : 'Нет'}</dd></div><div><dt>Другие животные</dt><dd>{{ none: 'Нет', cat: 'Кошка', dog: 'Собака', '': '' }[draft.otherPets]}</dd></div>
        <div><dt>Опыт</dt><dd>{draft.experience === 'first' ? 'Первый питомец' : 'Есть опыт'}</dd></div><div><dt>Время вне дома</dt><dd>{{ '0-4': 'До 4 часов', '4-8': '4–8 часов', '8+': 'Больше 8 часов', '': '' }[draft.away]}</dd></div>
        <div><dt>Имя</dt><dd>{draft.name.trim()}</dd></div><div><dt>Email</dt><dd>{draft.email.trim()}</dd></div><div className="full-width"><dt>Ваш текст</dt><dd>{draft.motivation.trim()}</dd></div>
      </dl>
      {notes.length > 0 && <div className="notice"><h4>Потребуется обсудить</h4><ul>{notes.map(note => <li key={note}>{note}</li>)}</ul><p>Это подсказки учебного сценария. Они не означают одобрения или отказа.</p></div>}
      <p className="care-reminder">Особенности ухода: {pet.care}</p>
      <label className="check"><input type="checkbox" checked={draft.careAccepted} onChange={event => update('careAccepted', event.target.checked)} aria-invalid={!!errors.careAccepted} aria-describedby={errors.careAccepted ? 'error-careAccepted' : undefined} />Я прочитал(а) особенности ухода и условия анкеты.</label>{fieldError('careAccepted')}
      <label className="check"><input type="checkbox" checked={draft.demoAccepted} onChange={event => update('demoAccepted', event.target.checked)} aria-invalid={!!errors.demoAccepted} aria-describedby={errors.demoAccepted ? 'error-demoAccepted' : undefined} />Я понимаю, что это демо. В приют ничего не отправится.</label>{fieldError('demoAccepted')}
    </>}
    <div className="form-actions">{step > 0 && <button type="button" className="button-secondary" onClick={() => { setErrors({}); setStep(step - 1); }}>Назад</button>}
      <button type="submit" className="button-primary">{step === 2 ? 'Завершить демо-заявку' : 'Продолжить'}</button>
    </div>
  </form>;
}
