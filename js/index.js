import { deleteCountryFromFavorites, fetchCountriesByPage, fetchCountriesByQuery, getCountryByCode, getSavedFavoriteCountriesCodes, parseToOnlyCountries, saveCountryToFavourites } from "./data.js";

//Zhromazduje state appky
const DATA = {
    pagination: {},
    countries: [],
    search: false,
    searchResults: [],
    showRegions: false,
    favoriteCountriesCodes: []
}

document.addEventListener('DOMContentLoaded', async () => {
    document.querySelector('#showRegions').checked = false
    const firstCountries = await fetchCountriesByPage(1);
    [DATA.pagination, DATA.countries] = firstCountries;

    const searchWord = (new URL(document.location)).searchParams.get('searchword')
    if (searchWord) {
        DATA.search = true
        DATA.searchResults = await fetchCountriesByQuery(searchWord)
        document.querySelector('#search').value = searchWord
        hideSearchConflictingElems(true)
    } else {
        DATA.search = false
        hideSearchConflictingElems(false)
    }

    injectDataToTable()
    assignAllListeners()
});


const assignAllListeners = () => {
    const $showRegionsCheckBox = document.querySelector('#showRegions')
    const $loadMoreCountriesBtn = document.querySelector('#loadMoreCountries')
    const $goToFavoritesBtn = document.querySelector('#goToFavorites')
    const $goToListOfCountriesBtn = document.querySelector('#goToListOfCountries')
    const $searchbarForm = document.querySelector('#searchbarForm')
    const $clearSearchbar = document.querySelector('#clearSearchbar')
    const $searchBarInput = document.querySelector('#search')

    $showRegionsCheckBox.addEventListener('click', () => {
        if ($showRegionsCheckBox.checked) {
            DATA.showRegions = true;
        } else {
            DATA.showRegions = false;
        }

        injectDataToTable()
    })


    $loadMoreCountriesBtn.addEventListener('click', async () => {
        const moreFetchedCountries = await fetchCountriesByPage(++DATA.pagination.page);
        DATA.pagination = moreFetchedCountries[0]
        DATA.countries = [...DATA.countries, ...moreFetchedCountries[1]]
        injectDataToTable()

        if (DATA.pagination.page === DATA.pagination.pages) {
            $loadMoreCountriesBtn.style.display = 'none'
            return
        }
    })

    $goToFavoritesBtn.addEventListener('click', async () => {
        window.location = 'favorites.html'
    })

    $goToListOfCountriesBtn.addEventListener('click', async () => {
        window.location = './'
    })

    $searchbarForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const searchWord = $searchbarForm.elements['search'].value;
        if (searchWord != "") {
            DATA.search = true
            DATA.searchResults = await fetchCountriesByQuery(searchWord)
            hideSearchConflictingElems(true)
        } else {
            DATA.search = false
            hideSearchConflictingElems(false)
        }
        injectDataToTable()
    });

    $clearSearchbar.addEventListener('click', () => {
        $searchBarInput.value = ""
    })
}

const hideSearchConflictingElems = (hide) => {
    if (hide) {
        document.querySelector('#loadMoreCountries').style.display = 'none'
        document.querySelector('#showRegionsWrapper').style.display = 'none'
    } else {
        document.querySelector('#loadMoreCountries').style.display = 'flex'
        document.querySelector('#showRegionsWrapper').style.display = 'flex'
    }
}

const setFavoriteIcons = (favoriteCountriesCodes = []) => {
    Array.from(document.querySelectorAll(".countryTableRow")).map(($rowElem) => {
        if (favoriteCountriesCodes.includes($rowElem.dataset.code)) {
            $rowElem.querySelector('.favorite span').style.color = 'gold'
        } else {
            $rowElem.querySelector('.favorite span').style.color = 'white'
        }

    })
}

const injectDataToTable = async () => {
    const $table = document.querySelector('#countriesTable')
    let dataToPrint;

    if (DATA.search) {
        dataToPrint = DATA.searchResults
    } else if (DATA.showRegions) {
        dataToPrint = DATA.countries
    } else {
        dataToPrint = parseToOnlyCountries(DATA.countries)
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

            setFavoriteIcons(getSavedFavoriteCountriesCodes())

        })
    })

    setFavoriteIcons(getSavedFavoriteCountriesCodes())
}