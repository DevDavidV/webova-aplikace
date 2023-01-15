import { deleteCountryFromFavorites, fetchCountriesByPage, fetchCountriesByQuery, getCountryByCode, getSavedFavoriteCountriesCodes, parseToOnlyCountries, saveCountryToFavourites } from "./data.js";

/* 
            <=========  Objekt so state stranky    =========>
*/
const StateData = {
    pagination: {},
    countries: [],
    search: false,
    searchResults: [],
    showRegions: false,
    favoriteCountriesCodes: []
}

/* 
            <=========  Inicializacia stranky po nacitani    =========>
*/
document.addEventListener('DOMContentLoaded', async () => {
    document.querySelector('#showRegions').checked = false
    const firstCountries = await fetchCountriesByPage(1);
    [StateData.pagination, StateData.countries] = firstCountries;

    const searchWord = (new URL(document.location)).searchParams.get('searchword')
    if (searchWord) {
        StateData.search = true
        StateData.searchResults = await fetchCountriesByQuery(searchWord)
        document.querySelector('#search').value = searchWord
        hideSearchConflictingElems(true)
    } else {
        StateData.search = false
        hideSearchConflictingElems(false)
    }

    injectDataToTable()
    assignAllListeners()
});

/* 
            <=========  Manipulacia HTML Dom    =========>
*/

//Funkcia ktora nastavi listenery na vsetky potrebne elementy
const assignAllListeners = () => {
    const $showRegionsCheckBox = document.querySelector('#showRegions')
    const $loadMoreCountriesBtn = document.querySelector('#loadMoreCountries')
    const $goToFavoritesBtn = document.querySelector('#goToFavorites')
    const $searchbarForm = document.querySelector('#searchbarForm')
    const $clearSearchbar = document.querySelector('#clearSearchbar')
    const $searchBarInput = document.querySelector('#search')

    //Pri kliku zmen hodnotu showRegions v objekte StateData a znovu vykresli riadky
    $showRegionsCheckBox.addEventListener('click', () => {
        if ($showRegionsCheckBox.checked) {
            StateData.showRegions = true;
        } else {
            StateData.showRegions = false;
        }

        injectDataToTable()
    })

    //Pri kliku na loadMore nacita viac krajin
    $loadMoreCountriesBtn.addEventListener('click', async () => {
        const moreFetchedCountries = await fetchCountriesByPage(++StateData.pagination.page);
        StateData.pagination = moreFetchedCountries[0]
        StateData.countries = [...StateData.countries, ...moreFetchedCountries[1]]
        injectDataToTable()

        if (StateData.pagination.page === StateData.pagination.pages) {
            $loadMoreCountriesBtn.style.display = 'none'
            return
        }
    })

    //Po kliknuti na Favorites presmeruje aktualnu stranku na stranku oblubenych krajin
    $goToFavoritesBtn.addEventListener('click', async () => {
        window.location = 'favorites.html'
    })

    //Pri submite seachFormu, ziskaj data ktore zodpovedaju query alebo resetuj seach na povodne zobrazenie krajin
    $searchbarForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const searchWord = $searchbarForm.elements['search'].value;
        if (searchWord != "") {
            StateData.search = true
            StateData.searchResults = await fetchCountriesByQuery(searchWord)
            hideSearchConflictingElems(true)
        } else {
            StateData.search = false
            hideSearchConflictingElems(false)
        }
        injectDataToTable()
    });

    $clearSearchbar.addEventListener('click', () => {
        $searchBarInput.value = ""
    })
}

//Funkcia ktora pri searchy skryje buttony paginacie a zobrazovania regionov
const hideSearchConflictingElems = (hide) => {
    if (hide) {
        document.querySelector('#loadMoreCountries').style.display = 'none'
        document.querySelector('#showRegionsWrapper').style.display = 'none'
    } else {
        document.querySelector('#loadMoreCountries').style.display = 'flex'
        document.querySelector('#showRegionsWrapper').style.display = 'flex'
    }
}

//Funkcia ktora zoberie vsetky riadky tabulky a nastavy im farbu podla toho ci su medzi oblubenymi
const setFavoriteIcons = (favoriteCountriesCodes = []) => {
    Array.from(document.querySelectorAll(".countryTableRow")).map(($rowElem) => {
        if (favoriteCountriesCodes.includes($rowElem.dataset.code)) {
            $rowElem.querySelector('.favorite span').style.color = 'gold'
        } else {
            $rowElem.querySelector('.favorite span').style.color = 'white'
        }

    })
}

//Funkcia ktora vlozi to tabulky riadky na zaklade state v StateData objekte
const injectDataToTable = async () => {
    const $table = document.querySelector('#countriesTable')
    let dataToPrint;

    if (StateData.search) {
        dataToPrint = StateData.searchResults
    } else if (StateData.showRegions) {
        dataToPrint = StateData.countries
    } else {
        dataToPrint = parseToOnlyCountries(StateData.countries)
    }

    const tableHeader = `
        <tr>
            <th>Map</th>
            <th>Code</th>
            <th>Country</th>
            <th>Capital city</th>
            <th>Region</th>
            <th></th>
        </tr>`
    const stringOfDataToPrint = tableHeader + dataToPrint.map((country) => {
        return `
                <tr class="countryTableRow" data-code="${country.iso2Code}">
                    <td>
                        <div class="flagImgWrapper">
                            ${country.capitalCity ? `<img class="flagImg" src="https://www.countryflagicons.com/FLAT/48/${country.iso2Code}.png">`
                : `<span class="material-icons">question_mark</span>`}
                        </div>
                    </td>
                    <td>${country.iso2Code}</td>
                    <td>${country.name}</td>
                    <td>${country.capitalCity}</td>
                    <td>${country?.region?.value}</td>
                    <td>
                        <button class="favorite">
                            <span class="material-icons">
                                star
                            </span>
                        </button>
                    </td>
                </tr>
            `
    }).join('')

    $table.innerHTML = stringOfDataToPrint


    //Prejdi vsetky riadky a nastav im onClick listener na presmerovanie na detail a pridanie medzi oblubene
    Array.from(document.querySelectorAll(".countryTableRow")).map(($rowElem) => {
        $rowElem.style.cursor = 'pointer'

        $rowElem.addEventListener('click', (e) => {
            window.location = 'detail.html?code=' + $rowElem.dataset.code
        })
        $rowElem.querySelector('.favorite').addEventListener('click', (event) => {
            event.stopPropagation()

            if (getSavedFavoriteCountriesCodes().includes($rowElem.dataset.code)) {
                deleteCountryFromFavorites($rowElem.dataset.code)
            } else {
                saveCountryToFavourites(getCountryByCode(dataToPrint, $rowElem.dataset.code))
            }
            //Znovu nastav ikonky
            setFavoriteIcons(getSavedFavoriteCountriesCodes())
        })
    })

    setFavoriteIcons(getSavedFavoriteCountriesCodes())
}