import axios from 'axios';
import './css/styles.css';
import 'simplelightbox/dist/simple-lightbox.min.css';
import SimpleLightbox from 'simplelightbox';

import { Notify } from 'notiflix';

function settingsForRequest(query, numberPage) {
  return {
    url: 'https://pixabay.com/api/',
    params: {
      key: '35695692-b29213b84af7336a869b1efb1',
      q: query,
      image_type: 'photo',
      orientation: 'horizontal',
      safesearch: true,
      per_page: 40,
      page: numberPage,
    },
  };
}

let isInputEmpty = true;
let showedImages = 0;
let totalImages = 0;
let numberPage = 1;

const form = document.querySelector('.search-form');
const input = document.querySelector('.search-form__input');
const button = document.querySelector('.search-form__button');
const gallery = document.querySelector('.gallery');
const loader = document.querySelector('.loader');

const lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionPosition: 'bottom',
  captionDelay: 250,
});

const scrollObserver = new IntersectionObserver(
  function (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        appendImages();
      }
    });
  },

  {
    rootMargin: '0px 0px 300px 0px',
    threshold: 0.1,
  }
);

form.addEventListener('submit', event => {
  event.preventDefault();

  scrollObserver.unobserve(loader);
  gallery.innerHTML = '';
  showedImages = 0;
  totalImages = 0;
  numberPage = 1;
  const query = input.value;
  isInputEmpty = !input.value.trim();

  if (isInputEmpty) {
    return;
  }

  loadImages(query);
});

input.addEventListener(
  'input',
  event => (isInputEmpty = !event.target.value.trim())
);

button.addEventListener('click', () =>
  button.classList.add('search-form__button--focus')
);

button.addEventListener('mouseleave', () => unfocusButton());

function unfocusButton() {
  button.classList.remove('search-form__button--focus');
}

async function loadImages(query) {
  try {
    console.log(query);

    const { totalHits, hits } = (
      await axios(settingsForRequest(query, numberPage))
    ).data;

    if (totalHits === 0) {
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );

      return;
    }

    totalImages = totalHits;
    Notify.success(`'Hooray! We found ${totalImages} images.'`);

    gallery.innerHTML = hits.map(createCard).join(' ');

    lightbox.refresh();

    setTimeout(unfocusButton, 400);

    showedImages = hits.length;

    if (showedImages < totalImages) {
      loader.classList.remove('loader-hidden');

      scrollObserver.observe(loader);
    }
  } catch (error) {
    console.error(error);
  }
}

async function appendImages() {
  try {
    const data = (await axios(settingsForRequest(input.value, ++numberPage)))
      .data;
    if (showedImages === totalImages) {
      console.log('COMPLETE');
      loader.classList.add('loader-hidden');

      scrollObserver.unobserve(loader);

      Notify.info("We're sorry, but you've reached the end of search results.");
    }

    gallery.insertAdjacentHTML(
      'beforeend',
      data.hits.map(createCard).join(' ')
    );

    lightbox.refresh();

    showedImages += data.hits.length;
  } catch (error) {
    console.error(error);
  }
}

function createCard(data) {
  return `
          <li class="gallery__item">
            <a href="${data.largeImageURL}">
              <div class="photo-card">
                <img class="photo-card__image" src="${data.webformatURL}" alt="${data.tags}" loading="lazy" />
                <div class="info">
                  <p class="info-item">
                    <b>Likes</b>
                    <span>${data.likes}</span>
                  </p>
                  <p class="info-item">
                    <b>Views</b>
                    <span>${data.views}</span>
                  </p>
                  <p class="info-item">
                    <b>Comments</b>
                    <span>${data.comments}</span>
                  </p>
                  <p class="info-item">
                    <b>Downloads</b>
                    <span>${data.downloads}</span>
                  </p>
                </div>
              </div>
            </a>
          </li>
        `;
}
