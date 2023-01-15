import { deleteIndicator, fetchCountryIndicator, fetchCountryIndicators, fetchIndicatorsByPage, getIndicatorById, getSavedIndicators, saveIndicator } from "./data.js";

/* 
            <=========  Objekt so state stranky    =========>
*/
const StateData = {
    countryDetails: {},
    countryIndicators: [],
    modal: {
        pagination: {},
        indicatorList: [],
    }
}

/* 
            <=========  Inicializacia stranky po nacitani    =========>
*/
document.addEventListener('DOMContentLoaded', async () => {
    const countryCode = (new URL(document.location)).searchParams.get('code')
    const fetchedDetails = await fetchCountryIndicators(countryCode, getSavedIndicators());
    [StateData.countryDetails, StateData.countryIndicators] = fetchedDetails

    const $countryName = document.querySelector('#countryName')
    $countryName.innerHTML = `<div class="flagImgWrapper">
    ${StateData.countryDetails.capitalCity ? `<img class="flagImg" src="https://www.countryflagicons.com/FLAT/48/${StateData.countryDetails.iso2Code}.png">`
            : `<span class="material-icons">question_mark</span>`}
            </div>` + StateData.countryDetails.name

    injectIndicators()
    injectCountryData()
    setupLeaflet(StateData.countryDetails.latitude, StateData.countryDetails.longitude)
    assignAllListeners()
});

/* 
            <=========  Manipulacia HTML Dom    =========>
*/

//Funkcia ktora nastavi listenery na vsetky potrebne elementy
const assignAllListeners = () => {
    const $goToFavoritesBtn = document.querySelector('#goToFavorites')
    const $goToListOfCountriesBtn = document.querySelector('#goToListOfCountries')
    const $openModal = document.querySelector('#addIndicators')
    const $closeModalBtn = document.querySelector('#closeModal')
    const $modal = document.querySelector('.modal')
    const $loadMoreIndicatorsBtn = document.querySelector('#loadMoreIndicators')
    const $searchbarForm = document.querySelector('#searchbarForm')

    //Po kliknuti na nacitanie viac krajin sa fetchne dalsia stranka krajin z apicka a vykresli sa do tabulky
    $loadMoreIndicatorsBtn.addEventListener('click', async () => {
        const moreIndicators = await fetchIndicatorsByPage(++StateData.modal.pagination.page)
        StateData.modal.pagination = moreIndicators[0]
        StateData.modal.indicatorList = [...StateData.modal.indicatorList, ...moreIndicators[1]]
        injectRowsToModalTable()

        //Ak sme na poslednej stranke paginacie, schovame load more button
        if (StateData.modal.pagination.page === moreIndicators[0].pages) {
            $loadMoreIndicatorsBtn.style.display = 'none'
            return
        }
    })

    //Po kliknuti na Favorites presmeruje aktualnu stranku na stranku oblubenych krajin
    $goToFavoritesBtn.addEventListener('click', async () => {
        window.location = 'favorites.html'
    })

    //Po kliknuti na List of countries presmeruje aktualnu stranku na stranku list krajin
    $goToListOfCountriesBtn.addEventListener('click', async () => {
        window.location = './'
    })

    //Po kliknuti na Add indicators sa otvori modal a stiahne sa zoznam indikatorov ak este modal nebol otvoreny
    $openModal.addEventListener('click', async () => {
        $modal.classList.add('modal-open')
        if (StateData.modal.indicatorList.length === 0) {
            [StateData.modal.pagination, StateData.modal.indicatorList] = await fetchIndicatorsByPage(1)
            injectRowsToModalTable()
        } else {
            injectRowsToModalTable()
        }
    })

    //Po kliknuti na Close button v modali sa modal zavrie
    $closeModalBtn.addEventListener('click', async () => {
        $modal.classList.remove('modal-open')
    })

    //Ak nieco napiseme do searchbaru, tak nas presmeruje na list krajin a vyhlada v nom nas keyword
    $searchbarForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const searchWord = $searchbarForm.elements['search'].value;
        window.location = './?searchword=' + searchWord
    });
}

//Funkcia ktora setupne leaflet a vycentruje mapu na krajinu podla suradnic
const setupLeaflet = (latitude, longitude) => {
    const map = L.map('map').setView([latitude, longitude], 5);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

//Funkcia ktora zoberie z StateData list indikatorov a naplni nim tabulku v modaly
const injectRowsToModalTable = () => {
    const $table = document.querySelector('#modalTable')
    const $modal = document.querySelector('.modal')

    const dataToPrint = StateData.modal.indicatorList

    const tableHeader = `
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Source Note</th>
        </tr>`

    //Vytvor string so vsetkymi riadkami
    const stringOfDataToPrint = tableHeader + dataToPrint.map((indicator) => {
        return `
                <tr class="modalTableRow" data-code="${indicator.id}">
                    <td>${indicator.id}</td>
                    <td>${indicator.name}</td>
                    <td>${indicator.sourceNote}</td>
                </tr>
            `
    }).join('')

    $table.innerHTML = stringOfDataToPrint

    //Prejdi vsetky riadky v tabulku a nastav im onClick listener, po kliknuti na riadok
    //sa stiahne indikator ku konkretnej krajine a rovnako tak sa aj prida do listu predvolenych
    //indikatorov
    Array.from(document.querySelectorAll(".modalTableRow")).map(($rowElem) => {
        $rowElem.style.cursor = 'pointer'
        $rowElem.addEventListener('click', async (e) => {
            const selectedIndicator = await fetchCountryIndicator(StateData.countryDetails.iso2Code, $rowElem.dataset.code)
            if (selectedIndicator) {
                saveIndicator($rowElem.dataset.code)
                StateData.countryIndicators.push(selectedIndicator)
                injectIndicators()
                $modal.classList.remove('modal-open')
            } else {
                $rowElem.style.backgroundColor = "darkgrey"
            }
        })
    })

}

//Funkcia ktora vlozi zakladne data o krajine
const injectCountryData = () => {
    const $wrapper = document.querySelector('#countryBasicData')

    $wrapper.innerHTML = `
        <p><b>Name</b></p>
        <p>${StateData.countryDetails.name}</p>` + ((StateData.countryDetails.capitalCity != "") ? `
        <p><b>Capital</b></p>
        <p>${StateData.countryDetails.capitalCity}</p>` : ``) +
        `<p><b>Region</b></p>
        <p>${StateData.countryDetails?.region.value}</p>
    `
}

//Funkcia ktora vlozi karty s jednotlivymi indikatormi
const injectIndicators = () => {
    const $wrapper = document.querySelector('#indicators-wrapper')

    const stringOfDataToPrint = StateData.countryIndicators.map((indicator) => {
        return `
        <div class="indicator" data-indicator=${indicator.indicator.id}>
            <p><b>${indicator.indicator.value}</b></p>
            <p><i>(${indicator.date})</i></p>
            <p>${indicator.value}</p>
            <button class="deleteBtn">Delete</button>
        </div>
        `
    }).join('')

    $wrapper.innerHTML = stringOfDataToPrint

    //Nastav onClick na Delete button jednotlivych kariet 
    Array.from(document.querySelectorAll(".indicator")).map(($indicator) => {
        const indicatorId = $indicator.dataset.indicator;

        $indicator.querySelector('.deleteBtn').addEventListener('click', async (e) => {
            e.preventDefault()
            deleteIndicator(indicatorId)
            StateData.countryIndicators = StateData.countryIndicators.filter(indicator => indicator.indicator.id !== indicatorId)
            injectIndicators()

        })
    })
}
