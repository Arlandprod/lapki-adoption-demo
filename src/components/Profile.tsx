import { Heart, House, Sun, Clock } from '@phosphor-icons/react';
import { energyLabel, speciesLabel } from '../data/pets';
import type { Compatibility, Pet } from '../types';
import { PetPhoto } from './PetCard';

function compatibility(value: Compatibility, yes: string) { return value === 'yes' ? yes : value === 'no' ? 'Рекомендован дом без них' : 'Не проверено'; }
export default function Profile({ pet, favorite, onFavorite, onApply }: {
  pet: Pet; favorite: boolean; onFavorite: () => void; onApply: () => void;
}) {
  return <div className="profile">
    <div className="profile-photo-column"><PetPhoto pet={pet} eager />
      <p className="photo-credit">Фото-иллюстрация: <a href={pet.photo.sourcePageUrl} target="_blank" rel="noreferrer">{pet.photo.author}</a> · <a href={pet.photo.licenseUrl} target="_blank" rel="noreferrer">{pet.photo.licenseName}</a>. Уменьшено и отображается с кадрированием.</p>
    </div>
    <div className="profile-content">
      <p className="eyebrow">Вымышленная анкета</p><p className="profile-subtitle">{speciesLabel[pet.species]} · {pet.age} · {pet.size}</p>
      <p className="profile-lead">{pet.headline}</p><p>{pet.story}</p>
      <div className="profile-facts">
        <span><House size={20} />{pet.apartment ? 'Подходит квартира' : 'Дом с участком'}</span>
        <span><Sun size={20} />{energyLabel[pet.energy]}</span>
        <span><Clock size={20} />{pet.aloneHours}</span>
      </div>
      <h3>Кому будет комфортно</h3>
      <dl className="facts-list"><div><dt>Дети</dt><dd>{compatibility(pet.children, 'От 7 лет, со взрослыми')}</dd></div>
        <div><dt>Кошки</dt><dd>{compatibility(pet.cats, 'Совместимость указана')}</dd></div><div><dt>Собаки</dt><dd>{compatibility(pet.dogs, 'Совместимость указана')}</dd></div>
        <div><dt>Опыт</dt><dd>{pet.firstTime ? 'Возможен первый питомец' : 'Нужен человек с опытом'}</dd></div>
      </dl>
      <h3>Обычный день</h3><p>{pet.routine}</p><h3>Здоровье и уход</h3><p>{pet.care}</p>
      <div className="notice"><h3>Что учесть</h3><p>{pet.considerations}</p></div>
      <p className="demo-note">Имя, возраст, характер, здоровье и статус придуманы для учебного проекта. На фото — животное-иллюстрация, которое здесь не пристраивается.</p>
      <div className="profile-actions"><button className="button-primary" type="button" onClick={onApply}>Пройти демо-заявку</button>
        <button className="button-secondary" type="button" aria-pressed={favorite} onClick={onFavorite}><Heart size={20} weight={favorite ? 'fill' : 'regular'} />{favorite ? 'В избранном' : 'В избранное'}</button>
      </div>
    </div>
  </div>;
}
