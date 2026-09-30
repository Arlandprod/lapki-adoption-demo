import { useState } from 'react';
import { Heart, ImageBroken } from '@phosphor-icons/react';
import { speciesLabel } from '../data/pets';
import type { Pet } from '../types';

export function PetPhoto({ pet, eager = false }: { pet: Pet; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className="pet-photo">
    {failed ? <div className="photo-error"><ImageBroken size={32} aria-hidden="true" /><span>Фото недоступно</span></div> :
      <img src={'/photos/' + pet.photo.file} alt={pet.photo.description} width={800} height={1000}
        style={{ objectPosition: pet.photo.suggestedObjectPosition }} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />}
  </div>;
}

export default function PetCard({ pet, favorite, eager, onFavorite, onOpen }: {
  pet: Pet; favorite: boolean; eager: boolean; onFavorite: () => void; onOpen: (target: HTMLElement) => void;
}) {
  return <article className="pet-card" aria-labelledby={'pet-' + pet.id}>
    <div className="card-image"><PetPhoto pet={pet} eager={eager} />
      <span className="demo-image-label">Демо-анкета</span>
      <button type="button" className={'favorite-button' + (favorite ? ' is-favorite' : '')}
        aria-label={(favorite ? 'Убрать из избранного: ' : 'В избранное: ') + pet.name} aria-pressed={favorite} onClick={onFavorite}>
        <Heart size={24} weight={favorite ? 'fill' : 'regular'} />
      </button>
    </div>
    <div className="card-content">
      <p className="card-meta">{speciesLabel[pet.species]} · {pet.sex === 'male' ? 'мальчик' : 'девочка'} · {pet.age}</p>
      <h3 id={'pet-' + pet.id}>{pet.name}</h3>
      <p className="card-story">{pet.headline}</p>
      <div className="tags">{pet.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
      <button className="card-open" type="button" aria-label={'Познакомиться: ' + pet.name} onClick={event => onOpen(event.currentTarget)}>Познакомиться</button>
    </div>
  </article>;
}
