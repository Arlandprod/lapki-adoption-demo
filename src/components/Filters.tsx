import { Cat, Dog, SlidersHorizontal } from '@phosphor-icons/react';
import { activeFilterCount } from '../domain';
import type { Filters as FilterState } from '../types';

export default function Filters({ value, onChange, onReset }: {
  value: FilterState; onChange: (value: FilterState) => void; onReset: () => void;
}) {
  function update<K extends keyof FilterState>(key: K, next: FilterState[K]) { onChange({ ...value, [key]: next }); }
  const controls = <>
    <fieldset className="filter-group">
      <legend>Кого вы ищете</legend>
      <div className="species-control">
        {([['all', 'Всех'], ['dog', 'Собак'], ['cat', 'Кошек']] as const).map(([species, label]) =>
          <button key={species} type="button" className={value.species === species ? 'selected' : ''}
            aria-pressed={value.species === species} onClick={() => update('species', species)}>
            {species === 'dog' ? <Dog size={18} /> : species === 'cat' ? <Cat size={18} /> : null}{label}
          </button>)}
      </div>
    </fieldset>
    <label className="field">Жильё
      <select value={value.housing} onChange={event => update('housing', event.target.value as FilterState['housing'])}>
        <option value="any">Любое жильё</option><option value="apartment">Квартира</option><option value="house">Дом с участком</option>
      </select>
    </label>
    <label className="check"><input type="checkbox" checked={value.children} onChange={event => update('children', event.target.checked)} />С детьми от 7 лет</label>
    <label className="field">Другие животные дома
      <select value={value.otherPets} onChange={event => update('otherPets', event.target.value as FilterState['otherPets'])}>
        <option value="any">Не учитывать</option><option value="cat">Есть кошка</option><option value="dog">Есть собака</option>
      </select>
    </label>
    <hr />
    <label className="field">Ритм жизни
      <select value={value.energy} onChange={event => update('energy', event.target.value as FilterState['energy'])}>
        <option value="any">Любой ритм</option><option value="calm">Спокойный</option><option value="moderate">Умеренно активный</option><option value="active">Активный</option>
      </select>
    </label>
    <label className="field">Возраст
      <select value={value.ageGroup} onChange={event => update('ageGroup', event.target.value as FilterState['ageGroup'])}>
        <option value="any">Любой возраст</option><option value="young">До 1,5 лет</option><option value="adult">Взрослые</option><option value="senior">Старшие</option>
      </select>
    </label>
    <label className="check"><input type="checkbox" checked={value.firstTime} onChange={event => update('firstTime', event.target.checked)} />Для первого опыта</label>
    <label className="check"><input type="checkbox" checked={value.specialCare} onChange={event => update('specialCare', event.target.checked)} />Готов к особому уходу</label>
    <p className="filter-note">Совместимость с детьми и животными показываем только при ответе «да» в демо-анкете.</p>
    <button type="button" className="text-button" disabled={!activeFilterCount(value)} onClick={onReset}>Сбросить фильтры</button>
  </>;
  return <aside className="filters" aria-label="Фильтры животных">
    <div className="filters-desktop"><div className="filter-heading"><SlidersHorizontal size={22} /><h2>Ваш дом</h2></div>{controls}</div>
    <details className="filters-mobile"><summary><SlidersHorizontal size={20} />Подобрать по условиям{activeFilterCount(value) > 0 && <span className="count">{activeFilterCount(value)}</span>}</summary><div className="mobile-filter-content">{controls}</div></details>
  </aside>;
}
