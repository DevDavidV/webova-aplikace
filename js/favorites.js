import { addNoteToSavedCountry, deleteCountryFromFavorites, getSavedFavoriteCountries } from "./data.js";

/* 
            <=========  Objekt so state stranky    =========>
*/
const StateData = {
    savedCountries: []
}

/* 
            <=========  Inicializacia stranky po nacitani    =========>
*/
document.addEventListener('DOMContentLoaded', async () => {
    StateData.savedCountries = getSavedFavoriteCountries();

    injectFavoriteCountriesCards()
    assignAllListeners()
});

/* 
            <=========  Manipulacia HTML Dom    =========>
*/

//Funkcia ktora nastavi listenery na vsetky potrebne elementy
const assignAllListeners = () => {
    const $goToListOfCountriesBtn = document.querySelector('#goToListOfCountries')
    const $searchbarForm = document.querySelector('#searchbarForm')

    //Po kliknuti na List of countries presmeruje aktualnu stranku na stranku list krajin
    $goToListOfCountriesBtn.addEventListener('click', async () => {
        window.location = './'
    })

    //Ak nieco napiseme do searchbaru, tak nas presmeruje na list krajin a vyhlada v nom nas keyword
    $searchbarForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const searchWord = $searchbarForm.elements['search'].value;
        window.location = './?searchword=' + searchWord
    });
}

//Funkcia ktora vlozi karty s jednotlivymi oblubenymi krajinami
const injectFavoriteCountriesCards = () => {
    const $favoriteCountriesCardsWrapper = document.querySelector('#favoriteCountriesCardsWrapper')

    $favoriteCountriesCardsWrapper.innerHTML = StateData.savedCountries.map((country) => {
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

    //Prejdi cez vsetky krajiny a ich leaflet mapam nastav suradnice
    StateData.savedCountries.map((country) => {
        const map = L.map('map' + country.iso2Code).setView([country.latitude, country.longitude], 5);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 20,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    })

    //Prejdi cez vsetky karty a nastav ich buttonom onClick listenery
    Array.from(document.querySelectorAll(".favCountryCard")).map(($cardElem) => {
        const $textArea = $cardElem.querySelector('textarea')
        const $openDetailPageBtn = $cardElem.querySelector('.detailBtn')
        const $deleteBtn = $cardElem.querySelector('.deleteBtn')

        $textArea.addEventListener('input', (e) => {
            e.preventDefault()
            addNoteToSavedCountry($cardElem.dataset.code, $textArea.value)
        })
        $openDetailPageBtn.addEventListener('click', (e) => {
            e.preventDefault()
            window.location = 'detail.html?code=' + $cardElem.dataset.code
        })
        $deleteBtn.addEventListener('click', (e) => {
            e.preventDefault()
            deleteCountryFromFavorites($cardElem.dataset.code)
            StateData.savedCountries = getSavedFavoriteCountries();
            injectFavoriteCountriesCards()
        })
    })
}