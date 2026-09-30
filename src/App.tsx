import { useEffect, useRef, useState } from 'react';
import { Heart, PawPrint, Note, ShieldCheck, Trash, MagnifyingGlass } from '@phosphor-icons/react';
import { pets } from './data/pets';
import { activeFilterCount, DEFAULT_FILTERS, filterPets } from './domain';
import { clearLocalState, readLocalState, saveFavorites, saveReceipts } from './storage';
import type { Pet, Receipt } from './types';
import Filters from './components/Filters';
import PetCard from './components/PetCard';
import Modal from './components/Modal';
import Profile from './components/Profile';
import Application from './components/Application';
import { registerWebTools } from './webmcp';

type View = 'catalog' | 'favorites' | 'receipts';
const knownIds = pets.map(pet => pet.id);

export default function App() {
  const [initial] = useState(() => readLocalState(knownIds));
  const [favorites, setFavorites] = useState<string[]>(initial.favorites);
  const [receipts, setReceipts] = useState<Receipt[]>(initial.receipts);
  const [storageAvailable, setStorageAvailable] = useState(initial.available);
  const [view, setView] = useState<View>('catalog');
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [selected, setSelected] = useState<{ pet: Pet; mode: 'profile' | 'application' } | null>(null);
  const [message, setMessage] = useState('');
  const returnFocus = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const actions = useRef({
    getFavorites: () => favorites,
    replaceFavorites: (ids: string[]) => { setFavorites(ids); if (!saveFavorites(ids)) setStorageAvailable(false); },
    showPet: (pet: Pet) => { returnFocus.current = document.activeElement as HTMLElement; setSelected({ pet, mode: 'profile' }); },
  });
  actions.current = {
    getFavorites: () => favorites,
    replaceFavorites: ids => { setFavorites(ids); if (!saveFavorites(ids)) setStorageAvailable(false); },
    showPet: pet => { returnFocus.current = document.activeElement as HTMLElement; setSelected({ pet, mode: 'profile' }); },
  };
  useEffect(() => registerWebTools(pets, actions), []);
  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== null && !event.key.startsWith('lapki-demo:')) return;
      const state = readLocalState(knownIds);
      if (state.available) { setFavorites(state.favorites); setReceipts(state.receipts); }
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function navigate(next: View) { setView(next); requestAnimationFrame(() => heading.current?.focus()); }
  function toggleFavorite(pet: Pet) {
    const next = favorites.includes(pet.id) ? favorites.filter(id => id !== pet.id) : [...favorites, pet.id];
    setFavorites(next);
    if (!saveFavorites(next)) setStorageAvailable(false);
    setMessage(pet.name + (next.includes(pet.id) ? ' добавлен(а) в избранное.' : ' убран(а) из избранного.'));
  }
  function openPet(pet: Pet, target: HTMLElement) { returnFocus.current = target; setSelected({ pet, mode: 'profile' }); }
  function complete(receipt: Receipt) {
    const next = [receipt, ...receipts].slice(0, 30);
    setReceipts(next);
    const saved = saveReceipts(next);
    if (!saved) setStorageAvailable(false);
    return saved;
  }
  const source = view === 'favorites' ? pets.filter(pet => favorites.includes(pet.id)) : pets;
  const shown = filterPets(source, filters);
  return <>
    <a className="skip-link" href="#main">Перейти к содержимому</a>
    <div className="demo-banner">Учебный проект · Все анкеты вымышленные · Заявки не отправляются</div>
    <header className="site-header page-width">
      <button type="button" className="brand" onClick={() => navigate('catalog')} aria-label="Лапки — открыть каталог"><PawPrint size={31} weight="fill" /><span>Лапки</span></button>
      <nav aria-label="Основная навигация">
        <button type="button" aria-current={view === 'catalog' ? 'page' : undefined} onClick={() => navigate('catalog')}>Каталог</button>
        <button type="button" aria-current={view === 'favorites' ? 'page' : undefined} onClick={() => navigate('favorites')}><Heart size={19} />Избранное<span className="count">{favorites.length}</span></button>
        <button type="button" aria-current={view === 'receipts' ? 'page' : undefined} onClick={() => navigate('receipts')}><Note size={19} />Демо-заявки<span className="count">{receipts.length}</span></button>
      </nav>
    </header>
    <main id="main" className="page-width">
      <section className="intro">
        <div><p className="eyebrow">Знакомство начинается здесь</p>
          <h1 ref={heading} tabIndex={-1}>{view === 'catalog' ? <>Дом начинается<br /><span>с дружбы.</span></> : view === 'favorites' ? <>Те, кто<br /><span>запомнился.</span></> : <>Ваши<br /><span>демо-заявки.</span></>}</h1>
          <p>{view === 'catalog' ? 'Найдите того, чей характер и привычки подходят вашему дому.' : view === 'favorites' ? 'Сохранённые анкеты помогут вернуться к знакомству.' : 'Подтверждения учебного сценария. Ни одна заявка не отправлена.'}</p>
        </div>
        <div className="intro-note"><ShieldCheck size={26} weight="light" /><div><strong>Можно спокойно попробовать</strong><p>Животные и истории придуманы. Фото — иллюстрации. Настоящие контакты не нужны.</p></div></div>
      </section>
      {!storageAvailable && <p className="storage-warning" role="status">Хранилище браузера недоступно. Избранное и демо-заявки работают до перезагрузки страницы.</p>}
      {view === 'receipts' ? <section className="history" aria-label="История демонстрационных заявок">
        {receipts.length === 0 ? <div className="empty-state"><Note size={42} weight="light" /><h2>Сначала познакомьтесь</h2><p>Откройте анкету и пройдите демо-заявку. Здесь появится её подтверждение.</p><button type="button" className="button-primary" onClick={() => navigate('catalog')}>Открыть каталог</button></div> : <>
          <div className="history-heading"><h2>Сохранено: {receipts.length}</h2><button type="button" className="text-button" onClick={() => { setReceipts([]); if (!saveReceipts([])) setStorageAvailable(false); setMessage('История демо-заявок очищена.'); }}><Trash size={18} />Очистить историю</button></div>
          <div className="receipt-list">{receipts.map(receipt => {
            const pet = pets.find(item => item.id === receipt.petId)!;
            return <article className="history-item" key={receipt.id}><img src={'/photos/' + pet.photo.file} width={88} height={88} alt={pet.photo.description} style={{ objectPosition: pet.photo.suggestedObjectPosition }} /><div><p className="eyebrow">Завершено локально · демо</p><h3>{pet.name}</h3><code>{receipt.id}</code><time dateTime={receipt.createdAt}>{new Date(receipt.createdAt).toLocaleString('ru-RU')}</time></div><button type="button" className="button-secondary" onClick={event => openPet(pet, event.currentTarget)}>Открыть анкету</button></article>;
          })}</div><p className="demo-note">Сохраняем только номер, дату и выбранную анкету. Имя, email и текст формы в историю не попадают. Максимум 30 последних подтверждений.</p>
        </>}
      </section> : <div className="catalog-layout">
        <Filters value={filters} onChange={setFilters} onReset={() => setFilters({ ...DEFAULT_FILTERS })} />
        <section className="catalog-results" aria-label={view === 'favorites' ? 'Избранные животные' : 'Каталог животных'}>
          <div className="results-heading"><h2>{view === 'favorites' ? 'Избранные анкеты' : 'Давайте познакомимся'}</h2><p role="status">Анкет: <strong>{shown.length}</strong> из {source.length}</p></div>
          {shown.length ? <div className="pet-grid">{shown.map((pet, index) => <PetCard key={pet.id} pet={pet} eager={index < 2} favorite={favorites.includes(pet.id)} onFavorite={() => toggleFavorite(pet)} onOpen={target => openPet(pet, target)} />)}</div> :
            <div className="empty-state"><MagnifyingGlass size={42} weight="light" /><h3>{view === 'favorites' && !favorites.length ? 'Пока никто не сохранён' : 'Такой анкеты пока нет'}</h3><p>{view === 'favorites' && !favorites.length ? 'Нажмите сердечко на понравившейся анкете — она появится здесь.' : 'Попробуйте изменить условия. Неизвестную совместимость мы не считаем подходящей.'}</p><button className="button-primary" type="button" onClick={() => { setFilters({ ...DEFAULT_FILTERS }); if (!activeFilterCount(filters)) navigate('catalog'); }}>{activeFilterCount(filters) ? 'Сбросить фильтры' : 'Открыть каталог'}</button></div>}
          <p className="catalog-caption">Все восемь анкет демонстрационные. Совпадение фильтров помогает изучить интерфейс и не является рекомендацией по пристройству.</p>
        </section>
      </div>}
    </main>
    <footer className="site-footer page-width">
      <div className="footer-line"><span className="footer-brand"><PawPrint size={21} weight="fill" />Лапки</span><p>Самостоятельный учебный проект. Реального приюта за ним нет.</p><button type="button" className="text-button" onClick={() => { const cleared = clearLocalState(); setFavorites([]); setReceipts([]); setFilters({ ...DEFAULT_FILTERS }); setStorageAvailable(cleared); setMessage(cleared ? 'Локальные демо-данные сброшены.' : 'Данные сброшены до перезагрузки: хранилище недоступно.'); }}>Сбросить демо-данные</button></div>
      <details className="credits"><summary>Фотографии и лицензии</summary><p>Фото иллюстрируют вымышленные анкеты. Файлы уменьшены и перекодированы в JPEG; в интерфейсе отображаются с кадрированием. Изменённые фото сохраняют указанные лицензии.</p><ul>{pets.map(pet => <li key={pet.id}><span>{pet.name}: </span><a href={pet.photo.sourcePageUrl} target="_blank" rel="noreferrer">{pet.photo.author} · оригинал</a><span> · </span><a href={pet.photo.licenseUrl} target="_blank" rel="noreferrer">{pet.photo.licenseName}</a></li>)}</ul></details>
    </footer>
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{message}</div>
    {selected && <Modal title={selected.mode === 'profile' ? selected.pet.name : 'Демо-заявка: ' + selected.pet.name} returnFocus={returnFocus.current} onClose={() => setSelected(null)}>
      {selected.mode === 'profile' ? <Profile pet={selected.pet} favorite={favorites.includes(selected.pet.id)} onFavorite={() => toggleFavorite(selected.pet)} onApply={() => setSelected({ ...selected, mode: 'application' })} /> :
        <Application pet={selected.pet} onComplete={complete} onClose={() => { setSelected(null); setView('catalog'); }} />}
    </Modal>}
  </>;
}
