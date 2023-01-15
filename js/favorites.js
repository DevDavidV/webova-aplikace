import { addNoteToSavedCountry, deleteCountryFromFavorites, getSavedFavoriteCountries } from "./data.js";

const DATA = {
    savedCountries: []
}

document.addEventListener('DOMContentLoaded', async () => {
    DATA.savedCountries = getSavedFavoriteCountries();
    console.log(DATA.savedCountries)

    injectFavoriteCountriesCards()
    assignAllListeners()
});

const assignAllListeners = () => {
    const $goToFavoritesBtn = document.querySelector('#goToFavorites')
    const $goToListOfCountriesBtn = document.querySelector('#goToListOfCountries')
    const $searchbarForm = document.querySelector('#searchbarForm')

    $goToFavoritesBtn.addEventListener('click', async () => {
        window.location = 'favorites.html'
    })

    $goToListOfCountriesBtn.addEventListener('click', async () => {
        window.location = '/'
    })

    $searchbarForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const searchWord = $searchbarForm.elements['search'].value;
        window.location = '/?searchword=' + searchWord
    });
}


const injectFavoriteCountriesCards = () => {
    const $favoriteCountriesCardsWrapper = document.querySelector('#favoriteCountriesCardsWrapper')

    $favoriteCountriesCardsWrapper.innerHTML = DATA.savedCountries.map((country) => {
        return `
            <div class="favCountryCard" data-code="${country.iso2Code}">
                <div class="wideMap" id="map${country.iso2Code}"></div>
                <div class="favCountryCardContent">
                    <h2>${country.name}</h2>` + ((country.capitalCity != "") ? `
                    <p><b>Capital</b></p>
                    <p>${country.capitalCity}</p>` : ``) +
            `<p><b>Region</b></p>
                    <p>${country?.region.value}</p>
                    <textarea class="card-textarea" >${country.notes}</textarea>
                    <button class="detailBtn">Open detail page</button>
                    <button class="deleteBtn">Delete</button>
                </div>
            </div>
        `
    }).join('')

    DATA.savedCountries.map((country) => {
        const map = L.map('map' + country.iso2Code).setView([country.latitude, country.longitude], 5);

        L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
        }).addTo(map);
    })

    Array.from(document.querySelectorAll(".favCountryCard")).map(($cardElem) => {
        const $textArea = $cardElem.querySelector('textarea')
        const $openDetailPageBtn = $cardElem.querySelector('.detailBtn')
        const $deleteBtn = $cardElem.querySelector('.deleteBtn')

        $textArea.addEventListener('input', (e) => {
            e.preventDefault()
            console.log($textArea.value, $cardElem.dataset.code)
            addNoteToSavedCountry($cardElem.dataset.code, $textArea.value)
        })
        $openDetailPageBtn.addEventListener('click', (e) => {
            e.preventDefault()
            window.location = 'detail.html?code=' + $cardElem.dataset.code
        })
        $deleteBtn.addEventListener('click', (e) => {
            e.preventDefault()
            deleteCountryFromFavorites($cardElem.dataset.code)
            DATA.savedCountries = getSavedFavoriteCountries();
            injectFavoriteCountriesCards()
        })
    })
}